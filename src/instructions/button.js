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

    // Prints the input on the screen
    // Done immediately
    print() {
        return this.newMeta(function(){
            this.origin._addElement(this.origin.parentElement);
            this.done();
        });
    }

    // Wait for a keypress on 'enter'
    // Done when pressed enter
    wait() {
        return this.newMeta(function(){
            if (this.origin._clicked)
                this.done();
            else {
                let ti = this;
                this.origin._click = this.origin.extend("_click", function(){ ti.done(); });
            }
        });
    }
}

ButtonInstr.prototype.settings = {
    // Records what is typed
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