// Adds a SPAN to the parent element
// Done immediately
class ButtonInstr extends Instruction {
    constructor(id, text) {
        super(id, text, "text");
        if (text != Abort) {
            this.setElement($("<input>").attr({type: "button", name: id}).val(text));
            this._time = [];
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this;
        this.element.click(function(){ ti._click(); });
        this.done();
    }

    // Called when a keypress on Enter
    _click() {
        this._clicked = true;
        this._time.push(Date.now());
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Wait for a keypress on 'enter'
    // Done when clicked
    wait(what) {
        return this.newMeta(function(){
            if (what == "first" && this.origin._clicked)
                this.done();
            else {
                let ti = this;
                // If Test instruction passed as argument
                if (what instanceof Instruction) {
                    // Test instructions have 'success'
                    if (what.hasOwnProperty("success")) {
                        // Done only when success
                        what.success = what.extend("success", function(arg){ if (!(arg instanceof Instruction)) ti.done(); });
                        // Test 'what' whenever press on enter until done
                        ti.origin._click = ti.origin.extend("_click", function(){
                            if (!ti.isDone) {
                                // Resets for re-running the test each time
                                what.hasBeenRun = false;
                                what.isDone = false;
                                what.run();
                            }
                        });
                    }
                    // If no 'success,' then invalid test
                    else {
                        console.log("ERROR: invalid test passed to 'wait'");
                        ti.done();
                    }
                }
                // If no test instruction was passed, listen for next 'enter'
                else
                    this.origin._click = this.origin.extend("_click", function(){ ti.done(); });
            }
        });
    }
}

ButtonInstr.prototype.settings = {
    // Records clicks
    log: function (comment) {
        let o = this.origin;
        return this.newMeta(function(){ 
            // Tell controller to save value(s) before calling finishedCallback
            Ctrlr.running.callbackBeforeFinish(function(){
                for (t = 0; t < o._time.length; t++)
                    Ctrlr.running.save(o._id, "click", o._time[t], comment);
            });
            this.done();
        });
    }
    ,
    // Sets the input to become disabled after a keypress on enter
    once: function(){
        return this.newMeta(function(){
            if (this.origin._entered)
                this.origin.element.attr("disabled", true);
            else {
                let ti = this;
                this.origin._pressedEnter = this.origin.extend("_pressedEnter", function(){
                    ti.origin.element.attr("disabled", true);
                });
            }
            this.done();
        });
    }
};

ButtonInstr._setDefaultsName("button");

PennController.instruction.newButton = function(id, text){ 
    return ButtonInstr._newDefault(new ButtonInstr(id, text));
};

PennController.instruction.getButton = function(id){ return PennController.instruction(id); };