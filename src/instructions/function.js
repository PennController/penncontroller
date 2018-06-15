// Executes a function
// Done immediately
class FunctionInstr extends Instruction {
    constructor(id, func) {
        super(id, func, "function");
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


FunctionInstr._setDefaultsName("func");

PennController.instruction.newFunction = function(id, func){ 
    return FunctionInstr._newDefault(new FunctionInstr(id, func));
};

PennController.instruction.getFunction = function(id){ return PennController.instruction(id); };