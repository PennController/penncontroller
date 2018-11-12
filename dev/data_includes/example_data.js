PennController.ResetPrefix(null);

PennController.ResetPrefix(null);

PennController.PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/stillalienspictures.zip"); // Pictures

PennController(
    newImage( "alien" , "alien_blue.png" )
        .settings.size( 100, 100 )
    ,
    newCanvas( "myCanvas" , 400 , 400 )
        .settings.css("border", "solid 1px black")
        .settings.add( "center at 50%", "center at 50%" , getImage( "alien" ) )
        .print()
    ,
    newButton("resize", "Resize")
        .print()
        .wait()
    ,
    getImage( "alien" )
        .settings.size( 200, 200 )
    ,
    //getCanvas( "myCanvas" )
    getImage( "alien" )
        .refresh()
    ,
    getCanvas( "myCanvas" )
        .refresh()
    ,
    newTimer("forever", 1)
        .wait()
);