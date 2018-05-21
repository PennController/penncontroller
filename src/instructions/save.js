// Adds something to the list of what is to be saved
// Done immediately
class SaveInstr extends Instruction {
    constructor(parameters) {
        super(parameters, "save");
        if (parameters != Abort) {
            this.setElement($("<save>"));
            this.parameter = parameters[0];
            this.value = parameters[1];
            this.comment = parameters[2];
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================
    run() {
        if (super.run() == Abort)
            return Abort;
        Ctrlr.running.save(this.parameter, this.value, Date.now(), this.comment);
        this.done();
    }
}

PennController.instruction.save = function(){ return new SaveInstr(arguments); };