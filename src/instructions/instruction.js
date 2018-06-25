import {_instructionsToPreload} from "../preload/preload.js";
import {_URLsToLoad, _zipPriority, _unzippedResources, _zipCallbacks} from "../preload/preloadZip.js";

const MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

// The instructions of each controller
var _localInstructions = [{}];

// The Instruction class itself
export class Instruction {
    constructor(id, content, type) {
        this.type = type;
        this.content = content;
        this.hasBeenRun = false;
        this.isDone = false;
        this.parentElement = null;          // To be set by caller
        this.element = null;
        this.origin = this;
        this.itvlWhen = null;               // Used in WHEN
        this.resource = null;
        // J provides with copies of the element's methods/attributes that return instructions/conditional functions
        this.j = {}
        // Binding 'ti' (=this) to the SETTINGS and TEST functions (because they're objects *of an object* of the prototype)
        let ti = this;
        this.settings = {};
        this.test = {};
        this.testNot = {};
        // We take the chain into account
        var constructorClass = this.constructor;
        while (constructorClass != Object.getPrototypeOf(Function)) {
            // Evaluate prototype now, as constructorClass will change at next loop
            let proto = (function(p) { return p; })(constructorClass.prototype);
            // Settings
            for (let s in proto.settings){
                // Add only if not already added at previous loop (= higher level of constructorClass)
                if (!ti.settings.hasOwnProperty(s) && proto.settings[s] instanceof Function)
                    ti.settings[s] = function(){ return proto.settings[s].apply(ti, arguments); };
            }
            // Test
            for (let s in proto.test){
                // Add only if not already added at previous loop (= higher level of constructorClass)
                if (!ti.test.hasOwnProperty(s) && proto.test[s] instanceof Function) {
                    ti.test[s] = function(){ return proto.test[s].apply(ti, arguments); };
                    // Also add testNot
                    ti.testNot[s] = function(){ 
                        // Let's create a positive test
                        let pos = proto.test[s].apply(ti, arguments);
                        // The negative test runs the positive test
                        let istr =  ti.newMeta(function(){ pos.hasBeenRun = false; pos.isDone = false; pos.run(); });
                        // We bind failure of the negative to success of the positive
                        pos.success = pos.extend("success", function(arg){ if (!(arg instanceof Instruction)) istr.failure(); });
                        // We bind success of the negative to failure of the positive
                        pos.failure = pos.extend("failure", function(arg){ if (!(arg instanceof Instruction)) istr.success(); });
                        // We create the 'success' method of test instructions
                        istr.success = function(successInstruction){
                            if (successInstruction instanceof Instruction){
                                istr._then = successInstruction;
                                successInstruction.done = successInstruction.extend("done", function(){ istr.done() });
                            }
                            else if (istr._then instanceof Instruction)
                                istr._then.run();
                            else
                                istr.done();
                            return istr;
                        };
                        // We create the 'failure' method of test instructions
                        istr.failure = function(failureInstruction){
                            if (failureInstruction instanceof Instruction){
                                istr._fail = failureInstruction;
                                failureInstruction.done = failureInstruction.extend("done", function(){ istr.done() });
                            }
                            else if (istr._fail instanceof Instruction)
                                istr._fail.run();
                            else
                                istr.done();
                            return istr;                        
                        }
                        // Return the negative test
                        return istr;
                    }
                }
            }
            // Go up a level
            constructorClass = Object.getPrototypeOf(constructorClass);
        }
        //console.log("Created instruction of type "+type+" with "+this.content);
        // Add instruction to the current controller
        if (!Ctrlr.building.hasOwnProperty("instructions"))
            Ctrlr.building.instructions = [];
        Ctrlr.building.instructions.push(this);
        //console.log("Created a new instruction, adding to controller:", Ctrlr.building);
        // Check that _localInstructions is up to date with list of PennControllers created so far
        while (_localInstructions.length < Ctrlr.list.length+1)
            _localInstructions.push({});
        _localInstructions[_localInstructions.length-1][id] = this.origin;
        this._id = id;
    }


    // Adds this's element to a given element
    _addElement(to, element, callback) {
        // If no destination element specified, use the controller's main level element (div)
        if (to == null)
            to = Ctrlr.running.element;
        // If no to-add element specified, use the element of the current instruction
        if (element == null)
            element = this.element;
        // The elements should be jQuery elements
        if (!(element instanceof jQuery) || !(to instanceof jQuery))
            return Abort;
        // If adding directly to the controller, embed in a DIV
        if (to == Ctrlr.running.element)
            element = $("<div>").append(element);
        // From https://stackoverflow.com/questions/38588741/having-a-reference-to-an-element-how-to-detect-once-it-appended-to-the-document
        if (callback instanceof Function && MutationObserver) {
            let observer = new MutationObserver((mutations) => {
                if (mutations[0].addedNodes.length === 0)
                    return;
                if (Array.prototype.indexOf.call(mutations[0].addedNodes, element[0]) === -1)
                    return;
                observer.disconnect();
                callback();
            });

            observer.observe(to[0], {
                childList: true
            });
        }
        // Content to the left
        if (this.origin._left){
            let leftSpan = $("<span>").addClass("PennController-before");
            if (this.origin._left instanceof Instruction) {
                this.origin._left.origin.parentElement = leftSpan;
                if (!this.origin._left.hasBeenRun)
                    this.origin._left.run();
                this.origin._left.origin.print().run();
            }
            else if (this.origin._left instanceof jQuery)
                leftSpan.append(this.origin._left);
            element.prepend(leftSpan);
        }
        // The element itself
        to.append(element);
        // Content to the left
        if (this.origin._right){
            let rightSpan = $("<span>").addClass("PennController-after");
            if (this.origin._right instanceof Instruction) {
                this.origin._right.origin.parentElement = rightSpan;
                if (!this.origin._right.hasBeenRun)
                    this.origin._right.run();
                this.origin._right.origin.print().run();
            }
            else if (this.origin._right instanceof jQuery)
                rightSpan.append(this.origin._right);
            element.append(rightSpan);
        }
    }

    // Method to set the jQuery element
    // Feeds the J attribute
    setElement(element) {
        // Set the element
        this.element = element;
        let ti = this;
        // And feed J with copies of methods/attributes
        for (let property in this.origin.element) {
            // If method, function that calls the element's method and returns an instruction (done immediately)
            if (typeof(ti.origin.element[property]) == "function") {
                ti.j[property] = function() {
                    ti.origin.element[property].apply(ti.origin.element, arguments);
                    return ti.newMeta(function(){ 
                        this.done();
                    });
                };
            }
            // If attribute, function that returns that attribute
            else
                ti.j[property] = function() { return ti.origin.element[property]; }
        }
    }

    // Adds a file to preloading
    _addToPreload() {
        // If the resource has already been set, preloading is already done
        if (this.origin.resource)
            return Abort;
        if (_instructionsToPreload.indexOf(this.origin)<0)
            _instructionsToPreload.push(this.origin);
        // And add the file to the current controller
        if (!Ctrlr.building.hasOwnProperty("preloadingInstructions"))
            Ctrlr.building.preloadingInstructions = [];
        if (Ctrlr.building.preloadingInstructions.indexOf(this.origin)<0)
            Ctrlr.building.preloadingInstructions.push(this.origin);
    }

    // Method to set the resource
    // Can be AUDIO or IMAGE
    _setResource(resource) {
        // If resource already set, throw a warning and abort
        if (this.origin.resource) {
            console.log("Warning: trying to replace resource for "+this.origin.content+"; several host copies of the same file? Ignoring new resource.");
            return Abort;
        }
        // Remove the instruction('s origin) from the list
        let idx = _instructionsToPreload.indexOf(this.origin);
        if (idx >= 0)
            _instructionsToPreload.splice(idx, 1);
        // Set the resource
        this.origin.resource = resource;
    }

    // Method to fetch a resource
    // Used by AudioInstr, ImageInstr, VideoInstr (YTInstr deals differently)
    fetchResource(resource, type) {
        let ti = this;

        // If resource already set, stop here
        if (this.origin.resource)
            return Abort;

        // Priority to zipped resources: wait for everything to be unzipped first
        if (_zipPriority && _URLsToLoad.length>0 && !resource.match(/^http/i)) {
            _zipCallbacks.push(function() {
                ti.fetchResource(resource, type);
            });
            return;
        }
        let element;
        let src;
        let event = "load";
        // If resource is part of unzipped resources
        if (_unzippedResources.hasOwnProperty(resource)) {
            type = _unzippedResources[resource].type;
            src = URL.createObjectURL(_unzippedResources[resource].blob);
            // Firefox won't reach readyState 4 with blob audios (but doesn't matter since file is local)
            if (type.match(/audio/))
                event = "canplay";
        }
        // Try to load the file at the given URL
        else if (resource.match(/^http/i)) {
            let extension = resource.match(/\.([^.]+)$/);
            // Resource should have an extension
            if (!type && !extension) {
                console.log("Error: extension of resource "+file+" not recognized");
                return Abort;
            }
            // Getting the extension itself rather than the whole match
            extension = extension[1];
            // AUDIO FILE
            if (type == "audio" || extension.match(/mp3|ogg|wav/i)) {
                type = "audio/"+extension.toLowerCase().replace("mp3","mpeg").toLowerCase();
                src = resource;
                event = "canplaythrough";
            }
            // IMAGE
            else if (type == "image" || extension.match(/gif|png|jpe?g/i)) {
                type = "image/"+extension.replace(/jpg/i,"jpeg").toLowerCase();
                src = resource;
            }
            // VIDEO
            else if (type == "video" || extension.match(/mp4|ogg|webm/i)) {
                // TO DO
            }
        }
        // Else, call fetchResource with each host URL (if any)
        else if (PennController.hosts.length) {
            // Trying to fetch the image from the host url(s)
            for (let h in PennController.hosts) {
                if (typeof(PennController.hosts[h]) != "string" || !PennController.hosts[h].match(/^http/i))
                    continue;
                ti.fetchResource(PennController.hosts[h]+resource, type);
            }
        }

        // If Audio
        if (type.match(/audio/)) {
            // Add SOURCE inside AUDIO, and add 'preload=auto'
            element = $("<audio>").append($("<source>").attr({src: src, type: type}))
                                    .attr({preload: "auto", controls: "controls"});
            // If the file was so fast to load that it can already play
            if (element.get(0).readyState > (4 - (event=="canplay")))
                ti._setResource(element);
            // Otherwise, bind a CANPLAYTHROUGH event
            else 
                element.one(event, function(){
                    // Once can play THROUGH, remove instruction from to preload
                    ti._setResource(element);
                });
        }
        // If image, add it directly (no need to preload)
        else if (type.match(/image/)) {
            element = $("<img>").attr({src: src, type: type});
            element.bind(event, function() {
                // Set resource
                ti.origin._setResource(element);
            }).bind("error", function() {
                console.log("Warning: could not find image "+resource);
            });
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    // Run once the instruction has taken effect
    done() {
        if (this.isDone || !this.hasBeenRun)
            return Abort;
        // Cannot be done if has a previous instruction that is not done yet
        if (this.previousInstruction instanceof Instruction && !this.previousInstruction.isDone)
            return Abort;
        // If instruction was called with WHEN clear any timeout
        if (this.itvlWhen)
            clearInterval(this.itvlWhen);
        this.isDone = true;
    }

    // Run by previous element (by default)
    run() {
        if (this.hasBeenRun)
            return Abort;
        // Cannot be run if has a previous instruction that is not done yet
        if (this.previousInstruction instanceof Instruction && !this.previousInstruction.isDone)
            return Abort;
        this.hasBeenRun = true;
    }


    // ========================================
    // INTERNAL METHODS
    // ========================================

    // Returns a new function executing the one passed as argument after THIS one (chain can be aborted)
    extend(method, code) {
        let ti = this, m = ti[method];
        return function(){
            if (m.apply(ti,arguments) == Abort)
                return Abort;
            return code.apply(ti,arguments);
        }
    }

    // Sets when a WHEN instruction is done
    // By default: upon click if clickable, timer otherwise
    _whenToInsist(tryToValidate) {
        let ti = this;
        if (this.origin.clickable)
            this.origin.element.click(tryToValidate);
        else
            this.itvlWhen = setInterval(tryToValidate, 10);                    
    }


    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction that runs ifFailure if conditionalFunction is not met
    // Done when source is done and conditionalFunction is met
    when(conditionalFunction, ifFailure) {
        return this.newMeta(function(){ 
            // Instruction immediately done if condition met
            if (conditionalFunction())
                this.done();
            // Else, run ifFailure and find way to validate later
            else {
                // If ifFailure is an instruction, run it
                if (ifFailure instanceof Instruction) {
                    ifFailure.parentElement = Ctrlr.running.element;
                    ifFailure.run();
                }
                // If ifFailure is a function, execute it
                else if (ifFailure instanceof Function)
                    ifFailure();
                // Try to insist
                let ti = this;
                this._whenToInsist(function(){
                    if (!ti.isDone && conditionalFunction()) 
                        ti.done();
                });
            }
        });
    }

    // Converts into a META instruction
    newMeta(callback, before) {
        // Maybe newMeta shouldn't pass on the source's content?
        //let source = this, instr = new this.origin.constructor(this.content);
        let source = this, instr = new this.origin.constructor("_newMeta_", Abort);
        // This will be called after source is run (actual running of this instruction)
        instr.sourceCallback = function(){
            // Cannot be run if sources not done yet
            let currentInstruction = this;
            while (currentInstruction.source) {
                if (!currentInstruction.source.isDone)
                    return Abort;
                currentInstruction = currentInstruction.source;
            }
            instr.hasBeenRun = true;
            if (typeof callback == "function")
                callback.apply(instr, arguments);
        };
        instr.before = function(){
            if (typeof before == "function")
                before.apply(instr, arguments);
        };
        // Rewrite any specific DONE method
        instr.done = function(){ 
            if (Instruction.prototype.done.apply(instr) == Abort)
                return Abort;
            // Cannot be done if sources not done yet
            let currentInstruction = this;
            while (currentInstruction.source) {
                if (!currentInstruction.source.isDone)
                    return Abort;
                currentInstruction = currentInstruction.source;
            }
        };
        // Rewrite any specific RUN method
        instr.run = function(){
            if (Instruction.prototype.run.apply(instr) == Abort)
                return Abort;
            // Should not be considered run yet (only so in callback)
            instr.hasBeenRun = false;
            instr.before();
            if (!source.hasBeenRun){
                source.done = source.extend("done", function(){ instr.sourceCallback(); });
                source.run();
            }
            else {
                instr.sourceCallback();
            }
        };
        // All other methods are left unaffected
        instr.type = "meta";
        instr.source = source;
        instr.setElement(source.element);
        instr.origin = source.origin;
        instr.toPreload = source.toPreload;
        return instr;
    }

    // Prints the element on the screen
    // Done immediately
    print() {
        return this.newMeta(function(){
            this.origin._addElement(this.origin.parentElement);
            if (this.origin._setAlignment)
                this.origin.element.parent().css("text-align", this.origin._setAlignment);
            this.done();
        });
    }

    // Returns an instruction to remove the element (if any)
    // Done immediately
    remove() {
        return this.newMeta(function(){
            // Content to the left
            if (this.origin._left){
                if (this.origin._left instanceof Instruction)
                    this.origin._left.origin.element.detach();
                else if (this.origin._left instanceof jQuery)
                    this.origin._left.detach();
            }
            // The element itself
            if (this.origin.element instanceof jQuery) {
                this.origin.element.detach();
            }
            // Content to the right
            if (this.origin._right){
                if (this.origin._right instanceof Instruction)
                    this.origin._right.origin.element.detach();
                else if (this.origin._right instanceof jQuery)
                    this.origin._right.detach();
            }
            this.done();
        });
    }

    // Returns an instruction to move the origin's element
    // Done immediately
    move(where, options) {
        return this.newMeta(function(){
            if (where instanceof Instruction) {
                let origin = where.origin.element;
                while (where instanceof ComplexInstr && !origin.is("table"))
                    origin = origin.parent();
                if (options == "before")
                    origin.before(this.origin.element);
                else
                    origin.after(this.origin.element);
            }
            this.done();
        });
    }

    // Returns an instruction to shift X & Y's offsets
    // Done immediately
    shift(x, y) {
        return this.newMeta(function(){
            if (this.origin.element.css("position").match(/static|relative/)) {
                this.origin.element.css("position", "relative");
                this.origin.element.css({left: x, top: y});
            }
            else if (this.origin.element.css("position") == "absolute") {
                this.origin.element.css({
                    left: this.origin.element.css("left")+x,
                    top: this.origin.element.css("top")+y
                });
            }
            this.done();
        });
    }

    // Returns an instruction to hide the origin's element
    // Done immediately
    hide(shouldHide) {
        if (typeof(shouldHide)=="undefined")
            shouldHide = true;
        return this.newMeta(function(){
            if (shouldHide)
                this.origin.element.css("visibility","hidden");
            else
                this.origin.element.css("visibility","visible");
            this.done();
        });
    }

    // Returns an instruction to wait for a click on the element
    // Done upon click on the origin's element
    click(callback) {
        return this.newMeta(function(){
            this.origin.clickable = true;
            this.origin.element.addClass(Ctrlr.running.cssPrefix + "clickable");
            let ti = this;
            this.origin.element.click(function(){
                if (callback instanceof Instruction) {
                    callback.parentElement = Ctrlr.running.element;
                    callback.run();
                }
                else if (callback instanceof Function)
                    callback.apply(Ctrlr.running.variables);
                ti.done();
            });
        });
    }

    // Returns an instruction to assign an id to the instruction
    // Done immediately
    _setId(name) {
        _localInstructions[_localInstructions.length-1][name] = this.origin;
        this.origin._id = name;
        return this.newMeta(function(){ this.done(); });
    }
}


// SETTINGS instructions
Instruction.prototype.settings = {
    // Center the text on the screen
    center: function(){
        return this.newMeta(function(){
            this.origin.element.css({"text-align": "center", margin: "auto"});
            this.origin.element.parent().css("text-align","center");
            this.origin._setAlignment = "center";
            this.done();
        });
    }
    ,
    // Align the text to the left ot its container
    left: function(){
        return this.newMeta(function(){
            this.origin.element.css({"text-align": "left", "margin-left": 0});
            this.origin.element.parent().css("text-align","left");
            this.origin._setAlignment = "left";
            this.done();
        });
    }
    ,
    // Align the text to the right ot its container
    right: function(){
        return this.newMeta(function(){
            this.origin.element.css({"text-align": "right", "margin-right": 0});
            this.origin.element.parent().css("text-align","right");
            this.origin._setAlignment = "right";
            this.done();
        });
    }
    ,
    // Make the font bold-faced
    bold: function(on){
        return this.newMeta(function(){
            if (on===false)
                this.origin.element.css("font-weight", "normal");
            else
                this.origin.element.css("font-weight", "bold");
            this.done();
        });
    }
    ,
    // Make the font italics
    italic: function(on){
        return this.newMeta(function(){
            if (on===false)
                this.origin.element.css("font-style","normal");
            else
                this.origin.element.css("font-style","italic");
            this.done();
        });
    }
    ,
    // Make the font italics
    color: function(colour){
        return this.newMeta(function(){
            this.origin.element.css("color", colour);
            this.done();
        });
    }
    ,
    // Resizes the element to W,H
    size: function(w,h) {
        return this.newMeta(function(){
            this.origin.element.css({width: w, height: h});
            this.done();
        });
    }
    ,
    // Adds content to the left
    before: function(element){
        let o = this.origin;
        return this.newMeta(function(){
            if (typeof(element).match(/number|string/))
                element = $("<span>").html(element);
            if (element instanceof jQuery || element instanceof Instruction)
                o._left = element;
            else
                console.log("Warning: tried to 'before' an invalid element", element);
            this.done();
        });
    }
    ,
    // Adds content to the right
    after: function(element){
        let o = this.origin;
        return this.newMeta(function(){
            if (typeof(element).match(/number|string/))
                element = $("<span>").html(element);
            if (element instanceof jQuery || element instanceof Instruction)
                o._right = element;
            else
                console.log("Warning: tried to 'after' an invalid element", element);
            this.done();
        });
    }
    ,
    // Dynamically changes css
    css: function() {
        let arg = arguments;
        return this.newMeta(function(){
            this.origin.element.css.apply(this.origin.element, arg);
            this.done();
        });
    }
    ,
    // Enables an element (only effective if input)
    enable: function(){
        return this.newMeta(function(){
            this.origin.element.attr("disabled", false);
            this.done();
        });
    }
    ,
    // Disables an element (only effective if input)
    disable: function(){
        return this.newMeta(function(){
            this.origin.element.attr("disabled", true);
            this.done();
        });
    }
};



// Handling default instructions
// called for each instruction type (create handlers)
Instruction._setDefaultsName = function(name) {
    let ti = this;
    ti._defaultInstructions = [];
    ti._temporaryDefaultInstructions
    // handler
    name = "default"+name.substr(0,1).toUpperCase()+name.substr(1);
    PennController.instruction[name] = {settings: {}};
    // We go up the chain
    var constructorClass = ti;
    while (constructorClass != Object.getPrototypeOf(Function)) {
        // Evaluate prototype now, as constructorClass will change at next loop
        let proto = (function(p) { return p; })(constructorClass.prototype);
        // Actions
        let instructionClassProperties = Object.getOwnPropertyNames(proto);
        for (let index in instructionClassProperties){
            let f = instructionClassProperties[index];
            // Add only if not added at previous loop (i.e., at a higher instance level)
            if (!PennController.instruction[name].hasOwnProperty(f) &&
                proto[f] instanceof Function && !f.match(/^(_.+|constructor|done|run|extend|newMeta)$/)) {
                PennController.instruction[name][f] = function(){
                    ti._defaultInstructions.push([f, arguments]);
                    return PennController.instruction[name];
                };
            }
        }
        // Settings
        for (let s in proto.settings){
            // Add only if not added at previous loop (i.e., at a higher instance level)
            if (!PennController.instruction[name].settings.hasOwnProperty(s) &&
                proto.settings[s] instanceof Function && !s.match(/^_/)) {
                PennController.instruction[name].settings[s] = function(){
                    ti._defaultInstructions.push(["settings."+s, arguments]);
                    return PennController.instruction[name];
                };
            }
        }
        // Go up a level
        constructorClass = Object.getPrototypeOf(constructorClass);
    }
}
// called when an instance is created (applies the default instructions)
Instruction._newDefault = function(instruction) {
    if (Object.keys(this._defaultInstructions).length){
        for (let f in this._defaultInstructions){
            let name = this._defaultInstructions[f][0];
            let args = this._defaultInstructions[f][1];
            let isSettings = name.match(/^settings\.([^.]+)$/);
            // if a setting
            if (isSettings){
                instruction = instruction.settings[isSettings[1]].apply(instruction, args);
            }
            else
                instruction = instruction[name].apply(instruction, args);
        }
    }
    return instruction;   
}



// Returns an instruction by its ID
PennController.instruction = function(id) {
    if (typeof(id)!="string")
        return Abort;
    // If there's an instrution referenced as ID while EXECUTING a controller
    if (Ctrlr.running.hasOwnProperty("id") && _localInstructions[Ctrlr.running.id].hasOwnProperty(id))
        return _localInstructions[Ctrlr.running.id][id];
    // If there's an instrution referenced as ID while CREATING a controller
    else if (!Ctrlr.running.hasOwnProperty("id") && _localInstructions[_localInstructions.length-1].hasOwnProperty(id))
        return _localInstructions[_localInstructions.length-1][id];
    else {
        console.log("ERROR: could not find an element named "+id+", check the spelling (esp. lower/upper-case)");
        return Abort;
    }
};