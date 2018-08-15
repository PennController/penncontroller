// Whether all audio instructions should automatically preload
export var _autoPreloadAudio = true;

// Whether all audio instructions should automatically preload
export var _autoPreloadImages = true;

// Whether all video instructions should automatically preload
export var _autoPreloadVideos = true;

// Whether ALL resources should be preloaded at once and asap
export var _globalPreload = true;

// Array of instructions to preload
export var _instructionsToPreload = [];

// How long the preloader should wait before ignoring failure to preload (ms)
export var _timeoutPreload = 120000;

// The message that should be displayed while preloading
export var _waitWhilePreloadingMessage = "Please wait while the resources are preloading. This process may take up to 2 minutes.";

// Returns only the items that will be run (see latin-squared designs)
// called by _checkPreload (but could be useful for other tricks)
function _filteredItems(items) {
    let filteredItems = [];
    let latinSquared = {};
    // Going through the items
    for (let i in items) {
        let item = items[i];
        // If item is not latin-squared, add it to filteredItems
        if (!(item[0] instanceof Array))
            filteredItems.push(item);
        // If it is latin-squared, add it to latinSquared under its key
        else if (item[0].length > 1) {
            let key = item[0][1];
            if (!latinSquared.hasOwnProperty(key))
                latinSquared[key] = [];
            latinSquared[key].push(item);
        }
    }
    let counter;
    if (typeof(counterOverride) != "undefined")
        counter = counterOverride;
    else
        counter = __counter_value_from_server__;
    // Now go through the latin-squared items
    for (let l = 0; l < Object.keys(latinSquared).length; l++) {
        let itemsInGroup = latinSquared[ Object.keys(latinSquared)[l] ];
        let localCounter = ((counter % itemsInGroup.length) + l) % itemsInGroup.length;
        filteredItems.push(itemsInGroup[localCounter]);
    }
    return filteredItems;
};

// Feeds the passed controller so as to wait for the resources of the matching items to be preloaded
// called by the controller (see define_ibex_controller below)
export function _checkPreload(controller) {
    // ====     BUILD LIST OF RESOURCES     ====
    //
    let instructions = [];

    // Build the list of label predicates (see IBEX shuffle.js)
    let labelPredicates = [];
    // If label predicates are passed, go through them
    if (controller.options.preload.hasOwnProperty(0)) {
        for (let c in controller.options.preload) {
            let predicate = controller.options.preload[c];
            if (typeof(predicate) == "number")
                continue;
            // Convert any string into a predicate (see IBEX's shuffle.js)
            if (typeof(predicate) == "string")
                predicate = (s) => s == controller.options.preload[c];
            labelPredicates.push(predicate);
        }
    }
    // No predicate passed: all labels are in
    else
        labelPredicates = [anyType];
    // Get the list of items that will be run (exclude items not target by latin-squared designs)
    let filteredItems = _filteredItems(items);
    // Go through the list of items
    for (let i in filteredItems) {
        let item = filteredItems[i];
        // Get the label of the item
        let label = item[0];
        // If the item is latin-squared (ie., label is an array) label is actually label's first element
        if (label instanceof Array)
            label = item[0][0];
        // Go through the label predicates
        let match = false;
        for (let l in labelPredicates) {
            // If the label satisfies a predicate, then will add its instructions to the list
            if (labelPredicates[l](label)) {
                match = true;
                break;
            }
        }
        // If no match was found, go to the next item
        if (!match)
            continue;
        // Check whether there are PennController elements in the item
        let previousIsPennController = false;
        for (let el in item) {
            // First element is label [+ latin-square]
            if (el == 0)
                continue;
            let element = item[el];
            // If the previous element was the string "PennController"
            if (previousIsPennController) {
                // Reset for next elements
                previousIsPennController = false;
                // Making sure the current element is indeed a penncontroller
                if (element instanceof Object && element.hasOwnProperty("id")) {
                    // Add the PennController's resources
                    instructions = instructions.concat(Ctrlr.list[element.id].preloadingInstructions);
                }
            }
            // If the current element is the string "PennController," note it down
            if (el > 0 && element == "PennController")
                previousIsPennController = true;
        }
    }
    // ====     CREATE CONTROLLER'S CONTENT (AND TIMER)     ====
    //        
    // Add the preloading message
    let wait = $("<div id='waitWhilePreloading'>").append(_waitWhilePreloadingMessage);
    controller.element.append( wait );
    // Go through the instructions to preload
    for (let i in instructions) {
        let instruction = instructions[i];
        if (instruction && _instructionsToPreload.indexOf(instruction)>=0) {
            if (!controller.toPreload)
                controller.toPreload = [];
            // Add the instruction only if not already listed
            if (controller.toPreload.indexOf(instruction) < 0) {
                controller.toPreload.push(instruction);
                // Extend _setResource (called when preload is done)
                instruction._setResource = instruction.extend("_setResource", function(){
                    // Remove the entry (set index here, as it may have changed by the time callback is called)
                    let index = controller.toPreload.indexOf(instruction);
                    if (index >= 0)
                        controller.toPreload.splice(index, 1);
                    // If no more file to preload, finish
                    if (controller.toPreload.length <= 0 && jQuery.contains(document, wait[0])) {
                        wait.remove();
                        controller.finishedCallback();
                    }
                });
            }
        }
    }
    // If all resources already preloaded anyway, proceed
    if ((!controller.toPreload || controller.toPreload.length <= 0) && jQuery.contains(document, wait[0])) {
        wait.remove();
        controller.finishedCallback();
    }
    // Else, make sure to set a timeout
    else {
        setTimeout(function(){
            // Abort if wait no longer displayed (ie., preloading's done)
            if (!jQuery.contains(document, wait[0]))
                return Abort;
            wait.remove();
            controller.finishedCallback();
        }, controller.options.timeout);
    }
    return Abort;
};

// Creates a CheckPreload item, to be used in an item definition in place of PennController
// see define_ibex_controller for how it contributes to calling _checkPreload
PennController.CheckPreload = function () {
    // If CheckPreload was called, then override _globalPreload
    _globalPreload = false;
    let timeout = arguments[Object.keys(arguments).length-1];
    if (typeof(timeout) != "number" || timeout <= 0)
        timeout = _timeoutPreload
    // Return the object below; the controller will know how to deal with it (see define_ibex_controller below)
    return {custom: _checkPreload, preload: arguments, timeout: timeout, countsForProgressBar: false};
};

// Settings for auto preloading
PennController.AutoPreload = function (parameter) {
    if (parameter == "images") {
        _autoPreloadVideos = false;
        _autoPreloadAudio = false;
        _autoPreloadImages = true;
    }
    else if (parameter == "audio") {
        _autoPreloadAudio = true;
        _autoPreloadImages = false;
        _autoPreloadVideos = false;
    }
    else if (parameters == "video") {
        _autoPreloadVideos = true;
        _autoPreloadAudio = false;
        _autoPreloadImages = false;
    }
    else if (typeof(parameter) == "object") {
        if (parameter.hasOwnProperty("images"))
            _autoPreloadImages = parameter.images;
        if (parameter.hasOwnProperty("audio"))
            _autoPreloadAudio = parameter.audio;
        if (parameter.hasOwnProperty("videos"))
            _autoPreloadVideos = parameter.videos;
    }
    else {
        _autoPreloadAudio = true;
        _autoPreloadImages = true;
        _autoPreloadVideos = true;
    }
};