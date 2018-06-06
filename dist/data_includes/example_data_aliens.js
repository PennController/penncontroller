var shuffleSequence = seq("checkTest", "test", "checkItems", startsWith("Item"));

// Preloading a zip file
PennController.PreloadZip("http://files.lab.florianschwarz.net/ibexfiles/PsEntAliens/Images.zip",
                          "http://babel.ling.upenn.edu/~amygood/files/soundfiles/Practice_BT9_EG_Rev_Soundfiles.zip");

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Ex1Factives/Audio/");

// Much quicker to type p than to type PennController.instruction each time
var p = PennController.instruction;

var items = [

  ["checkTest", "Message", {html: "This is a test"}],

  ["checkTest", "PennController", PennController.CheckPreload("test", 10)],
  ["checkItems", "PennController", PennController.CheckPreload(startsWith("Item"))],
  
  ["test", "PennController", 
    PennController.InitiateRecorder("http://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/saveAudioZip.php")
  ],
  
  ["test", "PennController", PennController(

      p.voiceRecorder()
      ,
      p.image("planets.png")
      ,
      p.voiceRecorder()
      ,
      p.key(" ")

  )]

];

// Feed/Create the items from the datasource
PennController.FeedItems(

    // Refering to each row in the datasource as 'item'
    (item) => PennController(

        p.text("Group: "+item.group)
        ,
        p.canvas(60, 230)
            // First planet
            .put( p.image("alien_"+item.Alien1Planet1, 20, 50),   0, 0)
            .put( p.image(item.Alien2Planet1, 20, 50),   0, 60)
            .put( p.image(item.Alien3Planet1, 20, 50),   0, 120)
            .put( p.image(item.Alien4Planet1, 20, 50),   0, 180)
            // Second planet
            .put( p.image("alien_"+item.Alien1Planet2, 20, 50),   30, 0)
            .put( p.image(item.Alien2Planet2, 20, 50),   30, 60)
            .put( p.image(item.Alien3Planet2, 20, 50),   30, 120)
            .put( p.image(item.Alien4Planet2, 20, 50),   30, 180)
            // Third planet
            .put( p.image("alien_"+item.Alien1Planet3, 20, 50),   60, 0)
            .put( p.image(item.Alien2Planet3, 20, 50),   60, 60)
            .put( p.image(item.Alien3Planet3, 20, 50),   60, 120)
            .put( p.image(item.Alien4Planet3, 20, 50),   60, 180)
        ,
        p.text(item.AgainSentence)
        ,
        p.audio("thought_bike.mp3")
            .record("play","end")
            .wait()
        ,
        p.key("FJ")

    )

);