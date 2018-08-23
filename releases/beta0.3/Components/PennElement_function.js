// FUNCTION element
PennController._AddElementType("Function", function(PennEngine) {

    this.immediate = function(id, func){
        this.function = func;
    };

    this.uponCreation = function(resolve){
        // void
        resolve();
    };

    this.value = function(){                                    // Value is result of calling the function
        return this.function.call();
    };

    this.actions = {
        call: async function(resolve){
            await this.function.apply(this, [PennEngine.controllers.running.element]);
            resolve();
        }
    };

    this.test = {
        is: function(value){
            let returned = this.function.call();
            if (value===undefined)
                return !returned;
            else
                return returned==value;
        }
    }

});