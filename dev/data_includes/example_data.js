var shuffleSequence = seq(anyType);
PennController.ResetPrefix(null);

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Pictures/");

var items = [
    ["waf", "PennController", PennController(
        defaultImage
            .settings.size(100,100)
        ,
        // newVideo("bear", "https://www.w3schools.com/tags/movie.mp4")
        //     .print()
        //     .wait()
        // ,
        newImage("apple"       , "apple.png"      ),        
        newImage("banana"      , "banana.png"     ).settings.hidden(),
        newImage("appleCover"  , "CoveredBox.png" ).settings.hidden(),
        newImage("bananaCover" , "CoveredBox.png" ),

        newSelector("image")
            .settings.log("all")
            .settings.callback(
                getSelector("image")
                    .test.selected( getImage("appleCover") )
                    .success(
                        getImage("appleCover").settings.hidden(),
                        getImage("apple").settings.visible(),
                        getImage("bananaCover").settings.visible(),
                        getImage("banana").settings.hidden()
                    )
                    .failure(
                        getImage("appleCover").settings.visible(),
                        getImage("apple").settings.hidden(),
                        getImage("bananaCover").settings.hidden(),
                        getImage("banana").settings.visible()
                    )
            )
        ,
        newCanvas("images", 200, 100)
            .settings.add(  0, 0, getImage("apple"      )                            )
            .settings.add(100, 0, getImage("banana"     )                            )
            .settings.add(  0, 0, getImage("appleCover" ).settings.selector("image") )
            .settings.add(100, 0, getImage("bananaCover").settings.selector("image") )
            .print()
        ,
        newButton("continue", "Continue")
            .print()
            .wait()
    )]
]


// PennController.defaultTable.setLabel("Expt");

// PennController.FeedItems(   PennController.defaultTable.filter("Item", "drinks") ,
//     item => PennController(
//         newText("test", item.A)
//             .print()
//         ,
//         newButton("continue", "Continue")
//             .print()
//             .wait()
//     )
// );


// PennController.FeedItems(   PennController.GetTable("ratings.csv").filter("Item", "oasis") ,
//     item => PennController(
//         newText("test", item.A)
//             .print()
//         ,
//         newButton("continue", "Continue")
//             .print()
//             .wait()
//     )
// );














PennController.ResetPrefix(null);
PennController.AddHost( "http://files.lab.florianschwarz.net/ibexfiles/OrAgainCB/Pictures/" );

/* Start with the welcome screen,  */
/* then randomly show all the trials labeled "First" (see first FeedItems below)   */
/* then show the transition screen */
/* then randomly show all the trials labeled "Second" (see second FeedItems below) */
var shuffleSequence = seq("welcome screen", randomize("First"), "transition screen", randomize("Second"));

var items = [
    ["welcome screen", "PennController", PennController(
        newText("welcome", "Welcome. The first half of the experiment is about to begin.")
            .print()
        ,
        newText("description", "You will see two pictures displayed side by side. Make your choice using the F and J keys.")
            .print()
        ,
        newButton("continue", "Got it. Let's start the experiment!")
            .print()
            .wait()
    )]
    ,
    ["transition screen", "PennController", PennController(
        newText("good job", "You have completed the first half of the experiment.")
            .print()
        ,
        newText("description", "In the second half, F and J switch which picture is visible, and Space validates your choice.")
            .print()
        ,
        newButton("continue", "Got it. Let's start the second half!")
            .print()
            .wait()
    )]
];

// FIRST TRIAL TYPE: ONE SELECTION
PennController.FeedItems(
    row => PennController(
     
        // INITIAL SETTINGS
        defaultImage
            .settings.size(300,200)            /* All the pictures are 300x200px */
        ,
        defaultText                            /* All the texts are centered (and automatically displayed) */
            .settings.center()
            .print()
        ,
        defaultTimer                           /* All the timers start automatically and put the execution on hold */
            .start()
            .wait()
        ,
        newSelector("image")                   /* Represents the group of images out of which to make a choice */
            .settings.log()                          /* Log the choice                     */
            .settings.disableClicks()                /* Selection only through key presses */
            .settings.once()                         /* First selection is definitive      */
        ,
        // SEQUENCE OF DISPLAYS & INTERACTIONS
        newText("context", row.ContextSentence)
            .settings.italic()                 /* Show the context sentence in italics at the top */
        ,
        newTimer("context to test", 500)       /* Wait 500ms */
        ,
        newText("test", row.SentenceFormula)
            .settings.bold()                   /* Show the test sentence in bold right below the context sentence */
        ,
        newTimer("test to images", 500)        /* Wait another 500ms */
        ,
        newImage("target"     , row.PicTargetFilename )
        ,
        newImage("competitor" , row.Pic2Filename      )
        ,
        newCanvas("images", 700, 240)          /* The canvas containing the previous canvas and the 'F' and 'J' indications */
            .settings.add(  0,   0, getImage( "target"     ).settings.selector("image") /* Add target to selector     */ )
            .settings.add(400,   0, getImage( "competitor" ).settings.selector("image") /* Add competitor to selector */ )
            .settings.add(140, 210, newText("f", "F").settings.bold() )
            .settings.add(540, 210, newText("j", "J").settings.bold() )
            .print()                           /* Print this canvas, which in turn prints the two canvas it contains */
        ,
        getSelector("image")
            .shuffle()                         /* Shuffle the order of the elements in the group (i.e., target & competitor) */
            .settings.keys( "F" , "J" )        /* Then assign F key to the first element (left on canvas) and J to the second element (right on canvas) */
            .wait()                            /* Wait for a selection to happen */
        ,
        newText("last instructions", "Wait for next trial...")
        ,
        newTimer("final", 500)                 /* Wait 500ms before proceeding to next trial */
                           
    )
).label("First");        /* All these trials are labeled "First" */
    
    
// SECOND TRIAL TYPE: SWITCH DESIGN
PennController.FeedItems(
    row => PennController(
     
        // INITIAL SETTINGS
        defaultImage
            .settings.size(300,200)            /* All the pictures are 300x200px */
        ,
        defaultText                            /* All the texts are centered (and automatically displayed) */
            .settings.center()
            .print()
        ,
        defaultTimer                           /* All the timers start automatically and put the execution on hold */
            .start()
            .wait()
        ,
        newSelector("image")                   /* Represents the group of images out of which to make a choice */
            .settings.log("all")                     /* Log the whole sequence of choices  */
            .settings.disableClicks()                /* Selection only through key presses */
        ,
        // SEQUENCE OF DISPLAYS & INTERACTIONS
        newText("context", row.ContextSentence)
            .settings.italic()                 /* Show the context sentence in italics at the top */
        ,
        newTimer("context to test", 500)       /* Wait 500ms */
        ,
        newText("test", row.SentenceFormula)
            .settings.bold()                   /* Show the test sentence in bold right below the context sentence */
        ,
        newTimer("test to images", 500)        /* Wait another 500ms */
        ,
        newCanvas("target", 300, 200)          /* A canvas with the target picture and a black overlay (not printed yet) */
            .settings.add( 0, 0, newImage("target open" , row.PicTargetFilename ).settings.hidden() )
            .settings.add( 0, 0, newImage("target cover", "http://files.lab.florianschwarz.net/ibexfiles/Pictures/CoveredBox.png") )
        ,
        newCanvas("competitor", 300, 200)      /* A canvas with the competitor picture and a black overlay (not printed yet) */
            .settings.add( 0, 0, newImage("competitor open" , row.Pic2Filename ).settings.hidden() )
            .settings.add( 0, 0, newImage("competitor cover", "http://files.lab.florianschwarz.net/ibexfiles/Pictures/CoveredBox.png") )
        ,
        newCanvas("images", 700, 240)          /* The canvas containing the previous canvas and the 'F' and 'J' indications */
            .settings.add(  0,   0, getCanvas( "target"     ).settings.selector("image") /* Add target canvas to selector     */ )
            .settings.add(400,   0, getCanvas( "competitor" ).settings.selector("image") /* Add competitor canvas to selector */ )
            .settings.add(140, 210, newText("f", "F").settings.bold() )
            .settings.add(540, 210, newText("j", "J").settings.bold() )
            .print()                           /* Print this canvas, which in turn prints the two canvas it contains */
        ,
        getSelector("image")
            .shuffle()                         /* Shuffle the order of the elements in the group (target & competitor canvas) */
            .settings.keys( "F" , "J" )        /* Then assign F key to the first element (left on canvas) and J to the second element (right on canvas) */
            .settings.callback(
                getSelector("image")           /* UPON SELECTION ('callback'): test which option is selected                 */
                    .test.selected( getCanvas("target") )
                    .success(                  /* Whenever target is selected, apply the appropriate visibility settings     */
                        getImage("target cover").settings.hidden(),
                        getImage("target open" ).settings.visible(),
                        getImage("competitor cover").settings.visible(),
                        getImage("competitor open" ).settings.hidden(),
                        getText("selected").settings.text("Selected: target")
                    )
                    .failure(                  /* Whenever competitor is selected, apply the appropriate visibility settings */
                        getImage("target cover").settings.visible(),
                        getImage("target open" ).settings.hidden(),
                        getImage("competitor cover").settings.hidden(),
                        getImage("competitor open" ).settings.visible(),
                        getText("selected").settings.text("Selected: competitor")
                    ) 
            )
            .select(0)                         /* Start with selecting the first element (index = 0) i.e. the one displayed on the left */
        ,
        newKey("validate", " ")
            .wait()                            /* Validate with press on Space */
                           
    )
).label("Second");        /* All these trials are labeled "Second" */