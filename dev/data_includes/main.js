PennController.ResetPrefix(null) // Shorten command names (keep this line here)

newTrial(
    newCanvas("container", 640, 480).color('gray').print()
    ,
    newCanvas("green",200,200).color("green").print("center at 50%","top at 0%", getCanvas("container"))
    ,
    newCanvas("blue",200,200).color("blue").after(newCanvas("red",200,200).color("red"))
        .print("left at 25%", "bottom at 90%", getCanvas("container"))
    ,
    newSelector("select")
        .add(getCanvas("green"),getCanvas("blue"),getCanvas("red"))
        .frame("solid 2px purple")
        .shuffle()
    ,
    newButton("finish").print().log().wait()
)
.noTrialLog()


// Working on shuffle with before/after
newTrial(
    newCanvas("green",200,200).color("green").print()
    ,
    newCanvas("blue",200,200).color("blue").after(newCanvas("red",200,200).color("red")).print()
    ,
    newSelector("select")
        .add(getCanvas("green"),getCanvas("blue"),getCanvas("red"))
        .frame("solid 2px purple")
        .shuffle(getCanvas("green"),getCanvas("red"))
    ,
    newButton("finish").print().log().wait()
)
.noTrialLog()

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
