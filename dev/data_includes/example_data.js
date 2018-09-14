// var shuffleSequence = seq("trial");
// PennController.ResetPrefix(null);

// var items = [
//     ["trial", "PennController", PennController(
//         newText("test sentence", "The fish swim in a tank which is perfectly round")
//             .print()        // A test sentence
//         ,
//         newImage("competitor", "http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/1fishSquareTank.png")
//             .print()        // An image with 1 fish that swims in a square tank
//         ,
//         newImage("target", "http://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/2fishRoundTank.png")
//             .print()        // An image with 2 fish that swim in a round tank
//         ,
//         newSelector("tank") // We indicate that target+competitor belong to a selection group
//             .settings.add( getImage("target") , getImage("competitor") )
//             .wait()         // On hold until target or competitor is selected
//     )]
// ];


var shuffleSequence = seq("trial");
PennController.ResetPrefix(null);

var items = [
    ["trial", "PennController", PennController(
        newText("green", "To me, the color green is...")
        ,
        newTextInput("alternative", "")
            .settings.before( newText("other", "Other:") )
        ,
        newScale("judgment",    "cold", "cool", "lukewarm", "warm", "hot", "")
            .settings.size("auto", "auto")
            .settings.labels("top")
            .settings.before( getText("green") )
            .settings.after( getTextInput("alternative") )
            .print()
            .wait()
    )]
];