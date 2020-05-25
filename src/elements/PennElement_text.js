// TEXT element
/* $AC$ PennController.newText(name,text) Creates a new Text element $AC$ */
/* $AC$ PennController.getText(name) Retrieves an existing Text element $AC$ */
window.PennController._AddElementType("Text", function(PennEngine) {

    this.immediate = function(id, text){
        if (text===undefined)
            text = id;
        this.id = id;
        text = text.replace(/(^\s|\s$)/,'&nbsp;');
        this.initialText = text; // Keep track of this for reset
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

    this.actions = {
        unfold: function(resolve, duration){ /* $AC$ Text PElement.unfold(duration) Unfolds the text in duration milliseconds $AC$ */
            let startUnfolding = ()=>{
                let d = Number(duration);
                if (d>0){
                    let start = Date.now();
                    this.jQueryElement.css("visibility", "visible");
                    let width = this.jQueryElement.width();
                    let wrap = $("<div>").css({
                        display: 'inline-block',
                        'overflow-x': 'hidden',
                        width: 0,
                        margin: 0,
                        padding: 0,
                        'white-space': 'nowrap'
                    });
                    wrap = this.jQueryElement.wrap(wrap).parent();
                    let previousWidth = 0;
                    let unfold = ()=>{                        
                        let proportion = (Date.now()-start) / d;
                        if (proportion>=1)
                            proportion = 1;
                        let newWidth = Math.round(width*proportion);
                        if (newWidth>previousWidth)
                            wrap.width(newWidth);
                        previousWidth = newWidth;
                        if (proportion<1)
                            window.requestAnimationFrame(unfold);
                    };
                    window.requestAnimationFrame(unfold);
                }
            };
            if (!(this.jQueryContainer instanceof jQuery && this.jQueryContainer.parent().length))
                PennEngine.elements.standardCommands.actions.print.call(this, startUnfolding);
            else
                startUnfolding();
            resolve();
        }
    }

    this.settings = {
        text: function(resolve,  text){ /* $AC$ Text PElement.text(text) Redefines the text of the element $AC$ */
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