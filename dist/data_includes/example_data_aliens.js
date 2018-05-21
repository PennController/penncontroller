var shuffleSequence = seq("checkTest", "test", "checkItems", startsWith("Item"));

// Preloading a zip file
PennController.PreloadZip("http://files.lab.florianschwarz.net/ibexfiles/PsEntAliens/Images.zip",
                          "http://babel.ling.upenn.edu/~amygood/files/soundfiles/Practice_BT9_EG_Rev_Soundfiles.zip");

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Ex1Factives/Audio/");

// Much quicker to type t than to type PennController.instruction each time
var istr = PennController.instruction;

var items = [

  ["checkTest", "Message", {html: "Ceci est un test"}],

  ["checkTest", "PennController", PennController.CheckPreload("test", 10)],
  ["checkItems", "PennController", PennController.CheckPreload(startsWith("Item"))],
  
  ["test", "PennController", 
    PennController.InitiateRecorder("http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/saveAudioZip.php")
  ],
  
  ["test", "PennController", PennController(

      istr.voiceRecorder()
      ,
      istr.image("planets.png")
      ,
      istr.voiceRecorder()
      ,
      istr.key(" ")

  )]

];

// Feed/Create the items from the datasource
PennController.FeedItems(

    // Refering to each row in the datasource as 'item'
    (item) => PennController(

        istr.text("Group: "+item.group)
        ,
        istr.canvas(60, 230)
            // First planet
            .put( istr.image("alien_"+item.Alien1Planet1, 20, 50),   0, 0)
            .put( istr.image(item.Alien2Planet1, 20, 50),   0, 60)
            .put( istr.image(item.Alien3Planet1, 20, 50),   0, 120)
            .put( istr.image(item.Alien4Planet1, 20, 50),   0, 180)
            // Second planet
            .put( istr.image("alien_"+item.Alien1Planet2, 20, 50),   30, 0)
            .put( istr.image(item.Alien2Planet2, 20, 50),   30, 60)
            .put( istr.image(item.Alien3Planet2, 20, 50),   30, 120)
            .put( istr.image(item.Alien4Planet2, 20, 50),   30, 180)
            // Third planet
            .put( istr.image("alien_"+item.Alien1Planet3, 20, 50),   60, 0)
            .put( istr.image(item.Alien2Planet3, 20, 50),   60, 60)
            .put( istr.image(item.Alien3Planet3, 20, 50),   60, 120)
            .put( istr.image(item.Alien4Planet3, 20, 50),   60, 180)
        ,
        istr.text(item.AgainSentence)
        ,
        istr.audio("thought_bike.mp3")
        //istr.audio("w_beer_R.wav")
            .record("play","end")
            .wait()
        ,
        istr.key("FJ")

    )

);