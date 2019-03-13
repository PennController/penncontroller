// TEXT element
window.PennController._AddElementType("Text", function(PennEngine) {

    this.immediate = function(id, text){
        if (text===undefined){
            text = id;
            this.id = PennEngine.utils.guidGenerator();
        }
        this.initialText = text;                                        // Keep track of this for reset
        this.text = text;
    };

    this.uponCreation = function(resolve){
        this.jQueryElement = $("<span>"+this.initialText+"</span>").css('display','inline-block');    // The jQuery element
        resolve();
    };

    this.value = function(){                                            // Value is text
        return this.text;
    };

    this.end = function(){
        if (this.log){
            if (!this.printTime)
                PennEngine.controllers.running.save(this.type, this.id, "Print", "NA", "Never", "NULL");
            else
                PennEngine.controllers.running.save(this.type, this.id, "Print", "NA", this.printTime, "NULL");
        }
    }

    this.settings = {
        text: function(resolve,  text){
            this.text = text;
            this.jQueryElement.html(text);
            resolve();
        }
    };
    
    this.test = {
        text: function(text){
            if (text instanceof RegExp)
                return this.text.match(text);
            else
                return text==this.text;
        }
    };

});