import {_globalPreload, _instructionsToPreload, _timeoutPreload, _waitWhilePreloadingMessage, _checkPreload} from "./preload/preload.js";

// All the image and audio files
var _preloadedFiles = {};

define_ibex_controller({
    name: "PennController",
    jqueryWidget: {    
        _init: function () {
            
            var _t = this;

            _t.cssPrefix = _t.options._cssPrefix;
            _t.utils = _t.options._utils;
            _t.finishedCallback = _t.options._finishedCallback;

            //  =======================================
            //      EXCEPTIONAL CASE: CUSTOM CONTROLLER
            //  =======================================
            if (_t.options.hasOwnProperty("custom") && _t.options.custom instanceof Function)
                return _t.options.custom(_t);

            // Filtering out non-instructions
            _t.instructions = [];
            for (let i in _t.options.instructions) {
                if (_t.options.instructions[i] instanceof Instruction)
                    _t.instructions.push(_t.options.instructions[i]);
            }
            
            _t.id = _t.options.id;

            _t.toSave = [];
            _t.toRunBeforeFinish = [];

            _t.timers = [];

            //  =======================================
            //      INTERNAL FUNCTIONS
            //  =======================================

            // Adds a parameter/line to the list of things to save
            _t.save = function(parameter, value, time, comment){
                _t.toSave.push([
                        ["Parameter", parameter],
                        ["Value", value],
                        ["Time", time],
                        ["Comment", comment ? comment : "NULL"]
                    ]);
            };

            // Adds a function to be executed before finishedCallBack
            _t.callbackBeforeFinish = function(func) {
                _t.toRunBeforeFinish.push(func);
            };

            // Called when controller ends
            // Runs finishedCallback
            _t.end = function() {
                for (let f in _t.toRunBeforeFinish){
                    _t.toRunBeforeFinish[f]();
                }
                // Re-appending preloaded resources to the HTML node
                for (let f in _preloadedFiles) {
                    if (!_preloadedFiles[f].parent().is("html")) {
                        _preloadedFiles[f].css("display","none");
                        _preloadedFiles[f].appendTo($("html"));
                    }
                }
                // Hide all iframes
                $("iframe").css("display","none");
                // Stop playing all audios
                $("audio").each(function(){ 
                    this.pause();
                    this.currentTime = 0;
                });
                // End all timers
                for (let t in this.timers) {
                    clearInterval(this.timers[t]);
                    clearTimeout(this.timers[t]);
                }
                // Save time
                _t.save("Page", "End", Date.now(), "NULL");
                // Next trial
                _t.finishedCallback(_t.toSave);
            };

            // #########################
            // PRELOADING PART 1
            //
            // Adds an instruction that must be preloaded before the sequence starts
            _t.addToPreload = function(instruction) {
                // Add the resource if defined and only if not already preloaded
                if (instruction && _instructionsToPreload.indexOf(instruction)>=0) {
                    if (!_t.toPreload)
                        _t.toPreload = [];
                    // Add the resource only if not already listed (several instructions may share the same origin)
                    if (_t.toPreload.indexOf(instruction) < 0) {
                        _t.toPreload.push(instruction);
                        // Extend _setResource (called after preloading)
                        instruction._setResource = instruction.extend("_setResource", function(){
                            // Remove the entry (set index here, as it may have changed by the time callback is called)
                            let index = _t.toPreload.indexOf(instruction);
                            if (index >= 0)
                                _t.toPreload.splice(index, 1);
                            // If no more file to preload, run
                            if (_t.toPreload.length <= 0) {
                                $("#waitWhilePreloading").remove();
                                _t.save("Preload", "Complete", Date.now(), "NULL");
                                if (!_t.instructions[0].hasBeenRun)
                                    _t.instructions[0].run();
                            }
                        });
                    }
                }
            }
            // Check if the instruction requires a preloaded resource
            if (!_globalPreload && Ctrlr.list[this.id].hasOwnProperty("preloadingInstructions")) {
                // Go through each resource that next's origin has to preload
                for (let i in Ctrlr.list[this.id].preloadingInstructions)
                    // Add resource
                    _t.addToPreload(Ctrlr.list[this.id].preloadingInstructions[i]);
            }
            // 
            // END OF PRELOADING PART 1
            // #########################


            // Make it so that each instruction runs next one
            let previous;
            for (let i in _t.instructions) {
                let next = _t.instructions[i];
                // If not an instruction, continue
                if (!(next instanceof Instruction))
                    continue;
                // Give a parent element
                next.parentElement = _t.element;
                // Run next instruction when previous is done
                if (previous instanceof Instruction) {
                    previous.done = previous.extend("done", function(){ next.run(); });
                    // Inform of previous instruction
                    next.previousInstruction = previous;
                }
                previous = next;
            }
            // Now previous is the last instruction
            previous.done = previous.extend("done", function(){ _t.end(); });

            // Record running of first instruction
            _t.instructions[0].run = _t.instructions[0].extend("run", function(){ 
                _t.save("Page", "RunFirstInstruction", Date.now(), "NULL");
            });

            // Create local variables (see FuncInstr)
            _t.variables = {};

            // Inform that the current controller is this one
            //_setCtrlr(_t);
            Ctrlr.running = _t;

            // #########################
            // PRELOADING PART 2
            //
            // If ALL resources should be preloaded at once (and if there are resources to preload to start with)
            if (_globalPreload && _instructionsToPreload.length) {
                // Add each of them
                for (let i in _instructionsToPreload)
                    _t.addToPreload(i);
            }
            // If anything to preload
            if (_t.toPreload) {
                // Save preloading time
                _t.save("Preload", "Start", Date.now(), "NULL");
                // Add a preloading message
                _t.element.append($("<div id='waitWhilePreloading'>").html(_waitWhilePreloadingMessage));
                // Adding a timeout in case preloading fails
                setTimeout(function(){
                    // Abort if first instruction has been run in the meantime (e.g. preloading's done)
                    if (_t.instructions[0].hasBeenRun)
                        return Abort;
                    $("#waitWhilePreloading").remove();
                    _t.save("Preload", "Timeout", Date.now(), "NULL");
                    if (!_t.instructions[0].hasBeenRun)
                        _t.instructions[0].run();
                }, _timeoutPreload);
            }
            //
            // END OF PRELOADING PART 2
            // #########################
            // Else, run the first instruction already!
            else
                _t.instructions[0].run();

            // Save time of creation
            _t.save("Page", "Creation", Date.now(), "NULL");

        }
    },

    properties: {
        obligatory: [],
        countsForProgressBar: true,
        htmlDescription: null
    }
});


// Get any change to the running order (stocked in controller.js)
import { getChangeRunningOrder } from "./controller.js";

// Apply any change to the running order
window.modifyRunningOrder = function (ro) {
    let functionsRunningOrder = getChangeRunningOrder();
    for (let i = 0; i < functionsRunningOrder.length; i++)
        ro = functionsRunningOrder[i](ro);
    return ro;
}