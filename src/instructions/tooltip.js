// To be implemented
class TooltipInstr extends Instruction {
    constructor(id, text){
        super(id, text);
    }
}

TooltipInstr._setDefaultsName("tooltip");

PennController.instruction.newTooltip = function(id, text){ 
    return TooltipInstr._newDefault(new TooltipInstr(id, text));
};

PennController.instruction.getTooltip = function(id){ return PennController.instruction(id); };