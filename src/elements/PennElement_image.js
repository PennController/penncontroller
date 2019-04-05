// IMAGE element
/* $AC$ PennController.newImage(name,file) Creates a new Image element $AC$ */
/* $AC$ PennController.getImage(name) Retrieves an existing Image element $AC$ */
window.PennController._AddElementType("Image", function(PennEngine) {

    this.immediate = function(id, file){
        if (typeof id == "string" && file===undefined){
            this.id = PennEngine.utils.guidGenerator();
            file = id;
        }
        let addHostURLs = !file.match(/^http/i);
        this.resource = PennEngine.resources.fetch(file, function(resolve){
            this.object = new Image();          // Creation of the image element
            this.object.onload = resolve;       // Preloading is over when image is loaded
            this.object.src = this.value;       // Now point to the image
        }, addHostURLs);
    };

    this.uponCreation = function(resolve){
        this.image = this.resource.object;      // Image simply refers to the resource's object
        this.image.style = null;                // (Re)set any particular style applied to the resource's object
        this.jQueryElement = $(this.image);     // The jQuery element
        resolve();
    };

    this.end = function(){
        if (this.log){
            if (!this.printTime)
                PennEngine.controllers.running.save(this.type, this.id, "Print", "NA", "Never", "NULL");
            else
                PennEngine.controllers.running.save(this.type, this.id, "Print", "NA", this.printTime, "NULL");
        }
    }
    
    this.value = function(){                    // Value is whether it's displayed
        return this.jQueryElement.parent().length;
    };

});