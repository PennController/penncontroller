// const FONTSIZE = 15;
// const SPEED = 1.5;
// const UPDATEBLURRATE = 10;
// const LEFTRIGHTGAP = 0;
// const BLURSIZE = 50;
// let Xs = [];

PennController.ResetPrefix(null);
PennController.Debug();
//PennController.PreloadZip("https://sprouse.uconn.edu/downloads/syllabicity/mixed.zip");

PennController(
    newVideo("testVideo", "bee_ram_giraffe.mp4")
        .print()
    ,   
    newText("instructions", "Press F if you think 0.999... = 1, press J otherwise.")
        .print()
    ,
    newKey("forj", "fj")
        .wait()
    ,
    newText("text", "f")
        .print()
    ,
    getKey("forj")
        .test.pressed("f")
        .success( newText("success", "You're right!").print() )
        .failure( newText("failure", "You're wrong, 0.999... and 1 do refer to the same number").print() )
    ,
    newButton("continue", "Continue")
        .print()
        .wait()
)

PennController.AddTable("keys",
    "item,key\n"+
    "item,f\n"+
    "item,j"
);

PennController.Template( "keys" ,
    row => PennController(
        newText("instructions", "Press F if you think 0.999... = 1, press J otherwise.")
            .print()
        ,
        newKey("forj", "fj")
            .wait()
        ,
        newText("text", row.key)
            .print()
        ,
        getKey("forj")
            .test.pressed(row.key)
            .success( newText("success", "You're right!").print() )
            .failure( newText("failure", "You're wrong, 0.999... and 1 do refer to the same number").print() )
        ,
        newButton("continue", "Continue")
            .print()
            .wait()
    )
)

PennController(
    newDropDown("drop", " ")          // Default text (not an option) is an empty space
        .settings.log()               // Log the last selection (default; alternatively pass "first" or "all")
        .settings.add("was", "is", "will be", "be")     // The options
        .shuffle()                    // Shuffle the order in which the options are presented
    ,
    newText("beginning", "The little boy &nbsp;")
        .settings.after(
            getDropDown("drop").settings.after( newText("end", "&nbsp; sick all day long.") )
        )
        .print()
    ,
    getDropDown("drop")
        .wait()
    ,
    newVar("SelectionRank",0)         // We will store the rank in this variable
        .settings.log()               // And we will log its value
    ,
    getDropDown("drop")
        .test.selected(0)             // If option at rank 0 was selected...
        .success( getVar("SelectionRank").set("First") ) // ... then we selected the first option
    ,
    getDropDown("drop")
        .test.selected(1)             // If option at rank 1 was selected...
        .success( getVar("SelectionRank").set("Second") ) // ... then we selected the first option
    ,
    getDropDown("drop")
        .test.selected(2)             // If option at rank 2 was selected...
        .success( getVar("SelectionRank").set("Third") ) // ... then we selected the first option
    ,
    getDropDown("drop")
        .test.selected(3)             // If option at rank 3 was selected...
        .success( getVar("SelectionRank").set("Fourth") ) // ... then we selected the first option
)

//PennController.AddHost("http://localhost/");
PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Pictures/");

PennController.AddTable("wordlearning",
    "item,group,condition,image1,image2,image3,image4,imageSwitch,word\n"+
    "1,A,same,candy.png,cardigan.png,checkmark.png,chips.png,coffee.png,wug\n"+
    "2,A,switch,coffee.png,computer.png,cookie.png,digital_watch.png,dress.png,dax\n"+
    "3,A,same,dress.png,dress_shirt.png,dress_socks.png,drums.png,candy.png,spleg\n"+
    "1,B,switch,candy.png,cardigan.png,checkmark.png,chips.png,coffee.png,wug\n"+
    "2,B,same,coffee.png,computer.png,cookie.png,digital_watch.png,dress.png,dax\n"+
    "3,B,switch,dress.png,dress_shirt.png,dress_socks.png,drums.png,candy.png,spleg"
);

PennController.Template( "wordlearning" ,
    row => PennController( "learn" ,
        newVar("choice-"+row.item)
            .settings.global()
        ,
        newVar("nonchoice-"+row.item)
            .settings.global()
        ,
        newSelector("choice")
            .settings.log()
        ,
        newText(row.word)
            .settings.center()
            .print()
        ,
        newCanvas("images", 630, 150)
            .print()
            .settings.add(   0 , 0 , newImage("image1", row.image1).settings.selector("choice") )
            .settings.add( 160 , 0 , newImage("image2", row.image2).settings.selector("choice") )
            .settings.add( 320 , 0 , newImage("image3", row.image3).settings.selector("choice") )
            .settings.add( 480 , 0 , newImage("image4", row.image4).settings.selector("choice") )
        ,
        getSelector("choice")
            .shuffle()
            .wait()
            .setVar("choice-"+row.item)
            .test.selected( getImage("image1") )
                .success( getVar("nonchoice-"+row.item).set(row.image2) )
                .failure( getVar("nonchoice-"+row.item).set(row.image1) )
    )
)

PennController( "transition",
    newVar("times7")
    ,
    newText("Enter a number between 3 and 9")
        .print()
    ,
    newTextInput("number")
        .settings.center()
        .print()
        .wait( getTextInput("number").test.text(/^[3-9]$/) )
        .settings.disable()
        .setVar("times7")
    ,
    getVar("times7")
        .set(v=>v*7)
    ,
    newText("Multiply this number by 7 and enter it below")
        .print()
    ,
    newTextInput("answer")
        .settings.center()
        .print()
        .wait( getTextInput("answer").test.text(getVar("times7")) )
        .settings.disable()
    ,
    newButton("Good, now click to continue")
        .print()
        .wait()
)


PennController.Template( "wordlearning" ,
    row => PennController( "showwhatlearned" ,
        newText(row.word)
            .settings.center()
            .print()
        ,
        newCanvas( "show" , 320 , 150 )
            .settings.add( 0 , 0 , row.condition=="same"?getVar("choice-"+row.item):newImage("nonchoice",row.imageSwitch) )
            .print()
        ,
        newSelector("choice-test")
            .settings.log()
            .settings.add( row.condition=="same"?getVar("choice-"+row.item):getImage("nonchoice") )
        ,
        getVar("nonchoice-"+row.item)
            .test.is(row.image1)
            .success( getCanvas("show")
                .settings.add( 160 , 0 , newImage("distractor1",row.image1).settings.selector("choice-test") )
            )
            .failure( getCanvas("show")
                .settings.add( 160 , 0 , newImage("distractor2",row.image2).settings.selector("choice-test") )
            )
        ,
        getSelector("choice-test")
            .shuffle()
            .wait()
    )
)


// PennController(
//     newImage("sound", "http://localhost:3000/server.py?resource=blackboard.png")
//         .print()
//     ,
//     newTextInput("waf", "wouf wouf")
//         .print()
//     ,
//     newButton("Continue")
//         .print()
//         .wait( getTextInput("waf").testNot.text(/^\W*$/) )
//     ,
//     //...DashFlashDash("The crocodile returned", "alligator", 50, "to the water")
//     //,
//     newVar("wouf", 0)
//     ,
//     newDropDown("drop", " ")          // Default text (not an option) is an empty space
//         .settings.log()               // Log the last selection (default; alternatively pass "first" or "all")
//         .settings.add("was", "is", "will be", "be")     // The options
//         .shuffle(true)                // Shuffle the order in which the options are presented
//     ,
//     newText("beginning", "The little boy &nbsp;")
//         .settings.after(
//             getDropDown("drop").settings.after( newText("end", "&nbsp; sick all day long.") )
//         )
//     ,
//     newSelector("test")
//         .settings.add( getText("beginning") , getText("end") )
//         .settings.keys( "A"                 ,    "B"     )
//         .select( getText("end") )
//     ,
//     getText("beginning")
//         .print()
//     ,
//     getDropDown("drop")
//         .wait()
//     ,
//     getVar("wouf")
//         .set(2)
//     ,
//     newButton("continue", "Continue")
//         .print()
//         .wait( getVar("wouf").test.is(2) )
//     ,
//     newText("link", "<p><a href='https://app.prolific.ac/submissions/complete?cc=G5NNLD6T' target='_'>"+
//                     "Click here to validate your submission and receive your compensation.</a></p>")
//         .settings.css({"font-weight": "bold", "font-size": "1.5em", "font-family": "sans-serif"})
//         .settings.center()
//         .print()
// )



// PennController(
//     newButton("validate","validate")
//         .print()
//         .wait()
//     ,
//     // MASK
//     newCanvas("blur", BLURSIZE+"vw", 1.5*FONTSIZE+"vw")
//         .settings.css("background", "radial-gradient(ellipse at center, "+
//                                     "rgba(255,255,255,0) 0%,rgba(255,255,255,0) 24%,"+
//                                     "rgba(255,255,255,1) 63%,rgba(255,255,255,1) 66%,rgba(255,255,255,1) 100%)")
//     ,
//     newCanvas("left_white",  Number((240-BLURSIZE)/2)+"vw", 1.5*FONTSIZE+"vw")
//         .settings.css("background", "white")
//     ,
//     newCanvas("right_white", Number((240-BLURSIZE)/2)+"vw", 1.5*FONTSIZE+"vw")
//         .settings.css("background", "white")
//     ,
//     newCanvas("mask", "240vw", 1.5*FONTSIZE+"vw")
//         .settings.add(          Number((240-BLURSIZE)/2)+"vw" , "center at 50%" ,  getCanvas("blur")        )
//         .settings.add(                                  "0vw" , "center at 50%" ,  getCanvas("left_white")  )
//         .settings.add( Number((240-BLURSIZE)/2+BLURSIZE)+"vw" , "center at 50%" ,  getCanvas("right_white") )
//     ,
//     // END MASK
//     newText("sentence", "The green toad put the yellow frog on the napkin into the box.")
//         .settings.css({'font-size': FONTSIZE+"vw", 'white-space': 'nowrap'})
//         .settings.cssContainer({overflow:"hidden"})
//     ,
//     newCanvas("screen", "100vw", "100vh")
//         .settings.add(                              0 , 0 , newCanvas("left",  Number(50-LEFTRIGHTGAP/2)+"vw", "100vh") )
//         .settings.add( Number(50+LEFTRIGHTGAP/2)+"vw" , 0 , newCanvas("right", Number(50-LEFTRIGHTGAP/2)+"vw", "100vh") )
//         .settings.add(                              0 , 0 , newCanvas("read", "100vw", "100vh").settings.cssContainer("overflow","hidden") )
//         .print()
//         .settings.cssContainer({position: "absolute", top: 0, left: 0})
//     ,
//     getCanvas("read")
//         .settings.add("left at 50%"  , "center at 50%", getText("sentence"))
//         // .settings.add("center at 50%", "center at 50%", getCanvas("mask")  )
//     ,
//     newEyeTracker("wouf", 10)
//         .calibrate()
//         .settings.add( getCanvas("left") , getCanvas("right") )
//         .settings.callback(function(x,y){
//             let el = getText("sentence")._element.jQueryContainer;
//             let offset = el.offset();
//             let windowWidth = $(window).width();
//             let elWidth = el.width();
//             let left = offset.left + SPEED*(windowWidth/2 - x)/100;
//             if (left>windowWidth-10)
//                 left = windowWidth-10;
//             if (left+elWidth<10)
//                 left = 10 - elWidth;
//             el.offset({top: offset.top, left: left});
//             // if (Xs.length < UPDATEBLURRATE)
//             //     Xs.push(x);
//             // else{
//             //     let left = 0;
//             //     Xs.map(n=>left+=n);
//             //     let mask = getCanvas("mask")._element.jQueryElement;
//             //     mask.offset({top: mask.offset().top, left: left/UPDATEBLURRATE - 1.2*windowWidth});
//             //     Xs = [x];
//             // }
//         })
//         .start()
//     ,
//     getCanvas("read")
//         .settings.css("cursor","none")
//     ,
//     getButton("validate")
//         .wait()
// )


// // Animates the canvas 'ball' and changes its color
// shake = color=>[
//     getCanvas("ball").settings.css({transition: '0.25s ease-in-out', transform: 'translateX(10px)'})
//     ,
//     getButton("shake").settings.disable()
//     ,
//     newTimer(300).start().wait()
//     ,
//     getCanvas("ball").settings.css({transform: 'none'})
//     ,
//     newTimer(300).start().wait()
//     ,
//     getCanvas("ball").settings.css('background', color)
//     ,
//     getButton("reset").settings.enable()
// ]

// // Generates a palette with two colors
// palette = (color1,color2,...elements)=>[
//     newCanvas("board", 100, 100)
//         .settings.center()
//         .settings.add( "center at 50" ,  -5  , newImage('bgPalette', 'https://www.dropbox.com/s/oa5ipw0b5gfgm5v/1494779624.png?raw=1' ).settings.size(120,90) )
//         .settings.add( 40 , 12 , newCanvas("color1" , 20, 20).settings.css('background', color1) )
//         .settings.add( 15 , 25 , newCanvas("color2" , 20, 20).settings.css('background', color2) )   
//         .print()
//     ,
//     newPalette("palette")
//         .settings.addColor( color1 , getCanvas("color1") /*, '2'*/ )
//         .settings.addColor( color2 , getCanvas("color2") /*, '1'*/ )
//         .settings.addElement( ...elements )
// ]


// // Generates a report sequence Canvas with the four specified colors
// report = (actual1,actual2,buffy1,buffy2) => [
//     newGroup("draw"),
//     newGroup("buffy"),
//     newGroup("shaken")
//     ,
//     newCanvas( "buffysGuesses" , 100 , 80 )
//         .settings.add( "center at 25%" ,  5 , newText("firstBuffy", "draw").settings.italic() )
//         .settings.add( "center at 25%" , 45 , newText("secondBuffy", "shake").settings.italic() )
//         .settings.add( "center at 75%" ,  5 , newCanvas("buffyPatch1", 20, 20).settings.css('background',buffy1) )
//         .settings.add( "center at 75%" , 45 , newCanvas("buffyPatch2", 20, 20).settings.css('background',buffy2) )
//     ,
//     newCanvas("buffyPanel", 200, 100)
//         .settings.css("font-family", "Chalkduster, fantasy")
//         .settings.add( "right at 100%" , "center at 55%" , newImage("buffy", "buffy_blindfold.png").settings.size(80,80) )
//         .settings.add( -5 , -10 , newImage("buffyBubble", "buffyBubble.png").settings.size(130,120) )
//         .settings.add( "center at 25%" , 0 , newText("think", "I THINK...") )
//         .settings.add( 0 , 20 , getCanvas("buffysGuesses") )
//     ,
//     newCanvas("drawnBall", 20, 20).settings.css({'border': 'solid 1px white', 'border-radius': '10px', 'background': actual1})
//     ,
//     newCanvas("shakenBall", 20, 20).settings.css({'border': 'solid 1px white', 'border-radius': '10px', 'background': actual2})
//     ,
//     newText("label draw" , "1. Draw:"), newText("label guess", "2. Buffy's guesses:"), newText("label shake", "3. Shake:")
//     ,
//     newCanvas( "labels" , 600 , 20 )
//         .settings.css({"font-family": "Chalkduster, fantasy", color: "white"})
//         .settings.add( "center at 16%" , "center at 50%" , getText("label draw").settings.group("draw") )
//         .settings.add( "center at 50%" , "center at 50%" , getText("label guess").settings.group("buffy") )
//         .settings.add( "center at 83%" , "center at 50%" , getText("label shake").settings.group("shaken") )
//     ,
//     newCanvas( "reports" , 600 , 110 )
//         .settings.add( "center at 16%" , "center at 50%" , getCanvas("drawnBall").settings.group("draw") )
//         .settings.add( "center at 50%" , "center at 50%" , getCanvas("buffyPanel").settings.group("buffy") )
//         .settings.add( "center at 83%" , "center at 50%" , getCanvas("shakenBall").settings.group("shaken")  )
//     ,
//     newImage("chalk", "https://www.dropbox.com/s/bpwbe2psliq0ak5/chalk_overlay.png?raw=1")
//         .settings.size(600,160)
//         .settings.css("opacity",0.2)
//         .settings.cssContainer("pointer-events", "none")
//     ,
//     newCanvas( "sequence" , 600 , 160 )
//         .settings.css("border", "solid 5px darkgoldenrod")
//         .settings.add( 0 , 0  , newImage("blackboard", "https://www.dropbox.com/s/xo5r6a38xook8x7/blackboard.png?raw=1").settings.size(600,160) )
//         .settings.add( 0 , 10 , getCanvas("labels")  )
//         .settings.add( 0 , 40 , getCanvas("reports") )
//         .settings.add( "center at 30%" , "center at 50%" , newCanvas("lineLeft", 0,108).settings.css("border","dashed 1px white").settings.group("buffy") )
//         .settings.add( "center at 70%" , "center at 50%" , newCanvas("lineRight",0,108).settings.css("border","dashed 1px white").settings.group("shaken") )
//         .settings.add( 0 , 0  , getImage("chalk") )
// ]

// // Generates a report without Buffy :'(
// reportNoBuffy = (...args) => report(...args).concat([
//     getCanvas("labels").settings.remove( getText("label guess")  ),
//     getCanvas("reports").settings.remove( getCanvas("buffyPanel") ),
//     getCanvas("sequence").settings.remove( getCanvas("lineLeft")   ).settings.remove( getCanvas("lineRight")  )
//     ,
//     getCanvas("sequence").settings.add( "center at 50%" , "center at 50%" , newCanvas("lineMiddle", 0,  108).settings.css("border", "dashed 1px white") )
//     ,
//     getText("label shake").settings.text("2. Shake:")
// ])
    

// // Adds some style to the occurrences of the color's row in the string
// String.prototype.styleColor = function(row) {
//     return this.replace(
//                 new RegExp("(\\W"+row.Color+"(\\W|$))")
//                 , 
//                 "<span style='color:"+row.Color+"; text-shadow: 1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, -1px 0 0 #000; font-weight: normal'>$1</span>"
//            );
// }

// PennController.Template( "psbuffy.csv" ,
//     row => PennController( "practice-"  + row.Order + "-" + row.Subject + "-" + row.MatrixLeftPredicate + "-" + row.Condition ,
//         newText("Practice trial")
//             .settings.center()
//             .settings.italic()
//             .settings.color('blue')
//             .print()
//         ,
//         newText("description", "<p><em>Fact:</em> &nbsp; "+row.Sentence.charAt(0).toUpperCase()+row.Sentence.slice(1).styleColor(row)+"</p>").print()
//         ,
//         report(row.Actual1,row.Actual2,row.Buffy1,row.Buffy2),
//         getCanvas("sequence").print(),
//         getGroup("draw").settings.hidden(),
//         getGroup("buffy").settings.hidden(),
//         getGroup("shaken").settings.hidden()
//         ,
//         newTimer("between-steps", DELAY).start().wait()    
//         ,
//         getGroup("draw").settings.visible(),
//         getTimer("between-steps").start().wait()
//         ,
//         getGroup("buffy").settings.visible(),
//         getTimer("between-steps").start().wait()
//         ,
//         getGroup("shaken").settings.visible(),
//         getCanvas("lineRight").settings.visible()
//         ,
//         palette( row.Color , row.altercolor , getCanvas('drawnBall') , getCanvas('buffyPatch1') , getCanvas("buffyPatch2") , getCanvas('shakenBall') ),
//         getPalette("palette")
//             .brush( getCanvas('drawnBall')   , row.Actual1 )
//             .brush( getCanvas('buffyPatch1') , row.Buffy1  )
//             .brush( getCanvas('buffyPatch2') , row.Buffy2  )
//             .brush( getCanvas('shakenBall')  , row.Actual2 )
//             .settings.log()
//         ,
//         newKey(" ").settings.callback( getButton("continue").click() ),
//         newButton('continue', "Continue")
//             .print()
//             .wait()
//             .remove()
//         ,
//         getCanvas('board').remove()
//         ,
//         ...checkColors(row)
//         ,
//         ( row.Order==10 ? 
//           getTooltip("feedback")
//               .settings.text("Good, practice is over! The experiment will start next and we will no longer give you feedback.")
//               .settings.label("Start the experiment")
//               .print( getCanvas("sequence") )
//               .wait()
//         : 
//         null )
//     )
// )
    
    
    
// checkColors = row => {
//     let top = [
//         newTooltip("feedback", "")
//             .settings.position("bottom center")
//             .settings.frame('none')
//         ,
//         newVar("correct", true)
//     ];
//     let commands = [
//         getVar("correct").test.is(true).failure(
//             getTooltip("feedback").settings.text("Oops, it appears you were wrong").print(getCanvas("sequence")).wait()
//         )
//     ];
//     if ((row.Subject=="Second" && row.MatrixLeftPredicate=="Was") || row.Subject=="Again") commands = [
//         getPalette("palette").test.color(getCanvas("shakenBall"),row.Color).failure( blink(getCanvas("shakenBall")) , getVar("correct").set(v=>false) )
//         ,
//         ...commands
//         ,
//         getPalette("palette").brush( getCanvas("shakenBall") , row.Color )
//     ];
//     if (row.Subject=="Second" && row.MatrixLeftPredicate=="Thought") commands = [
//         getPalette("palette").test.color(getCanvas("buffyPatch2"),row.Color).failure( blink(getCanvas("buffyPatch2")) , getVar("correct").set(v=>false) )
//         ,
//         ...commands
//         ,
//         getPalette("palette").brush( getCanvas("buffyPatch2") , row.Color )
//     ];
//     if ((row.Subject=="First" && row.MatrixLeftPredicate=="Was") || row.Subject=="Again") commands = [
//         getPalette("palette").test.color(getCanvas("drawnBall"),row.Color).failure( blink(getCanvas("drawnBall")) , getVar("correct").set(v=>false) )
//         ,
//         ...commands
//         ,
//         getPalette("palette").brush( getCanvas("drawnBall") , row.Color )
//     ];
//     if (row.Subject=="First" && row.MatrixLeftPredicate=="Thought") commands = [
//         getPalette("palette").test.color(getCanvas("buffyPatch1"),row.Color).failure( blink(getCanvas("buffyPatch1")) , getVar("correct").set(v=>false) )
//         ,
//         ...commands
//         ,
//         getPalette("palette").brush( getCanvas("buffyPatch1") , row.Color )
//     ];
//     return [
//         ...top
//         ,
//         ...commands
//         ,
//         unblink(getCanvas("drawnBall")),unblink(getCanvas("shakenBall")),unblink(getCanvas("buffyPatch1")),unblink(getCanvas("buffyPatch2")),
//         getCanvas("drawnBall").settings.css("border", "solid 1px white"),
//         getCanvas("shakenBall").settings.css("border", "solid 1px white"),
//         getCanvas("buffyPatch1").settings.css("border", "none"),
//         getCanvas("buffyPatch2").settings.css("border", "none")
//         ,
//         newTimer("beforeEnd", 200).start().wait()
//         ,
//         getVar("correct").test.is(true).failure(
//             getTooltip("feedback").settings.text("Now that's better").settings.label("Got it!").print(getCanvas("sequence")).wait()
//         )
//     ];
// }
    

// blink = element => newFunction(function(){
//         element._element.jQueryElement.css("border", "solid 2px red");
//         let b = 1;
//         let a = setInterval(()=>{
//             b = 1 - b;
//             element._element.jQueryElement.css("border", (b==1?"solid 2px red":"none"));
//         }, 500);
//         this['blink-'+element._element.id] = a;
//     }).call()
        
        
// unblink = element => newFunction(function(){
//         if (this.hasOwnProperty('blink-'+element._element.id)) clearInterval(this['blink-'+element._element.id]);
//     }).call()


// PennController.ResetPrefix(null);

// PennController.AddHost("https://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/");

// const DELAY = 750;

// PennController.Sequence( 
//     startsWith("practice")
// )

    
// // Exectued before all trials
// PennController.Header(
//     defaultTooltip                  // Aspect & properties of all tooltips
//         .settings.size(250, 60)
//         .settings.key("")
//         .settings.frame()
//         .settings.label("Click here or Press Space")
//     ,
//     newTimer(200).start().wait()
// )    