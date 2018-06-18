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
    wait(what) {
        return this.newMeta(function(){
            // If only first enter should be tested
            if (what == "first" && this.origin._entered)
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
                        ti.origin._pressedEnter = ti.origin.extend("_pressedEnter", function(){
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
                    this.origin._pressedEnter = this.origin.extend("_pressedEnter", function(){ ti.done(); });
            }
        });
    }
}

TextInputInstr.prototype.test = {
    // Test wheter the text in the input matches test
    text: function (test) {
        let o = this.origin;
        let istr = this.newMeta(function(){
            // Test for a simple textual match
            if (typeof(test) == "string") {
                if (o.element.val() == test)
                    return this.success();
                else
                    return this.failure();
            }
            // Test for a RegExp match
            else if (test instanceof RegExp) {
                if (o.element.val().match(test))
                    return this.success();
                else
                    return this.failure();
            }
            else
                return this.failure();
        });
        // What happens if success
        istr.success = function(successInstruction){
            if (successInstruction instanceof Instruction){
                istr._then = successInstruction;
                successInstruction.done = successInstruction.extend("done", function(){ istr.done() });
            }
            else if (istr._then instanceof Instruction)
                istr._then.run();
            else
                istr.done();
            return istr;
        };
        // What happens if failure
        istr.failure = function(failureInstruction){
            if (failureInstruction instanceof Instruction){
                istr._fail = failureInstruction;
                failureInstruction.done = failureInstruction.extend("done", function(){ istr.done() });
            }
            else if (istr._fail instanceof Instruction)
                istr._fail.run();
            else
                istr.done();
            return istr;
        };
        return istr;
    }
};

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