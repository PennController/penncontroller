// Adds a SPAN to the parent element
// Done immediately
class HTMLInstr extends Instruction {
    constructor(id, file) {
        super(id, file, "html");
        if (file != Abort) {
            this._file = file;
            this.setElement($("<div>").addClass("PennController-HTML"));
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        if (CHUNKS_DICT.hasOwnProperty(this._file))
            this.element.append(htmlCodeToDOM({include: this._file}));
        else
            this.element.append(htmlCodeToDOM(this._file));
        this.done();
    }
}


HTMLInstr._setDefaultsName("html");

PennController.instruction.newHtml = function(id, file){ 
    return HTMLInstr._newDefault(new HTMLInstr(id, file));
};

PennController.instruction.getHtml = function(id){ return PennController.instruction(id); };