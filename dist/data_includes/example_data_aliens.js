/*
var shuffleSequence = seq("intro", "test");

PennController.ResetPrefix(null);

var items = [
    
  ["intro", "PennController", PennController(
      
      newYoutube("mcgurk", "aFPtc8BVdJk")
          .print()
      ,
      newButton("validation", "click here")
          .print()
          .wait()
      
  )]
  ,

  // Indicate where to look for the PHP file you uploaded on you server
  ["intro", "PennController", PennController.InitiateRecorder(
      "http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/saveAudioZip.php",
      ""
  )]
  ,
  ["test", "PennController", PennController(
      newText("instructions", "Please record a sample and proceed.")
        .print()
      ,
      newVoiceRecorder("recorder")
        .print()
      ,
      newButton("validate", "Click here to continue")
        .print()
        .wait()
  )]

];
*/

//var shuffleSequence = seq("welcome", "preload", startsWith("Test"));
var shuffleSequence = seq("test");

PennController.ResetPrefix(null);

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/");

var score = 0;

var items = [

    /*["welcome", "PennController",PennController(
        newText("testdsd", "waf")
            .print()
        ,
        newButton("valButton", "valdiate")
            .print()
            .wait()
    )]
    ,*/

    ["test", "PennController",PennController(
        newFunction("test function", function(){ score++; })
            .call()
        ,
        newText("score", "")
        ,
        newAudio("test sentence", "fishRound.ogg")
            .settings.once()
            .print()
            .wait()
        ,
        newHtml("test html", "example_intro.html")
            .settings.log()
            .print()
        ,
        newButton("valPareso", "wouf")
            .print()
            //.wait()
        ,
        newYoutube("testYT", "aFPtc8BVdJk")
            .print()
        ,
        getButton("valPareso")
            .wait()
        ,
        newFunction("new function", function(){ getText("score").settings.text("Score: "+score).run(); })
            .call()
        ,
        getText("score")
            .print()
        ,
        newFunction("test score", function(){ return score; })
            .test.is(1)
            .success(
                newText("text 1", "It's 1!!")
                    .print()
            )
            .failure(
                newText("text not 1", "It's not 1...")
                    .print()
            )
        ,
        getYoutube("testYT")
            .play()
            .wait()
        ,
        newButton("valButton", "valdiate")
            .print()
            .wait()
    )]
    ,

    ["welcome", "Message", {html: "Welcome. The resources are currently being preloaded, but you can already try to move to the first trial: it won't start before the resources are preloaded anyway."}]
    ,
    ["preload", "PennController", PennController.CheckPreload(startsWith("Test"))]
    ,
    ["TestRecord", "PennController", 
        PennController.InitiateRecorder("http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/saveAudioZip.php")
    ]
    ,
    ["TestRecord", "PennController",PennController(
        newText("instructions", "Please record a sample and proceed.")
          .print()
        ,
        newVoiceRecorder("recorder")
          .settings.once()
          .print()
          .wait()
        ,
        newButton("validate", "Click here to continue")
          .print()
          .wait()
    )]
    ,
    [["Test1a", 1], "PennController", PennController(
    
        newImage("tank", "1fishSquareTank.png")
            .print()
        ,
        newText("description", "The tank is round.")
            .print()
        ,
        newKey("validate", "FJ")
            .wait()
    
    )]
    ,
    [["Test1b", 1], "PennController", PennController(
    
        newImage("tank", "1fishSquareTank.png")
            .print()
        ,
        newText("description", "The tank is square.")
            .print()
        ,
        newKey("FJ")
            .wait()
    
    )]
    ,
    [["Test2a", 2], "PennController", PennController(
    
        newImage("tank", "2fishRoundTank.png")
            .print()
        ,
        newText("description", "The tank is round.")
            .print()
        ,
        newKey("FJ")
            .wait()
    
    )]
    ,
    [["Test2b", 2], "PennController", PennController(
    
        newImage("tank", "2fishRoundTank.png")
            .print()
        ,
        newText("description", "The tank is square.")
            .print()
        ,
        newKey("FJ")
            .wait()
    
    )]
];


/*
var shuffleSequence = seq(randomize("rating"), randomize("input"));
PennController.ResetPrefix(null);

PennController.FeedItems( PennController.GetTable("design.csv").filter("Label","rating") ,
    (item) => PennController(
        newText("A's line", item.A)
            .print()
        ,
        newText("B's line", item.B)
            .print()
        ,
        newText("question", "How natural do you find B's answer?")
            .settings.italic()
            .settings.center()
            .print()
        ,
        newScale("answer",    "Unnatural", "So-so...", "Natural")
            .settings.log() // We want to collect data here
            .settings.radio()
            .settings.labels("bottom")
            .settings.center()
            .print()
            .wait()
        ,
        newButton("validate score", "Click here to validate")
            .settings.center()
            .print()
            .wait()
    )
    // We save ID, Label, Item and Group
        .logAppend( "ID" , PennController.GetURLParameter("id") )
        .logAppend( "Label" , item.Label )
        .logAppend( "Item"  , item.Item  )
        .logAppend( "Group" , item.Group )
);

PennController.FeedItems( PennController.GetTable("design.csv").filter("Label","input") ,
        (item) => PennController(
        newText("warning input", "Please enter some text before validating")
            .settings.bold()
            .settings.italic()
            .settings.color("red")
        ,
        newText("Instruction", "Please fill the box below to create a sentence that you find natural.")
            .settings.italic()
            .print()
        ,
        newTextInput("alternative")
            .settings.log() // We want to collect data here
            .settings.before(item.Sentence+" ") // Just adding a space character
            .print()
        ,
        newButton("validate input", "Click here to validate")
            .settings.center()
            .print()
            .wait(
                getTextInput("alternative")
                    .testNot.text("")
                    .failure( getText("warning input").print() )
            )
    )
    // Note that 'logAppend' relates to 'PennController' above (to the right of '=>')
        .logAppend( "ID" , PennController.GetURLParameter("id") )
        .logAppend( "Label" , item.Label )
        .logAppend( "Item"  , item.Item  )
        .logAppend( "Group" , item.Group )
);
*/


/*
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
PennController.FeedItems(PennController.GetTable("default").filter("ColorTest", "blue"),

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

    ).save("Group", item.group)

);*/