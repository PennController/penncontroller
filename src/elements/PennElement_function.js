// FUNCTION element
/* $AC$ PennController.newFunction(name,function) Creates a new Function element $AC$ */
/* $AC$ PennController.getFunction(name) Retrieves an existing Function element $AC$ */
window.PennController._AddElementType("Function", function(PennEngine) {

    this.immediate = function(id, func){
        if (typeof id == "function"){
            func = id;
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Function";
            this.id = id;
        }
        this.function = func;
    };

    this.uponCreation = function(resolve){
        // void
        if (!PennEngine.controllers.running.hasOwnProperty("internalVariables"))
            PennEngine.controllers.running.internalVariables = {};
        resolve();
    };

    this.end = function(){
        PennEngine.controllers.running.internalVariables = undefined;
    };

    this.value = function(){                                    // Value is result of calling the function
        return this.function.apply(PennEngine.controllers.running.internalVariables);
    };

    this.actions = {
        call: async function(resolve){  /* $AC$ Function PElement.call() Executes the function $AC$ */
            await this.function.apply(PennEngine.controllers.running.internalVariables);
            resolve();
        }
    };

    this.test = {
        is: function(value){  /* $AC$ Function PElement.test.is(value) Checks that the function returns the specified value $AC$ */
            let returned = this.function.apply(PennEngine.controllers.running.internalVariables);
            if (value===undefined)
                return !returned;
            else
                return returned==value;
        }
    }

});