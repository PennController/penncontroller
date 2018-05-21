// Dummy object, ABORT keyword
// used in the instructions' EXTEND method to abort chain of execution
export var Abort = new Object;

// Making sure that MutationObserver is defined across browsers
const MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

// Object pointing to...
export var Ctrlr = {
    building: {},   // ... the PennController being built when defining items
    running: {},    // ... the PennController currently running in Ibex
    list: []        // ... the list of PennControllers created so far
};

// Handler for modifications to the running order
// Any modification added through changeRunningOrder is executed in modifyRunningOrder in define_ibex_controller.js
var functionsRunningOrder = [];
// Import and call this function to add a change to the running order
export function changeRunningOrder(func) {
    if (func instanceof Function) {
        console.log("Pushed a function to modify running order");
        functionsRunningOrder.push(func);
    }
    else
        return console.log("ERROR: changeRunningOrder only takes functions as parameters");
};
// This function is called by define_ibex_controller.js in modifyRunningOrder to actually apply the changes
export function getChangeRunningOrder(func) {
    return functionsRunningOrder;
};


//  =========================================
//
//      PENNCONTROLLER OBJECT
//
//  =========================================

// Returns an object with the instructions passed as arguments
// The object will be given to the actual controller
export var PennController = function() {
    let id = Ctrlr.list.length, sequence = arguments;
    // Add the controller under construction to the list
    Ctrlr.building.id = id;
    Ctrlr.building.sequence = sequence;
    Ctrlr.list.push(Ctrlr.building);
    console.log("Just added controller:", Ctrlr.building);
    // Resetting Ctrlr.building for next one
    Ctrlr.building = {};
    // ID is _instructions' length minus 2: we just pushed for NEXT controller
    return {instructions: sequence, id: id};
};

// General settings
PennController.Configure = function(parameters){
    for (let parameter in parameters){
        if (parameter.indexOf["PreloadResources","Configure"] < 0) // Don't override built-in functions/parameters
            PennController[parameter] = parameters[parameter];
    }
    /*
        baseURL: "http://.../",
        ImageURL: "http://.../",
        AudioURL: "http://.../",
        ...
    */
};

// This adds a URL where resources will be looked for
PennController.AddHost = function() {
    if (!PennController.hasOwnProperty("hosts"))
        PennController.hosts = [];
    for (let a = 0; a < arguments.length; a++) {
        if (typeof(arguments[a])=="string" && arguments[a].match(/^https?:\/\//i))
            PennController.hosts.push(arguments[a]);
        else
            console.log("Warning: host #"+a+" is not a valid URL.", arguments[a]);
    }
}

// This allows the users to call the instruction methods as global functions
PennController.RemovePrefix = function() {
    for (let i in PennController.instructions)
        window[i] = PennController.instructions[i];
}