// CANVAS element
PennController._AddElementType("Canvas", function(PennEngine) {

    this.immediate = function(id, width, height){
        this.width = width;
        this.height = height;
    };

    this.uponCreation = function(resolve){
        this.jQueryElement = $("<div>").css({
            width: this.width, height: this.height,
            overflow: "visible", position: "relative", display: "inline-block"
        });
        this.elementCommands = [];
        this.showElement = (elementCommand, x, y, z)=>new Promise(resolve=>{
                let afterPrint = ()=>{
                    let element = elementCommand._element;
                    let jQueryElement = element.jQueryElement;
                    if (element.jQueryContainer){
                        element.jQueryContainer.css({position: "absolute", left: x, top: y});
                        if (Number(z)>0||Number(z)>0)
                            element.jQueryContainer.css("z-index", z);    // Only if number (i.e. not NaN)
                    }
                    else{
                        jQueryElement.css({position: "absolute", left: x, top: y});
                        if (Number(z)>0||Number(z)>0)
                            jQueryElement.css("z-index", z);    // Only if number (i.e. not NaN)
                    }
                    resolve();
                }
                elementCommand.print( this.jQueryElement )._runPromises().then(afterPrint);
            });
        resolve();
    };

    this.value = function(){                                    // Value is how many elements it contains
        return this.elementCommands.length;
    };
    
    this.actions = {
        print: async function(resolve, where){
            for (let e in this.elementCommands)
                await this.showElement(...this.elementCommands[e]);
            PennEngine.elements.standardCommands.actions.print.apply(this, [resolve, where]);
        }
    };

    this.settings = {
        add: function(resolve, x, y, elementCommand, z){
            if (elementCommand.hasOwnProperty("_element") && elementCommand._element.jQueryElement instanceof jQuery){
                this.elementCommands.push([elementCommand, x, y, z]);
                if (this.jQueryElement.parent().length)
                    this.showElement(elementCommand, x, y, z).then(resolve);
                else
                    resolve();
            }
            else{
                console.warn("Invalid element referenced to add to canvas");
                resolve();
            }
        }
    };

});