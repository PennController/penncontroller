// Adds a radio scale to the parent element
// Done immediately
class RadioInstr extends Instruction {
    constructor(id, lengthOrLabels) {
        super(id, lengthOrLabels, "radio");
        if (lengthOrLabels != Abort) {
            this.labels = [];
            if (!lengthOrLabels.length){
                console.log("Error: no length nor label provided for scale");
                return Abort;
            }
            // If length provided, add numbers as labels
            else if (lengthOrLabels.length==1 && typeof(lengthOrLabels[0])=="number"){
                this._type = "radio";
                for (let i = 0; i < lengthOrLabels[0]; i++)
                    this.labels.push(i);
            }
            // Otherwise, use labels provided
            else {
                this._type = "button";
                for (let i = 0; i < lengthOrLabels.length; i++)
                    this.labels.push(lengthOrLabels[i]); 
            }
            this.length = this.labels.length;
            // Sequence of values to be recorded
            this.values = [];
            // Sequence of times to be recorded
            this.times = [];
            this.setElement($("<table>"));
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
    // ACTIONS
    // ========================================

    // Prints the scale on the screen
    // Done immediately
    print() {
        return this.newMeta(function(){
            // Recreating the scale whenever it is (re)printed
            let ti = this.origin;
            ti.element.find("input").remove();
            ti.element.find("tr").remove();
            let tr = $("<tr>");
            let trLabels = $("<tr>");
            for (let i = 0; i < ti.length; i++) {
                let label = ti.labels[i];
                var value = label;
                if (ti._type=="radio")
                    value = i;
                let input = $("<input>").attr({name: ti._id, value: value, type: ti._type});
                input.click(function(){
                    ti._clicked($(this).attr("value"));
                });
                tr.append($("<td>").append(input));
                trLabels.append($("<td>").html(label));
            }
            if (this.origin._left){
                if (this.origin._left instanceof Instruction) {
                    let td = $("<td>");
                    tr.prepend(td);
                    trLabels.prepend($("<td>"));
                    this.origin._left.origin.parentElement = td;
                    if (!this.origin._left.hasBeenRun)
                        this.origin._left.run();
                    this.origin._left.origin.print().run();
                }
                else if (this.origin._left instanceof jQuery){
                    tr.prepend($("<td>").append(this.origin._left));
                    trLabels.prepend($("<td>"));
                }
            }
            if (this.origin._right){
                if (this.origin._right instanceof Instruction) {
                    let td = $("<td>");
                    tr.append(td);
                    trLabels.append($("<td>"));
                    this.origin._right.origin.parentElement = td;
                    if (!this.origin._right.hasBeenRun)
                        this.origin._right.run();
                    this.origin._right.origin.print().run();
                }
                else if (this.origin._right instanceof jQuery){
                    tr.append($("<td>").html(this.origin._right));
                    trLabels.append($("<td>"));
                }
            }
            this.origin.element.append(tr);
            if (this.origin._labelsPosition){
                if (this.origin._labelsPosition=="bottom")
                    this.origin.element.append(trLabels);
                else
                    this.origin.element.prepend(trLabels);
            }
            // Temporarily remove _left and _right to prevent _addElement from re-adding them
            let l = this.origin._left;
            let r = this.origin._righ;
            this.origin._left = undefined;
            this.origin._right = undefined;
            this.origin._addElement(this.origin.parentElement);
            this.origin._left = l;
            this.origin._right = r;
            if (this.origin._setAlignment)
                this.origin.element.parent().css("text-align", this.origin._setAlignment);
            this.done();
        });
    }

    // Returns an instruction to wait for a click
    // Done when clicked
    wait(what) {
        return this.newMeta(function(){ 
            let ti = this;
            // If only first selection
            if (what == "first" && ti.origin.values.length)
                this.done();
            else if (what instanceof Instruction) {
                // Test instructions have 'success'
                if (what.hasOwnProperty("success")) {
                    // Done only when success
                    what.success = what.extend("success", function(arg){ if (!(arg instanceof Instruction)) ti.done(); });
                    // Test 'what' whenever press on enter until done
                    ti.origin._clicked = ti.origin.extend("_clicked", function(){
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
                this.origin._clicked = this.origin.extend("_clicked", function(){ ti.done(); });
        });
    }
}

RadioInstr.prototype.settings = {
    // Returns an instruction to save the parameters
    log: function (parameters, comment) {
        let o = this.origin;
        return this.newMeta(function(){ 
            // Tell controller to save value(s) before calling finishedCallback
            Ctrlr.running.callbackBeforeFinish(function(){
                // If the value to be saved in only the final value (default)
                if (typeof(parameters) != "string" || parameters == "last")
                    // Store a function to save the value at the end of the trial
                    Ctrlr.running.save(o._id, o.values[o.values.length-1], o.times[o.times.length-1], comment);
                else {
                    // If only saving first selected value, call Ctrlr.running.SAVE on first click
                    if (parameters == "first" && o.values.length == 1)
                        Ctrlr.running.save(o._id, o.values[0], o.times[0], comment);
                    // If all values are to be saved, call Ctrlr.running.SAVE on every click
                    else if (parameters == "all") {
                        for (let n in o.values)
                            Ctrlr.running.save(o._id, o.values[n], o.times[n], comment);
                    }
                }
            });
            this.done();
        });
    }
    ,
    // Returns an instruction to disable the inputs once selection has happened
    once: function(){
        let o = this.origin;
        return this.newMeta(function(){
            if (o.values.length)
                o.element.find("input").attr("disabled",true);
            else 
                o._clicked = o.extend("_clicked", function(){ o.element.find("input").attr("disabled",true); });
            this.done();
        });
    }
    ,
    // Returns an instruction to set the type to 'radio' (effect upon print)
    radio: function(){
        let o = this.origin;
        return this.newMeta(function(){
            o._type = "radio";
            this.done();
        });
    }
    ,
    // Returns an instruction to set the type to 'button' (effect upon print)
    button: function(){
        let o = this.origin;
        return this.newMeta(function(){
            o._type = "button";
            this.done();
        });
    }
    ,
    // Returns an instruction to print labels
    labels: function(position){
        let o = this.origin;
        return this.newMeta(function(){
            o._labelsPosition = position;
            this.done();
        });
    }
}

RadioInstr.prototype.test = {
    // Returns a function giving selected value/TRUE/TRUE value iff existent/= VALUES/among VALUES
    selected: function (values) {
        let o = this.origin;
        let istr = this.newMeta(function(){
            let lastvalue = o.values[o.values.length-1];
            if (typeof(values) == "undefined"){
                if (o.values.length)
                    return this.success();
                else
                    return this.failure();
            }
            else if (typeof(values) == "number" || typeof(values) == "string"){
                if (lastvalue == values)
                    return this.success();
                else    
                    return this.failure();
            }
            else if (values instanceof Array){
                if (values.indexOf(lastvalue) >= 0 || values.indexOf(parseInt(lastvalue)) >= 0)
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

RadioInstr._setDefaultsName("scale");

PennController.instruction.newScale = function(id, ...lengthOrLabels){ 
    return RadioInstr._newDefault(new RadioInstr(id, lengthOrLabels));
};

PennController.instruction.getScale = function(id){ return PennController.instruction(id); };