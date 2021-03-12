PennController.ResetPrefix(null); // Shorten command names (keep this line here)

newTrial(
    newText("first")
        .print()
    ,
    newCanvas("container", 500, 200)
        .add(0,0,newText("second"))
        .add("right at 100%","bottom at 100%",newText("third"))
        .print()
    ,
    newButton("shuffle").print().wait()
    ,
    newSelector("choice")
        .add(getText("first"),getText("second"),getText("third"))
        .shuffle()
        .wait()
)
