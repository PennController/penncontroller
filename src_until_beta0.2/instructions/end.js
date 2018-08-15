// Adds an instruction to end the trial prematurely
// Done immediately
class EndInstr extends Instruction {
    constructor() {
        super("end", "end");
    }
    run() {
        super.run();
        this.hasBeenRun = true;
        this.done = true;
        Ctrlr.running.end();
    }
}

PennController.instruction.end = function(){ return new EndInstr(); };