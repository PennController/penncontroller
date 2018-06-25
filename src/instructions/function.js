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
        this.done();
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to execute the function
    // Done immediately
    call() {
        return this.newMeta(function(){
            this.origin.func.apply(Ctrlr.running.variables);
            this.done();
        });
    }

}

FunctionInstr.prototype.test = {
    is: function(value){
        let o = this.origin;
        let istr = this.newMeta(function(){
            let returnValue = o.func.apply(Ctrlr.running.variables);
            // If a value was passed
            if (value) {
                // Special case: regexp
                if (value instanceof RegExp){
                    if (typeof(returnValue)=="string" && returnValue.match(RegExp))
                        this.success();
                    else
                        this.failure();
                }
                else if (value == returnValue)
                    this.success()
                else
                    this.failure()
            }
            // If no value was passed, failure if function returns something other than 0/null/undefined/false
            else if (returnValue)
                this.failure();
            else
                this.success();
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
}

FunctionInstr._setDefaultsName("function");

PennController.instruction.newFunction = function(id, func){ 
    return FunctionInstr._newDefault(new FunctionInstr(id, func));
};

PennController.instruction.getFunction = function(id){ return PennController.instruction(id); };