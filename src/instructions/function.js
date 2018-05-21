// Executes a function
// Done immediately
class FunctionInstr extends Instruction {
    constructor(func) {
        super(func, "function");
        if (func != Abort) {
            this.setElement($("<function>"));
            this.func = func;
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================
    run() {
        if (super.run() == Abort)
            return Abort;
        this.func.apply(Ctrlr.running.variables);
        this.done();
    }
}

PennController.instruction.func = function(func){ return new FunctionInstr(func); };