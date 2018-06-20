// Binds a keypress event to the document
// Done upon keypress
class KeyInstr extends Instruction {
    constructor(id, keys, caseSensitive) {
        super(id, keys, "key");
        if (keys != Abort) {
            this.setElement($("<key>"));
            this.keys = [];
            // Can pass a number (useful for special keys such as shift)
            if (typeof(keys) == "number")
                this.keys.push(keys);
            // Or a string of characters
            else if (typeof(keys) == "string") {
                for (let k in keys) {
                    // If case sensitive, add the exact charcode
                    if (caseSensitive)
                        this.keys.push(keys.charCodeAt(k));
                    // If not, add both lower- and upper-case charcodes
                    else {
                        let upperKeys = keys.toUpperCase(),
                            lowerKeys = keys.toLowerCase();
                        this.keys.push(lowerKeys.charCodeAt(k));
                        this.keys.push(upperKeys.charCodeAt(k));
                    }
                }
            }
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    // Adds key press event
    // Done immediately
    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this;
        Ctrlr.running.safeBind($(document),"keydown",function(e){
            if (ti.keys.length==0 || ti.keys.indexOf(e.keyCode)>=0)
                ti._pressed(e.keyCode);
        });
        this.done();
    }

    // Validate WHEN in origin's PRESSED
    _whenToInsist(tryToValidate) {
        this.origin._pressed = this.origin.extend("_pressed", tryToValidate);
    }

    // Called when the right (or any if unspecified) key is pressed
    _pressed(key) {
        if (this.origin.key)
            return;
        this.origin.key = String.fromCharCode(key);
        this.origin.time = Date.now();
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to save the key that was pressed
    // Done immediately
    log(comment) {
        return this.newMeta(function(){
            let ti = this;
            this._logging = true;
            Ctrlr.running.callbackBeforeFinish(function(){ 
                Ctrlr.running.save('keypress', ti.origin.key, ti.origin.time, comment);
            });
            this.done();
        });
    }

    // Returns an instruction to wait for the keypress before proceeding
    // Done when key is pressed
    wait(what) {
        return this.newMeta(function(){ 
            let ti = this;
            // If only first selection
            if (what == "first" && this.origin.key)
                this.done();
            else {
                if (what instanceof Instruction) {
                    var keyPressed = null, time = null;
                    // Test instructions have 'success'
                    if (what.hasOwnProperty("success")) {
                        // Done only when success
                        what.success = what.extend("success", function(arg){ 
                            if (!(arg instanceof Instruction)) {
                                ti.done();
                                // Probably also want to save key that was pressed on success
                                if (this._logging)
                                    Ctrlr.running.callbackBeforeFinish(function(){ 
                                        Ctrlr.running.save('keypress', keyPressed, time, "Success press");
                                    });
                            }
                        });
                        // Test 'what' whenever press on enter until done
                        ti.origin._pressed = ti.origin.extend("_pressed", function(key){
                            if (!ti.isDone) {
                                keyPressed = key;
                                time = Date.now();
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
                   this.origin._pressed = this.origin.extend("_pressed", function(){ ti.done(); });
            }     
        });
    }
}

KeyInstr.prototype.test = {
    pressed: function(keys) {
        let istr = this.newMeta(function(){
            let ti = this.origin;
            let key = ti.key;
            if (!key)
                return this.failure();
            else if (typeof(keys) == "string"){
                if (RegExp(key,'i').test(keys))
                    return this.success();
                else
                    return this.failure();
            }
            else if (typeof(keys) == "number") {
                if (keys == key.charCodeAt(0))
                    return this.success();
                else
                    return this.failure();
            }
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

KeyInstr._setDefaultsName("key");

PennController.instruction.newKey = function(id, keys){ 
    return KeyInstr._newDefault(new KeyInstr(id, keys));
};

PennController.instruction.getKey = function(id){ return PennController.instruction(id); };