(function(){

var prefix = null;
let oldResPref = window.PennController.ResetPrefix;
window.PennController.ResetPrefix = function(prefixName) {
    oldResPref(prefixName);
    if (typeof(prefixName)=="string")           // Catch the new prefix
        prefix = window[prefixName];
    else
        prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
};

let getVarWasReset = false;
let resetGetVar = PennEngine =>{
    if (getVarWasReset) return;
    let oldGetVar = window.PennController.Elements.getVar;
    window.PennController.Elements.getVar = function(getVarID){
        let controller = PennEngine.controllers.underConstruction; // Controller under construction
        if (PennEngine.controllers.running)                     // Or running, if in running phase
            controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
        if (!(controller.elements.hasOwnProperty("Var") && controller.elements.Var.hasOwnProperty(getVarID))){
            let newVar = window.PennController.Elements.newVar(getVarID).settings.global();
            newVar._element.scope = "global";
            return newVar;
        }
        else
            return oldGetVar(getVarID);
    };
    if (prefix)                         // Update 'getVar' for the new prefix
        prefix.getVar = window.PennController.Elements.getVar;
}

let globalVars = {};

// VAR element
/* $AC$ PennController.newVar(name,value) Creates a new Var element $AC$ */
/* $AC$ PennController.getVar(name) Retrieves an existing Var element $AC$ */
window.PennController._AddElementType("Var", function(PennEngine) {

    this.immediate = function(id, value){
        resetGetVar(PennEngine);
        let controller = PennEngine.controllers.underConstruction; // Controller under construction
        if (PennEngine.controllers.running)                     // Or running, if in running phase
            controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
        if (controller.elements.hasOwnProperty("Var") && controller.elements.Var.hasOwnProperty(id)){
            let other = controller.elements.Var[id];
            if (other.scope == "global")
                delete controller.elements.Var[id];
        }
        this.scope = "local";
        this.initialValue = value;
        //this.value = value;
        this._value = value;
        this.getter = ()=>{
            if (this.scope=="local")
                return this._value;
            else
                return globalVars[this.id];
        };
        this.setter = v=>{
            if (this.scope=="local")
                this._value = v;
            else
                globalVars[this.id] = v;
        };
        Object.defineProperty(this, "value", { get: this.getter , set: this.setter });
        this.evaluate = ()=>{
            if (this.value && this.value.type === "Var")
                return this.value.evaluate();
            else
                return this.value;
        };
    };

    this.uponCreation = function(resolve){
        this.scope = "local";
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
                this.value = value.call(this, this.value);
            else
                this.value = value;
            if (this.values===undefined)
                this.values = [];
            this.values.push(["Set", this.value, Date.now(), "NULL"]);
            resolve();
        }
    };

    this.settings = {
        local: function(resolve){  /* $AC$ Var PElement.local() Ensures that the value of this Var element only affects the current trial $AC$ */
            this.scope = "local";
            resolve();
        },
        log: function(resolve, ...what){
            if (what.length)
                this.log = what;
            else
                this.log = ["final"];
            resolve();
        },
        global: function(resolve){  /* $AC$ Var PElement.global() Shares the value with all Var elements with the same name across trials $AC$ */
            if (!globalVars.hasOwnProperty(this.id))
                globalVars[this.id] = this.value;
            this.scope = "global";
            resolve();
        }
    };

    this.test = {
        is: function(test){  /* $AC$ Var PElement.test.is(value) Checks the value of the Var element (can be a function, e.g. v=>v<10) $AC$ */
            let v = this.evaluate();
            if (test && test.value)
                test = test.value;
            if (test && test._element)
                test = test._element
            if (v && v._element)
                v = v._element;
            if (test instanceof RegExp && typeof(v) == "text")
                return v.match(test);
            else if (test instanceof Function)
                return test(v);
            else
                return v == test;
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
                if (variable)
                    variable.value = window.PennController.Elements["get"+this.type](this).value;
                else if (globalVars[varRef])
                    globalVars[varRef].value =  window.PennController.Elements["get"+this.type](this).value;
                else
                    return PennEngine.debug.error("No Var element named "+varRef+" found");
            }
            else
                PennEngine.debug.error("Invalid variable reference when trying to store "+this.id+"'s value", varRef);
            resolve();
        }
    };
});


})();