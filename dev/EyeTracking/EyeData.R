# Imports
read.pcibex <- function(filepath, auto.colnames=TRUE, fun.col=function(col,cols){cols[cols==col]<-paste(col,"Ibex",sep=".");return(cols)}) {
  n.cols <- max(count.fields(filepath,sep=",",quote=NULL),na.rm=TRUE)
  if (auto.colnames){
    cols <- c()
    con <- file(filepath, "r")
    while ( TRUE ) {
      line <- readLines(con, n = 1, warn=FALSE)
      if ( length(line) == 0) {
        break
      }
      m <- regmatches(line,regexec("^# (\\d+)\\. (.+)\\.$",line))[[1]]
      if (length(m) == 3) {
        index <- as.numeric(m[2])
        value <- m[3]
        if (index < length(cols)){
          cols <- c()
        }
        if (is.function(fun.col)){
          cols <- fun.col(value,cols)
        }
        cols[index] <- value
        if (index == n.cols){
          break
        }
      }
    }
    close(con)
    return(read.csv(filepath, comment.char="#", header=FALSE, col.names=cols))
  }
  else{
    return(read.csv(filepath, comment.char="#", header=FALSE, col.names=seq(1:n.cols)))
  }
}
require("dplyr")
require("ggplot2")
require("tidyr")

# The URL where the data is stored
ETURL = "http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/EyeTracker.php?experiment="
# Time-window to bin the looks
BIN_DURATION = 100

# We'll use Reception time to identify individual sessions
results <- read.pcibex("results.csv")
names(results)[1] <- 'Participant'

# Read ET data file for each session and append output to ETdata
ETdata = data.frame()
filesDF <- subset(results, Parameter=="Filename"&Type=="Item-1")
apply(filesDF, 1, function(row) {
  data <- read.csv(paste(ETURL,as.character(row[['Value']]),sep=''))
  data$Participant <- row[['Participant']]
  ETdata <<- rbind(ETdata,data)
})

# Bin the data
ETdata$bin <- BIN_DURATION*floor(ETdata$times/BIN_DURATION)
ETdata <- ETdata %>% group_by(Participant,trial,bin) %>% mutate(
    top_female=mean(X_topFemaleIA),
    bottom_female=mean(X_bottomFemaleIA),
    top_male=mean(X_topMaleIA),
    bottom_male=mean(X_bottomMaleIA),
  )

# Add final choice to ETdata
answers <- results[results$Parameter=="Selection", c("Participant","Item.number","Value")]
names(answers) <- c("Participant", "trial", "Selection")
ETdata <- merge(ETdata,answers,by=c("Participant","trial"))

# Some transformations before plotting
#  - only keep first row for each bin per participant+trial
ETdata_toplot <- ETdata %>% group_by(Participant,trial,bin) %>% filter(row_number()==1)
#  - from wide to long (see http://www.cookbook-r.com/Manipulating_data/Converting_data_between_wide_and_long_format/)
ETdata_toplot <- gather(ETdata_toplot, focus, gaze, top_female:bottom_male)

# Plot the results
ggplot(ETdata_toplot, aes(x=bin,y=gaze,color=focus)) + 
  geom_line(stat="summary",fun.y="mean") +
  facet_grid(Selection~.)