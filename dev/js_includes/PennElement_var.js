(function(){

var prefix = null;
let oldResPref = PennController.ResetPrefix;
PennController.ResetPrefix = function(prefixName) {
    oldResPref(prefixName);
    if (typeof(prefix)=="string")           // Catch the new prefix
        prefix = window[prefixName];
    else
        prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
};

// VAR element
PennController._AddElementType("Var", function(PennEngine) {

    this.immediate = function(id, value){
        // Things are getting a little ugly: overriding 'getVar' to make 'newVar' optional when global reference
        let oldGetVar = PennController.Elements.getVar;
        let underConstruction = PennEngine.controllers.underConstruction;
        PennController.Elements.getVar = function(getVarID){
            let currentVar = PennEngine.controllers.underConstruction.elements[id];
            if (getVarID==id && !(currentVar && currentVar.type=="Var")){
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
            prefix.getVar = PennController.Elements.getVar;
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
        let running = PennEngine.controllers.running.options.elements[this.id];
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
        set: function(resolve, value){
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
        local: function(resolve){
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
        global: function(resolve){
            this.scope = "global";
            for (c in PennEngine.controllers.list){
                PennEngine.controllers.list[c].elements[this.id] = this;
            }
            resolve();
        }
    }

    this.test = {
        is: function(test){
            if (test instanceof RegExp)
                return this.evaluate().match(test);
            else if (test instanceof Function)
                return test(this.evaluate());
            else
                return this.evaluate() == test;
        }
    };

});

PennController._AddStandardCommands(function(PennEngine){
    this.actions = {
        setVar: function(resolve, varRef){
            if (typeof(varRef)=="string") {
                let variable = PennEngine.controllers.running.options.elements[varRef];
                if (variable.type && variable.type=="Var")
                    variable.value = PennController.Elements["get"+this.type](this.id).value;
                else
                    console.warn("Invalid variable reference when trying to store "+this.id+"'s value in PennController #"+PennEngine.controllers.running.id, varRef);
            }
            else
                console.warn("Invalid variable reference when trying to store "+this.id+"'s value in PennController #"+PennEngine.controllers.running.id, varRef);
            resolve();
        }
    };
});


})();