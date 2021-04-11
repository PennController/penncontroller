PennController.ResetPrefix(null); // Shorten command names (keep this line here)

newTrial(
    newTextInput("test", "")
        .length(2)
        .print()
        .callback(
            newText("waf")
                .text( getTextInput("test") )
                .print()
        )
    ,
    newDropDown("waf", "...")
        .add("wouf", "wef")
        .callback( newText("hello").print() )
        .print()
    ,
    newButton("next")
        .print().wait()
    ,
    getText("hello").remove()
    ,
    getDropDown("waf").print()
    ,
    getButton("next").wait()
)
