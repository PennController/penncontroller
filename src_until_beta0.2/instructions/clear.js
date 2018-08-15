// Detaches any preceding DOM element
// Done immediately
class ClearInstr extends Instruction {
    constructor() {
        super("clear", "clear");
    }

    run() {
        super.run();
        this.hasBeenRun = true;
        $(".PennController-PennController div").detach();
        this.done();
    }
}

PennController.instruction.clear = function(){ return new ClearInstr(); };