// Conditionally runs one or another instruction
// Done when executed instruction is done
class IfInstr extends Instruction {
    constructor(condition, success, failure) {
        super(arguments, "if");
        if (condition != Abort) {
            this.setElement($("<div>").addClass("PennController-Condition"));
            this.condition = condition;
            this.success = success;
            this.failure = failure;
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        if (!this.success instanceof Instruction)
            return Abort;
        if (!this.condition instanceof Function)
            return Abort;
        let ti = this;
        if (this.condition()) {
            //this.success.origin.parentElement = this.element;
            this.success.done = this.success.extend("done", function(){ ti.done(); });
            this.success.run();
        }
        else if (this.failure instanceof Instruction) {
            //this.failure.origin.parentElement = this.element;
            this.failure.done = this.failure.extend("done", function(){ ti.done(); });
            this.failure.run();
        }
        else {
            this.done();
        }
    }
}

PennController.instruction.if = function(condition, success, failure){ return new IfInstr(condition, success, failure); };