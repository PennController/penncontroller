import { PennEngine } from './pennengine.js';
import { lazyPromiseFromArrayOfLazyPromises, minsecStringFromMilliseconds } from './utils.js';

const PRELOADDELAY = 60000;

let headerController = null;
let footerController = null;

// Instances represent all the PennControllers,     ultimately passed for evaluation to define_ibex_controller
class Controller {
    constructor(){
        this.id = PennEngine.controllers.list.length;
        this.appendResultLine = [];                     // Columns ([header,value]) to add to each result row
        this.linesToSave = [];                          // What will be added to the results file at the end
        this.resources = [];                            // Resources used by the controller (see PennEngine.resources.fetch)
        this.elements = {};                             // Elements defined in the sequence of commands
        this.preloadDelay = PRELOADDELAY;               // Default delay to check that resources are preloaded
        PennEngine.controllers.list.push(this);         // Add this instance to the global list of controllers
        this.defaultCommands = {};                      // Default commands for each element type
        this.headerDefaultCommands = {};
        if (headerController && headerController.defaultCommands)                           // Inherit header's default commands
            for (let type in headerController.defaultCommands)                              // Defaults for each type specified
                this.defaultCommands[type] = [].concat(headerController.defaultCommands[type]);   // Copy of array
    }
    //  PRIVATE METHODS
    _addElement(id, element){               // Add element to the list
        if (this.elements.hasOwnProperty(id))
            console.warn("Overriding another element with the same name ("+id+") in PennController #"+this.id);
        this.elements[id] = element;
    }
    _getElement(id){                // Returns element from the list
        return this.elements[id];
    }
    //  PUBLIC METHODS  (return the instance)
    logAppend(parameter, value, comments) { // Adds a line to the results file
        this.linesToSave.push(["PennController", this.id,  parameter, value, Date.now(), comments]);
        return this;
    }
    log(name, value) {              // Adds a column to each line in the results file (value can be a function/promise)
        if (value==undefined)
            value = name;
        this.appendResultLine.push([name, value]);
        return this;
    }
    noHeader(){
        this.runHeader = false;
        return this;
    }
    noFooter(){
        this.runFooter = false;
        return this;
    }
    setOption(option, value){
        this[option] = value;
    }
}

// Immediately create a new instance for construction
PennEngine.controllers.underConstruction = new Controller();

// Provide a way to create new controllers
PennEngine.controllers.new = ()=>new Controller();


// The only object to be exported to the front end (see last line of index.js)
export var PennController = function(...rest) {
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    let sequenceArray = [];                                                         // Build array of lazy promises out of rest
    function appendPromises( ...commands ){
        for (let c in commands)
            if (commands[c]._promises)                                              // Append command's promises
                this.push( lazyPromiseFromArrayOfLazyPromises(commands[c]._promises) );
            else if (commands[c] instanceof Array)                                  // Probe the array for commands
                appendPromises.apply(this, commands[c]);
    };
    appendPromises.apply( sequenceArray , rest );                                   // Filter rest (can contain arrays itself)
    controller.sequence = lazyPromiseFromArrayOfLazyPromises( sequenceArray );      // Now make one big lazy promise out of that
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return controller;                                                              // Return controller
};

// A handler for retrieving parameters passed in the URL
let Parameters = {};                                        // URL will never change, so no need to recreate at each call
PennController.GetURLParameter = function(parameter){
    if (!Object.keys(Parameters).length){                   // Feed Parameters only once
        let URLParameters = window.location.search.replace("?", "").split("&");
        for (let param in URLParameters)                    // Go through each param in the URL
            Parameters[URLParameters[param].split("=")[0]] = URLParameters[param].split("=")[1];   
    }
    if (Parameters.hasOwnProperty(parameter))
        return Parameters[parameter];                       // Return the parameter if it exists
}

// This adds a URL where resources will be looked for
PennController.AddHost = function(...rest) {
    for (let a in rest) {
        if (typeof(rest[a])=="string" && rest[a].match(/^https?:\/\//i))
            PennEngine.URLs.push(rest[a]);
        else
            console.warn("URL #"+a+" is not a valid URL (PennController.AddHost).", rest[a]);
    }
};

// Creates an item checking that the resources (used by the items with matching labels, if specified) are preloaded
PennController.CheckPreloaded = function(...rest) {
    let controller = new Controller();                  // Create a new controller
    controller.id = "Preloader";
    controller.runHeader = false;                       // Don't run header and footer
    controller.runFooter = false;
    PennEngine.controllers.list.pop();                  // Remove it from PennEngine's list immediately (not a 'real' controller)
    controller.sequence = ()=>new Promise(r=>r());      // Not a 'real' controller: only record preloading
    controller.ignoreWhenCheckingPreload = true;        // In case this controller's label matches those to be checked

    if (rest.length && Number(rest[rest.length-1])>0){  // Custom delay
        controller.preloadDelay = Number(rest[rest.length-1]);
        if (rest.length>1)                              // Label-filtering
            rest.pop();
    }
    
    let labelPredicates = [];                           // Build the list of label predicates (see IBEX shuffle.js)
    if (rest.length) {                                  // If label predicates are passed, go through them
        for (let c in rest) {
            let predicate = rest[c];
            if (typeof(predicate)=="string")            // Convert any string into a predicate (see IBEX's shuffle.js)
                predicate = s=>s==rest[c];
            if (predicate instanceof Function)
                labelPredicates.push(predicate);
        }
    }
    else                                                // No predicate passed: all labels are in
        labelPredicates = [anyType];

    let oldModify = window.modifyRunningOrder;          // Trick: use Ibex's modifyRunningOrder to probe sequence of trials
    window.modifyRunningOrder = function (ro){
        if (oldModify instanceof Function)
            ro = oldModify.apply(this, [ro]);
        for (let i = 0; i < ro.length; i++){            // Add all the PennController elements' resources to this controller
            let item = ro[i];                           // after all the elements have been created 
            let elements = item.filter(e=>{
                let match = false;
                for (let l in labelPredicates)          // Only keep elements whose label matches at least one predicate
                    match = match || labelPredicates[l](e.type);
                match = match && e.controller == "PennController";  // and elements that are PennController elements
                match = match && !e.options.ignoreWhenCheckingPreload;  // and elements that are not CheckPreloaded themselves
            })
            for (let e in elements)
                controller.resources = controller.resources.concat(
                    element[e].resources.filter(r=>controller.resources.indexOf(r)<0)
                );                                      // Add all the (not already added) resources to this controller
        }
        return ro;
    };

    return controller;
};

PennController.Header = function(...rest){
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    controller.id = "Header";                                                       // Special controller
    PennEngine.controllers.list.pop();                                              // Remove from the list
    controller.sequence = lazyPromiseFromArrayOfLazyPromises(
        rest.map( command=>lazyPromiseFromArrayOfLazyPromises(command._promises) )  // The sequence of commands to run
    );
    for (let type in controller.defaultCommands)                                    // Indicate header origin of default commmands
        for (let c in controller.defaultCommands[type])
            controller.defaultCommands[type][c].push("header");
    headerController = controller;
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return controller;                                                              // Return controller
};

PennController.Footer = function(...rest){
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    controller.id = "Footer";                                                       // Special controller
    PennEngine.controllers.list.pop();                                              // Remove from the list
    controller.sequence = lazyPromiseFromArrayOfLazyPromises(
        rest.map( command=>lazyPromiseFromArrayOfLazyPromises(command._promises) )  // The sequence of commands to run
    );
    footerController = controller;
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return controller;                                                              // Return controller
};

// What happens when a controller is evaluated
define_ibex_controller({
    name: "PennController",
    jqueryWidget: {    
        _init: function () {
            
            var _t = this;

            PennEngine.controllers.running = _t;        // This is now the running controller

            _t.cssPrefix = _t.options._cssPrefix;
            _t.utils = _t.options._utils;
            _t.finishedCallback = _t.options._finishedCallback;

            _t.id = _t.options.id;                      // This identifies the running controller in PennEngine's list
            _t.runHeader = _t.options.runHeader==undefined|_t.options.runHeader;
            _t.runFooter = _t.options.runFooter==undefined|_t.options.runFooter;

            let preloadDelay = _t.options.preloadDelay;

            // SAVE
            let linesToSave = [];                       // This array will be passed to finishedCallback
            _t.save = function(elementType, elementName, parameter, value, time, ...comments){
                // if (value && value.type == "Var")
                //     value = value.value;
                if (!comments.length)
                    comments = ["NULL"];
                let row = [
                    ["PennElementType", elementType],
                    ["PennElementName", elementName], 
                    ["Parameter", parameter],
                    ["Value", value],
                    ["EventTime", time]
                ];
                if (_t.options.appendResultLine instanceof Array)// If anything to append
                    for (let c in _t.options.appendResultLine){
                        let column = _t.options.appendResultLine[c];
                        if (!(column instanceof Array) || column.length != 2)
                            continue;                           // Only append pairs of param + value
                        // if (column[1] instanceof Function)
                        //     column[1] = column[1]();            // If function/promise value, run it
                        // else if (column[1] && column[1].type=="Var")
                        //     column[1] = column[1].value;        // If Var element, evaluate it
                        row.push(column);
                    }
                row.push(["Comments", comments.join(',')]);     // If multiple arguments, add unnamed columns
                linesToSave.push(row);
            };
            for (let l in _t.options.linesToSave)       // Push what the user passed to logAppend
                _t.save(_t.options.linesToSave[l]);

            // HEADER AND FOOTER INHERITENCE
            if (_t.runHeader && headerController instanceof Controller){
                _t.options.resources = _t.options.resources.concat(                     // Inherit header's resources
                    headerController.resources.filter(r=>_t.options.resources.indexOf(r)<0)
                );
                $.extend(_t.options.elements, headerController.elements);               // Inherit header's elements
            }
            if (_t.runFooter && footerController instanceof Controller){
                _t.options.resources = _t.options.resources.concat(                     // Inherit footer's resources
                    footerController.resources.filter(r=>_t.options.resources.indexOf(r)<0)
                );
                $.extend(_t.options.elements, footerController.elements);                       // Inherit footer's elements
            }

            // END
            let trialEnded = false;
            let endTrial = async function(){
                if (trialEnded)
                    return;
                trialEnded = true;
                // FOOTER
                if (_t.runFooter && footerController instanceof Controller){
                    _t.save("PennController", _t.id, "_Footer_", "Start", Date.now(), "NULL");
                    await footerController.sequence();  // Run footer
                    _t.save("PennController", _t.id, "_Footer_", "End", Date.now(), "NULL");
                }
                for (let e in _t.options.elements)      // Call end on each element (when defined)
                    _t.options.elements[e].end();
                _t.save("PennController", _t.id, "_Trial_", "End", Date.now(), "NULL");
                linesToSave.sort((a,b)=>a[4][1]>b[4][1]);// sort the lines by time
                linesToSave.map(line=>{
                    for (let e in line)
                        if (line[e][1] instanceof Function)
                            line[e][1] = line[e][1]();  // If function/promise value, run it
                        else if (line[e][1] && line[e][1].type=="Var")
                            line[e][1] = line[e][1].value;// If Var element, evaluate it
                });
                _t.finishedCallback(linesToSave);       // and then call finishedCallback
            };
            _t.endTrial = endTrial;

            // START
            let trialStarted = false;
            let startTrial = async function(failedToPreload){ // Launches the trial
                if (trialStarted)                       // Trial already started: return
                    return;
                trialStarted = true;
                if (failedToPreload){                   // Some resources failed to load
                    for (let r in _t.options.resources.filter(r=>r.status!="ready"))
                        _t.save(
                            "PennController",
                            _t.id,
                            "_PreloadFailed_",          // Save the name of the resources that failed to load
                            csv_url_encode(_t.options.resources[r].name),
                            Date.now(),
                            "NULL"
                        );
                }
                _t.save("PennController", _t.id, "_Trial_", "Start", Date.now(), "NULL");
                // HEADER
                if (_t.runHeader && headerController instanceof Controller){
                    _t.save("PennController", _t.id, "_Header_", "Start", Date.now(), "NULL");
                    await headerController.sequence();  // Run header
                    _t.save("PennController", _t.id, "_Header_", "End", Date.now(), "NULL");
                }
                preloadElement.remove();                // Remove preload message
                _t.options.sequence().then(endTrial);   // Run the sequence of commands
            };

            // PRELOAD
            let preloadElement = $("<div><p>Please wait while the resources are preloading</p>"+
                                        "<p>This may take up to "+minsecStringFromMilliseconds(preloadDelay)+".</p></div>");
            _t.element.append(preloadElement);          // Add the preload message to the screen
            for (let r in _t.options.resources){        // Go through the list of resources used in this trial
                let resource = _t.options.resources[r], originalResolve = resource.resolve;
                if (resource.status!="ready")
                    resource.resolve = function(){      // Redefine each non-ready resource's resolve
                        originalResolve.apply(resource);
                        if (_t.options.resources.filter(r=>r.status!="ready").length==0)
                            startTrial();               // Start trial if no non-ready resource left
                    };
            }
            if (_t.options.resources.filter(r=>r.status!="ready").length==0)
                startTrial();                           // Start trial if no non-ready resource
            else                                        // Start trial after a delay if resources failed to load
                setTimeout(function(){startTrial(true);}, preloadDelay);

        }
    },

    properties: {
        obligatory: [],
        countsForProgressBar: true,
        htmlDescription: null
    }
});