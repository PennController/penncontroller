import { PennEngine } from './engine.js';
import { lazyPromiseFromArrayOfLazyPromises, minsecStringFromMilliseconds, guidGenerator } from './utils.js';

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
            PennEngine.debug.error("Overwrting another "+element.type+" element with the same name ("+element.id+")");
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
    label(text){        /* $AC$ PennController().label(label) Assigns a label to the generated PennController trial $AC$ */
        this.useLabel = text;
        return this;
    }
    logAppend(parameter, value, comments) { // Adds a line to the results file
        this.linesToSave.push(["PennController", this.id,  parameter, value, Date.now(), comments]);
        return this;
    }
    log(name, value) {        /* $AC$ PennController().log(name,value) Adds value to each line of this trial in the results file $AC$ */
        if (value==undefined)
            value = name;
        this.appendResultLine.push([csv_url_encode(name), value]);
        return this;
    }
    noHeader(){         /* $AC$ PennController().noHeader() Will not run commands from the header at the beginning of this trial $AC$ */
        this.runHeader = false;
        return this;
    }
    noFooter(){         /* $AC$ PennController().noFooter() Will not run commands from the footer at the end of this trial $AC$ */
        this.runFooter = false;
        return this;
    }
    setOption(option, value){   /* $AC$ PennController().setOption(option,value) Sets options for the controller (see Ibex manual) $AC$ */
        this[option] = value;
        return this;
    }
}

// Immediately create a new instance for construction
PennEngine.controllers.underConstruction = new Controller();

// Provide a way to create new controllers
PennEngine.controllers.new = ()=>new Controller();


const newTrialArgumentCallbacks = []
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
        for (let c in commands){
            newTrialArgumentCallbacks.filter(f=>f instanceof Function && f.call(null,commands[c]));
            if (commands[c] && commands[c]._promises)                               // Append command's promises
                this.push( lazyPromiseFromArrayOfLazyPromises(commands[c]._promises) );
            else if (commands[c] && commands[c] instanceof Array)                   // Probe the array for commands
                appendPromises.apply(this, commands[c]);
            
        }
    };
    appendPromises.apply( sequenceArray , rest );                                   // Filter rest (can contain arrays itself)
    controller.sequence = lazyPromiseFromArrayOfLazyPromises( sequenceArray );      // Now make one big lazy promise out of that
    PennEngine.controllers.underConstruction = new Controller();                    // Create a new controller for next build
    return controller;                                                              // Return controller
};
PennEngine.NewTrialArgumentCallback = f=>newTrialArgumentCallbacks.push(f);


// More explicit method to create a trial
PennController.newTrial = PennController;

// Whether to print debug information
PennController.Debug = function (onOff) {   /* $AC$ global.PennController.Debug() Enables the debug mode for testing your experiment $AC$ */
    PennEngine.debug.on = onOff==undefined||onOff;
};
PennController.DebugOff = ()=>PennController.Debug(false);  /* $AC$ global.PennController.DebugOff() Disables the debug mode; use before making public $AC$ */

// Handler for definition of shuffleSequence
PennController.Sequence = function(...seq) {   /* $AC$ global.PennController.Sequence(sequence) Defines the running order of your trials, based on their labels (see documentation) $AC$ */
    for (let i = 0; i < seq.length; i++)
        if (seq[i]._item && seq[i]._item instanceof Array && seq[i]._item.length>1 && seq[i]._item[1] == "__SendResults__"){
            let label = "sendResults-"+guidGenerator()
            seq[i].label( label );
            seq[i] = label;
        }
    window.shuffleSequence = window.seq(...seq);
};

// A handler for retrieving parameters passed in the URL
let Parameters = {};                                        // URL will never change, so no need to recreate at each call
PennController.GetURLParameter = function(parameter){       /* $AC$ global.PennController.GetURLParameter(parameter) Returns the value of the parameter from the URL $AC$ */
    if (!Object.keys(Parameters).length){                   // Feed Parameters only once
        let URLParameters = window.location.search.replace("?", "").split("&");
        for (let param in URLParameters)                    // Go through each param in the URL
            Parameters[URLParameters[param].split("=")[0]] = URLParameters[param].split("=")[1];   
    }
    if (Parameters.hasOwnProperty(parameter))
        return Parameters[parameter];                       // Return the parameter if it exists
}

// This adds a URL where resources will be looked for
PennController.AddHost = function(...rest) {       /* $AC$ global.PennController.AddHost(url) Will look resources at the specified URL $AC$ */
    for (let a in rest) {
        if (typeof(rest[a])=="string" && rest[a].match(/^https?:\/\//i))
            PennEngine.URLs.push(rest[a]);
        else
            PennEngine.debug.error("URL #"+a+" is not a valid URL (PennController.AddHost).", rest[a]);
    }
};

// Creates an item checking that the resources (used by the items with matching labels, if specified) are preloaded
PennController.CheckPreloaded = function(...rest) {       /* $AC$ global.PennController.CheckPreloaded() Creates a trial that is validated when the resources are preloaded $AC$ */
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


const copy_uniqueMD5 = ()=>{
    // Time zone.
    var s = "" + new Date().getTimezoneOffset() + ':';
    // Plugins.
    var plugins = [
        "Java",
        "QuickTime",
        "DevalVR",
        "Shockwave",
        "Flash",
        "Windows Media Player",
        "Silverlight",
        "VLC Player"
    ];
    for (var i = 0; i < plugins.length; ++i) {
        var v = PluginDetect.getVersion(plugins[i]);
        if (v) s += plugins[i] + ':' + v;
    }
    // Whether or not cookies are turned on.
    createCookie("TEST", "TEST", 0.01); // Keep it for 0.01 days.
    if (readCookie("TEST") == "TEST")
        s += "C";
    // Screen dimensions and color depth.
    var width = screen.width ? screen.width : 1;
    var height = screen.height ? screen.height : 1;
    var colorDepth = screen.colorDepth ? screen.colorDepth : 1;
    s += width + ':' + height + ':' + colorDepth;
    return b64_md5(s);
}
const old_stringify = window.JSON.stringify;
window.JSON.stringify = function(...args){
    const rvalue = old_stringify.apply(this, args);
    if (args.length==1 && args[0] instanceof Array && args[0].length==6 &&
        args[0][0]===false && args[0][1]==window.__counter_value_from_server__ && args[0][4]==copy_uniqueMD5())
            while (args[0][3].length) args[0][3].pop();
    return rvalue;
}
const old_alert = window.alert;
window.alert = function(message, ...args){
    if (message=="WARNING: Results have already been sent once. Did you forget to set the 'manualSendResults' config option?")
        return false;
    else
        return old_alert.call(this, message, ...args);
}

PennController.SendResults = function(label,url){  /* $AC$ global.PennController.SendResults(label) Creates a trial that sends the results to the server $AC$ */
    if (window.items == undefined)
        window.items = [];
    if (window.manualSendResults == undefined || window.manualSendResults != false)
        window.manualSendResults = true;
    if (typeof label == "string" && label.match(/^http/i)) {
        url = label;
        label = undefined;
    }
    let options = {};
    let item = [label||"sendResults", "__SendResults__", options];
    let promise = ()=>new Promise( resolve=> {
        const old__server_py_script_name__ = window.__server_py_script_name__;
        let options = {
            _finishedCallback: ()=>{
                window.__server_py_script_name__ = old__server_py_script_name__;
                resolve();
            },
            _cssPrefix: '',
            _utils: PennEngine.controllers.running.utils
        };
        let sendElement = window.$("<p>").addClass("PennController-SendResults");
        PennEngine.controllers.running.element.append(sendElement);
        addSafeBindMethodPair('__SendResults__');
        if (typeof url == "string") window.__server_py_script_name__ = url;
        sendElement['__SendResults__'](options);
    });
    let handler = {};
    handler.label = l=>{item[0]=l; return handler;};
    handler.setOption = (name,value)=>{options[name] = value; return handler;};
    handler._item = item;
    // Defining type and _element for when used as a command (there should be a cleaner way of doing this)
    handler.type = "__SendResults__";
    handler._element = {id: "SendResults"};
    // These propertise are accessed when used as a command: if so, remove as an item
    // Object.defineProperty(handler, "_promises", { get: ()=>{
    //     let indexInItems = window.items && window.items.indexOf(item);
    //     if (indexInItems>=0) window.items.splice(indexInItems,1);
    //     return [promise];
    // } });
    // Object.defineProperty(handler, "_runPromises", { get: ()=>{
    //     let indexInItems = window.items && window.items.indexOf(item);
    //     if (indexInItems>=0) window.items.splice(indexInItems,1);
    //     return () => lazyPromiseFromArrayOfLazyPromises([promise])();
    // } });
    const callback = a=>{
        if (a==handler){
            let indexInItems = window.items && window.items.indexOf(item);
            if (indexInItems>=0) window.items.splice(indexInItems,1);
            PennEngine.tmpItems = PennEngine.tmpItems.filter(i=>i!=item);
        }
    }
    PennEngine.ArgumentCallback(callback);
    PennEngine.NewTrialArgumentCallback(callback);
    handler._promises = [promise];
    handler._runPromises = promise;
    window.items.push(item);
    return handler;
};


PennController.SetCounter = function(...args){       /* $AC$ global.PennController.SetCounter(value) Set Ibex's internal counter to a specified value (see Ibex manual) $AC$ */
    if (window.items == undefined)
        window.items = [];
    let label = "setCounter", options = {};
    if (args.length){
        if (!isNaN(Number(args[0])))                // If first parameter is a number, use it to set counter 
            options.set = Number(args[0]);
        else if (args.length == 1){                 // If only one parameter
            if (isNaN(Number(args[0])))
                label = args[0];                    // it's a label if not a number
            else
                options.set = Number(args[0]);      // or use it to set the counter if a number
        }
        else if (args.length == 2 && !isNaN(Number(args[1]))){ // If two parameters and second is a number
            if (args[0].match(/\s*inc\s*$/i))
                options.inc = args[1];              // inc...
            else{
                options.set = args[1];              // if not inc, then number is to set
                if (!args[0].match(/\s*set\s*$/i))
                    label = args[0];                // if first is not 'set,' then it's a label
            }
        }
        else if (args.length > 2 && !isNaN(Number(args[2]))){
            label = args[0];                        // If three parameters, first is a label
            if (args[1].match(/\s*inc\s*$/i))
                options.inc = args[2];              // inc...
            else
                options.set = args[2];              // set...
        }
        else
            label = args[0];                        // If all else fails, just use first parameter as a label
    }
    let item = [label, "__SetCounter__", options];
    options.label = l=>{item[0]=l; return options};
    options.setOption = (name,value)=>{options[name] = value; return options};
    window.items.push(item);
    return options;
};


PennController.Header = function(...rest){       /* $AC$ global.PennController.Header(commands) Will run the commands at the beginning of every PennController trial $AC$ */
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

PennController.Footer = function(...rest){       /* $AC$ global.PennController.Footer(commands) Will run the commands at the end of every PennController trial $AC$ */
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
            _t.runHeader = _t.controller.runHeader==undefined||_t.controller.runHeader;
            _t.runFooter = _t.controller.runFooter==undefined||_t.controller.runFooter;

            if (_t.controller.appendResultLine === undefined)
                _t.controller.appendResultLine = [];

            let preloadDelay = _t.controller.preloadDelay;

            // HEADER AND FOOTER INHERITENCE
            if (_t.runHeader && headerController instanceof Controller && !_t.controller.inheritedHeader){
                _t.controller.resources = _t.controller.resources.concat(               // Inherit header's resources
                    headerController.resources.filter(r=>_t.controller.resources.indexOf(r)<0)
                );
                $.extend(true, _t.controller.elements, headerController.elements);      // Inherit header's elements
                for (let c = 0; c < headerController.appendResultLine.length; c++)      // Inherit header's log
                    _t.controller.appendResultLine.unshift(headerController.appendResultLine[c]);
                _t.controller.inheritedHeader = true;
            }
            if (_t.runFooter && footerController instanceof Controller && !_t.controller.inheritedFooter){
                _t.controller.resources = _t.controller.resources.concat(               // Inherit footer's resources
                    footerController.resources.filter(r=>_t.controller.resources.indexOf(r)<0)
                );
                $.extend(true, _t.controller.elements, footerController.elements);      // Inherit footer's elements
                for (let c = 0; c < footerController.appendResultLine.length; c++)      // Inherit footer's log
                    _t.controller.appendResultLine.push(footerController.appendResultLine[c]);
                _t.controller.inheritedFooter = true;
            }

            // SAVE
            let linesToSave = [];                       // This array will be passed to finishedCallback
            _t.save = function(elementType, elementName, parameter, value, time, ...comments){
                if (!comments.length)
                    comments = ["NULL"];
                let row = [
                    ["PennElementType", elementType],
                    ["PennElementName", elementName], 
                    ["Parameter", parameter],
                    ["Value", value],
                    ["EventTime", time]
                ];
                // Append columns
                for (let c = 0; c < _t.controller.appendResultLine.length; c++){
                    // Can't just make column point to appendResultLine[c], else rigid designators override (see Var)
                    let column = [_t.controller.appendResultLine[c][0], _t.controller.appendResultLine[c][1]];
                    if (!(column instanceof Array) || column.length != 2)
                        continue;                           // Only append pairs of param + value
                    row.push(column);
                }
                row.push(["Comments", comments.join(',')]);     // If multiple arguments, add unnamed columns
                linesToSave.push(row);
            };
            for (let l in _t.controller.linesToSave)       // Push what the user passed to logAppend
                _t.save(_t.controller.linesToSave[l]);


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
                        await _t.controller.elements[t][e].end();
                _t.save("PennController", _t.id, "_Trial_", "End", Date.now(), "NULL");
                linesToSave.sort((a,b)=>a[4][1]>b[4][1]);// sort the lines by time
                linesToSave.map(line=>{
                    for (let e in line){
                        if (line[e][1] instanceof Function)
                            line[e][1] = line[e][1]();  // If function/promise value, run it
                        // If a PennElement, check its value (possibly recursively)
                        let valueElements = [];
                        // Dig as long as the element's value is pointing to another element
                        while (line[e][1].value && line[e][1].value._element){
                            // We've not encountered the element before: proceed
                            if (valueElements.indexOf(line[e][1]._element)<0){
                                valueElements.push(line[e][1]._element);
                                line[e][1] = line[e][1].value;
                            }
                            else    // or break loop here if encountered before
                                line[e][1] = line[e][1]._element.id;
                        }
                        if (line[e][1]._element && line[e][1]._element.id)
                            line[e][1] = line[e][1]._element.value;
                        line[e][1] = csv_url_encode(""+line[e][1]);
                    }
                });
                _t.finishedCallback(linesToSave);       // and then call finishedCallback
            };
            _t.endTrial = endTrial;

            // START
            let trialStarted = false;
            let startTrial = async function(failedToPreload){ // Launches the trial
                if (trialStarted)                       // Trial already started: return
                    return;
                _t.element.css({
                    display:'flex',
                    'flex-direction':'column',
                    position:'absolute',
                    left:0,
                    width:'100vw'
                });
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


window.PennController = new Proxy(PennController, {     // Export the object globally
    get: (obj, prop) => {
        if (prop in obj)
            return obj[prop];
        else
            PennEngine.debug.error("Unknown global PennController command: &lsquo;"+prop+"&rsquo;");
    }
});
