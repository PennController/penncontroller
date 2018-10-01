PennController.ResetPrefix(null);

var shuffleSequence = seq("waf","waf",not("waf"));

PennController( "waf" ,
    newVideo("buffy", "http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/buffy.mp4")
        .print()
        .play()
    ,
    newImage("one animal", "http://files.lab.florianschwarz.net/ibexfiles/Pictures/grapes.png")
        .settings.size(200, 200)
    ,
    newImage("two animals", "http://files.lab.florianschwarz.net/ibexfiles/Pictures/fries.png")
        .settings.size(200, 200)
    ,
    newCanvas("pictures", 800, 300)
        .settings.add( 100,   0, getImage("one animal") )
        .settings.add( 500,   0, getImage("two animals") )
        .settings.add( 100, 250, newText("sg text", "wouf").settings.size(200, 0).settings.center() )
        .settings.add( 500, 250, newText("pl text", "woufs").settings.size(200, 0).settings.center() )
        .print()
    ,
    newText("sentence", "There are two ___")
        .settings.center()
        .print()
    ,
    newSelector("choice")
        .settings.log()    // We want to save the final choice in the results file
    ,
    newCanvas("options", 400, 150)
        .settings.center()
        .settings.add(   0,  50, newText("waf", "waf").settings.selector("choice") )  // Both label and text of element
        .settings.add(   0, 100, newText("wef", "wef").settings.selector("choice") )  // Both label and text of element
        .settings.add( 100,  50, newText("wif", "wif").settings.selector("choice") )  // Both label and text of element
        .settings.add( 100, 100, newText("wuf", "wuf").settings.selector("choice") )  // Both label and text of element
        .settings.add( 200,  50, newText("wafs", "wafs").settings.selector("choice") )  // Both label and text of element
        .settings.add( 200, 100, newText("wefs", "wefs").settings.selector("choice") )  // Both label and text of element
        .settings.add( 300,  50, newText("wifs", "wifs").settings.selector("choice") )  // Both label and text of element
        .settings.add( 300, 100, newText("wufs", "wufs").settings.selector("choice") )  // Both label and text of element
        .print()
    ,
    getSelector("choice")
        .settings.once()
        .shuffle()
        .wait()
    ,
    getSelector("choice")
        .test.selected( getText("waf") )  // We refer back to the element labeled with the value in opt1 (correct answer)
        .success(
            newText("good", "Well done").print()
        )
        .failure(
            newText("bad", "No").print()
        )
    ,
    newButton("continue", "Continue")
        .print()
        .wait()
)


PennController( "waf" ,
    newText("green", "How warm is the color green to you?")
        .print()
    ,
    newScale("judgment", 5) // 5-point scale
        .settings.log()
        .print()
        .wait()             // Validate upon choice
);

PennController(
    newText("test sentence", "The fish swim in a tank which is perfectly round")
        .print()        // A test sentence
    ,
    newImage("competitor", "http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/1fishSquareTank.png")
        .print()        // An image with 1 fish that swims in a square tank
    ,
    newImage("target", "http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/2fishRoundTank.png")
        .print()        // An image with 2 fish that swim in a round tank
    ,
    newSelector("tank") // We indicate that target+competitor belong to a selection group
        .settings.add( getImage("target") , getImage("competitor") )
        .wait()         // On hold until target or competitor is selected
);


PennController(     "trial" ,
    newText("green", "To me, the color green is...")
        .print()
    ,
    newTextInput("alternative", "")
        .settings.before( newText("other", "Other:") )
    ,
    newScale("judgment",    "cold", "cool", "lukewarm", "warm", "hot", "")
        .settings.labelsPosition("right")
        .settings.log()
        .print()
        .settings.label(2, getTextInput("alternative"))
        .wait()
);


PennController.Template(
    row => PennController(
        newText("sentence", row.Sentence)
            .print()
        ,
        newButton("wait", "wait")
            .print()
            .wait()
    )
);


PennController(     "altTrial" ,
    newText("green", "To me, the color green is...")
        .print()
    ,
    newTextInput("alternative", "")
        .settings.before( newText("other", "Other:") )
    ,
    newScale("judgment",    "cold", "cool", "lukewarm", "warm", "hot", "")
        .settings.size("auto", "auto")
        .settings.labelsPosition("top")
        .settings.before( getText("green") )
        .settings.after( getTextInput("alternative") )
        .print()
        .wait()
);