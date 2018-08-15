// This tells Ibex you will send the results early
//var manualSendResults = true;
var showProgressBar = true;
var shuffleSequence = seq("label", "consent","instructions","start",/*"Practice-good","Practice-intermed", "Practice-bad","preexpt",randomize("experiment"),
                            "send","feedback","confirmation","final"*/);
// rshuffle(startsWith("experiment")),rshuffle(startsWith("experiment"))
PennController.ResetPrefix(null);


// Adds .settings.keys to all element types (but only effective for Button)
// PennController._AddStandardCommands(function(PennEngine){
//     this.settings = {
//         keys: function(resolve, keys){
//             if (this.type=="Button")
//                 PennEngine.controllers.running.safeBind($(document), "keydown", e=>{
//                     if (this.jQueryElement.parent() && !this.disabled &&
//                         keys.toUpperCase().includes(String.fromCharCode(e.which).toUpperCase()))
//                         this.jQueryElement.trigger("click");
//                 });
//             resolve();
//         }
//     };
// });

PennController.Header(
    newVar("StartTime", 0)
        .test.is( 0 )
        .success(
            getVar("StartTime")
                .set( v=>Date.now() )
        )
);

PennController.Footer(
    newVar("TimeDifference")
        .set( getVar("StartTime") )
        .set( v=>Date.now()-v )
    ,
    newText("elapsed")
        .settings.text( getVar("TimeDifference") )
        .settings.before( newText("labelElapsed", "Time elapsed (in ms):&nbsp;") )
        .print()
    ,
    newButton("validate", "Continue")
        .print()
        .wait()
);

var items = [
    ["label", "PennController", PennController(
        newVar("name")
        ,
        newTextInput("nameInput", "What is your name?")
            .settings.once()
            .print()
            .wait()
            .setVar("name")
        ,
        newText("helloname")
            .settings.before( newText("hello", "Hello&nbsp;") )
            .settings.text( getVar("name") )
            .print()
        ,
        newButton("continue", "Continue")
            .print()
            .wait()
        ,
        getVar("StartTime")
            .settings.global()
        ,
        newButton("getTimeDiff", "How many ms since display?")
            .print()
            .wait()
    )],
    ["label", "PennController", PennController(
        getVar("StartTime")
            .settings.local()
        ,
        newButton("getTimeDiff", "How many ms since PREVIOUS display?")
            .print()
            .wait()
    )],
    ["label", "PennController", PennController(
        newButton("getTimeDiff", "How many ms since NEW display?")
            .print()
            .wait()
    )],



    ["label", "PennController", PennController(
        defaultText
            .print()
        ,
        defaultKey
            .wait()
        ,
        newVar("firstKeyPressed")
        ,
        newText("firstPress", "Press any key")
        ,
        newKey("firstKey", "")
        ,
        getVar("firstKeyPressed")
            .set( getKey("firstKey") )
        ,
        newText("printFirstKey", "")
            .settings.text( getVar("firstKeyPressed") )
        ,
        newText("secondPress", "Good, now press a second key.")
        ,
        newKey("secondKey", "")
            .test.pressed( getVar("firstKeyPressed") )
            .success( newText("same", "So, you pressed the same key twice!") )
            .failure( newText("diff", "You appear to be quite inconstant.") )
        ,
        newButton("validate", "OK")
            .print()
            .wait()
        ,
        newVar("participantsName", "")
            .settings.global()
        ,
        newTextInput("name", "Please write your name")
            .print()
            .wait()
            .setVar( "participantsName" )
      ).log("Participant", getVar("participantsName") )]
      ,
      ["label", "PennController", PennController(
        newText("hello", "Hello ")
            .settings.after( newText("name", "") )
            .settings.after( newText("rest", ", how are you today?") )
            .print()
        ,
        getText("name")
            .settings.text( getVar("participantsName") )
        ,
        newSelector("mood")
        ,
        newCanvas("moods", 200, 40)
            .settings.add(  10, 10, newButton("good", "Good, thank you").settings.selector("mood") )
            .settings.add( 110, 10, newButton("bad", "Not so well").settings.selector("mood") )
            .print()
        ,
        getSelector("mood")
            .wait()
      ).log("Participant", getVar("participantsName") )]
      ,

    ["consent", "PennController", PennController(
        newVar("trialsLeft", 3)
        ,
        newTextInput("guess", "Guess my name")
            .settings.after( 
                newText("remain", " Number of remaining attempts: ")
                    .settings.after( newText("trial", "3") )
            )
            .print()
            .wait(  
                getTextInput("guess")
                    .test.text( /Jeremy/i )
                    .failure( 
                        getText("trial")    // Decrease trialsLeft and update trial's text with it 
                            .settings.text( getVar("trialsLeft").set(v=>Math.max(0,v-1)) )
                        ,
                        getVar("trialsLeft")// Disable guess if 0 attempts left
                            .test.is(0).success( getTextInput("guess").settings.disable() )
                    )   
            )
    )],

    ["consent", "PennController", PennController(
        newHtml("consent", "IbexConsentProlific.html")
            .settings.log()
            .print()
        ,
        newButton("consent btn", "I consent to take this experiment")
            .print()
            .wait( getHtml("consent").test.complete().failure( getHtml("consent").warn() ) )
    )]
    , 
    ["instructions", "PennController", PennController(
        newHtml("instructions form", "IbexInstructions-Unmarked.html")
            .print()
        ,
        newButton("continue to expt", "Click to start the experiment.")
            .print()
            .wait( getHtml("instructions form").test.complete().failure(getHtml("instructions form").warn()) )
    )]
	,
    ["start", "PennController", PennController(
        newText("start message", "Let's start with a couple of practice items!")
            .settings.bold() 
			.settings.center()
            .print()	
        ,
        newButton("continue to practice", "Continue to the practice items.")
            .print()
            .wait()			
    )]	
    ,
   ["preexpt", "PennController", PennController(
        newText("pre experiment", "The actual experiment is about to begin. Please turn off any distractions and complete the experiment in one sitting.")
            .settings.bold() // Boldface
			.settings.center()
            .print()			
        ,
        newButton("continue to critical", "Take the experiment.")
            .print()
            .wait()				
    )]	
    ,
    ["send", "__SendResults__", {}]
	,
    ["feedback", "PennController", PennController(
        newHtml("feedback form", "IbexFeedbackPreConfirmationProlific.html")
            .print()
        ,
        newButton("continue to confirm", "Click here to confirm your participation!")
			.settings.bold()
			.print()
            .wait()				
    )]
	,
    ["confirmation", "PennController", PennController(
        newHtml("confirmation form", "IbexConfirmationProlific.html")
            .print()
        ,
        newButton("continue final", "Click to confirm that your answers went through.") // To debriefing, on Sona.
            .print()
            .wait()						
    )]
	,	
// Debriefing (Sona only)
//    ["debriefing", "PennController", PennController(
//       newHtml("confirmation form", "IbexDebriefing.html")
//            .print()
//		,
 //       newButton("continue to confirm", "Click to confirm that your answers went through.")
	//		.settings.bold()
		//	.print()
          //  .wait()
//    )]                     
//,
   ["final", "PennController", PennController(
        newText("final message", "The results were successfully sent to the server. Thanks!")
            .settings.bold() // Boldface
			.settings.center()
            .print()			
    )]
	
];


var containerStim = $("<div>").css("border", "solid 1px darkgreen");
var containerAnswer = $("<div>").css("border", "solid 1px darkgreen");

PennController.GetTable( "datasource-however.csv" ).setLabel("Expt");

PennController.FeedItems( PennController.GetTable( "datasource-however.csv" ).filter("ExptType","Practice"),
    (item) => PennController(
        newTooltip("instructions", "Press Space to continue")
            .settings.position("bottom center")
            .settings.key(" ", "no click") 
        ,
        newFunction("isGood", function(){ return item.Expt=="Practice-good"; })
        ,
        newFunction("isIntermed", function(){ return item.Expt=="Practice-intermed"; })
        ,
        newCanvas("stimbox", 730, 120)
            .settings.add(25,25, 
                newText("background", 
                    "Imagine that you're at the gym, and you happen to overhear the following bit of someone's conversation:")
                    .settings.size(700, 30)
            )	
            .settings.add(25,70, 
                newText("stimuli", item.StimUnmarked)
                    .settings.italic()
                    .settings.size(700, 30)
            )
			.print()
        ,
        // newFunction("addContainerStim", el=>el.append(containerStim.empty()) )
        //     .call()
        // ,
        // newText("background", 
        //     "Imagine that you're at the gym, and you happen to overhear the following bit of someone's conversation:")
        //     .settings.size(700, 30)
        //     .print( containerStim )
        // ,
        // newText("stimuli", item.StimUnmarked)
        //     .settings.italic()
        //     .settings.size(700, 30)
        //     .print( containerStim )
		// ,
        newTimer("transit", 500)
            .start()
            .wait()
        ,
        newText("instructionsText", "")
            .settings.center()
            .settings.css("background", "floralwhite")
        ,
        getFunction("isGood")
            .test.is(true)
            .success( getText("instructionsText").settings.text("Most people...") )
            .failure( 
                getFunction("isIntermed")
                    .test.is(true)
                    .success( getText("instructionsText").settings.text("bla bla bla...") )
                    .failure( getText("instructionsText").settings.text("ble ble ble...") )
            )
        ,
        getText("instructionsText")
            .print()
        ,
        getTooltip("instructions")
            .print( getText("instructionsText") )
            .wait()
        ,
        newScale("answer", 9)  
                    .settings.disable()
                    .settings.before( newText("labelLeft", "Completely unnatural").settings.bold() )
                    .settings.after( newText("labelRight", "Completely natural").settings.bold() )
        ,            
        getFunction("isGood")
            .test.is(true)
            .success( getScale("answer").settings.default(8) )
            .failure( 
                getFunction("isIntermed")
                    .test.is(true)
                    .success( getScale("answer").settings.default(4) )
                    .failure( getScale("answer").settings.default(0) )
            )
		,	
        newCanvas("ansbox", 730, 120)
            .settings.add(25,25, newText("leftAnswer", "To me, this sentence sounds").settings.size(700, 30) )   
            .settings.add(25,70, getScale("answer").settings.size(undefined, 20) )
            .print()
        ,        
        newButton("validate", "Next question.")
            .settings.center()	
            //.settings.keys(" ")
            .print()	
            .wait()
	)
);



PennController.FeedItems( PennController.GetTable( "datasource-however.csv" ).filter("Expt","experiment").filter("EmbCondition", "MC") ,
    (item) => PennController(
        newTimer("blank", 1000)
            .start()
            .wait()
        ,    
        newTooltip("instructions", "Press Space to continue")
            .settings.size(180, 25)
            .settings.position("bottom center")
            .settings.key(" ", "no click") 
        ,
        newCanvas("stimbox", 730, 120)
            .settings.add(25,25, 
                newText("background", 
                    "Imagine that you're at the gym, and you happen to overhear the following bit of someone's conversation:")
                    .settings.size(700, 30)
            )   
            .settings.add(25,70, 
                newText("stimuli", item.StimUnmarked)
                    .settings.italic()
                    .settings.size(700, 30)
            )
            .print()
        ,
        newTimer("transit", 2000)
            .start()
            .wait()
        ,   
        newScale("answer", 9)  
            .settings.log()
            .settings.before( newText("labelLeft", "Completely unnatural").settings.bold() )
            .settings.after( newText("labelRight", "Completely natural").settings.bold() )
        ,
        newCanvas("answerbox", 730, 120)
            .settings.add(25,25, newText("leftAnswer", "To me, this sentence sounds:").settings.size(700, 30) )   
            .settings.add( 25,70, getScale("answer").settings.size(undefined, 20) )
            .print()
        ,
        newTooltip("warning", "Select a response first")
            .settings.frame()
            .settings.position("bottom center")
            //.settings.key(" ", "no click")
        ,
        newButton("validate", "Next question.")
            .settings.center()  
            .print()    
            .wait(
                getScale("answer").test.selected()
                    .failure( getTooltip("warning").print(getScale("answer")) )
            )

	)
);






