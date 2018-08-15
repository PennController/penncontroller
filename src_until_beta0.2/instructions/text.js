// Adds a SPAN to the parent element
// Done immediately
class TextInstr extends Instruction {
    constructor(id, text) {
        super(id, text, "text");
        if (text != Abort) {
            this.setElement($("<span>").html(text));
            let ti = this;
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        //this._addElement(this.parentElement);
        this.done();
    }
}

TextInstr.prototype.settings = {
    // Changes the content
    text: function (text) {
        return this.newMeta(function(){
            this.origin.content = text;
            this.origin.element.html(text);
            this.done();
        })
    }
}


TextInstr._setDefaultsName("text");

PennController.instruction.newText = function(id, text){ 
    return TextInstr._newDefault(new TextInstr(id, text));
};

PennController.instruction.getText = function(id){ return PennController.instruction(id); };