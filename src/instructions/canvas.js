// Adds a Canvas where you can place multiple instructions
// Done immediately
class CanvasInstr extends Instruction {
    constructor(id, w, h) {
        super(id, {width: w, height: h}, "canvas");
        if (w != Abort) {
            if (typeof(w) != "number" || typeof(h) != "number" || w < 0 || h < 0)
                return Abort;
            let element = $("<div>").css({width: w, height: h, position: "relative"}).addClass("PennController-Canvas");
            this.setElement(element);
            this.objects = [];
        }
    }

    // ========================================
    // PRIVATE AND INSTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        for (let o in this.objects) {
            let object = this.objects[o],
                origin = object[0];
            if (!(origin instanceof Instruction)) {
                console.log("Warning: element #"+o+" of canvas is not a proper instruction; ignoring it.");
                continue;
            }
            // If instruction has not been run yet, run it
            if (!origin.hasBeenRun) {
                origin.done = origin.extend("done", function(){
                    origin.element.css({position: "absolute", left: object[1], top: object[2], "z-index": object[3]});
                });
                origin.run();
            }
        }
        //this._addElement(this.parentElement);
        this.done();
    }

    // Adds an object onto the canvas at (X,Y) on the Z-index level
    _addObject(instruction, x, y, z) {
        if (typeof(x) != "number" || typeof(y) != "number")
            return Abort;
        if (!(instruction instanceof Instruction))
            return Abort;
        let origin = instruction.origin;
        let alreadyIn = false;
        for (let o in this.origin.objects) {
            let object = this.origin.objects[o];
            // If instruction already contained, update the parameters
            if (object[0] == origin) {
                object[1] = x;
                object[2] = y;
                if (typeof(z) == "number")
                    object[3] = z;
                alreadyIn = true;
            }
        }
        // If instruction is newly added, just push OBJECTS
        if (!alreadyIn)
            this.origin.objects.push([origin, x, y, (typeof(z)=="number" ? z : this.origin.objects.length)]);
        // Redefined parentElement in any case
        origin.parentElement = this.origin.element;
        // If instruction has already been run and is already done, re-append its element
        if (instruction.hasBeenRun && instruction.isDone) {
            origin.element.appendTo(this.origin.element);
            origin.element.css({position: "absolute", left: x, top: y, "z-index": z});
        }
        // If instruction has not been run yet, but if CANVAS has been run: run instruction
        else if (this.origin.hasBeenRun) {
            origin.done = origin.extend("done", function(){
                origin.element.css({position: "absolute", left: x, top: y, "z-index": z});
            });
            instruction.run();
        }
    }


    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================


    // Returns an insturction to print the canvas
    // Done immediately
    print(which) {
        let s = super.print();
        return this.newMeta(function(){
            if (typeof(which)=="undefined"||which=="all") {
                for (let o in this.origin.objects) {
                    if (this.origin.objects[o][0] instanceof Instruction)
                        this.origin.objects[o][0].origin.print().run();
                }
            }
            s.run();
            this.done();
        });
    }
}

// SETTINGS instructions
CanvasInstr.prototype.settings = {
    // Returns an instruction to add/update an instruction on the canvas at (X,Y)
    add: function(x,y,instruction,z){
        return this.newMeta(function(){
            this.origin._addObject(instruction, x, y, z);
            this.done();
        });
    }
};


CanvasInstr._setDefaultsName("canvas");

PennController.instruction.newCanvas = function(id, width, height){ 
    return CanvasInstr._newDefault(new CanvasInstr(id, width, height));
};

PennController.instruction.getCanvas = function(id){ return PennController.instruction(id); };