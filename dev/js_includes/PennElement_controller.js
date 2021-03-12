// CONTROLLER element
/* $AC$ PennController.newController(name,controller,options) Creates a new Controller element $AC$ */
/* $AC$ PennController.getController(name) Retrieves an existing Controller element $AC$ */
window.PennController._AddElementType("Controller", function(PennEngine) {

    this.immediate = function(id, controller, options){
        if (options===undefined){
            if (typeof(controller) == "string")
                options = {};
            else{
                options = controller || {};
                controller = id
            }
        }
        this.id = id;
        this.controller = controller;
        this.options = options;
    };

    this.uponCreation = function(resolve){
        this.jQueryElement = $("<div>");
        this.log = false;
        this.results = [];
        this.finishedCallback = () => this.done = true;

        let t = this;
        this.options._finishedCallback = function(resultsArray) { 
            if (t.done) return;
            t.results.push( [Date.now(), resultsArray] );
            addSafeBindMethodPair("PennController");
            t.finishedCallback();
            this.destroy();
        };
        this.options._cssPrefix = this.controller+'-';
        this.options._utils = PennEngine.controllers.running.utils;
        this.options._utilsClass = PennEngine.controllers.running.options._utilsClass;
        this.options._controllerDefaults = PennEngine.controllers.running.options._controllerDefaults;

        let controllerNames = Object.getOwnPropertyNames($.ui).filter( name => $.ui[name] instanceof Function && $.ui[name]._ibex_options );
        if (controllerNames.indexOf(this.controller)>=0){
            // addSafeBindMethodPair(this.controller);
            // this.jQueryElement[this.controller](this.options);
        }
        else{
            let lowest = {score: 1, controllerName: ""};
            for (let i = 0; i < controllerNames.length; i++){
                let score = PennEngine.utils.levensthein(this.controller,controllerNames[i]) / this.controller.length;
                if (score < lowest.score){
                    lowest.score = score;
                    lowest.controllerName = controllerNames[i];
                }
            }
            if (lowest.score < 0.5)
                add = " Did you mean to type <strong>"+lowest.controllerName+"</strong>?";
            PennEngine.debug.error("Controller &lsquo;"+this.controller+"&rsquo; not found."+add);
        }
        resolve();
    };

    this.end = function(){
        if (this.log){
            for (let i = 0; i < this.results.length; i++){
                let time = this.results[i][0];
                let lines = this.results[i][1];
                for (let j = 0; j < lines.length; j++){
                    let line = lines[j];
                    // elementType, elementName, parameter, value, time, ...comments
                    let elementType = "Controller-"+this.controller;
                    let elementName = this.id;
                    let parameter = "NULL", value = "NULL";
                    if (line.length>0) parameter = line[0][1];
                    if (line.length>1) value = line[1][1];
                    for (let n = 2; n < line.length; n++)    // Add columns temporarily
                        PennEngine.controllers.running.controller.appendResultLine.push( [line[n][0],line[n][1]] );
                    PennEngine.controllers.running.save( elementType, elementName, parameter, value, time, "Any addtional parameters were appended as additional columns" );
                    for (let n = 2; n < line.length; n++)    // Remove columns added temporarily
                        PennEngine.controllers.running.controller.appendResultLine.pop();
                }
            }
        }
    };

    this.value = function(){                                    // Value is how many elements it contains
        return this.controller;
    };
    

    this.actions = {
        callback: function(resolve, ...commands){
            const oldCallback = this.finishedCallback;
            this.finishedCallback = function(...args){
                oldCallback.call(this, args);
                commands.forEach( async c => {
                    if (c.hasProperty("_runPromises") && c._runPromises instanceof Function)
                        await c._runPromises();
                    else if (c instanceof Function)
                        await c.call(this);
                });
            }
            resolve();
        },
        print: function(resolve,...args){
            this.done = false;
            this.jQueryElement.empty();
            const callback = ()=>{
                addSafeBindMethodPair(this.controller);
                this.jQueryElement[this.controller](this.options);
                resolve();
            }
            PennEngine.elements.standardCommands.actions.print.call(this, callback, ...args);
        },
        wait: function(resolve, test){   /* $AC$ Controller PElement.wait() Waits until the controller has been completed before proceeding $AC$ */
            if (test == "first" && this.done)       // If first and already complete, resolve already
                resolve();
            else {                                  // Else, extend finishedCallback and do the checks
                let resolved = false;
                let oldCallback = this.finishedCallback;
                this.finishedCallback = ()=>{
                    oldCallback.apply(this);
                    if (resolved) return;
                    if (test instanceof Object && test._runPromises && test.success){
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success") {
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                        });
                    }
                    else{                                    // If no (valid) test command was provided
                        resolved = true;
                        resolve();                          // resolve anyway
                    }
                };
            }
        }
    };

});
