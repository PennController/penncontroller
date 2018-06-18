// Adds a SPAN to the parent element
// Done immediately
class TextInputInstr extends Instruction {
    constructor(id, text) {
        super(id, text, "text");
        if (text != Abort) {
            this.setElement($("<input>").attr({type: "text", name: id}).val(text));
            let ti = this;
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        //this._addElement(this.parentElement);
        let ti = this;
        Ctrlr.running.safeBind(this.origin.element, 'keydown', function (e) { 
            if (e.keyCode == 13)
                ti._pressedEnter();
        });
        this.done();
    }

    // Called when a keypress on Enter
    _pressedEnter() {
        this._entered = true;
        this._time = Date.now();
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Prints the input on the screen
    // Done immediately
    print() {
        return this.newMeta(function(){
            this.origin._addElement(this.origin.parentElement);
            this.origin.element.focus();
            this.done();
        });
    }

    // Wait for a keypress on 'enter'
    // Done when pressed enter
    wait() {
        return this.newMeta(function(){
            if (this.origin._entered)
                this.done();
            else {
                let ti = this;
                this.origin._pressedEnter = this.origin.extend("_pressedEnter", function(){ ti.done(); });
            }
        });
    }
}

TextInputInstr.prototype.settings = {
    // Records what is typed
    log: function (comment) {
        let o = this.origin;
        return this.newMeta(function(){ 
            // Tell controller to save value(s) before calling finishedCallback
            Ctrlr.running.callbackBeforeFinish(function(){
                Ctrlr.running.save(o._id, o.element.val(), o._time, comment);
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

TextInputInstr._setDefaultsName("textInput");

PennController.instruction.newTextInput = function(id, text){ 
    return TextInputInstr._newDefault(new TextInputInstr(id, text));
};

PennController.instruction.getTextInput = function(id){ return PennController.instruction(id); };