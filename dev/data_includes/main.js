PennController.ResetPrefix(null); // Shorten command names (keep this line here)

newTrial(
    newController("mySentence", "DashedSentence", {s: "this is an example"})
    ,
    newButton("Read")
        .callback(
            clear()
            ,
            getController("mySentence")
                .print()
                .log()
                .wait()
                .remove()
            ,
            getButton("Read")
                .print()
            ,
            getButton("Next")
                .print()
        )
        .print()
    ,
    newButton("Next")
        .wait()
)

newTrial(
    defaultText.center()
    ,
    newText("first")
        .print()
    ,
    newCanvas("container", 500, 200)
        .add(0,0,newText("second"))
        .add("right at 100%","bottom at 100%",newText("third"))
        .center()
        .print()
    ,
    newSelector("choice")
        .add(getText("first"),getText("second"),getText("third"))
    ,
    newButton("shuffle")
        .callback( getSelector("choice").shuffle() )
        .center()
        .print()
    ,
    getSelector("choice")
        .log()
        .wait()
)
