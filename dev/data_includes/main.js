PennController.ResetPrefix(null) // Shorten command names (keep this)

newTrial(
  newCanvas("waf","100vw","100vh").print()
  ,
  newButton("Send results to https://test.pcibex.net/r/KKNQwv/").print().wait()
  ,
  SendResults("https://test.pcibex.net/r/KKNQwv/")
  ,
  newButton().wait()
)
