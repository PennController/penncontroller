// FUNCTION element
window.PennController._AddElementType("Function", function(PennEngine) {

    this.immediate = function(id, func){
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
        call: async function(resolve){
            await this.function.apply(PennEngine.controllers.running.internalVariables);
            resolve();
        }
    };

    this.test = {
        is: function(value){
            let returned = this.function.apply(PennEngine.controllers.running.internalVariables);
            if (value===undefined)
                return !returned;
            else
                return returned==value;
        }
    }

});