// Binds a keypress event to the document
// Done upon keypress
class KeyInstr extends Instruction {
    constructor(keys, caseSensitive) {
        super(keys, "key");
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
    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this;
        Ctrlr.running.safeBind($(document),"keydown",function(e){
            if (ti.keys.length==0 || ti.keys.indexOf(e.keyCode)>=0)
                ti._pressed(e.keyCode);
        });
    }

    // Validate WHEN in origin's PRESSED
    _whenToInsist(tryToValidate) {
        this.origin._pressed = this.origin.extend("_pressed", tryToValidate);
    }

    // Called when the right (or any if unspecified) key is pressed
    _pressed(key) {
        if (!this.isDone) {
            this.origin.key = String.fromCharCode(key);
            this.origin.time = Date.now();
            this.origin.done();
        }
    }

    // ========================================
    // CONDITIONAL FUNCTIONS
    // ========================================

    // Returns a function to true if the key pressed matches
    // false otherwise
    pressed(keys) {
        let ti = this.origin;
        return function(){
            let key = ti.key;
            if (!key)
                return false;
            else if (typeof(keys) == "string")
                return RegExp(key,'i').test(keys);
            else if (typeof(keys) == "number")
                return keys == key.charCodeAt(0);
            else
                return key.charCodeAt(0);
        };
    }


    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to save the key that was pressed
    // Done immediately
    record(comment) {
        return this.newMeta(function(){
            let ti = this;
            Ctrlr.running.callbackBeforeFinish(function(){ 
                Ctrlr.running.save('keypress', ti.origin.key, ti.origin.time, comment);
            });
            this.done();
        });
    }
}

PennController.instruction.key = function(keys){ return new KeyInstr(keys); };