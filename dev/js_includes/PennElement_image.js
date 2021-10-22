// IMAGE element
/* $AC$ PennController.newImage(name,file) Creates a new Image element $AC$ */
/* $AC$ PennController.getImage(name) Retrieves an existing Image element $AC$ */
window.PennController._AddElementType("Image", function(PennEngine) {

    this.immediate = function(id, file){
        if (typeof id == "string" && file===undefined)
            file = id;
        this.id = id;
        let addHostURLs = !file.match(/^http/i);
        this.resource = PennEngine.resources.new(file, function(uri, resolve){
            const object = new Image();          // Creation of the image element
            object.onload = ()=>resolve(object);       // Preloading is over when image is loaded
            object.src = uri;       // Now point to the image
        }, addHostURLs);
        // this.resource = PennEngine.resources.fetch(file, function(resolve){
        //     this.object = new Image();          // Creation of the image element
        //     this.object.onload = resolve;       // Preloading is over when image is loaded
        //     this.object.src = this.value;       // Now point to the image
        // }, addHostURLs);
    };

    this.uponCreation = function(resolve){
        this.image = this.resource.object;      // Image simply refers to the resource's object
        if (this.image)
            this.image.style = null;            // (Re)set any particular style applied to the resource's object
        this.jQueryElement = $(this.image);     // The jQuery element
        this.jQueryElement.removeClass();
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
