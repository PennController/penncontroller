# To summarize the data (see %>% commands below)
require("dplyr")

# The fields are separated by commas
# There are comment lines starting with # (useless for analyses)
# There is no header (no single line assigning each column a name)
results_full <- read.csv("results", sep=",", comment.char="#", header=F)

# As we can see, the columns have default Vn names
head(results_full)

# The 7 first columns (until IbexGroup) are not particularly relevant
# The 8 last columns (starting from Parameter) contain all we need for our analyses 
colnames(results_full) <- c("SendResultsTime", "MD5IP", 
                            "IbexController", "IbexItemNum", "IbexElementNum", "IbexLabel", "IbexGroup",
                            "Parameter", "Value", "Time", "Comment", "ID", "Label", "Item", "Group")

# Parameter == "answer" means a response line for the element we labeled 'answer' (our scale)
results_answer_ratings <- results_full %>% 
                           filter(Label == "rating" & Parameter == "answer")

# Parameter == "alternative" means a response line for the element we labeled 'alternative' (our input box)
results_answer_inputs <- results_full %>% 
                           filter(Label == "input" & Parameter == "alternative")


# Let's take a look at all the alternatives that were proposed for each item
results_answer_inputs %>%
  group_by(Item, Value) %>%
  summarize(
    n = n()
  )


# Let's see how 'any' vs 'either' impacted perception of naturalness
results_answer_ratings %>%
  group_by(Group) %>%
  summarise(
    n = n(),
    score = mean(as.numeric(as.character(Value)))
  )


# Let's look at whether 'any' vs 'either' influenced rate of antonymic alternatives
results_answer_inputs %>% 
  mutate(dry = grepl("dry", Value), cold = grepl("cold", Value)) %>%
  group_by(Group, Item) %>%
  summarise(
    dry = sum(dry),
    cold = sum(cold)
  )


# Were people faster to score in the 'any' or the 'either' group?
results_RT_per_item_per_ppt <- results_full %>% 
                                  filter(Label == "rating" & (Parameter == "answer" | Value == "RunFirstInstruction" )) %>%
                                  group_by(Item, ID) %>%
                                  summarize( Group = unique(Group), difference = diff(as.numeric(as.character(Time))) )

results_RT_per_group <- results_RT_per_item_per_ppt %>%
                          group_by(Group) %>%
                          summarize( meanRT = mean(difference) )
#    Group   meanRT
#   <fctr>    <dbl>
# 1    any 1686.667
# 2 either 1566.000



# Let's save a smaller table so we can manually treat the alternatives in a spreadsheet editor
results_simplified <- results_full %>%
                        select(Parameter:Group) %>%
                        filter(Parameter != "Page")
write.csv(results_simplified, "results_simplified.csv")
