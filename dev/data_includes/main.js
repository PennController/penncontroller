PennController.ResetPrefix(null) // Shorten command names (keep this)

PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/OnlyCleftsVW/Pictures.zip")
PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/OnlyCleftsVW/AudioContext.zip")
PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/OnlyCleftsVW/AudioTest.zip")


newTrial(
  newCanvas("waf","100vw","100vh").print()
  ,
  newButton("Send results to https://test.pcibex.net/r/KKNQwv/").print().wait()
  ,
  SendResults("https://test.pcibex.net/r/KKNQwv/")
  ,
  newButton().wait()
)
