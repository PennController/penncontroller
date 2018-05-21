// Groups instruction's elements in a 'select' form
// Done immediately (+WAIT method: upon selection)
class SelectorInstr extends Instruction {
    constructor(arg) {
        super(arg, "selector");
        if (arg != Abort) {
            this.instructions = arg;
            this.shuffledInstructions = arg;
            this.enabled = true;
            this.canClick = true;
            this.keyList = [];
            this.shuffledKeyList = [];
            this.selectedElement = null;
            this.selectedInstruction = null;
            this.callbackFunction = null;
            this.setElement($("<div>").addClass("PennController-Selector"));
            this.selections = [];
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this;
        // Go through each instruction
        for (let i in this.instructions) {
            let instruction = this.instructions[i];
            if (instruction instanceof Instruction) {
                // If instruction's origin has not been run, then selector creates it: should be its parent
                if (!instruction.origin.hasBeenRun)
                    instruction.origin.parentElement = this.element;
                // If instruction's not been run yet, run it
                if (!instruction.hasBeenRun)
                    instruction.run();
                // Bind clicks
                instruction.origin.element.bind("click", function(){
                    if (!ti.canClick)
                        return;
                    // SELECT is a method that returns an instruction
                    ti._select(instruction);
                });
            }
            else {
                console.log("Warning: selector's entry #"+i+" is not a proper instruction.");
            }
        }
        // Binding a keydown event
        Ctrlr.running.safeBind($(document), "keydown", function(e){
            // Triggering only if keys were specified
            if (!ti.keyList.length)
                return Abort;
            for (let k in ti.shuffledKeyList){
                if ((typeof(ti.shuffledKeyList[k])=="number" && ti.shuffledKeyList[k] == e.keyCode) ||
                    (ti.shuffledKeyList[k] instanceof Array && ti.shuffledKeyList[k].indexOf(e.keyCode)>=0))
                    ti._select(ti.shuffledInstructions[k]);
            }
        });
        // Add the div to the parent element
        _addElement(this.parentElement);
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
                else if (ti.instructions[i].origin.element != instruction.element)
                    ti.instructions[i].origin.element.removeClass("PennController-selected");
            }
            if (ti.callbackFunction instanceof Function)
                ti.callbackFunction(instruction);
        }
    }

    // ========================================
    // CONDITIONAL FUNCTIONS
    // ========================================

    // Returns a conditional function as whether a (specific) instrution is selected
    selected(instruction) {
        let o = this.origin, arg = arguments;
        return function(){
            // If more than one instruction
            if (arg.hasOwnProperty("1")) {
                for (let a in arg) {
                    if (arg[a] instanceof Instruction && arg[a].origin == o.selectedInstruction)
                        return true;
                }
                return false;
            }
            else if (instruction instanceof Instruction) {
                return (instruction.origin == o.selectedInstruction);
            }
            else
                return o.selectedInstruction;
        }
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


    // Returns an instruction that associates instructions with keys
    // Done immediately
    keys() {
        let keys = arguments;
        return this.newMeta(function(){
            if (keys.hasOwnProperty("0")) {
                if (typeof(keys[0]) == "string") {
                    let caseSensitive = keys.hasOwnProperty("1");
                    for (let i = 0; i < keys[0].length; i++){
                        if (this.origin.instructions.hasOwnProperty(i)){
                            if (caseSensitive)
                                this.origin.keyList.push(keys[0].charCodeAt(i));
                            else
                                this.origin.keyList.push([keys[0].toUpperCase().charCodeAt(i),
                                                            keys[0].toLowerCase().charCodeAt(i)]);
                        }
                    }
                }
                if (typeof(keys[0]) == "number") {
                    for (let k in keys) {
                        if (keys[k]<0)
                            console.log("Warning: invalid key code for selector instruction #"+k+", not attaching keys to it.");
                        else
                            this.origin.keyList.push(keys[k]);
                    }
                }
            }
            this.origin.shuffledKeyList = this.origin.keyList;
            this.done();
        });
    }

    // Returns an instruction to shuffle the presentation of the instructions
    // Done immediately
    // NOTE: if KEYS is called before, keys are shuffled, if called after, they are not
    shuffle(arg) {
        let ti = this.origin;
        return this.newMeta(function(){
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

    // Returns an instruction to disable the selector right after first selection
    // Done immediately
    once() {
        let ti = this.origin;
        ti._select = ti.extend("_select", function(){ ti.enabled = false; });
        return this.newMeta(function(){
            this.done();
        });
    }

    // Returns an instruction to enable/disable the selector
    // Done immediately
    enable(active) {
        if (typeof(active)=="undefined")
            active = true;
        return this.newMeta(function(){
            this.origin.enabled = active;
            this.done();
        });
    }

    // Returns an instruction to save the selection(s)
    // Done immediately
    record(parameters) {
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

    // Returns an instruction to wait for something to be selected
    // Done upon selection
    wait() {
        return this.newMeta(function(){ 
            let ti = this;
            if (this.origin.selected().call())
                this.done();
            else
                this.origin._select = this.origin.extend("_select", function(){ ti.done(); });
        });
    }
}

PennController.instruction.selector = function(){ return new SelectorInstr(arguments); };