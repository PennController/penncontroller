var shuffleSequence = seq("test");

// Preloading two zip files
PennController.PreloadZip("http://files.lab.florianschwarz.net/ibexfiles/PsEntAliens/Images.zip",
                          "http://files.lab.florianschwarz.net/ibexfiles/PsEntAliens/StopSentences.zip");

// Much quicker to type T than to type PennController.instruction each time
var t = PennController.instruction;

// Disabling autopreload for test purposes
/*PennController.AutoPreload({
                                images: false,
                                audio: false
});*/

// Setting items is standard
var items = [

  // The only difference is you call PennController instead of giving an options object
  ["test", "PennController", PennController(

      /*t("23.wav")
      ,*/
      t("23.wav")
        .wait()
      ,
      sometext = t("Some text")
      // Linebreaks before and after commas to clearly signal instructions steps
      ,
      bakeryImage = t("http://files.lab.florianschwarz.net/ibexfiles/Pictures/bakery.png")
                      .click( t(
                                  goodjob = t("Good job!")
                                    .j.css({position: "relative", left: "50px", top: "-75px", background: "yellow"})
                                  ,
                                  t.timer(1500, goodjob.remove())
                                )
                      )
                      .preload()
      ,
      pressf = t("Press F")
      ,
      key = t.key("F").save()
      ,
      t.clear()
      ,
      //t("http://files.lab.florianschwarz.net/ibexfiles/PSEnt/Audio/kid_Also_baseball_cap.wav")
      //  .wait()
      //,
      scaleLine = t(
                      t("text left"),
                      scale = t.radioButtons('radios',5).save(),
                      t("text right")
                  )
      ,
      /*t.audio("http://files.lab.florianschwarz.net/ibexfiles/LucyCate/LDSF/duck.mp3")
        .wait()
        .save()
      ,*/
      pressforj = t("Press F or J")
      ,
      t.key("FJ").save("F or J")
      ,
      pressforj.remove()
      ,
      keyvalidation = t("Now press any key")
      ,
      t.key().when(
          scale.selected([0,4]),
          t(
            warning = t("<p>Select an end button before pressing a key.</p>")
              .move(scaleLine)
              .j.css({color: "red", "font-weight": "bold"})
            ,
            scale.click( warning.remove() )
          )
      )
      ,
      keyvalidation.remove()
      ,
      t("Click here to end").click()

  )],


  ["test", "PennController", PennController(

      sentence = t("These four aliens had to leave their home planet. "+
                   "While in transit on Planet XR, nothing happened to their color. "+
                   "Then they moved on to Planet PH.")
      ,
      /*t(
          //blue = t("alien_blue.png").j.css({width: "20px", height: "100px"}),
          blue = t("alien_blue.png").resize("20px", "100px"),
          //red = t("alien_red.png").j.css({width: "20px", height: "100px"})
          red = t("alien_red.png").resize("20px", "100px")
      )
      ,*/
      t(
          firstRow = t(   
                          t("F").j.css("font-weight","bold")
                          , 
                          t("J").j.css("font-weight","bold")
                      ).hide()
          ,
          secondRow = t(  
                          blueA = t("alien_blue.png").resize("20px", "100px")
                          ,
                          redA = t("alien_red.png").resize("20px", "100px")
                      )
      )
      ,
      sel = t.selector(blueA, redA)
              .shuffle()
              .enable(false)
      ,
      pressspace = t("Press space")
      ,
      t.key(" ")
        .save()
      ,
      t(150)
      ,
      sentence.remove()
      ,
      pressspace.remove()
      ,
      t(550)
      ,
      audio = t("23.wav")
          .wait()
      ,
      firstRow.hide(false)
      ,
      forj = t("Press F or J")
      ,
      sel
        .enable()
        .keys("FJ")
        .clickable(false)
        .once()
        .wait()
      ,
      forj.remove()
      ,
      firstRow.hide()
      ,
      t(1000)
      ,
      t("Press any key")
      ,
      t.key()

  )],



  ["test", "PennController", PennController(


      /*t(
          blue = t("alien_blue.png").resize("20px", "100px"),
          //red = t("alien_red.png").j.css({width: "20px", height: "100px"})
          red = t("alien_red.png").resize("20px", "100px")
      )
      ,*/

      slc = t.selector(
          blue = t("alien_blue.png").resize("20px", "100px"),
          red = t("alien_red.png").resize("20px", "100px")
      )
          .enable(false)
          .shuffle()
          .keys("FJ")
          .clickable(false)
          .once()
      ,
      sentence = t("These four aliens had to leave their home planet. "+
                   "While in transit on Planet XR, nothing happened to their color. "+
                   "Then they moved on to Planet PH.")
      ,
      /*t(
          //blue = t("alien_blue.png").j.css({width: "20px", height: "100px"}),
          blue = t("alien_blue.png").resize("20px", "100px"),
          //red = t("alien_red.png").j.css({width: "20px", height: "100px"})
          red = t("alien_red.png").resize("20px", "100px")
      )
      ,*/
      pressspace = t("Press space")
      ,
      t.key(" ")
        .save()
      ,
      t(150)
      ,
      sentence.remove()
      ,
      pressspace.remove()
      ,
      t(550)
      ,
      audio = t("23.wav")
          .wait()
      ,
      t("Press F or J")
      ,
      slc
        .enable(true)
        .wait()
      ,
      console.log(slc)
      ,
      t(1000)
      ,
      t("Press any key")
      ,
      t.key()

  )],


  ["test", "PennController", PennController(

      sometext = t("This is another test")
      ,
      t(
          key = t("Click here").click()
          , 
          t(" (clicking here will have no effect)").click()
      )
      .validation("all")

  )]
      
];