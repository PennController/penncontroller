import { PennEngine } from './engine.js';
import { lazyPromiseFromArrayOfLazyPromises, minsecStringFromMilliseconds } from './utils.js';

const PRELOADDELAY = 60000;

let headerController = null;
let footerController = null;
let preloaders = [];

// Instances represent all the PennControllers,     ultimately passed for evaluation to define_ibex_controller
export class Controller {
    constructor(){
        this.id = PennEngine.controllers.list.length;
        this.useLabel = false;                          // The label (used if generated outside 'items')
        this.addToItems = true;                         // Whether this controller should be added to 'items'
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
    _addElement(element){                   // Adds an element to the dictionary
        if (!element.hasOwnProperty("type") || !element.hasOwnProperty("id"))
            return PennEngine.debug.error("Attempted to create an invalid element");
        if (!this.elements.hasOwnProperty(element.type))
            this.elements[element.type] = {};
        if (this.elements[element.type].hasOwnProperty(element.id))
            PennEngine.debug.error("Overriding another "+element.type+" element with the same name ("+id+")");
        this.elements[element.type][element.id] = element;
    }
    _getElement(id, type){                  // Returns element from the list
        if (typeof(id)!="string"||id.length<1||typeof(type)!="string"||type.length<1)
            return PennEngine.debug.error("Attempted to get an invalid element", id, type);
        if (!this.elements.hasOwnProperty(type))
            return PennEngine.debug.error("Attempted to get an element of an invalid type ("+type+")", id);
        if (!this.elements[type].hasOwnProperty(id)) { 
            let otherTypes = [];
            for (let t in this.elements)
                if (this.elements[t].hasOwnProperty(id))
                    otherTypes.push(t);
            return PennEngine.debug.error("No "+type+" element named &quot;"+id+"&quot; found",
                                        (otherTypes.length?"Found &quot;"+id+"&quot; of type "+otherTypes.join(','):null));
        }
        return this.elements[type][id];
    }
    //  PUBLIC METHODS  (return the instance)
    label(text){
        this.useLabel = text;
        return this;
    }
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
        return this;
    }
}

// Immediately create a new instance for construction
PennEngine.controllers.underConstruction = new Controller();

// Provide a way to create new controllers
PennEngine.controllers.new = ()=>new Controller();


// The only object to be exported to the front end (see last line of index.js)
export var PennController = function(...rest) {
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    if (window.items)
        for (let i in window.items)                                                 // Add any non-added items yet
            if (PennEngine.tmpItems.indexOf(window.items[i])<0)
                PennEngine.tmpItems.push(window.items[i]);
    PennEngine.tmpItems.push(controller);                                           // Add this controller
    if (rest.length && typeof(rest[0])=="string")                                   // First parameter can be label
        controller.useLabel = rest[0];
    let sequenceArray = [];                                                         // Build array of lazy promises out of rest
    function appendPromises( ...commands ){
        for (let c in commands)
            if (commands[c] && commands[c]._promises)                               // Append command's promises
                this.push( lazyPromiseFromArrayOfLazyPromises(commands[c]._promises) );
            else if (commands[c] && commands[c] instanceof Array)                   // Probe the array for commands
                appendPromises.apply(this, commands[c]);
    };
    appendPromises.apply( sequenceArray , rest );                                   // Filter rest (can contain arrays itself)
    controller.sequence = lazyPromiseFromArrayOfLazyPromises( sequenceArray );      // Now make one big lazy promise out of that
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return controller;                                                              // Return controller
};

// Whether to print debug information
PennController.Debug = function (onOff) {
    PennEngine.debug.on = onOff==undefined||onOff;
};

// Handler for definition of shuffleSequence
PennController.Sequence = function(...seq) {
    window.shuffleSequence = window.seq(...seq);
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
            PennEngine.debug.error("URL #"+a+" is not a valid URL (PennController.AddHost).", rest[a]);
    }
};

// Creates an item checking that the resources (used by the items with matching labels, if specified) are preloaded
PennController.CheckPreloaded = function(...rest) {
    let controller = new Controller();                  // Create a new controller
    controller.id = "Preloader-"+preloaders.length;
    controller.runHeader = false;                       // Don't run header and footer
    controller.runFooter = false;
    preloaders.push(controller);
    PennEngine.controllers.list.pop();                  // Remove it from PennEngine's list immediately (not a 'real' controller)
    controller.sequence = ()=>new Promise(r=>r());      // Not a 'real' controller: only record preloading
    controller.ignoreWhenCheckingPreload = true;        // In case this controller's label matches those to be checked

    PennEngine.tmpItems.push(controller);               // Add the controller to the list

    if (rest.length && Number(rest[rest.length-1])>0){  // Custom delay
        controller.preloadDelay = Number(rest[rest.length-1]);
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
        labelPredicates = [x=>true];

    PennEngine.Prerun(                                  // Probe sequence of trials using modifyRunningOrder
        ()=>{                                           // but user can manual define it, so use conf_...
            let oldModify = window.conf_modifyRunningOrder;
            window.conf_modifyRunningOrder = function (ro){
                if (oldModify instanceof Function)
                    ro = oldModify.call(this, ro);
                for (let i = 0; i < ro.length; i++){    // Add all the PennController elements' resources to this controller
                    let item = ro[i];                   // after all the elements have been created 
                    let elements = item.filter(e=>{
                        let match = false;               // Only keep elements whose label matches at least one predicate
                        for (let l = 0; l < labelPredicates.length; l++)
                            match = match || labelPredicates[l](e.type);
                        match = match && e.controller == "PennController";  // and elements that are PennController elements
                        match = match && !e.options.ignoreWhenCheckingPreload;  // and elements that are not CheckPreloaded themselves
                        return match;
                    });
                    for (let e = 0; e < elements.length; e++)
                        controller.resources = controller.resources.concat(
                            elements[e].options.resources.filter(r=>controller.resources.indexOf(r)<0)
                        );                              // Add all the (not already added) resources to this controller
                }
                return ro;
            };
        }
    );

    return controller;
};


PennController.SendResults = function(label){
    if (window.items == undefined)
        window.items = [];
    if (window.manualSendResults == undefined || window.manualSendResults != false)
        window.manualSendResults = true;
    let options = {};
    let item = [label||"sendResults", "__SendResults__", options];
    options.label = l=>{item[0]=l; return options;};
    options.setOption = (name,value)=>{options[name] = value; return options;};
    window.items.push(item);
    return options;
};


PennController.SetCounter = function(...args){
    if (window.items == undefined)
        window.items = [];
    let label = "setCounter", options = {};
    if (args.length == 1 || args.length == 3)
        label = args[0];
    else if (args.length > 1){
        if (args[0+args.length==3].match(/set/i))
            options.set = args[1+args.length==3];
        else if (args[0+args.length==3].match(/inc/i))
            options.inc = args[1+args.length==3];
    }
    let item = [label, "__SetCounter__", options];
    options.label = l=>{item[0]=l; return options};
    options.setOption = (name,value)=>{options[name] = value; return options};
    window.items.push(item);
    return options;
};


PennController.Header = function(...rest){
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    controller.id = "Header";                                                       // Special controller
    controller.addToItems = false;                                                  // Do no add to 'items'
    PennEngine.controllers.list.pop();                                              // Remove from the list
    controller.sequence = lazyPromiseFromArrayOfLazyPromises(
        rest.map( command=>lazyPromiseFromArrayOfLazyPromises(command._promises) )  // The sequence of commands to run
    );
    for (let type in controller.defaultCommands)                                    // Indicate header origin of default commmands
        for (let c in controller.defaultCommands[type])
            controller.defaultCommands[type][c].push("header");
    if (headerController){
        headerController.resources = headerController.resources.concat(controller.resources);
        $.extend(true, headerController.elements, controller.elements);
        headerController.headerDefaultCommands = controller.headerDefaultCommands;  // Already inherited
        headerController.sequence = lazyPromiseFromArrayOfLazyPromises( [ headerController.sequence , controller.sequence ] );
    }
    else
        headerController = controller;
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return headerController;                                                        // Return Header controller
};

PennController.Footer = function(...rest){
    let controller = PennEngine.controllers.underConstruction;                      // To be returned
    controller.id = "Footer";                                                       // Special controller
    controller.addToItems = false;                                                  // Do no add to 'items'
    PennEngine.controllers.list.pop();                                              // Remove from the list
    controller.sequence = lazyPromiseFromArrayOfLazyPromises(
        rest.map( command=>lazyPromiseFromArrayOfLazyPromises(command._promises) )  // The sequence of commands to run
    );
    if (footerController){
        footerController.resources = footerController.resources.concat(controller.resources);
        $.extend(true,footerController.elements, controller.elements);
        footerController.headerDefaultCommands = controller.headerDefaultCommands;  // Already inherited
        footerController.sequence = lazyPromiseFromArrayOfLazyPromises( [ footerController.sequence , controller.sequence ] );
    }
    else
        footerController = controller;
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return footerController;                                                        // Return controller
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
            if (typeof(_t.id) == "string" && _t.id.match(/^Preloader-/))
                _t.controller = preloaders[Number(_t.id.replace(/Preloader-/,''))];
            else if (_t.id == "Header")
                _t.controller = headerController;
            else if (_t.id == "Footer")
                _t.controller = footerController;
            else if (Number(_t.id)>=0&&Number(_t.id)<PennEngine.controllers.list.length)
                _t.controller = PennEngine.controllers.list[_t.id];
            else
                _t.controller = _t.options;
            _t.runHeader = _t.controller.runHeader==undefined|_t.controller.runHeader;
            _t.runFooter = _t.controller.runFooter==undefined|_t.controller.runFooter;

            let preloadDelay = _t.controller.preloadDelay;

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
                if (_t.controller.appendResultLine instanceof Array)// If anything to append
                    for (let c in _t.controller.appendResultLine){
                        let column = _t.controller.appendResultLine[c];
                        if (!(column instanceof Array) || column.length != 2)
                            continue;                           // Only append pairs of param + value
                        row.push(column);
                    }
                row.push(["Comments", comments.join(',')]);     // If multiple arguments, add unnamed columns
                linesToSave.push(row);
            };
            for (let l in _t.controller.linesToSave)       // Push what the user passed to logAppend
                _t.save(_t.controller.linesToSave[l]);

            // HEADER AND FOOTER INHERITENCE
            if (_t.runHeader && headerController instanceof Controller){
                _t.controller.resources = _t.controller.resources.concat(               // Inherit header's resources
                    headerController.resources.filter(r=>_t.controller.resources.indexOf(r)<0)
                );
                $.extend(true, _t.controller.elements, headerController.elements);      // Inherit header's elements
            }
            if (_t.runFooter && footerController instanceof Controller){
                _t.controller.resources = _t.controller.resources.concat(               // Inherit footer's resources
                    footerController.resources.filter(r=>_t.controller.resources.indexOf(r)<0)
                );
                $.extend(true, _t.controller.elements, footerController.elements);      // Inherit footer's elements
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
                    footerController._getElement = (id, type) => _t.controller._getElement(id, type);
                    await footerController.sequence();  // Run footer
                    _t.save("PennController", _t.id, "_Footer_", "End", Date.now(), "NULL");
                }
                for (let t in _t.controller.elements)   // Call end on each element (when defined)
                    for (let e in _t.controller.elements[t])
                        _t.controller.elements[t][e].end();
                _t.save("PennController", _t.id, "_Trial_", "End", Date.now(), "NULL");
                linesToSave.sort((a,b)=>a[4][1]>b[4][1]);// sort the lines by time
                linesToSave.map(line=>{
                    for (let e in line)
                        if (line[e][1] instanceof Function)
                            line[e][1] = line[e][1]();  // If function/promise value, run it
                        else if (line[e][1] && line[e][1].type=="Var" && !line[e][1]._promises.length)
                            line[e][1] = line[e][1].value;// If Var element, evaluate it (no command)
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
                    for (let r in _t.controller.resources.filter(r=>r.status!="ready"))
                        _t.save(
                            "PennController",
                            _t.id,
                            "_PreloadFailed_",          // Save the name of the resources that failed to load
                            csv_url_encode(_t.controller.resources[r].name),
                            Date.now(),
                            "NULL"
                        );
                }
                preloadElement.remove();                // Remove preload message
                _t.save("PennController", _t.id, "_Trial_", "Start", Date.now(), "NULL");
                // HEADER
                if (_t.runHeader && headerController instanceof Controller){
                    _t.save("PennController", _t.id, "_Header_", "Start", Date.now(), "NULL");
                    await headerController.sequence();  // Run header
                    _t.save("PennController", _t.id, "_Header_", "End", Date.now(), "NULL");
                }
                _t.controller.sequence().then(endTrial); // Run the sequence of commands
            };

            // PRELOAD
            let preloadElement = $("<div><p>Please wait while the resources are preloading</p>"+
                                        "<p>This may take up to "+minsecStringFromMilliseconds(preloadDelay)+".</p></div>");
            _t.element.append(preloadElement);          // Add the preload message to the screen
            for (let r in _t.controller.resources){     // Go through the list of resources used in this trial
                let resource = _t.controller.resources[r], originalResolve = resource.resolve;
                if (resource.status!="ready")
                    resource.resolve = function(){      // Redefine each non-ready resource's resolve
                        originalResolve.apply(resource);
                        if (_t.controller.resources.filter(r=>r.status!="ready").length==0)
                            startTrial();               // Start trial if no non-ready resource left
                    };
            }
            if (_t.controller.resources.filter(r=>r.status!="ready").length==0)
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

window.PennController = PennController;                 // Export the object globally