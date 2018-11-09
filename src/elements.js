import { lazyPromiseFromArrayOfLazyPromises } from "./utils.js";
import { PennController } from "./controller.js";
import { PennEngine } from "./engine.js";

PennController.Elements = {};       // Will add newX/getX/defaultX commands for each element type (see _AddElementType)

// Returns an anonymous function returning a Promise containing the function command
// This is basically just a way to get lazy evaluation of Promises
//
// Example:     newCommand( function(resolve,  delay){ setTimeout(resolve, delay); } );
// returns:     delay => new Promise( resolve => setTimeout(resolve, delay) );
//
let newCommand = function(command) {
    return function(...rest){
        let element = this;
        return new Promise( function(resolve){
            for (let r in rest){                        // Evaluate any getVar() passed as argument (no command)
                if (rest[r] instanceof PennElementCommands && rest[r].type == "Var" && !rest[r]._promises.length){
                    rest[r]._runPromises();
                    rest[r] = rest[r]._element.evaluate();
                }
            }
            command.apply(element, [resolve].concat(rest));
        });
    }
};

// Returns an anonymous function returning a Promise fulfilled only when the condition function returns true
//
// Example:     newTest( function( element ){ return (element == this._element.selectedElement); } );
//
let newTest = function(condition) {
    return function(success, failure, ...rest){         // success/failure = lazy promises (see PennElementCommand)
        let element = this;
        let promise = new Promise( async function(resolve){ // async resolution (in contrast to newCommand)
            for (let r in rest){                        // Evaluate any getVar() passed as argument (no command)
                if (rest[r] instanceof PennElementCommands && rest[r].type == "Var" && !rest[r]._promises.length){
                    rest[r]._runPromises();
                    rest[r] = rest[r]._element.evaluate();
                }
            }
            if (condition.apply(element, rest)){
                await success();                        // success = sequence of promises (see lazyPromiseFromArrayOfLazyPromises)
                resolve("success");
            }
            else{
                await failure();                        // failure = sequence of promises (see lazyPromiseFromArrayOfLazyPromises)
                resolve("failure");
            }
        });
        promise.test = condition;                       // So it can be accessed independently of (async) resolution
        return promise;
    };
};

// Used in PennElementCommand to create a test command (both positive and negative)
//
// Example:     testCommand( function( opt ) { return this.opt == opt; } );
//
let testCommand = function(condition){
    let t = this;
    return function(...rest){
        let listOfTests = [condition];
        // Complex expressions are evaluated strictly linearly
        let test = () => newTest( () => {
            let connective = "and";
            let previousTest = true;
            for (let i = 0; i < listOfTests.length; i++) {
                let tst = listOfTests[i];
                if (tst=="and") connective = "and";
                else if (tst=="or") connective = "or";
                else{
                    let result = tst.apply(t._element, rest);
                    if (connective=="and")
                        previousTest = previousTest&&result;
                    else if (connective=="or")
                        previousTest = previousTest||result;
                }
            }
            return previousTest;
        });
        // NOTE: Test commands are special, they add two methods to the PennElementCommands instance: success and failure
        let successCommands = [()=>new Promise(resolve=>resolve())], failureCommands = [()=>new Promise(resolve=>resolve())];
        t._promises.push( () => test().apply( t._element , [
            lazyPromiseFromArrayOfLazyPromises(       // Map each command to a lazy Promise from its list of promises
                successCommands.map(successCommand=>lazyPromiseFromArrayOfLazyPromises(successCommand._promises))
            )
            ,
            lazyPromiseFromArrayOfLazyPromises(       // Map each command to a lazy Promise from its list of promises
                failureCommands.map(failureCommand=>lazyPromiseFromArrayOfLazyPromises(failureCommand._promises))
            )
        ].concat(rest)
        ) );
        t.success = function(...commands){        // To define the (sequence of) command(s) run upon success
            successCommands = successCommands.concat(commands);
            return t;                                           // Return the PennElementCommands instance
        };
        t.failure = function(...commands){        // To define the (sequence of) command(s) run upon failure
            failureCommands = failureCommands.concat(commands);
            return t;                                           // Return the PennElementCommands instance
        };
        t.and = function(...tests){
            for (let t = 0; t < tests.length; t++){
                if (!tests[t].hasOwnProperty("success")){
                    console.warn("Invalid test passed to and");
                    continue; 
                }
                listOfTests.push("and");
                listOfTests.push( ()=>tests[t]._promises[tests[t]._promises.length-1]().test() );
            }
            return t;
        };
        t.or = function(...tests){
            for (let t = 0; t < tests.length; t++){
                if (!tests[t].hasOwnProperty("success")){
                    console.warn("Invalid test passed to and");
                    continue; 
                }
                listOfTests.push("or");
                listOfTests.push( ()=>tests[t]._promises[tests[t]._promises.length-1]().test() );
            }
            return t;
        };
        return t;                       // Return the PennElementCommands instance
    };
};

// A class representing instances of elements
class PennElement {
    constructor(id, name, type){
        this.jQueryElement = $("<PennElement>");
        this.id = id;
        this.type = name;
        if (type.hasOwnProperty("end"))     // Called at the end of a trial
            this.end = function(){ type.end.apply(this); };
    }
}

// A class representing commands on elements, instantiated upon call to newX and getX
// An instance is fed with the methods corresponding to its element type (defined within _AddElementType)
class PennElementCommands {
        //  TODO
        //      constructor should take elementId as a parameter instead
        //      its _element attribute should be a dynamic get
        //      this will take care of elements defined in headers
    constructor(element, type){
        let t = this;
        if (element instanceof PennElement)
            t._element = element;
        else if (typeof(element) == "string"){  // element = name/id    >   attribute
            let controller;
            if (!PennEngine.controllers.running)    // If in phase of creation:
                controller = PennEngine.controllers.underConstruction; // get from controller under construction
            else                                    // Else, get from the running controller (e.g. async command)
                controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
            Object.defineProperty(t, "_element", { get: ()=>controller._getElement(element) });
        }
        t.type = type.name;
        t._promises = [];                   // Commands are essentially (lazy) promises, to be run in order (see _runPromises)
        // METHOD COMMANDS
        for (let p in type.actions) {
            t[p] = function(...rest){
                //let command = newCommand( type.actions[p] );
                // TMP
                let func = function(...args){
                    if (PennEngine.debug)
                        console.debug(type.name+" action command "+p+" running with params", rest);
                    type.actions[p].apply(this, args);
                };
                let command = newCommand( func );
                // END TMP
                t._promises.push( () => command.apply(t._element, rest) );
                return t;                       // Return the PennElementCommands instance
            };
        }
        // SETTINGS COMMANDS
        t.settings = {};
        for (let p in type.settings) {
            t.settings[p] = function(...rest){ 
                //let command = newCommand( type.settings[p] );
                // TMP
                let func = function(...args){ 
                    if (PennEngine.debug)
                        console.debug(type.name+" settings command "+p+" running with params", rest);
                    type.settings[p].apply(this, args);
                };
                let command = newCommand( func );
                // END TMP
                t._promises.push( () => command.apply(t._element, rest) );
                return t;                       // Return the PennElementCommands instance
            };
        }
        // TEST COMMANDS
        t.test = {};
        t.testNot = {};
        for (let p in type.test) {
            t.test[p] = testCommand.call(t, type.test[p]);
            t.testNot[p] = testCommand.call(t, function(...rest){ return !type.test[p].apply(t._element,rest); });
        }
        if (type.value)
            Object.defineProperty(t, "value", { get() {return type.value.apply(t._element);} });
    }
    
    // The promises will be run in order (see lazyPromiseFromArrayOfLazyPromises in utils.js)
    _runPromises () {
        return lazyPromiseFromArrayOfLazyPromises(this._promises)();
    }
}

// The commands shared by all elements
let standardCommands = {
    actions: {
        // Adds the element to the page (or to the provided element)
        print: async function(resolve, where){
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery){
                if (this.jQueryContainer instanceof jQuery)
                    this.jQueryContainer.remove();
                this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,''));
                this.jQueryElement.addClass("PennController-"+this.id.replace(/[\s_]/g,''));
                let div = $("<div>").css({                      // (embed in a div first)
                    display: "inherit", 
                    "min-width": this.jQueryElement.width(),
                    "min-height": this.jQueryElement.height()
                });
                this.jQueryContainer = div;
                if (typeof(this.jQueryAlignment)=="string")
                    div.css("text-align",this.jQueryAlignment);     // Handle horizontal alignement, if any
                div.addClass("PennController-elementContainer")
                    .addClass("PennController-"+this.type.replace(/[\s_]+/g,'')+"-container")
                    .addClass("PennController-"+this.id.replace(/[\s_]+/g,'')+"-container")
                    .append(this.jQueryElement);
                if (where instanceof jQuery)                        // Add to the specified jQuery element
                    where.append(div);
                else                                                // Or to main element by default
                    PennEngine.controllers.running.element.append(div.css("width", "100%"));
                if (this.cssContainer)                              // Apply custom css if defined
                    div.css.apply(div, this.cssContainer);
                let before = $("<div>").css("display", "inline-block")
                                .addClass("PennController-before")
                                .addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-before")
                                .addClass("PennController-"+this.id.replace(/[\s_]/g,'')+"-before");
                let after = $("<div>").css("display", "inline-block")  
                                .addClass("PennController-after")
                                .addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-after")
                                .addClass("PennController-"+this.id.replace(/[\s_]/g,'')+"-after");
                //if (this.jQueryBefore && this.jQueryBefore.length)
                    this.jQueryElement.before( before );
                //if (this.jQueryAfter && this.jQueryAfter.length)
                    this.jQueryElement.after( after );
                for (let e in this.jQueryBefore)
                    if (this.jQueryBefore[e] && this.jQueryBefore[e]._element)
                        await this.jQueryBefore[e].print( before )._runPromises();
                for (let e in this.jQueryAfter)
                    if (this.jQueryAfter[e] && this.jQueryAfter[e]._element)
                        await this.jQueryAfter[e].print( after )._runPromises();
            }
            else
                console.warn("No jQuery instance to print for element ", this.id);
            this.printTime = Date.now();
            resolve();
        },
        // Calls print again, where the element currently is
        refresh: function(resolve){
            let container = this.jQueryElement.parent();
            if (!(container instanceof jQuery) || !container.parent().length)
                return resolve();
            PennController.Elements['get'+this.type](this.id).print( container )._runPromises().then(resolve);
        },
        // Removes the element from the page
        remove: function(resolve){
            if (this.jQueryContainer instanceof jQuery)
                    this.jQueryContainer.remove();
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.remove();
            else
                console.warn("No jQuery instance to remove for element ", this.id);
            if (this.jQueryBefore && this.jQueryBefore.length)
                for (let b in this.jQueryBefore)
                    if (this.jQueryBefore[b]._element && this.jQueryBefore[b]._element.jQueryElement instanceof jQuery)
                        this.jQueryBefore[b]._element.jQueryElement.remove();
            if (this.jQueryAfter && this.jQueryAfter.length)
                for (let a in this.jQueryAfter)
                    if (this.jQueryAfter[a]._element && this.jQueryAfter[a]._element.jQueryElement instanceof jQuery)
                        this.jQueryAfter[a]._element.jQueryElement.remove();
            resolve();
        }
    }
    ,
    settings: {
        after: function(resolve,  commands){
            if (commands._element && commands._element.jQueryElement instanceof jQuery){
                if (this.jQueryElement.parent().length)     // If this element already printed
                    commands.print( this.jQueryContainer.find(".PennController-"+this.type+"-after") )
                commands._runPromises().then(()=>{
                    this.jQueryAfter.push( commands );
                    resolve();
                });
            }
            else{
                console.warn("Tried to add an invalid element after element named ", this.id);
                resolve();
            }
        },
        before: function(resolve,  commands){
            if (commands._element && commands._element.jQueryElement instanceof jQuery){
                if (this.jQueryElement.parent().length)     // If this element already printed
                    commands.print( this.jQueryContainer.find(".PennController-"+this.type+"-before") )
                commands._runPromises().then(()=>{
                    this.jQueryBefore.push( commands );
                    resolve();
                });
            }
            else{
                console.warn("Tried to add an invalid element before element named ", this.id);
                resolve();
            }
                
        },
        bold: function(resolve){
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css("font-weight","bold");
            else
                console.warm("Element named ",this.id," has not jQuery element to render as bold");
            resolve();
        },
        center: function(resolve){
            if (this.jQueryElement instanceof jQuery){
                this.jQueryElement.css({"text-align":"center",margin:"auto"});
                this.jQueryAlignment = "center";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("text-align", "center");
            }
            else
                console.warm("Element named ",this.id," has not jQuery element to render as centered");
            resolve();
        },
        color: function(resolve, color){
            if (this.jQueryElement && typeof(color)=="string")
                this.jQueryElement.css("color", color);
            else
                console.warn("Element named ",this.id," has not jQuery element to render as",color);
            resolve();
        },
        cssContainer: function(resolve, ...rest){
            this.cssContainer = rest;
            if (this.jQueryContainer instanceof jQuery)
                this.jQueryContainer.css(...rest);
            resolve();
        },
        css: function(resolve, ...rest){
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css(...rest);
            else
                console.warm("Element named ",this.id," has not jQuery element on which to apply the CSS");
            resolve();
        },
        disable: function(resolve){
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.attr("disabled", true);
            else
                console.warn("No jQuery instance to disable for element ", this.id);
            resolve();
        },
        enable: function(resolve){
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.removeAttr("disabled");
            else
                console.warn("No jQuery instance to enable for element ", this.id);
            resolve();
        },
        hidden: function(resolve){
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.css({visibility: "hidden"/*, "pointer-events": "none"*/});
            else
                console.warn("No jQuery instance to hide for element ", this.id);
            resolve();
        },
        italic: function(resolve){
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css("font-style","italic");
            else
                console.warm("Element named ",this.id," has not jQuery element to render in italic");
            resolve();
        },
        left: function(resolve){
            if (this.jQueryElement instanceof jQuery){
                this.jQueryElement.css("text-align","left");
                this.jQueryAlignment = "left";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("text-align", "left");
            }
            else
                console.warm("Element named ",this.id," has not jQuery element to render as aligned to the left");
            resolve();
        },
        log: function(resolve){
            this.log = true;
            resolve();
        },
        right: function(resolve){
            if (this.jQueryElement instanceof jQuery){
                this.jQueryElement.css("text-align","right");
                this.jQueryAlignment = "right";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("text-align", "right");
            }
            else
                console.warm("Element named ",this.id," has not jQuery element to render as aligned to the right");
            resolve();
        },
        size: function(resolve, width, height){
            if (this.jQueryElement instanceof jQuery){
                this.jQueryElement.width(width);
                this.jQueryElement.height(height);
            }
            else
                console.warm("Element named ",this.id," has not jQuery element to render as aligned to the right");
            resolve();
        },
        visible: function(resolve){
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.css({visibility: "visible"/*, "pointer-events": "auto"*/});
            else
                console.warn("No jQuery instance to make visible for element ", this.id);
            resolve();
        }
    }
    ,
    test: {
        printed: function(){
            return this.hasOwnProperty("jQueryElement") && 
                    this.jQueryElement instanceof jQuery && 
                    this.jQueryElement.parent().length;
        }
    }
};

// Make it available for developers
PennEngine.elements.standardCommands = standardCommands;



// Special commands (to replace with Trial?)
PennController.Elements.clear = function(){
    return {
        _promises: [()=>new Promise(                        // PennController cares for _promises
            async function(resolve) {
                let controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
                for (let e in controller.elements){
                    let element = controller.elements[e];
                    let commands = PennController.Elements["get"+element.type](element.id);
                    await commands.remove()._runPromises(); // Call element's own remove
                }
                resolve();
            }
        )]
    };
};

PennController.Elements.end = function(){
    return {
        _promises: [()=>new Promise(                        // PennController cares for _promises
            ()=>PennEngine.controllers.running.endTrial()   // No promise resolution = sequence halted
        )]
        ,
        _runPromises: () => lazyPromiseFromArrayOfLazyPromises(this._promises)()
    };
};


// Type is a class-like function, taking PennEngine as its parameter and returning a template for PennElementCommands
//
// Usage:
//      PennController._AddElementType("ElementTypeName", function(){
//          /* this refers to the template for PennElementCommands */
//          this.immediate = function(id, param){ /* this refers to the element */ /* run at the start of the experiment */ },
//          this.uponCreation = function(resolve){ /* this refers to the element */ /* Promise, run upon newElementType(id, param) */ },
//          this.end = function(){ /* this refers to the element */ /* run at the end of a trial (e.g. saves/resets) */ }
//          this.actions = {action1: function(){ /* this refers to the element */ }, action2: function},
//          this.settings = {settings1: function(){ /* this refers to the element */ }, settings2: function},
//          this.test = {test1: function(){ /* this refers to the element */ return true|false; }}
//      })
//
let elementTypes = {};
PennController._AddElementType = function(name, Type) {
    if (elementTypes.hasOwnProperty(name))
        console.error("Element type "+name+" defined more than once");
    
    function getType(T){                            // Makes sure type is set when calling new/get/default
        let type = new T(PennEngine);               // type defines a template type of PennElement (see, e.g., elements/text.js)

        if (!type.hasOwnProperty("actions"))
            type.actions = {};
        if (!type.hasOwnProperty("settings"))
            type.settings = {};
        if (!type.hasOwnProperty("test"))
            type.test = {};

        for (let action in standardCommands.actions){   // Feeding default actions (if not overridden by Type)
            if (!type.actions.hasOwnProperty(action))
                type.actions[action] = standardCommands.actions[action];
        }
        for (let setting in standardCommands.settings){ // Feeding default settings (if not overridden by Type)
            if (!type.settings.hasOwnProperty(setting))
                type.settings[setting] = standardCommands.settings[setting];
        }
        for (let test in standardCommands.test){        // Feeding default tests (if not overridden by Type)
            if (!type.test.hasOwnProperty(test))
                type.test[test] = standardCommands.test[test];
        }

        let uponCreation = type.uponCreation;           // Set a default uponCreation
        type.uponCreation = function(resolve){
            this.jQueryAfter = [];                      // Clear any element after this one
            this.jQueryBefore = [];                     // Clear any element before this one
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.removeAttr("style"); // Clear any style that could have been applied before
            if (uponCreation instanceof Function)
                uponCreation.apply(this, [resolve]);    // Call uponCreation for this type
            else
                resolve();
        };

        let end = type.end;                             // Set a default end
        type.end = function(){
            if (this.jQueryElement instanceof jQuery && this.jQueryElement.parent().length)
                this.jQueryElement.remove();            // Remove jQueryElement from DOM
            for (let b in this.jQueryBefore)            // Remove all preceding elements from DOM
                if (this.jQueryBefore[b]._element && this.jQueryBefore[b]._element.jQueryElement instanceof jQuery)
                this.jQueryBefore[b]._element.jQueryElement.remove();
            for (let a in this.jQueryAfter)            // Remove all following elements from DOM
                if (this.jQueryAfter[a]._element && this.jQueryAfter[a]._element.jQueryElement instanceof jQuery)
                this.jQueryAfter[a]._element.jQueryElement.remove();
            if (end instanceof Function)
                end.apply(this);                        // Call end for this type
        };

        type.name = name;
        return type;
    }
    
    elementTypes[name] = getType(Type);

    // 'new'
    PennController.Elements["new"+name] = function (...rest) {
        // for (let t in elementTypes)                             // Check that all types have been defined
        //     if (elementTypes[t] instanceof Function)
        //         elementTypes[t] = getType(elementTypes[t]);
        for (let r in rest)                                     // Evaluate any getVar() passed as argument (no command)
            if (rest[r] instanceof PennElementCommands && rest[r].type == "Var" && !rest[r]._promises.length)
                rest[r] = rest[r]._element.evaluate();
        let type = elementTypes[name];
        let controller = PennEngine.controllers.underConstruction; // Controller under construction
        if (PennEngine.controllers.running)                     // Or running, if in running phase
            controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
        let id = rest[0];                                       // All new elements must be given an id
        let element = new PennElement(id, name, type);          // Creation of the element itself
        if (type.hasOwnProperty("immediate") && type.immediate instanceof Function)
            type.immediate.apply(element, rest);                // Immediate initiation of the element
        controller._addElement(id, element);                    // Adding the element to the controller's dictionary
        let commands = new PennElementCommands(element, type);  // An instance of PennElementCommands bound to the element
        commands._promises.push( ()=>new Promise(r=>{element.printTime=0; element.log=false; r();}) ); // Init universal properties
        commands._promises.push( ()=>new Promise(r=>type.uponCreation.apply(element, [r])) ); // First command (lazy Promise)
        if (controller.defaultCommands.hasOwnProperty(name))// If current controller has default commands for element's type
            for (let p in controller.defaultCommands[name]){// add them to the list of commands (=lazy promises)
                let defaultCommand = controller.defaultCommands[name][p];
                commands._promises.push(()=>new Promise(        // defaultCommand = [commandName, [commandArguments], "header"]
                    r=>{
                        if (defaultCommand[2] == "header" && PennEngine.controllers.running.options.runHeader == false)
                            r();                                // Immediate resolution if from header but not run for this controller
                        else
                            defaultCommand[0].apply(element, [r, ...defaultCommand[1]]);
                    }
                ));
            }
        return commands;                                        // Return the command API
    };
    // 'get'
    PennController.Elements["get"+name] = function (id) {
        let type = elementTypes[name];
        return new PennElementCommands(id, type);          // Return the command API
    };
    // 'default'        Use a getter method to run setType when called
    Object.defineProperty(PennController.Elements, "default"+name, {
        get: function(){
            // for (let t in elementTypes)                         // Check that all types have been defined
            //     if (elementTypes[t] instanceof Function)
            //         elementTypes[t] = getType(elementTypes[t]);
            let type = elementTypes[name];
            let defaultInstance = {};
            let checkDefaultsExist = function(){    // function ensuring existence of default commands for element type for current controller
                if (!PennEngine.controllers.underConstruction.hasOwnProperty("defaultCommands"))
                    PennEngine.controllers.underConstruction.defaultCommands = {};
                if (!PennEngine.controllers.underConstruction.defaultCommands.hasOwnProperty(name))
                    PennEngine.controllers.underConstruction.defaultCommands[name] = [];
            };
                // actions
            for (let p in type.actions)
                defaultInstance[p] = function(...rest){
                    checkDefaultsExist();
                    PennEngine.controllers.underConstruction.defaultCommands[name].push([type.actions[p], rest]);
                    return defaultInstance;
                };
                // settings
            defaultInstance.settings = {};
            for (let p in type.settings)
                defaultInstance.settings[p] = function(...rest){
                    checkDefaultsExist();
                    PennEngine.controllers.underConstruction.defaultCommands[name].push([type.settings[p], rest]);
                    return defaultInstance;
                };
            return defaultInstance;
        }
    });
};

PennController._AddStandardCommands = function(commandsConstructor){
    let commands = new commandsConstructor(PennEngine);
    for (let type in commands){
        if (type.match(/^(actions|settings|test)$/)) {
            for (let name in commands[type]){
                let command = commands[type][name];
                if (standardCommands[type].hasOwnProperty(name))
                    console.warn("There already is a standard "+type+" command named "+name);
                else if (!(command instanceof Function))
                    console.warn("Standard "+type+" command "+name+" should be a function");
                else{
                    standardCommands[type][name] = command;
                    for (let t in elementTypes)
                        if (!elementTypes[t][type].hasOwnProperty(name))
                            elementTypes[t][type][name] = command;
                }
            }
        }
        else
            console.warn("Standard command type unknown", type);
    }
};


// This allows the users to call the instruction methods as global functions
PennController.ResetPrefix = function(prefixName) {
    if (typeof(prefixName)=="string"){
        if (window[prefix])
            throw "ERROR: prefix string already used for another JS object";
        window[prefixName] = {};                // Create an object
        var prefix = window[prefixName];        // Point to the object
    }
    else
        var prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
    let descriptors = Object.getOwnPropertyDescriptors(PennController.Elements);
    for (let d in descriptors){
        let descriptor = descriptors[d];
        if (descriptor.value instanceof Function)
            prefix[d] = descriptor.value;                   // new/get
        else if (descriptor.get instanceof Function)
            Object.defineProperty(prefix, d, descriptor);   // default
    }
};