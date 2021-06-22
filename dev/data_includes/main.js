PennController.ResetPrefix(null) // Shorten command names (keep this line here)

AddHost("https://test.pcibex.net/")

newTrial(
    newButton("Start").print().wait()
    ,
    newVar("grrr",Math.random())
        .test.is(v=>v>0.5)
        .success( newButton("Sup").print().wait() )
        .failure( newButton("Inf").print().wait() )
)

CheckPreloaded( startsWith("trial") )
    .label( "preloadTrial" );   

newTrial( "trial",
    newAudio("a","Fill_2_1.mp3").disable(0.2).print()
    ,
    newVideo("https://upload.wikimedia.org/wikipedia/commons/4/45/Boat_-_Oujda_-_Morocco.webm")
        .size(320,240)
        .print()
        .wait()
    ,
    defaultText
        .center()
        .print()
    ,
    newVar("counter", 0)
    ,
    newKey("space"," ")
        .callback(
            getVar("counter").set(v=>v+1)
                 .test.is(1)
                 .success( newAudio("Fill_2_1.mp3").play() )
                 .test.is(2)
                 .success( getAudio("Fill_2_1.mp3").stop(), newAudio("Fill_2_2.mp3").play() )
                 .test.is(3)
                 .success( getAudio("Fill_2_2.mp3").stop(), newAudio("Fill_2_3.mp3").play() )
                 .test.is(4)
                 .success( getAudio("Fill_2_3.mp3").stop(), newAudio("Fill_2_4.mp3").play() )
                 .test.is(5)
                 .success( getAudio("Fill_2_4.mp3").stop(), newAudio("Fill_2_5.mp3").play() )
                 .test.is(6)
                 .success( getAudio("Fill_2_5.mp3").stop(), newAudio("Fill_2_6.mp3").play() )
                 .test.is(7)
                 .success( getAudio("Fill_2_6.mp3").stop(), newAudio("Fill_2_7.mp3").play() )
                 .test.is(8)
                 .success( getAudio("Fill_2_7.mp3").stop(), newAudio("Fill_2_8.mp3").play() )
                 .test.is(9)
                 .success( getAudio("Fill_2_8.mp3").stop(), newAudio("Fill_2_9.mp3").play() )
        )
    ,
    newController(DashedSentence, {s:"waf wouf wef wif， wuf wyf wof waef wuaf"})
        .center()
        .print()
        .log()
        .wait()
        .remove()
    ,
    getKey("space")
        .disable()
    ,
    newKey("next", "Enter")
        .wait()
);

newTrial( "trial",
    defaultText
        .center()
        .print()
    ,
    newVar("counter", 0)
    ,
    newKey("space"," ")
        .callback(
            getVar("counter").set(v=>v+1)
                 .test.is(1)
                 .success( newAudio("Fill_3_1.mp3").play() )
                 .test.is(2)
                 .success( getAudio("Fill_3_1.mp3").stop(), newAudio("Fill_3_2.mp3").play() )
                 .test.is(3)
                 .success( getAudio("Fill_3_2.mp3").stop(), newAudio("Fill_3_3.mp3").play() )
                 .test.is(4)
                 .success( getAudio("Fill_3_3.mp3").stop(), newAudio("Fill_3_4.mp3").play() )
                 .test.is(5)
                 .success( getAudio("Fill_3_4.mp3").stop(), newAudio("Fill_3_5.mp3").play() )
                 .test.is(6)
                 .success( getAudio("Fill_3_5.mp3").stop(), newAudio("Fill_3_6.mp3").play() )
                 .test.is(7)
                 .success( getAudio("Fill_3_6.mp3").stop(), newAudio("Fill_3_7.mp3").play() )
                 .test.is(8)
                 .success( getAudio("Fill_3_7.mp3").stop(), newAudio("Fill_3_8.mp3").play() )
        )
    ,
    newController(DashedSentence, {s:"waf wouf wef wif， wuf wyf wof waef"})
        .center()
        .print()
        .log()
        .wait()
        .remove()
    ,
    getKey("space")
        .disable()
    ,
    newKey("next", "Enter")
        .wait()
);

newTrial( "trial",
    defaultText
        .center()
        .print()
    ,
    newVar("counter", 0)
    ,
    newKey("space"," ")
        .callback(
            getVar("counter").set(v=>v+1)
                 .test.is(1)
                 .success( newAudio("Fill_2_1.mp3").play() )
                 .test.is(2)
                 .success( getAudio("Fill_2_1.mp3").stop(), newAudio("Fill_2_2.mp3").play() )
                 .test.is(3)
                 .success( getAudio("Fill_2_2.mp3").stop(), newAudio("Fill_2_3.mp3").play() )
                 .test.is(4)
                 .success( getAudio("Fill_2_3.mp3").stop(), newAudio("Fill_2_4.mp3").play() )
                 .test.is(5)
                 .success( getAudio("Fill_2_4.mp3").stop(), newAudio("Fill_2_5.mp3").play() )
                 .test.is(6)
                 .success( getAudio("Fill_2_5.mp3").stop(), newAudio("Fill_2_6.mp3").play() )
                 .test.is(7)
                 .success( getAudio("Fill_2_6.mp3").stop(), newAudio("Fill_2_7.mp3").play() )
                 .test.is(8)
                 .success( getAudio("Fill_2_7.mp3").stop(), newAudio("Fill_2_8.mp3").play() )
                 .test.is(9)
                 .success( getAudio("Fill_2_8.mp3").stop(), newAudio("Fill_2_9.mp3").play() )
        )
    ,
    newController(DashedSentence, {s:"waf wouf wef wif， wuf wyf wof waef wuaf"})
        .center()
        .print()
        .log()
        .wait()
        .remove()
    ,
    getKey("space")
        .disable()
    ,
    newKey("next", "Enter")
        .wait()
);

newTrial( "trial",
    defaultText
        .center()
        .print()
    ,
    newVar("counter", 0)
    ,
    newKey("space"," ")
        .callback(
            getVar("counter").set(v=>v+1)
                 .test.is(1)
                 .success( newAudio("Fill_3_1.mp3").play() )
                 .test.is(2)
                 .success( getAudio("Fill_3_1.mp3").stop(), newAudio("Fill_3_2.mp3").play() )
                 .test.is(3)
                 .success( getAudio("Fill_3_2.mp3").stop(), newAudio("Fill_3_3.mp3").play() )
                 .test.is(4)
                 .success( getAudio("Fill_3_3.mp3").stop(), newAudio("Fill_3_4.mp3").play() )
                 .test.is(5)
                 .success( getAudio("Fill_3_4.mp3").stop(), newAudio("Fill_3_5.mp3").play() )
                 .test.is(6)
                 .success( getAudio("Fill_3_5.mp3").stop(), newAudio("Fill_3_6.mp3").play() )
                 .test.is(7)
                 .success( getAudio("Fill_3_6.mp3").stop(), newAudio("Fill_3_7.mp3").play() )
                 .test.is(8)
                 .success( getAudio("Fill_3_7.mp3").stop(), newAudio("Fill_3_8.mp3").play() )
        )
    ,
    newController(DashedSentence, {s:"waf wouf wef wif， wuf wyf wof waef"})
        .center()
        .print()
        .log()
        .wait()
        .remove()
    ,
    getKey("space")
        .disable()
    ,
    newKey("next", "Enter")
        .wait()
);



newTrial(newText("the end").print(),newButton().wait())

// AddHost("https://files.lab.florianschwarz.net/ibexfiles/Pictures/")
// AddHost("https://files.lab.florianschwarz.net/ibexfiles/NoWin/Audio/")

// newTrial(newButton("Start").print().wait())

// newTrial( "images1" ,
//     defaultImage.size(32,32),
//     newImage("alien_blue.png").print(),
//     newImage("alien_blue1.png").print(),
//     newImage("alien_green.png").print(),
//     newImage("alien_green1.png").print(),
//     newImage("alien_grey.png").print(),
//     newImage("alien_grey1.png").print(),
//     newAudio("ctl_none_f_1_con.mp3").play(),
//     newButton("next").print().wait()
// )
// newTrial( "images2" ,
//     defaultImage.size(32,32),
//     newImage("alien_orange.png").print(),
//     newImage("alien_orange1.png").print(),
//     newImage("alien_pink.png").print(),
//     newImage("alien_red.png").print(),
//     newImage("alien_red1.png").print(),
//     newImage("alien_yellow.png").print(),
//     newImage("alien_yellow1.png").print(),
//     newAudio("ctl_none_f_1_tar.mp3").play(),
//     newButton("next").print().wait()
// )

// newTrial("audios",
//     newAudio("ctl_none_f_2_con.mp3").print(),
//     newAudio("ctl_none_f_2_tar.mp3").print(),
//     newAudio("ctl_none_t_1_con.mp3").print(),
//     newAudio("ctl_none_t_1_tar.mp3").print(),
//     newAudio("ctl_none_t_2_con.mp3").print(),
//     newAudio("ctl_none_t_2_tar.mp3").print(),
//     newAudio("ctl_nwin_f_1_con.mp3").print().wait()
// )

// newTrial( "selector1" ,
//     newCanvas("container", 640, 480).color('gray').print()
//     ,
//     newCanvas("green",200,200).color("green").print("center at 50%","top at 0%", getCanvas("container"))
//     ,
//     newCanvas("blue",200,200).color("blue").after(newCanvas("red",200,200).color("red"))
//         .print("left at 25%", "bottom at 90%", getCanvas("container"))
//     ,
//     newSelector("select")
//         .add(getCanvas("green"),getCanvas("blue"),getCanvas("red"))
//         .frame("solid 2px purple")
//         .shuffle()
//     ,
//     newButton("finish").print().log().wait()
//     ,
//     newButton("finish")
// )
// .noTrialLog()


// // Working on shuffle with before/after
// newTrial( "selector2" ,
//     newCanvas("green",200,200).color("green").print()
//     ,
//     newCanvas("blue",200,200).color("blue").after(newCanvas("red",200,200).color("red")).print()
//     ,
//     newSelector("select")
//         .add(getCanvas("green"),getCanvas("blue"),getCanvas("red"))
//         .frame("solid 2px purple")
//         .shuffle(getCanvas("green"),getCanvas("red"))
//     ,
//     newButton("finish").print().log().wait()
// )
// .noTrialLog()

// newTrial(
//     newCanvas("container","100vw","2em").print()
//     ,
//     newController("ds","DashedSentence", {s: "This is a test", display: "in place"})
//         .css("font-weight","bold")
//         // .print( "center at 50%","middle at 50%", getCanvas("container") )
//         .print( "center at 50%","middle at 50%" )
//         .wait()
//         .remove()
//     ,
//     newButton("next").print().wait().remove()
//     ,
//     getController("ds")
//         .print()
//         .wait()
//     ,
//     getButton("next").wait()
// )


// Sequence(
//     "trial1",
//     "trial2",
//     "trial3",
//     "trial4",
//     "trial5"
// )

// AddTable("jumps",`label,jumps
// trial1,trial1:trial2:trial3:trial4:trial5
// trial2,trial1:trial2:trial3:trial4:trial5
// trial3,trial1:trial2:trial3:trial4:trial5
// trial4,trial1:trial2:trial3:trial4:trial5
// trial5,trial1:trial2:trial3:trial4:trial5`)

// Template( "jumps" ,  row=>newTrial( row.label,
//     newText(row.label).print()
//     ,
//     newTooltip("flash","").label(""),newTimer("timeout",2000)
//     ,
//     ...row.jumps.split(":").map(j=>newButton("Jump to "+j).callback(
//         jump(j),
//         getTooltip("flash").text("Next trial will be <em>"+j+"</em>").print("center at 50vw","middle at 50vh"),
//         getTimer("timeout").start().wait(),
//         getTooltip("flash").remove()
//     ).print())
//     ,
//     newButton("Next trial").print().wait()
// ) )
