// Adds a radio scale to the parent element
// Done immediately
class RadioInstr extends Instruction {
    constructor(id, label, length) {
        super(id, {label: label, length: length}, "radio");
        if (label != Abort) {
            this.label = label;
            this.length = length;
            this.values = [];
            this.times = [];
            this.setElement($("<span>"));
            for (let i = 0; i < length; i++) {
                let ti = this, input = $("<input type='radio'>").attr({name: label, value: i})
                input.click(function(){
                    ti._clicked($(this).attr("value"));
                });
                ti.element.append(input);
            }
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

    // Validate WHEN in origin's CLICKED
    _whenToInsist(tryToValidate) {
        this._clicked = this.extend("_clicked", tryToValidate);
    }

    // Called upon any click on an input
    _clicked(value) {
        this.values.push(value);
        this.times.push(Date.now());
    }

    
    // ========================================
    // METHODS RETURNING CONDITIONAL FUNCTIONS
    // ========================================

    // Returns a function giving selected value/TRUE/TRUE value iff existent/= VALUES/among VALUES
    selected(values) {
        let o = this.origin;
        return function(){
            let lastvalue = o.values[o.values.length-1];
            if (typeof(values) == "undefined")
                return lastvalue;
            else if (typeof(values) == "number" || typeof(values) == "string")
                return (lastvalue == values);
            else if (values instanceof Array)
                return (values.indexOf(lastvalue) >= 0 || values.indexOf(parseInt(lastvalue)) >= 0);
        };
    }


    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to wait for a click (on (a) specific value(s))
    // Done upon click meeting the specified conditions (if any)
    wait(values) {
        let instr = this.newMeta(), ti = this;
        this.origin._clicked = this.origin.extend("_clicked", function(value){
            if (typeof values == "number") {
                if (value == values)
                    instr.done();
            }
            else if (values instanceof Array) {
                if (values.indexOf(value) >= 0)
                    instr.done();
            }
            else
                instr.done();
        });
        return instr;
    }

    // Returns an instruction to save the parameters
    // Done immediately
    record(parameters, comment) {
        let o = this.origin;
        return this.newMeta(function(){ 
            // Tell controller to save value(s) before calling finishedCallback
            Ctrlr.running.callbackBeforeFinish(function(){
                // If the value to be saved in only the final value (default)
                if (typeof(parameters) != "string" || parameters == "last")
                    // Store a function to save the value at the end of the trial
                    Ctrlr.running.save(o.label, o.values[o.values.length-1], o.times[o.times.length-1], comment);
                else {
                    // If only saving first selected value, call Ctrlr.running.SAVE on first click
                    if (parameters == "first" && o.values.length == 1)
                        Ctrlr.running.save(o.label, o.values[0], o.times[0], comment);
                    // If all values are to be saved, call Ctrlr.running.SAVE on every click
                    else if (parameters == "all") {
                        for (let n in o.values)
                            Ctrlr.running.save(o.label, o.values[n], o.times[n], comment);
                    }
                }
            });
            this.done();
        });
    }
}


RadioInstr._setDefaultsName("scale");

PennController.instruction.newScale = function(id, label, length){ 
    return RadioInstr._newDefault(new RadioInstr(id, label, length));
};

PennController.instruction.getScale = function(id){ return PennController.instruction(id); };