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

    // Taken from Form.js
    _saveForms() {
        var rlines = [];
        var dom = this.origin.element;

        var inps = $(dom).find("input[type=text]");
        var tas = $(dom).find("textarea");
        for (var i = 0; i < tas.length; ++i) { inps.push(tas[i]); }

        for (var i = 0; i < inps.length; ++i) {
            var inp = $(inps[i]);

            /*if (inp.hasClass("obligatory") && ((! inp.attr('value')) || inp.attr('value').match(/^\s*$/))) {
                alertOrAddError(inp.attr('name'), t.obligatoryErrorGenerator(inp.attr('name')));
                return;
            }

            if (t.validators[inp.attr('name')]) {
                var er = t.validators[inp.attr('name')](inp.attr('value'));
                if (typeof(er) == "string") {
                    alertOrAddError(inp.attr('name'), er);
                    return;
                }
            }*/

            Ctrlr.running.save(this.origin._id, csv_url_encode(inp.attr('value')), Date.now(), csv_url_encode(inp.attr('name')));
        }

        var checks = $(dom).find("input[type=checkbox]");
        for (var i = 0; i < checks.length; ++i) {
            var check = $(checks[i]);

            /*
            // Checkboxes with the 'obligatory' class must be checked.
            if (! check.attr('checked') && check.hasClass('obligatory')) {
                alertOrAddError(check.attr('name'), t.obligatoryCheckboxErrorGenerator(check.attr('name')));
                return;
            }*/

            Ctrlr.running.save(this.origin._id, check.attr('checked') ? "checked" : "unchecked", Date.now(), check.attr('name'));
        }

        var rads = $(dom).find("input[type=radio]");
        // Sort by name.
        var rgs = { };
        for (var i = 0; i < rads.length; ++i) {
            var rad = $(rads[i]);
            if (rad.attr('name')) {
                if (! rgs[rad.attr('name')])
                    rgs[rad.attr('name')] = [];
                rgs[rad.attr('name')].push(rad);
            }
        }
        for (var k in rgs) {
            // Check if it's oblig.
            var oblig = false;
            var oneIsSelected = false;
            var oneThatWasSelected;
            var val;
            for (var i = 0; i < rgs[k].length; ++i) {
                if (rgs[k][i].hasClass('obligatory')) oblig = true;
                if (rgs[k][i].attr('checked')) {
                    oneIsSelected = true;
                    oneThatWasSelected = i;
                    val = rgs[k][i].attr('value');
                }
            }
            /*
            if (oblig && (! oneIsSelected)) {
                alertOrAddError(rgs[k][0].attr('name'), t.obligatoryRadioErrorGenerator(rgs[k][0].attr('name')));
                return;
            }*/
            if (oneIsSelected) {
                Ctrlr.running.save(this.origin._id, rgs[k][oneThatWasSelected].attr('value'), Date.now(), rgs[k][0].attr('name'));
            }
        }
    }
}


HTMLInstr.prototype.settings = {
    log: function(){
        return this.newMeta(function(){
            let ti = this;
            Ctrlr.running.callbackBeforeFinish(function(){ ti.origin._saveForms(); });
            this.done();
        });
    }
}


HTMLInstr._setDefaultsName("html");

PennController.instruction.newHtml = function(id, file){ 
    return HTMLInstr._newDefault(new HTMLInstr(id, file));
};

PennController.instruction.getHtml = function(id){ return PennController.instruction(id); };