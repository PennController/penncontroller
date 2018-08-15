// IMAGE element
PennController._AddElementType("Image", function(PennEngine) {

    this.immediate = function(id, file){
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

    this.value = function(){                    // Value is whether it's displayed
        return this.jQueryElement.parent().length;
    };

});