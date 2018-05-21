// Adds a SPAN to the parent element
// Done immediately
class TextInstr extends Instruction {
    constructor(text) {
        super(text, "text");
        if (text != Abort) {
            this.setElement($("<span>").html(text));
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        this._addElement(this.parentElement);
        this.done();
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Changes the content
    // Done immediately
    text(text) {
        return this.newMeta(function(){
            this.origin.content = text;
            this.origin.element.html(text);
            this.done();
        })
    }
}

PennController.instruction.text = function(text){ return new TextInstr(text); };