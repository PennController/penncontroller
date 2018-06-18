// Groups instruction's elements in a 'select' form
// Done immediately (+WAIT method: upon selection)
class SelectorInstr extends Instruction {
    constructor(id, instructions) {
        super(id, instructions, "selector");
        if (instructions != Abort) {
            this.instructions = [].concat(instructions);
            this.shuffledInstructions = [].concat(instructions);
            this.enabled = true;
            this.canClick = true;
            this.keyList = [];
            this.shuffledKeyList = [];
            this.selectedElement = null;
            this.selectedInstruction = null;
            this.callbackFunction = null;
            this.setElement($("<div>").addClass("PennController-Selector"));
            this.selections = [];
            this._frameCSS = "solid 2px green";
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this;
        // Binding a keydown event
        Ctrlr.running.safeBind($(document), "keydown", function(e){
            // Triggering only if keys were specified
            if (!ti.keyList.length)
                return Abort;
            for (let k in ti.shuffledKeyList){
                // shuffledKeyList is an array of arrays of keycodes (e.g. [[82,7086],[85,74,77]] for "RFV" vs "UJM")
                if (ti.shuffledKeyList[k].indexOf(e.keyCode)>=0)
                    ti._select(ti.shuffledInstructions[k]);
            }
        });
        // Add the div to the parent element
        //this._addElement(this.parentElement);
        // Done immediately
        this.done();
    }

    // Selects an instruction
    _select(instruction) {
        if (!this.enabled)
            return Abort;
        let ti = this.origin;
        // Select an instruction
        if (instruction instanceof Instruction) {
            ti.selectedElement = instruction.origin.element;
            ti.selectedInstruction = instruction.origin;
            // Add the 'selected' class to the element
            instruction.origin.element.addClass("PennController-selected");
            if (ti._frameCSS.match(/^.+ .+ .+$/))
                instruction.origin.element.css("outline", ti._frameCSS);
            // Go through the other instructions' elements and remove the class
            for (let i in ti.instructions) {
                // If this is the selected instruction, inform to be able to save later
                if (ti.instructions[i].origin == instruction.origin) {
                    // If the instruction has an ID, save it
                    if (instruction.origin._id)
                        ti.selections.push([instruction.origin._id, Date.now()]);
                    // Else, save its index in the list
                    else
                        ti.selections.push([i, Date.now()]);
                }
                // If not the selected instruction, make sure it's not tagged as selected
                else if (ti.instructions[i].origin.element != instruction.element){
                    ti.instructions[i].origin.element.removeClass("PennController-selected");
                    ti.instructions[i].origin.element.css("outline", "none");
                }
            }
            if (ti.callbackFunction instanceof Function)
                ti.callbackFunction(instruction);
        }
    }

    // Adds an instruction
    _addInstruction(instruction){
        if (instruction instanceof Instruction) {
            // If instruction's origin has not been run, then selector creates it: should be its parent
            if (!instruction.origin.hasBeenRun)
                instruction.origin.parentElement = this.origin.element;
            // If instruction's not been run yet, run it
            if (!instruction.hasBeenRun)
                instruction.run();
            // Bind clicks
            let origin = this.origin;
            instruction.origin.element.bind("click", function(){
                if (!origin.canClick)
                    return;
                // SELECT is a method that returns an instruction
                origin._select(instruction);
            });
            origin.instructions.push(instruction);
            origin.shuffledInstructions.push(instruction);
        }
        else
            console.log("Warning: tried to add a non-instruction or non-proper instruction to selector.", instruction);
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to select an instruction
    // Done immediately
    select(instruction) {
        return this.newMeta(function(){
            this.origin._select(instruction);
            this.done();
        });
    }

    // Returns an instruction that sets whether selector is clickable
    // Done immediately
    clickable(canClick) {
        return this.newMeta(function(){ 
            this.origin.canClick = canClick;
            this.done();
        });
    }

    // Returns an instruction to execute callback upon selection
    // Done immediately
    callback(instrOrFunc) {
        return this.newMeta(function(){
            this.origin._select = this.origin.extend("_select", function(){
                if (instrOrFunc instanceof Instruction)
                    instrOrFunc.run();
                else if (instrOrFunc instanceof Function)
                    instrOrFunc.apply(Ctrlr.running.variables, [this.origin.selectedInstruction]);
            });
            this.done();
        });
    }

    // Returns an instruction to wait for something to be selected
    // Done upon selection
    wait() {
        return this.newMeta(function(){ 
            let ti = this;
            if (this.origin.selectedInstruction)
                this.done();
            else
                this.origin._select = this.origin.extend("_select", function(){ ti.done(); });
        });
    }
}


// TEST 'instructions'
SelectorInstr.prototype.test = {
    // Tests whether a (specific) instrution is selected
    selected: function (instruction) {
        let o = this.origin, arg = arguments;
        let istr = this.newMeta(function(){
            // If test more than one selection
            if (arg.hasOwnProperty("1")) {
                // Go through the selection candidates
                for (let a in arg) {
                    // If on candidate is the selected instruction, success
                    if (arg[a] instanceof Instruction && arg[a].origin == o.selectedInstruction)
                        return this.success();
                }
                return this.failure();
            }
            // If test one selection only
            else if (instruction instanceof Instruction) {
                // If the selected instruction is the tested one, success
                if (instruction.origin == o.selectedInstruction)
                    return this.success();
                else
                    return this.failure();
            }
            // If no selection tested, just check whether selection happened
            else if (o.selectedInstruction)
                return this.success();
            else
                return this.failure();
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


// SETTINGS instructions
SelectorInstr.prototype.settings = {
    // Returns an instruction that associates instructions with keys
    keys: function (...rest) {
        let keys = rest;
        return this.newMeta(function(){
            if (keys.length) {
                // Going through the keys
                for (let k = 0; k < keys.length; ++k) {
                    // Do no specify more keys than instructions
                    if (k >= this.origin.instructions.length)
                        break;
                    let key = keys[k];
                    // If a string, can specify one or more keys per instruction (e.g. could be "F" or "RFV" as well)
                    if (typeof(key) == "string") {
                        let keyToAdd = [];
                        for (let i = 0; i < key.length; i++)
                            keyToAdd.push(key.charCodeAt(i));
                        // Add an array of the keycode(s)
                        this.origin.keyList.push(keyToAdd);
                    }
                    // If a number, simply add it (but no negative number)
                    else if (typeof(key) == "number") {
                        if (key<0)
                            console.log("Warning: invalid key code for selector instruction #"+k+", not attaching keys to it.");
                        else
                            this.origin.keyList.push([key]);
                    }
                }
            }
            this.origin.shuffledKeyList = this.origin.keyList;
            this.done();
        });
    }
    ,
    // Returns an instruction to shuffle the presentation of the instructions
    // NOTE: if KEYS is called before, keys are shuffled, if called after, they are not
    shuffle: function (arg) {
        return this.newMeta(function(){
            let ti = this.origin;
            let instructionIndices = [];
            // If no argument, just add every instruction's index
            if (typeof(arg)=="undefined") {
                for (let i in ti.instructions)
                    instructionIndices.push(i);
            }
            // Else, first feed instructionIndices
            else {
                // Go through each argument
                for (let i in arguments) {
                    let instruction = arguments[i];
                    // NUMBER: check there is an instruction at index
                    if (typeof(instruction)=="number" && 
                        ti.instructions.hasOwnProperty(instruction) &&
                        instructionIndices.indexOf(instruction)<0)
                            instructionIndices.push(instruction);
                    // INSTRUCTION: check that instruction is contained
                    else if (instruction instanceof Instruction) {
                        for (let i2 in this.origin.instructions) {
                            if (ti.instructions[i2].origin==instruction.origin && instructionIndices.indexOf(i2)<0)
                                instructionIndices.push(i2);
                        }
                    }
                }
            }
            let unshuffled = [].concat(instructionIndices);
            // Now, shuffle the indices
            fisherYates(instructionIndices);
            // Reset the lists
            ti.shuffledInstructions = $.extend({}, ti.instructions);
            ti.shuffledKeyList = [].concat(ti.keyList);
            // Go through each index now
            for (let i in instructionIndices) {
                let oldIndex = unshuffled[i],
                    newIndex = instructionIndices[i], 
                    origin = ti.instructions[newIndex].origin;
                ti.shuffledInstructions[oldIndex] = ti.instructions[newIndex];
                if (oldIndex < ti.keyList.length)
                    ti.shuffledKeyList[oldIndex] = ti.keyList[newIndex];
                // Add a SHUFFLE tag with the proper index before each instruction
                let shuf = $("<shuffle>").attr("id", oldIndex).css({
                    position: ti.instructions[newIndex].origin.element.css("position"),
                    left: ti.instructions[newIndex].origin.element.css("left"),
                    top: ti.instructions[newIndex].origin.element.css("top")
                });
                origin.element.before(shuf);
            } 
            // Go through each shuffle tag
            $("shuffle").each(function(){
                let index = $(this).attr('id');
                // Add the element of the INDEX-th instruction there
                $(this).after(ti.instructions[index].origin.element);
                // And update relevant CSS
                ti.instructions[index].origin.element.css({
                    position: $(this).css("position"),
                    left: $(this).css("left"),
                    top: $(this).css("top")
                });
            })
            // And now remove every SHUFFLE tag
            $("shuffle").remove();
            this.done();
        });
    }
    ,
    // Returns an instruction to disable the selector right after first selection
    once: function () {
        let ti = this.origin;
        ti._select = ti.extend("_select", function(){ ti.enabled = false; });
        return this.newMeta(function(){
            this.done();
        });
    }
    ,
    // Returns an instruction to enable/disable the selector
    enable: function (active) {
        if (typeof(active)=="undefined")
            active = true;
        return this.newMeta(function(){
            this.origin.enabled = active;
            this.done();
        });
    }
    ,
    // Returns an instruction to save the selection(s)
    record: function (parameters) {
        return this.newMeta(function(){
            let o = this.origin;
            Ctrlr.running.callbackBeforeFinish(function(){ 
                if (!o.selections.length)
                    return Abort;
                if (typeof(parameters) == "string") {
                    if (parameters == "first")
                        Ctrlr.running.save("selection", o.selections[0][0], o.selections[0][1], "NULL");
                    else if (parameters == "last")
                        Ctrlr.running.save("selection", o.selections[o.selections.length-1][0], o.selections[o.selections.length-1][1], "NULL");
                    else {
                        for (let s in o.selections)
                            Ctrlr.running.save("selection", o.selections[s][0], o.selections[s][1], "NULL");
                    }
                }
                else {
                    for (let s in o.selections)
                            Ctrlr.running.save("selection", o.selections[s][0], o.selections[s][1], "NULL");
                }
            });
            this.done();
        });
    }
    ,
    // Returns an instruction to add/update an instruction on the canvas at (X,Y)
    add: function(){
        let instructions = arguments;
        return this.newMeta(function(){    
            for (let i = 0; i < instructions.length; ++i) {
                let instruction = instructions[i];
                this.origin._addInstruction(instruction);
            }
            this.done();
        });
    }
    ,
    frame: function(css){
        return this.newMeta(function(){
            this.origin._frameCSS = css;
            this.done();
        });
    }
};



SelectorInstr._setDefaultsName("selector");

PennController.instruction.newSelector = function(id, ...rest){ 
    return SelectorInstr._newDefault(new SelectorInstr(id, rest));
};

PennController.instruction.getSelector = function(id){ return PennController.instruction(id); };