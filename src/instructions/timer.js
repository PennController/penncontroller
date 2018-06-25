// import {_setCtrlr} from "../controller.js";

// Adds a timer
// Done immediately
class TimerInstr extends Instruction {
    constructor(id, delay, callback) {
        super(id, delay, "timer");
        if (delay != Abort){
            this.delay = delay;
            this.setElement($("<timer>"));
            this.step = 10;
            this.callback = callback;
            this.cleared = false;
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        this.left = this.delay;
        let ti = this;
        /*this.timer = setInterval(function(){
            ti.left -= ti.step;
            if (ti.left <= 0){
                clearInterval(ti.timer);
                ti.left = 0;
                ti._elapsed();
            }
        }, this.step);*/
        //this.timer = setTimeout(function(){ ti._elapsed(); }, this.delay);
        //_setCtrlr("timers", Ctrlr.running.timers.concat([this.timer]));
        Ctrlr.running.timers.push(this.timer);
        this.done();
    }

    // Called when timer has elapsed
    _elapsed() {
        this.origin.cleared = true;
        if (this.origin.callback instanceof Function)
            this.origin.callback();
        else if (this.origin.callback instanceof Instruction) {
            this.origin.callback.parentElement = Ctrlr.running.element;
            this.origin.callback.run();
        }
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to start the timer
    // Done immediately
    start() {
        return this.newMeta(function(){
            let origin = this.origin;
            origin.timer = setTimeout(function(){ origin._elapsed(); }, origin.delay);
            this.done();
        });
    }

    // Returns an instruction that prematurely stops the timer
    // Done immediately
    stop(done) {
        let ti = this, instr = this.newMeta(function() { ti.done });
        instr.run = function(){ 
            clearInterval(ti.origin.timer);
            // If DONE is true, the (origin) timer instruction is considered done upon stopping
            if (done)
                ti.origin.done();
        }
        return instr;
    }

    // Returns an instruction to sait until the timer has elapsed
    // Done when the timer has elapsed
    wait(what) {
        return this.newMeta(function(){
            let ti = this;
            if (what=="first" && this.origin.cleared)
                this.done();
            else if (what instanceof Instruction) {
                // Test instructions have 'success'
                if (what.hasOwnProperty("success")) {
                    // Done only when success
                    what.success = what.extend("success", function(arg){ if (!(arg instanceof Instruction)) ti.done(); });
                    // Test 'what' whenever press on enter until done
                    ti.origin._elapsed = ti.origin.extend("_elapsed", function(){
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
            // If no test instruction was passed, listen for next 'clicked'
            else
                this.origin._elapsed = this.origin.extend("_elapsed", function(){ ti.done(); });
        });
    }
}

TimerInstr.prototype.settings = {
    callback: function(instructionOrFunction){
        return this.newMeta(function(){
            let timerCleared = function(){
                if (instructionOrFunction instanceof Function)
                    callback();
                else if (instructionOrFunction instanceof Instruction && !instructionOrFunction.hasBeenRun)
                    instructionOrFunction.run();
            };
            if (this.origin.cleared)
                timerCleared();
            else
                this.origin._elapsed = this.origin.extend("_elapsed", timerCleared);
        });
    }
    ,
    // Returns an instruction to set the timer's step
    step: function(value) {
        return this.newMeta(function(){ 
            // (Re)set the step
            this.origin.step = value;
            this.done(); 
        });
    }
}

TimerInstr._setDefaultsName("timer");

PennController.instruction.newTimer = function(id, delay, callback){ 
    return TimerInstr._newDefault(new TimerInstr(id, delay, callback));
};

PennController.instruction.getTimer = function(id){ return PennController.instruction(id); };