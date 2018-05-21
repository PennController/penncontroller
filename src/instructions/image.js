import {_autoPreloadImages} from "../preload/preload.js";

// Adds an IMG to the parent element
// Done immediately
class ImageInstr extends Instruction {
    constructor(image, width, height) {
        super(image, "image");
        if (image != Abort) {
            let div = $("<div>").css("display", "inline-block");
            if (typeof(width) == "number" && typeof(height) == "number")
                div.css({width: width, height: height});
            // A span to which the image will be appended upon running
            this.setElement(div);
            // This gets its value in _setResource
            this.image = null;
            // Calling addToPreload immediately if settings say so 
            if (_autoPreloadImages)
                this.origin._addToPreload();
            this.origin.fetchResource(image, "image");
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        //this.element.append(this.image);
        this._addElement(this.parentElement);
        this.done();
    }

    _setResource(image) {
        if (this.origin.image)
            return Abort;
        if (super._setResource(image)==Abort)
            return Abort;
        this.origin.image = image.clone();
        this.origin.element.append(this.origin.image);
        this.origin.image.css({width: "100%", height: "100%", display: "inherit"});
    }


    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to move the image to X,Y
    // Done immediately
    move(x,y) {
        return this.newMeta(function(){
            this.origin.element.css({left: x, top: y, position: 'absolute'});
            this.done();
        });
    }

    // Returns an instruction that the image should be preloaded
    // Done immediately
    preload() {
        this.origin._addToPreload();
        return this.newMeta(function(){ this.done(); });
    }
}

PennController.instruction.image = function(image, width, height){ return new ImageInstr(image, width, height); };