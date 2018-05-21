// To be implemented

// import {_setCtrlr} from "../controller.js";

// The elements being appended (needs global implementation?)
var _elementsToAppend = [];

class ScreenInstr extends Instruction {
    constructor(command) {
        super(command, "screen");
    }

    run() {
        if (command == "hold")
            _setCtrlr("hold", true);
        else if (command == "release") {
            _setCtrlr("hold", false);
            if (!_elementsToAppend.length)
                Ctrlr.running.release();
        }
    }
}

PennController.instruction.screen = function(command){ return new ScreenInstr(command); };