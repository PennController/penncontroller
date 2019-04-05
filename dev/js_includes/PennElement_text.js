// TEXT element
/* $AC$ PennController.newText(name,text) Creates a new Text element $AC$ */
/* $AC$ PennController.getText(name) Retrieves an existing Text element $AC$ */
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
        text: function(resolve,  text){ /* $AC$ Text PElement.settings.text(text) Redefines the text of the element $AC$ */
            this.text = text;
            this.jQueryElement.html(text);
            resolve();
        }
    };
    
    this.test = {
        text: function(text){ /* $AC$ Text PElement.test.text(value) Checks that the text of the element corresponds to the specified value $AC$ */
            if (text instanceof RegExp)
                return this.text.match(text);
            else
                return text==this.text;
        }
    };

});