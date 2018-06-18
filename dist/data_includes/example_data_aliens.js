var shuffleSequence = seq("checkTest", "test", "checkItems", startsWith("Item"));

PennController.ResetPrefix(null);

// Preloading a zip file
PennController.PreloadZip("http://files.lab.florianschwarz.net/ibexfiles/PsEntAliens/Images.zip",
                          "http://babel.ling.upenn.edu/~amygood/files/soundfiles/Practice_BT9_EG_Rev_Soundfiles.zip");

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Ex1Factives/Audio/");

// Much quicker to type p than to type PennController.instruction each time
var p = PennController.instruction;

var items = [

  ["checkTest", "Message", {html: "This is a test"}],

  ["checkTest", "PennController", PennController.CheckPreload("test", 10)],
  ["checkItems", "PennController", PennController.CheckPreload(startsWith("Item"))],


  ["test", "PennController", PennController(
    image.defaults.settings.size(100, 100)
    ,
    canvas.defaults.settings.center()
    ,
    newText("warning", "Please enter some text before pressing Return.")
        .settings.bold()
        .settings.italic()
        .settings.color("red")
    ,
    newTextInput("alternative")
        .settings.before("I thought the weather was warm, but it really is ")
        .print()
        .wait(
            // The 'wait' only gets validated if the text is not "" (i.e. box is not void)
            getTextInput("alternative").testNot.text("")
                                        .failure( // We print a message in case of failure to comply
                                            getText("warning").print()
                                        ) // Keep track of the closing parentheses...
        ) // ... as the structure becomes more complicated
    ,
    getTextInput("alternative")
        .settings.disable()
    ,
    getText("warning")
        .remove()
    ,
    newScale("answer",    "", "", "neutral", "", "")
            .settings.radio()   // We force a radio-button display
            .settings.before("easy") // Text on the left
            .settings.after("hard") // Text on the right
            .settings.labels("top") // "neutral" will appear above the middle button
            .print()
            //.wait()
    ,
    newButton("button", "Click me")
        .print()
        .wait()
    ,
    newScale("answer2",    "so easy", "fine", "hard", "impossible")
            .print()
            .wait()
    ,
    newText("question", "Which patch do you find greener?")
        .print()
    ,
    newImage("patch1", "alien_pink.png")
    ,
    newImage("patch2", "alien_yellow.png")
    ,
    newCanvas("patches", 250, 100)
        .settings.add(  0, 0, getImage("patch1"))
        .settings.add(150, 0, getImage("patch2"))
        .print()
    ,
    newSelector("patches")
        .settings.add(getImage("patch1"), getImage("patch2"))
        .settings.once() // The first selection is definitive
        .wait()
    ,
    newText("press a key", "Please press any key to continue.")
        .print()
    ,
    newKey("any", "")
        .wait()
  )]
  ,

  ["test", "PennController", PennController(
    image.defaults.settings.size(200, 200)
    ,
    newImage("target", "alien_blue.png")
    ,
    newImage("competitor", "alien_red.png")
    ,
    newCanvas("patches", 450, 200)
        .settings.add(  0, 0, getImage("competitor"))
        .settings.add(250, 0, getImage("target"))
        .print()
    ,
    newTimer("familiarization", 500)
        .start()
        .wait()
    ,
    newAudio("test sentence", "thought_bike.mp3")
        .play()
    ,
    newSelector("fish")
        .settings.add(getImage("competitor"), getImage("target"))
        .settings.keys(            "F"      ,             "J"   )
    ,
    getAudio("test sentence")
        .wait() // Let's wait until the end of the playback
    ,
    getSelector("fish").test.selected()
        .success(  // If the participant selected a fish image
            end() // then we end the trial now
        )
        .failure( // Otherwise
            getSelector("fish")
                .wait() // we wait for a selection
        )
  )]
  ,

  
  ["test", "PennController", 
    PennController.InitiateRecorder("http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/saveAudioZip.php")
  ],
  
  ["test", "PennController", PennController(
      text.defaults.settings.bold()
                   .print()
      ,
      newVoiceRecorder("first recorder")
      ,
      newImage("planet", "planets.png")
        .print()
      ,
      newText("test", "waf waf")
        .settings.right()
      ,
      newVoiceRecorder("second recorder")
      ,
      newKey("space", " ")
        .wait()

  )]

];

// All the images below are created with a default size of 20x50
image.defaults.settings.size(20,50);

// Feed/Create the items from the datasource
PennController.FeedItems(

    // Refering to each row in the datasource as 'item'
    (item) => PennController(

        newText("group legend", "Group: "+item.group)
        ,
        newCanvas("myCanvas", 60, 230)
            // First planet
            .settings.add(  0,   0, newImage("a1p1", "alien_"+item.Alien1Planet1) )
            .settings.add(  0,  60, newImage("a2p1", item.Alien2Planet1) )
            .settings.add(  0, 120, newImage("a3p1", item.Alien3Planet1) )
            .settings.add(  0, 180, newImage("a4p1", item.Alien4Planet1) )
            // Second planet
            .settings.add( 30,   0, newImage("a1p2", "alien_"+item.Alien1Planet2) )
            .settings.add( 30,  60, newImage("a2p2", item.Alien2Planet2) )
            .settings.add( 30, 120, newImage("a3p2", item.Alien3Planet2) )
            .settings.add( 30, 180, newImage("a4p2", item.Alien4Planet2) )
            // Third planet
            .settings.add( 60,   0, newImage("a1p3", "alien_"+item.Alien1Planet3) )
            .settings.add( 60,  60, newImage("a2p3", item.Alien2Planet3) )
            .settings.add( 60, 120, newImage("a3p3", item.Alien3Planet3) )
            .settings.add( 60, 180, newImage("a4p3", item.Alien4Planet3) )
            // Print the canvas now
            .print()
        ,
        newText("test sentence", item.AgainSentence)
        ,
        newAudio("test audio", "thought_bike.mp3")
            .settings.log("play","end")
            .play()
            .wait()
        ,
        newKey("fj key", "FJ")
            .wait()
    )

);