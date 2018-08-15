var shuffleSequence = seq("rating");
PennController.ResetPrefix(null);

PennController.AddHost("http://files.lab.florianschwarz.net/ibexfiles/Pictures/");

function maze(sentence1, sentence2){
    sentence1 = sentence1.replace(/\s+/g,' ').replace(/(^\s+|\s+$)/,'');
    sentence2 = sentence2.replace(/\s+/g,' ').replace(/(^\s+|\s+$)/,'');
    let words1 = sentence1.split(' '), words2 = sentence2.split(' ');
    if (words1.length != words2.length)
        throw Error("The two sentence must have the exact same length");
    let sequence = [
        newTimer('betweenWords', 100),
        newCanvas("2words", 200, 40)
            .settings.add(  25, 0, newText('word1', "") )
            .settings.add( 125, 0, newText('word2', "") )
            .settings.center()
            .print(),
        newSelector("words")
                .settings.add( getText('word1') , getText('word2') )
                .settings.keys(    "F"          ,   "J"             )
                .settings.disableClicks()
                .settings.log()
        ];
    for (let w in words1)
        sequence = sequence.concat([
            getText('word1').settings.text(words1[w]).settings.visible(),
            getText('word2').settings.text(words2[w]).settings.visible(),
            getSelector('words').shuffle().settings.keys('F','J').settings.enable().wait(),
            getTimer('betweenWords').start().wait(),
            getSelector('words').unselect().settings.disable(),
            getText('word1').settings.hidden(),
            getText('word2').settings.hidden(),
        ]);
    return sequence;
}

// FUNCTIONS TO CREATE IMAGE CANVAS //
// a simple alien image
function alienImage(name, color){ return newImage(name, 'alien_'+color+'.png' ).settings.size(45, 45); }
// a canvas with 10 aliens in 3 ships (to be printed over each planet images)
function getAliens3Ships(name, alienColors, blackAndWhite){
    return newCanvas(name, 137, 245)
        .settings.add(  4, 12 , newImage(name+"-ships", '3ships'+blackAndWhite+'.png').settings.size(137, 209), 1 )
        .settings.add( -5, 84 , 
            newCanvas(name+"-leftShip", 72 , 90 )
                .settings.add( 27,  0, alienImage(name+'-leftAlien1', alienColors.leftShip[0]) , 2 )
                .settings.add( 18, 45, alienImage(name+'-leftAlien2', alienColors.leftShip[1]) , 3 )
                .settings.add( 0,  11, alienImage(name+'-leftAlien3', alienColors.leftShip[2]) , 4 )
        )
        .settings.add( 50, 40 ,
            newCanvas(name+"-middleShip", 45, 175 )
                .settings.add( 0,   0, alienImage(name+'-middleAlien1', alienColors.middleShip[0]) , 5 )
                .settings.add( 0,  43, alienImage(name+'-middleAlien2', alienColors.middleShip[1]) , 6 )
                .settings.add( 0,  85, alienImage(name+'-middleAlien3', alienColors.middleShip[2]) , 7 )
                .settings.add( 0, 127, alienImage(name+'-middleAlien4', alienColors.middleShip[3]) , 8 )
        )
        .settings.add( 82, 85 ,
            newCanvas(name+"-rightShip", 67 , 89 )
                .settings.add( 0,  0, alienImage(name+'-rightAlien1', alienColors.rightShip[0]) , 9 )
                .settings.add( 5, 44, alienImage(name+'-rightAlien2', alienColors.rightShip[1]) , 10 )
                .settings.add(22, 17, alienImage(name+'-rightAlien3', alienColors.rightShip[2]) , 11 )
        )
        .settings.add( 45, 220, newText(name+'-planetName', name.replace(/^[^-]+-/,'')) );
}
// a canvas with home, transit and destination (if named 'filler' then will be black and white)
function newPlanetTripCanvas(name, planetAliens){
    let blackAndWhite = "";
    if (name=="filler")
        blackAndWhite = "BW";
    return newCanvas(name, 530, 245)
            .settings.add( 0, 0, newImage(name+"-planets", 'planetsLarger'+blackAndWhite+'.png').settings.size(530, 245), 0 )
            .settings.add( 0, 0, getAliens3Ships(name+"-Home", planetAliens.home, blackAndWhite) )
            .settings.add( 190, 0, getAliens3Ships(name+"-Transit", planetAliens.transit, blackAndWhite) )
            .settings.add( 380, 0, getAliens3Ships(name+"-Destination", planetAliens.destination, blackAndWhite) )
}
// the main canvas, showing two spapce-travel pictures side by side (target and filler)
function newTargetFillerCanvas(targetAliens, fillerAliens){
    return newCanvas('planets', 1160, 255)
            .settings.add(   5, 5, newPlanetTripCanvas('target', targetAliens).settings.css("border", "solid 1px grey") )
            .settings.add( 620, 5, newPlanetTripCanvas('filler', fillerAliens).settings.css("border", "solid 1px grey") );
}

// DEFAULT SETTINGS FOR TOOLTIPS
PennController.Header(
    defaultTooltip
        .settings.position("middle right")          // Vertically centered and horizontally on the right by default
        .settings.size(170,90)                      // All tooltips are 170x90
        .settings.frame()                           // Add a frame around the element attached to
        .settings.label("Click or press Space")     // The bottom-right label
        .settings.key(32)                           // Tooltips can be validated by pressing space (key code = 32)
);

// All the instructions tooltips have the same format (almost)
function instructions(where, text, position){
    if (position==undefined)
        position = "middle right";
    return getTooltip('instructions')
                .settings.text(text)                // Update the instructions tooltip's text
                .settings.position(position)        // (Re-)position it
                .print(where).wait();               // Attach it to the specified element, and wait for validation
}

// SEQUENCE OF PRACTICE TRIAL
PennController.FeedItems(
    item => PennController(
        newTooltip('instructions', ""),             // Let's create the instructions tooltip (no text for now)
        // LAYOUT PREPARATION
        newText("test sentence", "Exactly three aliens stopped being green")
            .settings.center()                      // Test sentence at the top and in the middle of the screen
            .print(),
        newTargetFillerCanvas({                     // Create the target and filler images
            home: {leftShip: ["red", "red", "red"], middleShip: ["red", "red", "red", "red"], rightShip: ["red", "red", "red"]},
            transit: {leftShip: ["grey", "grey", "grey"], middleShip: ["grey", "grey", "grey", "grey"], rightShip: ["grey", "grey", "grey"]},
            destination: {leftShip: ["blue", "blue", "blue"], middleShip: ["blue", "blue", "blue", "blue"], rightShip: ["blue", "blue", "blue"]},
        },{
            home: {leftShip: ["BW", "BW", "BW"], middleShip: ["BW", "BW", "BW", "BW"], rightShip: ["BW", "BW", "BW"]},
            transit: {leftShip: ["BW", "BW", "BW"], middleShip: ["BW", "BW", "BW", "BW"], rightShip: ["BW", "BW", "BW"]},
            destination: {leftShip: ["BW", "BW", "BW"], middleShip: ["BW", "BW", "BW", "BW"], rightShip: ["BW", "BW", "BW"]},
        }).settings.add( 620, 5,                    // Add the planet to be revealed, but hide it for now (only in practice trials)
            newPlanetTripCanvas("reveal", {
                home: {leftShip: ["red", "red", "red"], middleShip: ["red", "red", "red", "red"], rightShip: ["red", "red", "red"]},
                transit: {leftShip: ["grey", "grey", "grey"], middleShip: ["grey", "grey", "grey", "grey"], rightShip: ["grey", "grey", "grey"]},
                destination: {leftShip: ["blue", "blue", "blue"], middleShip: ["blue", "blue", "blue", "blue"], rightShip: ["blue", "blue", "blue"]},
            }).settings.css("border", "solid 1px grey").settings.hidden() )
            .print(),                               // Show the main canvas
        getCanvas('target-Transit').settings.hidden(),      // Hide some elements for now
        getCanvas('target-Destination').settings.hidden(),  // Hide some elements for now
        getCanvas('filler').settings.hidden(),              // Hide some elements for now
        // INSTRUCTIONS
        instructions( getCanvas('target-Home') , "These aliens are moving out from their home planet." ),
        instructions( getCanvas('target-Home') , "They are traveling using three space ships." ),
        instructions( getCanvas('target-Home-leftShip') , "For instance, these three aliens are traveling in one ship together." ),
        instructions( getCanvas('target-Home-middleShip') , "And these four aliens are traveling in another ship together." ),
        getCanvas('target-Transit').settings.visible(),         // Reveal transit
        instructions( getCanvas('target-Transit') , "They all stop by a transit planet..." ),
        getCanvas('target-Destination').settings.visible(),     // Reveal destination
        instructions( getCanvas('target-Transit') , "... before arriving to their destination." ),
        getCanvas('filler').settings.visible(),                 // Reveal filler
        newTimer("filler revelation", 200)                      // give them some time to digest
            .start().wait(),
        instructions( getCanvas('filler') , "Here, you can see another group of aliens, also moving out from their planet." , "bottom center" ),
        instructions( getCanvas('filler') , "We applied a filter screen, so you cannot see their colors." , "bottom center" ),
        instructions( getText('test sentence') , "Your task will be to guess which of the two pictures this sentence describes" , "top center" ),
        instructions( getCanvas('planets') , "Now click on one of the two pictures to make a choice." , "bottom center" ),
        instructions( getCanvas('target') , "Click on the picture on the left if you think it matches" , "bottom center" ),
        instructions( getCanvas('filler') , "or click on the picture on the right if you think it's a better match" , "bottom center" ),
        // CLICKS
        newTimer('before click', 100)
            .start().wait(),
        newTooltip('correct', "Right, this picture matches the description"),   // Create the positive feedback tooltip
        newTooltip('incorrect', "")                                             // Create the negative feedback tooltip
            .settings.css("background-color", "tomato"),                            // (beautiful tomato color: wrong!)
        newSelector('trips')
            .settings.add( getCanvas('target') , getCanvas('filler') , getCanvas('reveal') )
            .settings.frame( "solid 2px purple" ).settings.log()                // Group the pictures as selectable
            .wait(),                                                            // Wait for selection
        getSelector('trips')
            .test.selected( getCanvas('filler') )           // If filler was selected...
            .success(
                getSelector('trips').settings.disable(),    // temporarily disable selector
                getTooltip('incorrect')
                    .settings.text("Wrong, you should have selected the visible picture")
                    .settings.position('bottom center')
                    .print( getCanvas('filler') ).wait(),   // show negative feedback
                getTooltip('incorrect')
                    .settings.text("As you can see, the aliens' colors match the description here")
                    .print( getCanvas('target') ).wait(),
                getCanvas('reveal').settings.visible(),     // reveal colors
                getCanvas('filler').settings.hidden(),      // (and hide b&w)
                getTooltip('incorrect')
                    .settings.text("Once we remove the filter, you can see the aliens' colors do not match here")
                    .print( getCanvas('reveal') ).wait(),
                getSelector('trips').settings.enable()      // Re-enable selector, and wait for a click on target
                    .wait( getSelector('trips').test.selected(getCanvas('target')) )
            ),
        getCanvas("reveal").settings.visible(),                         // Reveal colors (if not already revealed)
        getCanvas("filler").remove(),                                   // Remove BW filler (if not done yet)
        getSelector('trips').settings.disable(),                        // Temporarily disable selector
        getTooltip('correct')
            .settings.position('bottom center')
            .print( getCanvas('target') ).wait(),                       // Give some positive feedback
        getSelector('trips').settings.enable(),                         // Re-enable selector
        // END OF TRIAL
        newButton("test", "Validation")
            .settings.center().print().wait()
    )//.noHeader()
);