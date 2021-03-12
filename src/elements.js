import { lazyPromiseFromArrayOfLazyPromises, parseElementCommands, printAndRefreshUntil, levensthein } from "./utils.js";
import { PennController } from "./controller.js";
import { PennEngine } from "./engine.js";

PennController.Elements = {};       // Will add newX/getX/defaultX commands for each element type (see _AddElementType)

// The self keyword will be instantiated with the current element in each command
class Self {
    constructor(){
        this._commands = [];             // We'll keep track of the commands here
        this._currentType = "action.";
    }
};
// Using a proxy to list *any* command when invoking self
Object.defineProperty(PennController.Elements, "self", {get: () => {
    const t = new Self();
    const p = new Proxy(t, {
        get: (obj, prop) => {
            if (prop == "_commands" || prop == "_currentType" || prop == "hasOwnProperty")
                return t[prop];
            console.log("Getting self's proxy, with",prop);
            if (prop == "settings")
                t._currentType = "settings.";
            else if (prop == "test")
                t._currentType = "test.";
            else if (prop == "testNot")
                t._currentType = "testNot.";
            else {
                console.log("Action on self");
                let action = {name: t._currentType.replace('action.','')+prop};
                t._commands.push(action);
                const f = (...args) => { action.args = args; console.log("Added args",args,"to",action);  return p };
                t._currentType = "action.";
                return f;
            }
            return p;
        }
    });
    return p;
}});

const evaluateArgumentsCallbacks = [];
PennEngine.ArgumentCallback = f=>evaluateArgumentsCallbacks.push(f);
// Replace Var with their values and self with pointers
const evaluateArguments = function(args){
    for (let r = 0; r < args.length; r++){
        evaluateArgumentsCallbacks.map(f=>f instanceof Function && f.call(null,args[r]));
        if (args[r] instanceof PennElementCommands && args[r].type == "Var" && !args[r]._promises.length){
            args[r]._runPromises();
            args[r] = args[r]._element.evaluate();
        }
        else if (args[r] instanceof Self) {
            let pcommands = new PennElementCommands(this, elementTypes[this.type]), handler = pcommands._proxy;
            const listOfCommands = args[r]._commands;
            // Loop through the commands and just call them on the handler (will take care of adding the promises)
            for (let i = 0; i < listOfCommands.length; i++){
                const c = listOfCommands[i];
                console.log("About to call",c.name,"with",c.args,"on",handler);
                if (c.name.match(/^settings\./)) handler = handler.settings[c.name.replace(/^settings\./,'')](...c.args);
                else if (c.name.match(/^test\./)) handler = handler.test[c.name.replace(/^test\./,'')](...c.args);
                else if (c.name.match(/^testNot\./)) handler = handler.testNot[c.name.replace(/^test\./,'')](...c.args);
                else handler = handler[c.name](...c.args);
            }
            args[r] = pcommands;
            console.log("Replaced self with",args[r]);
        }
    }
    return args;
}
PennEngine.utils.evaluateArguments = evaluateArguments;



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
            let controller = PennEngine.controllers.running;
            PennEngine.debug.currentPromise = resolve;
            let resolveOnlyForCurrentController = (...args)=>(PennEngine.controllers.running!=controller||resolve(...args));
            evaluateArguments.call(element, rest);
            command.apply(element, [resolveOnlyForCurrentController].concat(rest));
        });
    }
};



// Used in PennElementCommand to create a test command (both positive and negative)
//
// Example:     newTestBis( function( opt ) { return this.opt == opt; } );
//
let newTest = function(condition){
    let complex = [];                                   // ["and", testCommand, "or", testCommand, ...]
    let success = ()=>new Promise(r=>r()), failure = ()=>new Promise(r=>r());
    let test = function(...rest){
        let element = this;
        return new Promise(async function(resolve){
            let controller = PennEngine.controllers.running;
            PennEngine.debug.currentPromise = resolve;
            let resolveOnlyForCurrentController = (...args)=>(PennEngine.controllers.running!=controller||resolve(...args));
            evaluateArguments.call(element, rest);
            let result = condition.apply(element, rest);    // Result of this test
            let connective = "and";                     // Going through conjunctions/disjunction tests
            for (let c = 0; c < complex.length; c++){
                let tst = complex[c];
                if (tst=="and") connective = "and";
                else if (tst=="or") connective = "or";
                else if (tst && tst._runPromises && tst.success) {
                    tst = await tst._runPromises()=="success";  // Run the test; _runPromises returns last promise's value
                    if (connective=="and")
                        result = result&&tst;
                    else if (connective=="or")
                        result = result||tst;
                }
            }
            if (result){
                await success();
                resolveOnlyForCurrentController("success");
            }
            else{
                await failure();
                resolveOnlyForCurrentController("failure");
            }
        });
    }
    test.and = t=>{ complex.push("and"); complex.push(t); }
    test.or = t=>{ complex.push("or"); complex.push(t); }
    // Mapping directly to _runPromises doesn't work so map to ()=>_runPromises()
    test.success = (...commands)=>success = lazyPromiseFromArrayOfLazyPromises(commands.map(c=>()=>c._runPromises()));
    test.failure = (...commands)=>failure = lazyPromiseFromArrayOfLazyPromises(commands.map(c=>()=>c._runPromises()));

    return test;
}

// A class representing instances of elements
class PennElement {
    constructor(id, name, type){
        let jQueryElement = $("<PennElement>");
        let oldCSS = jQueryElement.css;
        let styles = [];
        jQueryElement.css = (...css)=>{
            styles.push(css);
            oldCSS.apply(jQueryElement, css);
        };
        let alreadySet = false;
        Object.defineProperty(this, "jQueryElement", {
            set: function(element) {
                if (!(element instanceof jQuery))
                    return PennEngine.debug.error("Tried to assign a non jQuery element to PennElement named "+id);
                if (alreadySet)
                    return jQueryElement = element;
                // inherit old jQueryElement's handlers
                let events = jQueryElement.data('events');
                if (events)
                    $.each(events, function() {
                        $.each(this, function() {
                            element.bind(this.type, this.handler);
                        });
                    });
                // inherit old jQueryElement's css
                for (let s in styles)
                    element.css(...styles[s]);
                jQueryElement = element;
                alreadySet = true;
            },
            get: function() { return jQueryElement; }
        });
        this.jQueryContainer = $("<div>");
        this.id = id;
        this.type = name;
        this.validate = ()=>this.hasValidated = true;
        this._printCallback = [];
        if (type.hasOwnProperty("end"))     // Called at the end of a trial
            this.end = function(){ type.end.apply(this); };
    }
}

let errorCommand = (command, type, name, dict) => {
    let add = "";
    let test = command.replace(/^\.(settings|testNot|test)\./,'');
    if ((levensthein(test,"settings") / "settings".length) < 0.5)
        add = " Did you mean to type &lsquo;<strong>settings</strong>&rsquo;?";
    if ((levensthein(test,"test") / "test".length) < 0.5)
        add = " Did you mean to type &lsquo;<strong>test</strong>&rsquo;?";
    if ((levensthein(test,"testNot") / "testNot".length) < 0.5)
        add = " Did you mean to type &lsquo;<strong>testNot</strong>&rsquo;?";
    let lowest = {score: 1, command: ""};
    for (let i = 0; i < dict.length; i++){
        let score = levensthein(test,dict[i]) / test.length;
        if (score < lowest.score){
            lowest.score = score;
            lowest.command = dict[i];
        }
    }
    if (lowest.score < 0.5)
        add = " Did you mean to type <strong>"+command.replace(test,lowest.command)+"</strong>?";
    PennEngine.debug.error("Command &lsquo;"+command+"&rsquo; unknown on "+type+" element &lsquo;"+name+"&rsquo;."+add);
};

// A class representing commands on elements, instantiated upon call to newX and getX
// An instance is fed with the methods corresponding to its element type (defined within _AddElementType)
class PennElementCommands {
    constructor(element, type){
        let t = new Proxy(this, {
            get: (obj, prop) => {
                if (prop in this)
                    return obj[prop];
                else {
                    if (prop == "_runPromises")
                        return () => this._runPromises.call(this);
                    let r;
                    try {
                        r = this[prop];
                    }
                    catch(err){
                        errorCommand(prop,this.type,this._element.id, Object.getOwnPropertyNames(type.actions));
                        return t;
                    }
                    if (r === undefined && typeof(prop) == "string" && prop != "nodeType")
                        errorCommand(prop,this.type,this._element.id, Object.getOwnPropertyNames(type.actions));
                    return r;
                }
            }
        });
        this._proxy = t;
        if (element instanceof PennElement)
            t._element = element;
        else if (typeof(element) == "string"){  // element = name/id    >   attribute
            let controller;
            if (!PennEngine.controllers.running)    // If in phase of creation:
                controller = PennEngine.controllers.underConstruction; // get from controller under construction
            else                                    // Else, get from the running controller (e.g. async command)
                controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
            Object.defineProperty(t, "_element", { get: ()=>controller._getElement(element, type.name) });
        }
        t.type = type.name;
        t._promises = [];                   // Commands are essentially (lazy) promises, to be run in order (see _runPromises)
        // ACTION COMMANDS
        for (let p in type.actions) {
            t[p] = function(...rest){
                let func = function(...args){
                    if (PennEngine.debug.on)
                        PennEngine.debug.log("<div style='color: lightsalmon'>"+
                                            t._element.id+" ("+type.name+") Action command '"+p+
                                            //"' running, params: " + JSON.stringify(parseElementCommands(rest)) +
                                            "' running, params: " + JSON.stringify(parseElementCommands(args)) +
                                            "</div>");
                    type.actions[p].apply(this, args);
                };
                let command = newCommand( func );
                t._promises.push( () => command.apply(t._element, rest) );
                return t;                       // Return the PennElementCommands instance
            };
        }
        // SETTINGS COMMANDS
        t.settings = new Proxy({}, {
            get: (obj, prop) => {
                if (prop in obj)
                    return obj[prop];
                else
                    errorCommand(".settings."+prop,this.type,this._element.id, Object.getOwnPropertyNames(type.settings));
                    // PennEngine.debug.error("Command &lsquo;.settings."+prop+"&rsquo; unknown on "+this.type+" element &lsquo;"+this._element.id+"&rsquo;");
            }
        });
        for (let p in type.settings) {
            t.settings[p] = function(...rest){ 
                let func = function(...args){ 
                    if (PennEngine.debug.on)
                        PennEngine.debug.log("<div style='color: salmon'>"+
                                            t._element.id+" ("+type.name+") Settings command '"+p+
                                            //"' running, params: " + JSON.stringify(parseElementCommands(rest)) +
                                            "' running, params: " + JSON.stringify(parseElementCommands(args)) +
                                            "</div>");
                    type.settings[p].apply(this, args);
                };
                let command = newCommand( func );
                t._promises.push( () => command.apply(t._element, rest) );
                return t;                       // Return the PennElementCommands instance
            };
        }
        // TEST COMMANDS
        t.test = new Proxy({}, {
            get: (obj, prop) => {
                if (prop in obj)
                    return obj[prop];
                else
                    errorCommand(".test."+prop,this.type,this._element.id, Object.getOwnPropertyNames(type.test));
                    //PennEngine.debug.error("Command &lsquo;.test."+prop+"&rsquo; unknown on "+this.type+" element &lsquo;"+this._element.id+"&rsquo;");
            }
        });
        t.testNot = new Proxy({}, {
            get: (obj, prop) => {
                if (prop in obj)
                    return obj[prop];
                else
                    errorCommand(".testNot."+prop,this.type,this._element.id, Object.getOwnPropertyNames(type.test));
                    //PennEngine.debug.error("Command &lsquo;.testNot."+prop+"&rsquo; unknown on "+this.type+" element &lsquo;"+this._element.id+"&rsquo;");
            }
        });
        for (let p in type.test) {
            t.test[p] = function (...rest){
                let func = function(...args){
                    if (PennEngine.debug.on)
                        PennEngine.debug.log("<div style='color: darksalmon'>"+
                                            t._element.id+" ("+type.name+") Test command '"+p+
                                            //"' running, params: " + JSON.stringify(parseElementCommands(rest)) +
                                            "' running, params: " + JSON.stringify(parseElementCommands(args)) +
                                            "</div>");
                    return type.test[p].apply(this, args);
                };
                let test = newTest( func );
                t._promises.push( () => test.apply(t._element, rest) );

                // Methods defined in newTest, encapsulating them to return t
                t.success = (...commands)=>{ test.success.apply(t._element, evaluateArguments.call(t._element,commands)); return t; };
                t.failure = (...commands)=>{ test.failure.apply(t._element, evaluateArguments.call(t._element,commands)); return t; };
                t.and = tst=>{ test.and.call(t._element, tst); return t; };
                t.or = tst=>{ test.or.call(t._element, tst); return t; };
                
                return t;                       // Return the PennElementCommands instance
            }
            t.testNot[p] = function (...rest){
                let func = function(...args){
                    if (PennEngine.debug.on)
                        PennEngine.debug.log(type.name+" testNot command "+p+" running, params: " + JSON.stringify(parseElementCommands(args)));
                        //PennEngine.debug.log(type.name+" testNot command "+p+" running, params: " + JSON.stringify(parseElementCommands(rest)));
                    return !type.test[p].apply(this, args);
                };
                let test = newTest( func );
                t._promises.push( () => test.apply(t._element, rest) );

                // Methods defined in newTest, encapsulating them to return t
                t.success = (...commands)=>{ test.success.apply(t._element, evaluateArguments.call(t._element,commands)); return t; };
                t.failure = (...commands)=>{ test.failure.apply(t._element, evaluateArguments.call(t._element,commands)); return t; };
                t.and = tst=>{ test.and.call(t._element, tst); return t; };
                t.or = tst=>{ test.or.call(t._element, tst); return t; };
                
                return t;                       // Return the PennElementCommands instance
            }
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
        // Zooms the element('s container) in/out so that it fits the dimensions
        scaling: function(resolve,x,y){
            let printedElement = this.jQueryElement;
            let width = 0, height = 0, page_width = 0, page_height = 0;
            const currentController = PennEngine.controllers.running;
            const getDimension = (s,ratio) => {
                let dimension = 0;
                if (!isNaN(Number(s))) return Number(s);
                else if (s.match(/(\d+(.\d+)?)px/)) dimension = Number(s.replace(/^[^\d]*(\d+(.\d+)?)px.*$/,"$1"));
                else{
                    const tmpDiv = $("<div>").css('width',s);
                    dimension = tmpDiv.appendTo(printedElement.parent()).width();
                    tmpDiv.remove();
                }
                return dimension/ratio;
            };
            const callback = ()=>{
                if (currentController!=PennEngine.controllers.running) return;
                if (this.jQueryContainer && this.jQueryContainer instanceof jQuery && this.jQueryContainer.parent().length)
                    printedElement = this.jQueryContainer;
                const new_width = printedElement.width(),
                      new_height = printedElement.height(),
                      new_page_width = $(window).width(),
                      new_page_height = $(window).height();
                window.requestAnimationFrame( callback );
                // if (new_width==width && new_height==height && new_page_width==page_width && new_page_height==page_height) return;
                // else{
                    width = new_width;
                    height = new_height;
                    page_width = new_page_width;
                    page_height = new_page_height;
                // }
                let zoom = "";
                if (x.match(/page|screen/i)){
                    const ratio_page = page_width/page_height,
                          ratio_element = width/height;
                    if (ratio_page<ratio_element)
                        zoom = `scale(${getDimension("100vw",width)})`;
                    else
                        zoom = `scale(${getDimension("100vh",height)})`;
                }
                else if (y===undefined || y.match(/auto/i))  // Base off width by default
                    zoom = `scale(${getDimension(x,width)})`;
                else if (x.match(/auto/i))
                    zoom = `scale(${getDimension(y,height)})`;
                else
                    zoom = `scale(${getDimension(x,width)},${getDimension(y,height)})`;
                let transform = printedElement.css("transform");
                transform = transform.replace(/^none$|matrix\([^)]+\)/,zoom);
                printedElement.css('transform',transform);
            };
            callback();
            resolve();
        },
        // Adds the element to the page (or to the provided element)
        print: async function(resolve, where, y, canvas){      /* $AC$ all PElements.print() Prints the element $AC$ */
            const lastPrint = [where,y,canvas]
            this._lastPrint = lastPrint;
            if (canvas && typeof(canvas)=="string")
                canvas = PennController.Elements.getCanvas(canvas);
            if (canvas && canvas instanceof PennElementCommands && canvas.type=="Canvas")
                return canvas.settings.add(where,y,PennController.Elements['get'+this.type](this.id))
                    ._runPromises().then(()=>resolve());
            if (this.jQueryElement && this.jQueryElement instanceof jQuery){
                this.jQueryContainer.detach();
                this.jQueryContainer.empty();
                this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,''));
                this.jQueryElement.addClass("PennController-"+this.id.replace(/[\s_]/g,''));
                let div = this.jQueryContainer;
                div.css("display","inherit");
                if (typeof(this.jQueryAlignment)=="string"){
                    if (this.jQueryAlignment.match(/left/i))
                        div.css('align-self','start');
                    else if (this.jQueryAlignment.match(/center/i))
                        div.css('align-self','center');
                    else if (this.jQueryAlignment.match(/right/i))
                        div.css('align-self','end');
                }
                div.addClass("PennController-elementContainer")
                    .addClass("PennController-"+this.type.replace(/[\s_]+/g,'')+"-container")
                    .addClass("PennController-"+this.id.replace(/[\s_]+/g,'')+"-container")
                    .append(this.jQueryElement);
                if (where instanceof jQuery)                        // Add to the specified jQuery element
                    where.append(div);
                else if (where instanceof PennElementCommands && where._element.jQueryElement instanceof jQuery)
                    where._element.jQueryElement.append(div);
                else if (y!==undefined) {                           // if where and y: coordinates
                    // div.appendTo($("body")).css('display','inline-block');
                    // let coordinates = parseCoordinates(where,y,div);
                    // div.css({position: 'absolute', left: coordinates.x, top: coordinates.y, 
                    //         transform: 'translate('+coordinates.translateX+','+coordinates.translateY+')'});
                    const currentController = PennEngine.controllers.running;
                    printAndRefreshUntil.call(div,
                        /*x=*/where,/*y=*/y,/*where=*/$("body"),
                        /*until=*/()=>currentController!=PennEngine.controllers.running || this._lastPrint!=lastPrint
                    );
                }
                else                                                // Or to main element by default
                    PennEngine.controllers.running.element.append(div);
                    // PennEngine.controllers.running.element.append(div.css("width", "100%"));
                if (this.cssContainer instanceof Array && this.cssContainer.length){ // Apply custom css if defined
                    for (let i = 0; i < this.cssContainer.length; i++)
                        div.css.apply(div, this.cssContainer[i]);
                }
                // div.css({
                //     "min-width": this.jQueryElement.width(),
                //     "min-height": this.jQueryElement.height()
                // });
                let before = $("<div>").css("display", "inline-block").addClass("PennController-before")
                let after = $("<div>").css("display", "inline-block").addClass("PennController-after")
                this.jQueryElement.before( before );
                this.jQueryElement.after( after );
                for (let e in this.jQueryBefore)
                    if (this.jQueryBefore[e] && this.jQueryBefore[e]._element)
                        await (new Promise(r=>
                            standardCommands.actions.print.call(this.jQueryBefore[e]._element, r, before)
                        ));
                for (let e in this.jQueryAfter)
                    if (this.jQueryAfter[e] && this.jQueryAfter[e]._element)
                        await (new Promise(r=>
                            standardCommands.actions.print.call(this.jQueryAfter[e]._element, r, after)
                        ));
            }
            else
                PennEngine.debug.error("No jQuery instance to print for element "+this.id);
            this.printTime = Date.now();
            for (let f = 0; f < this._printCallback.length; f++)
                if (this._printCallback[f] instanceof Function)
                    await this._printCallback[f].call(this);
            resolve();
        },
        // Calls print again, where the element currently is
        refresh: function(resolve){              /* $AC$ all PElements.refresh() Reprints the element where it is $AC$ */
            let container = this.jQueryElement.parent();
            if (!(container instanceof jQuery) || !container.parent().length)
                return resolve();
            let tmpContainer = $("<span>");
            container.before( tmpContainer );
            PennController.Elements['get'+this.type](this.id).print( tmpContainer )._runPromises().then(()=>{
                tmpContainer.before( this.jQueryElement.parent() );
                tmpContainer.remove();
                resolve();
            });
        },
        // Removes the element from the page
        remove: function(resolve){              /* $AC$ all PElements.remove() Removes the element from the page $AC$ */
            if (this.jQueryContainer instanceof jQuery)
                    this.jQueryContainer.detach();
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.detach();
            else
                PennEngine.debug.error("No jQuery instance to remove for element "+this.id);
            if (this.jQueryBefore && this.jQueryBefore.length)
                for (let b in this.jQueryBefore)
                    if (this.jQueryBefore[b]._element && this.jQueryBefore[b]._element.jQueryElement instanceof jQuery)
                        this.jQueryBefore[b]._element.jQueryElement.detach();
            if (this.jQueryAfter && this.jQueryAfter.length)
                for (let a in this.jQueryAfter)
                    if (this.jQueryAfter[a]._element && this.jQueryAfter[a]._element.jQueryElement instanceof jQuery)
                        this.jQueryAfter[a]._element.jQueryElement.detach();
            resolve();
        },
        wait: function(resolve, test){   /* $AC$ all PElement.wait() Waits until the element has been validated before proceeding $AC$ */
            if (test == "first" && this.hasValidated)   // If first and already validated, resolve already
                resolve();
            else {                                      // Else, extend remove and do the checks
                let resolved = false;
                let oldValidate = this.validate;
                this.validate = ()=>{
                    oldValidate.apply(this);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;  // Disable temporarilly
                        this.jQueryElement.attr("disabled", true);
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success") {
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled=="tmp"){
                                this.disabled = oldDisabled;
                                this.jQueryElement.attr("disabled", oldDisabled);
                            }   
                        });
                    }
                    else{                                    // If no (valid) test command was provided
                        resolved = true;
                        resolve();                          // resolve anyway
                    }
                };
                if (typeof test == "number" && test > 0){
                    let now = Date.now();
                    let check = ()=>{
                        if (Date.now()-now<=0)
                            this.validate();
                        else
                            window.requestAnimationFrame(check);
                    }
                    window.requestAnimationFrame(check);
                }
            }
        }
    }
    ,
    settings: {
        after: function(resolve,  commands){    /* $AC$ all PElements.after(element) Prints an element to the right of the current element $AC$ */
            if (commands._element && commands._element.jQueryElement instanceof jQuery){
                if (this.jQueryElement instanceof jQuery && this.jQueryElement.printed()) // If this element already printed
                    commands = commands.print( this.jQueryContainer.find(".PennController-after") );
                commands._runPromises().then(()=>{
                    this.jQueryAfter.push( commands );
                    resolve();
                });
            }
            else{
                PennEngine.debug.error("Tried to add an invalid element after element named "+this.id);
                resolve();
            }
        },
        before: function(resolve,  commands){    /* $AC$ all PElements.before(element) Prints an element to the left of the current element $AC$ */
            if (commands._element && commands._element.jQueryElement instanceof jQuery){
                if (this.jQueryElement instanceof jQuery && this.jQueryElement.printed()) // If this element already printed
                    commands.print( this.jQueryContainer.find(".PennController-"+this.type+"-before") )
                commands._runPromises().then(()=>{
                    this.jQueryBefore.push( commands );
                    resolve();
                });
            }
            else{
                PennEngine.debug.error("Tried to add an invalid element before element named "+this.id);
                resolve();
            }
                
        },
        bold: function(resolve){            /* $AC$ all PElements.bold() Prints the text, if any, as boldfaced $AC$ */
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css("font-weight","bold");
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as bold");
            resolve();
        },
        center: function(resolve){          /* $AC$ all PElements.center() Centers the element on the page $AC$ */
            if (this.jQueryElement instanceof jQuery){
                // this.jQueryElement.css({"text-align":"center",margin:"auto"});
                this.jQueryAlignment = "center";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("align-self", "center");
                    // this.jQueryContainer.css("text-align", "center");
            }
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as centered");
            resolve();
        },
        color: function(resolve, color){          /* $AC$ all PElements.color(color) Prints the text, if any, in the color specified $AC$ */
            if (this.jQueryElement && typeof(color)=="string")
                this.jQueryElement.css("color", color);
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as "+color);
            resolve();
        },
        cssContainer: function(resolve, ...rest){ /* $AC$ all PElements.cssContainer(option,value) Applies the CSS to the container of the element $AC$ */
            if (!this.cssContainer)
                this.cssContainer = [];
            this.cssContainer.push(rest);
            if (this.jQueryContainer.printed())
                this.jQueryContainer.css(...rest);
            resolve();
        },
        css: function(resolve, ...rest){        /* $AC$ all PElements.css(option,value) Applies the CSS to the element $AC$ */
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css(...rest);
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element on which to apply the CSS");
            resolve();
        },
        disable: function(resolve){             /* $AC$ all PElements.disable() Disables the element $AC$ */
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.attr("disabled", true).addClass("PennController-disabled");
            else
                PennEngine.debug.error("No jQuery instance to disable for element "+this.id);
            resolve();
        },
        enable: function(resolve){             /* $AC$ all PElements.enable() Enables the element $AC$ */
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.removeAttr("disabled").removeClass("PennController-disabled");
            else
                PennEngine.debug.error("No jQuery instance to enable for element "+this.id);
            resolve();
        },
        hidden: function(resolve){             /* $AC$ all PElements.hidden() Hides the element (will still leave a blank space) $AC$ */
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.css({visibility: "hidden"/*, "pointer-events": "none"*/});
            else
                PennEngine.debug.error("No jQuery instance to hide for element "+this.id);
            resolve();
        },
        italic: function(resolve){             /* $AC$ all PElements.italic() Prints the text, if any, as italicized $AC$ */
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.css("font-style","italic");
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render in italic");
            resolve();
        },
        left: function(resolve){             /* $AC$ all PElements.left() Aligns the element with the left edge of the printing area $AC$ */
            if (this.jQueryElement instanceof jQuery){
                // this.jQueryElement.css("text-align","left");
                this.jQueryAlignment = "left";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("align-self", "left");
                    // this.jQueryContainer.css("text-align", "left");
            }
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as aligned to the left");
            resolve();
        },
        log: function(resolve, value){
            this.log = value===undefined||value;
            resolve();
        },
        once: function(resolve){
            if (this.hasValidated){
                this.disabled = true;
                this.jQueryElement.attr("disabled", true);
            }
            else {
                let oldValidate = this.validate;
                this.validate = ()=>{
                    oldValidate.apply(this);
                    this.disabled = true;
                    this.jQueryElement.attr("disabled", true);
                }
            }
            resolve();
        },
        right: function(resolve){             /* $AC$ all PElements.right() Aligns the element with the right edge of the printing area $AC$ */
            if (this.jQueryElement instanceof jQuery){
                // this.jQueryElement.css("text-align","right");
                this.jQueryAlignment = "right";
                if (this.jQueryElement.parent().length)    // If element already printed, update
                    this.jQueryContainer.css("align-self","right");
                    // this.jQueryContainer.css("text-align", "right");
            }
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as aligned to the right");
            resolve();
        },
        size: function(resolve, width, height){  /* $AC$ all PElements.size(width,height) Gives the element a specific width and/or height $AC$ */
            if (this.jQueryElement instanceof jQuery){
                this.jQueryElement.width(width);
                this.jQueryElement.height(height);
                if (this.jQueryContainer instanceof jQuery){
                    if (typeof width == "string" && width.match(/%$/))
                        this.jQueryContainer.width("100%");
                    if (typeof height == "string" && height.match(/%$/))
                        this.jQueryContainer.height("100%");
                }
            }
            else
                PennEngine.debug.error("Element named "+this.id+" has not jQuery element to render as aligned to the right");
            resolve();
        },
        visible: function(resolve){             /* $AC$ all PElements.visible() Makes the element visible (again) $AC$ */
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                this.jQueryElement.css({visibility: "visible"/*, "pointer-events": "auto"*/});
            else
                PennEngine.debug.error("No jQuery instance to make visible for element "+this.id);
            resolve();
        }
    }
    ,
    test: {
        printed: function(){             /* $AC$ all PElements.test.printed() Checks that the element is printed on the page $AC$ */
            if (this.hasOwnProperty("jQueryElement") && this.jQueryElement instanceof jQuery)
                return this.jQueryElement.printed()
            return false;
        }
    }
};

// Make it available for developers
PennEngine.elements.standardCommands = standardCommands;


// Special command to go fullscreen
PennController.Elements.fullscreen = function(){       /* $AC$ Special Command.fullscreen() Makes the page fullscreen $AC$ */
    return {
        _promises: [()=>new Promise(
            function(resolve){
                if (document.documentElement.requestFullscreen)
                    return document.documentElement.requestFullscreen().then( resolve ).catch( resolve );
                else if (document.documentElement.mozRequestFullScreen) /* Firefox */
                    document.documentElement.mozRequestFullScreen();
                else if (document.documentElement.webkitRequestFullscreen) /* Chrome, Safari and Opera */
                    document.documentElement.webkitRequestFullscreen();
                else if (document.documentElement.msRequestFullscreen) /* IE/Edge */
                    document.documentElement.msRequestFullscreen();
                resolve();
            }
        )]
        ,
        _runPromises: () => lazyPromiseFromArrayOfLazyPromises(this._promises)()
    }
} // Exit full screen
PennController.Elements.exitFullscreen = function(){       /* $AC$ Special Command.exitFullscreen() Goes back to non-fullscreen $AC$ */
    return {
        _promises: [()=>new Promise(
            function(resolve){
                if (document.exitFullscreen)
                    return document.exitFullscreen().then( resolve ).catch( resolve );
                else if (document.mozCancelFullScreen) /* Firefox */
                    document.mozCancelFullScreen();
                else if (document.webkitExitFullscreen) /* Chrome, Safari and Opera */
                    document.webkitExitFullscreen();
                else if (document.msExitFullscreen) /* IE/Edge */
                    document.msExitFullscreen();
                resolve();
            }
        )]
        ,
        _runPromises: () => lazyPromiseFromArrayOfLazyPromises(this._promises)()
    }
}


// Special commands (to replace with Trial?)
PennController.Elements.clear = function(){     /* $AC$ Special Command.clear() Removes all the PElements currently on the page $AC$ */
    let t = {
        _element: $("<p></p>"),
        _promises: [()=>new Promise(                        // PennController cares for _promises
            async function(resolve) {
                let controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
                for (let t in controller.elements){
                    for (let e in controller.elements[t]){
                        let element = controller.elements[t][e];
                        let commands = PennController.Elements["get"+element.type](element.id);
                        await commands.remove()._runPromises(); // Call element's own remove
                    }
                }
                resolve();
            }
        )]
        ,
        _runPromises: () => lazyPromiseFromArrayOfLazyPromises(t._promises)()
    };
    return t;
};

PennController.Elements.end = function(){     /* $AC$ Special Command.end() Ends the trial immediately $AC$ */
    let t = {
        _element: $("<p></p>"),
        _promises: [()=>new Promise(                        // PennController cares for _promises
            async function(resolve) {
                await PennEngine.controllers.running.endTrial();
                resolve();
            }
        )]
        ,
        _runPromises: () => lazyPromiseFromArrayOfLazyPromises(t._promises)()
    };
    return t;
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
        PennEngine.debug.error("Element type "+name+" defined more than once");
    
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

        for (let command in type.settings){             // Making .settings commands available as main actions
            if (!type.actions.hasOwnProperty(command))
                type.actions[command] = type.settings[command];
        }

        let uponCreation = type.uponCreation;           // Set a default uponCreation
        type.uponCreation = function(resolve){
            this.jQueryAfter = [];                      // Clear any element after this one
            this.jQueryBefore = [];                     // Clear any element before this one
            if (this.jQueryElement && this.jQueryElement instanceof jQuery)
                this.jQueryElement.removeAttr("style"); // Clear any style that could have been applied before
            if (this.jQuerycontainer && this.jQueryContainer instanceof jQuery)
                this.jQuerycontainer = $("<div>");
            if (uponCreation instanceof Function)
                uponCreation.apply(this, [resolve]);    // Call uponCreation for this type
            else
                resolve();
        };

        let end = type.end;                             // Set a default end
        type.end = function(){
            //if (this.jQueryElement instanceof jQuery && this.jQueryElement.parent().length)
            if (this.jQueryElement instanceof jQuery)
                this.jQueryElement.remove();            // Remove jQueryElement from DOM
            for (let b in this.jQueryBefore)            // Remove all preceding elements from DOM
                if (this.jQueryBefore[b]._element && this.jQueryBefore[b]._element.jQueryElement instanceof jQuery)
                this.jQueryBefore[b]._element.jQueryElement.remove();
            for (let a in this.jQueryAfter)            // Remove all following elements from DOM
                if (this.jQueryAfter[a]._element && this.jQueryAfter[a]._element.jQueryElement instanceof jQuery)
                this.jQueryAfter[a]._element.jQueryElement.remove();
            if (this.jQueryContainer instanceof jQuery)
                this.jQueryContainer.remove();
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
        evaluateArguments.call(null, rest);
        let type = elementTypes[name];
        let controller = PennEngine.controllers.underConstruction; // Controller under construction
        if (PennEngine.controllers.running)                     // Or running, if in running phase
            controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
        let id = "unnamed-"+name;                               // The element's ID (to be overwritten)
        if (rest.length<1)                                      // No argument provided
            rest = [id];                                        // Try to create an ID anyway
            // PennEngine.debug.error("No argument provided for a "+name+" element");
        else if (typeof(rest[0])=="string"&&rest[0].length>0)   // If an ID was provided, use it
            id = rest[0];                                       
        let element = new PennElement(id, name, type);          // Creation of the element itself
        if (type.hasOwnProperty("immediate") && type.immediate instanceof Function)
            type.immediate.apply(element, rest);                // Immediate initiation of the element
        // If id already exists, add a number
        let oldId = element.id;
        for (let n = 2; controller.elements.hasOwnProperty(name) && controller.elements[name].hasOwnProperty(element.id); n++)
            element.id = oldId + String(n);
        if (oldId != element.id)
            PennEngine.debug.log("Found an existing "+element.type+" element named &ldquo;"+oldId+"&rdquo;--using name &ldquo;"+element.id+"&rdquo; instead for new element");
        controller._addElement(element);                        // Adding the element to the controller's dictionary
        let commands = new PennElementCommands(element, type);  // An instance of PennElementCommands bound to the element
        commands = commands._proxy;
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
        return (new PennElementCommands(id, type))._proxy;      // Return the command API
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
                    PennEngine.debug.error("There already is a standard "+type+" command named "+name);
                else if (!(command instanceof Function))
                    PennEngine.debug.error("Standard "+type+" command "+name+" should be a function");
                else{
                    standardCommands[type][name] = command;
                    for (let t in elementTypes){
                        if (!elementTypes[t][type].hasOwnProperty(name))
                            elementTypes[t][type][name] = command;
                        if (type == "settings" && !elementTypes[t].actions.hasOwnProperty(name))
                            elementTypes[t].actions[name] = command;
                    }
                }
            }
        }
        else
            PennEngine.debug.error("Standard command type unknown", type);
    }
};
