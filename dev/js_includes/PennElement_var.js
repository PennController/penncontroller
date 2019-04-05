(function(){

var prefix = null;
let oldResPref = window.PennController.ResetPrefix;
window.PennController.ResetPrefix = function(prefixName) {
    oldResPref(prefixName);
    if (typeof(prefix)=="string")           // Catch the new prefix
        prefix = window[prefixName];
    else
        prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
};

// VAR element
/* $AC$ PennController.newVar(name,value) Creates a new Var element $AC$ */
/* $AC$ PennController.getVar(name) Retrieves an existing Var element $AC$ */
window.PennController._AddElementType("Var", function(PennEngine) {

    this.immediate = function(id, value){
        // Things are getting a little ugly: overriding 'getVar' to make 'newVar' optional when global reference
        let oldGetVar = window.PennController.Elements.getVar;
        let underConstruction = PennEngine.controllers.underConstruction;
        window.PennController.Elements.getVar = function(getVarID){
            let controllerElements = PennEngine.controllers.underConstruction.elements;
            if (getVarID==id && !(controllerElements.hasOwnProperty("Var") && controllerElements.Var.hasOwnProperty(id))){
                let oldRunning = PennEngine.controllers.running;
                let oldUnderConstruction = PennEngine.controllers.underConstruction;
                PennEngine.controllers.running = null;
                PennEngine.controllers.underConstruction = underConstruction;
                let returnVar = oldGetVar(getVarID);
                PennEngine.controllers.running = oldRunning;
                PennEngine.controllers.underConstruction = oldUnderConstruction;
                return returnVar;
            }
            else
                return oldGetVar(getVarID);
        };
        if (prefix)                         // Update 'getVar' for the new prefix
            prefix.getVar = window.PennController.Elements.getVar;
        this.initialValue = value;
        this.value = value;
        this.scope = "local";
        this.evaluate = ()=>{
            if (this.value && this.value.type === "Var")
                return this.value.evaluate();
            else
                return this.value;
        };
    };

    this.uponCreation = function(resolve){
        let running = PennEngine.controllers.running.options.elements.Var[this.id];
        if (running && running.scope=="global" && running != this)
            this.value = running.value;
        else if (this.scope=="local")
            this.value = this.initialValue;
        this.values = [];
        resolve();
    };

    this.end = function(){
        if (this.log && this.log instanceof Array){
            if (this.log.indexOf("final")>-1)
                PennEngine.controllers.running.save(this.type, this.id, "Final", this.value, Date.now(), "Value at the end of the trial");
            if (this.log.indexOf("set")>-1){
                for (let v in this.values)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.values[v]);
                if (!this.values.length)
                    PennEngine.controllers.running.save(this.type, this.id, "Set", "NA", "Never", "The Var element was never set during the trial");
            }
        }
    };

    this.value = function(){
        return this.evaluate();
    };
    
    this.actions = {
        set: function(resolve, value){  /* $AC$ Var PElement.set(value) Sets the value (can be a function, e.g. v=>v+1 will increment the value) $AC$ */
            if (typeof(value)=="object" && value.hasOwnProperty("value"))
                this.value = value.value;
            else if (value instanceof Function)
                this.value = value.apply(this, [this.value]);
            else
                this.value = value;
            this.values.push(["Set", this.value, Date.now(), "NULL"]);
            resolve();
        }
    };

    this.settings = {
        local: function(resolve){  /* $AC$ Var PElement.settings.local() Ensures that the value of this Var element only affects the current trial $AC$ */
            this.scope = "local";
            for (c in PennEngine.controllers.list)
                if (PennEngine.controllers.list[c][this.id] == this)
                    PennEngine.controllers.list[c][this.id] = null;
            resolve();
        },
        log: function(resolve, ...what){
            if (what.length)
                this.log = what;
            else
                this.log = ["final"];
            resolve();
        },
        global: function(resolve){  /* $AC$ Var PElement.settings.global() Shares the value with all Var elements with the same name across trials $AC$ */
            this.scope = "global";
            for (c in PennEngine.controllers.list){
                if (!PennEngine.controllers.list[c].elements.hasOwnProperty("Var"))
                    PennEngine.controllers.list[c].elements.Var = {};
                PennEngine.controllers.list[c].elements.Var[this.id] = this;
            }
            resolve();
        }
    };

    this.test = {
        is: function(test){  /* $AC$ Var PElement.test.is(value) Checks the value of the Var element (can be a function, e.g. v=>v<10) $AC$ */
            if (test instanceof RegExp)
                return this.evaluate().match(test);
            else if (test instanceof Function)
                return test(this.evaluate());
            else
                return this.evaluate() == test;
        }
    };

});

window.PennController._AddStandardCommands(function(PennEngine){
    this.actions = {
        setVar: function(resolve, varRef){  /* $AC$ all PElements.setVar(var) Sets the value of the specified Var element with the current value of the element $AC$ */
            if (typeof(varRef)=="string") {
                if (!PennEngine.controllers.running.options.elements.hasOwnProperty("Var"))
                    return PennEngine.debug.error("No Var element named "+varRef+" found");
                let variable = PennEngine.controllers.running.options.elements.Var[varRef];
                variable.value = window.PennController.Elements["get"+this.type](this.id).value;
            }
            else
                PennEngine.debug.error("Invalid variable reference when trying to store "+this.id+"'s value", varRef);
            resolve();
        }
    };
});


})();