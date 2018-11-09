PennController.ResetPrefix(null);

PennController.ResetPrefix(null);

PennController.PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/stillalienspictures.zip"); // Pictures
PennController.PreloadZip("https://files.lab.florianschwarz.net/ibexfiles/PennController/SampleTrials/stillalienssounds.zip"); // Sounds

PennController(
    newImage( "alien" , "alien_blue.png" )
        .print()
    ,
    newText( "instruction" , "Please listen, then press space." )
        .print()
    ,
    newAudio( "sentence" , "stillalien1.mp3" )
        .play()
        .wait()
    ,
    newKey( "space key" , " " )
        .wait()
);

PennController(
    newImage( "alien" , "alien_red.png" )
        .print()
    ,
    newText( "instruction" , "Please listen, then press space." )
        .print()
    ,
    newAudio( "sentence" , "stillalien2.mp3" )
        .play()
        .wait()
    ,
    newKey( "space key" , " " )
        .wait()
);