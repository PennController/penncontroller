// SCALE element
/* $AC$ PennController.newScale(name,numberOrValues) Creates a new Scale element $AC$ */
/* $AC$ PennController.getScale(name) Retrieves an existing Scale element $AC$ */
window.PennController._AddElementType("Scale", function(PennEngine) {

    // SCALE-SPECIFIC FUNCTIONS & METHODS
    //
    function disable(){                                             // Disable the scale
        this.jQueryElement.find("input").attr("disabled", true);
        this.jQueryElement.find("div,label").css("cursor", "");
        this.disabled = true;
    }

    function enable(){                                              // Enable the scale
        this.jQueryElement.find("input").removeAttr("disabled");
        this.jQueryElement.find("div").css("cursor", "pointer");
        this.disabled = false;
    }

    function selectIndex(index, simulate) {
        if (this.scaleType=="slider") this.jQueryElement.find("input[type=range]")[0].value = index;
        else this.jQueryElement.find(`input#${this.id}-${index}`).attr('checked',true).change();
        if (simulate){
            let value = this.buttons[index];
            if (value===undefined||value===null||value=="")
                value = index+1;
            this.choice(value);
        }
    }

    async function buildScale(){                                  // Feeds this.jQueryElement according to scale type
        let defaultValue = this.defaultValue;
        let orientation = this.orientation;
        let type = this.scaleType;
        this.jQueryElement.empty();
        if (type=="slider"){                                        // Slider scale: special case
            var slider = $("<input>").attr({
                type: "range",
                min: "0",
                max: String(this.buttons.length-1),
                value: String((this.buttons.length-1)/2),           // Middle value by default
                step: "1"
            });
            if (Number(defaultValue)>=0 && Number(defaultValue)<=(this.buttons.length-1)) // A valid default value was specified
                slider.attr("value", String(defaultValue));
            if (this.disabled) slider.attr("disabled", true);
            slider[0].oninput = ()=>{if (this.firstClick) return; this.firstClick = Date.now(); };
            slider[0].onchange = ()=>this.choice(slider[0].value);
            if (orientation=="vertical"){
                slider.attr('orient','vertical'); // Firefox
                slider.css({'writing-mode':'vertical-lr','-webkit-appearance':'slider-vertical'}); // IE/Edge & Chrome/Safari
            }
            slider.css({width:'100%',height:'100%'});
            this.jQueryElement.append(slider);
        }
        else{
            this.jQueryElement.css({display:'inline-flex','justify-content':'space-between'});
            for (let i = 0; i < this.buttons.length; i++) {
                let v = this.buttons[i];
                if (v===undefined||v===null||v=="") v = i+1;            // If the array's entry is void, use its index
                else if (v instanceof PennEngine.PennElementCommands) v = i+1;
                let label = $("<label>").attr({for:this.id+'-'+i}).html(v).css('cursor','pointer');
                let input = $("<input>").attr({name:this.id,value:v,type:(type=="checkbox"?"checkbox":"radio"),id:this.id+'-'+i});
                let option = $("<div>").addClass("option")
                    .css({cursor:'pointer',display:'flex','align-items':'center'})
                    .append( input ).append( label );
                if (v._runPromises) v.print( label.empty() )._runPromises();
                if (defaultValue==v||defaultValue==i) input.attr("checked",true);
                if (this.disabled) input.attr("disabled", true);
                input[0].onchange = ()=>{
                    this.choice(this.buttons[i]||v,/*unselect=*/type=="checkbox"&&!input[0].checked)
                    this.jQueryElement.find("label").css("outline","none");
                    if (type=="buttons") label.css("outline","dotted 1px black");
                };
                if (type=="buttons") input.css("display","none");
                if (this.labels=="top") option.css('flex-direction','column-reverse');
                else if (this.labels=="bottom") option.css('flex-direction','column');
                else if (this.labels=="left") option.css('flex-direction','row-reverse');
                this.jQueryElement.append(option);
                if (type=="radio"&&this.labels===false) label.css("display","none");
                else if (this.buttons[i] instanceof PennEngine.PennElementCommands)
                    await this.buttons[i].print( label.empty() )._runPromises();
            };
            if (orientation=="vertical") this.jQueryElement.css('flex-direction','column');
        }
        if (!this.width) this.jQueryElement.css("max-width","max-content");
    }
    //
    // END SCALE-SPECIFIC FUNCTIONS & METHODS
    

    this.immediate = function(id, ...buttons){
        if (!buttons.length){
            buttons = [id];
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Scale";
        }
        this.id = id;
        if (typeof(buttons[0])!="string" && Number(buttons[0])>0)
            this.initialButtons = new Array(Number(buttons[0])); // Number: array of void values/labels
        else
            this.initialButtons = buttons;                       // Array of values/labels
    };

    this.uponCreation = function(resolve){
        this.jQueryElement = $("<div>").css("display", "inline-block");
        this.choices = [];
        this.log = false;
        this.labels = false;                                        // No label upon creation (may become "top" or "bottom")
        this.disabled = false;
        this.vertical = false;
        this.scaleType = "radio";
        this.defaultValue = null;
        this.orientation = "horizontal";
        this.width = null;
        this.keys = [];
        this.buttons = this.initialButtons;
        this.choice = (value,unselect)=>{                           // (Re)set upon creation, since it can be modified during runtime
            if (this.disabled)
                return;                                             // Store the value + timestamp
            this.unselected = unselect||undefined;
            if (value && value._runPromises)
                value = value._element.id;
            let duration = null;
            if (this.scaleType=="slider"&&this.firstClick){
                duration = Date.now() - this.firstClick;
                this.firstClick = undefined;
            }
            this.choices.push([(unselect?"Unselect":"Choice"), value, Date.now(), duration||"NULL"]);
        };
        PennEngine.controllers.running.safeBind($(document), "keydown", (e)=>{
            if (this.disabled)
                return;
            for (let k = 0; k < this.keys.length; k++){
                if (String.fromCharCode(e.which) == this.keys[k])
                    return selectIndex.apply(this, [k, true]);
            }
        });
        resolve();
    };

    // This is executed at the end of a trial
    this.end = function(){
        const that = this;
        if (this.log && this.log instanceof Array){
            if (this.scaleType=="checkbox")
                this.jQueryElement.find("input[type=checkbox]").each(function(i){
                    PennEngine.controllers.running.save(that.type, that.id, that.buttons[i], (this.checked?"checked":"unchecked"), Date.now(), "Status");
                });
            if (!this.choices.length)
                PennEngine.controllers.running.save(this.type, this.id, "Choice", "NA", "Never", "No selection happened");
            else if (this.choices.length==1)
                PennEngine.controllers.running.save(this.type, this.id, ...this.choices[0]);
            else if (this.log.indexOf("all")>-1)
                for (let c in this.choices)                     // Save any choice if logging
                    PennEngine.controllers.running.save(this.type, this.id, ...this.choices[c]);
            else {
                if (this.log.indexOf("first")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.choices[0]);
                if (this.log.indexOf("last")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.choices[this.choices.length-1]);
            }
        }
    };

    this.value = function(){                                // Value is last choice
        if (this.choices.length && this.unselected === undefined)
            return this.choices[this.choices.length-1][1];
        else
            return NaN;
    };
    
    this.actions = {
        print: async function(resolve, ...where){
            await buildScale.apply(this);                         // (Re)Build the scale when printing
            PennEngine.elements.standardCommands.actions.print.apply(this, [resolve, ...where]);
        },
        select: function(resolve, option, simulate){    /* $AC$ Scale PElement.select(option) Selects the specified option on the scale $AC$ */
            for (var b  = 0; b < this.buttons.length; b++){
                let button = this.buttons[b];
                if (button && button == option)
                    break;
                if (button && button._element &&  button._element.id == option)
                    break;
                if (b == option)
                    break;
            }
            if (b>=this.buttons.length)
                return resolve(PennEngine.debug.error("Option "+option+" not found for selection on Scale "+this.id));
            selectIndex.apply(this, [b, simulate]);
            resolve();
        },
        unselect: function(resolve){
            if (this.scaleType=="slider"){
                let slider = this.jQueryElement.find("input[type=range]")[0];
                slider.value = (slider.max - slider.min) / 2;
            }
            else this.jQueryElement.find("input").removeAttr("checked").change();
            this.unselected = true;
            resolve();
        },
        wait: function(resolve, test){    /* $AC$ Scale PElement.wait() Waits until a selection happens before proceeding $AC$ */
            if (test == "first" && this.choices.length)     // If first and already chosen, resolve already
                resolve();
            else {                                          // Else, extend choice and do the checks
                let resolved = false;
                let oldChoice = this.choice;
                this.choice = value=>{
                    oldChoice.apply(this, [value]);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;    // Disable temporarilly
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled=="tmp")       // Restore old setting if not changed by test
                                this.disabled = oldDisabled;
                        });
                    }
                    else{                                   // If no (valid) test command was provided
                        resolved = true;
                        resolve();                          // resolve anyway
                    }
                };
            }
        }
    };
    
    this.settings = {
        button: async function(resolve){    /* $AC$ Scale PElement.button() Transforms the scale options into buttons $AC$ */
            this.scaleType = "buttons";
            await buildScale.apply(this);                         // Rebuild the scale as a button scale
            resolve();
        },
        callback: function(resolve, ...elementCommands){    /* $AC$ Scale PElement.callback(commands) Will execute the specified command(s) whenever selection happens $AC$ */
            let originalChoice = this.choice;
            this.choice = async function(value) {
                let disabled = this.disabled;
                originalChoice.apply(this, [value]);
                if (disabled)
                    return;
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        checkbox: async function(resolve){
            this.scaleType = "checkbox";
            await buildScale.apply(this);                      // Rebuild the scale as a checkbox "scale"
            resolve();
        },
        default: function(resolve, value){    /* $AC$ Scale PElement.default(value) Sets the specified value to be selected by default $AC$ */
            if (this.buttons.indexOf(value)>-1||(Number(value)>=0&&Number(value)<this.buttons.length)){
                this.defaultValue = value;
                if (value._element)
                    value = value._element.id;
                this.choices.push(["Default", value, Date.now(), this.scaleType]); // Log it
            }
            else
                PennEngine.debug.error("Invalid default value for Scale "+this.id, value);
            resolve();
        },
        disable: function(resolve){
            disable.apply(this);
            this.jQueryContainer.addClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        },
        enable: function(resolve){
            enable.apply(this);
            this.jQueryContainer.removeClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        },
        horizontal: async function(resolve){    /* $AC$ Scale PElement.horizontal() Aligns the scale's options horizontally (again) $AC$ */
            this.orientation = "horizontal";
            if (this.jQueryElement.parent().length){
                await buildScale.apply(this);
                // fixAesthetics.apply(this);
            }
            resolve();
        },
        keys: function(resolve, ...keys){    /* $AC$ Scale PElement.keys(keys) Associates the scale's options with the specified keys for selection $AC$ */
            if (keys instanceof Array && keys.length == this.buttons.length){
                if (keys.filter(e=>typeof(e)=="string"&&e.length==1).length!=keys.length)
                    return resolve(PennEngine.debug.error("Every key should be a string of length 1 in Scale "+this.id, keys));
                this.keys = keys.map(k=>k.toUpperCase());
            }
            else if (this.buttons.filter(e=>typeof(e)=="string"&&e.length==1).length == this.buttons.length)
                this.keys = this.buttons.map(e=>e.toUpperCase());
            else
                this.keys = Array.from({length:this.buttons.length},(v,k)=>k+1);
            resolve();
        },
        label: async function(resolve, index, value){    /* $AC$ Scale PElement.label(index,label) Gives the specified label to the option at the specified index on the scale $AC$ */
            if (isNaN(Number(index)) || index<0 || index>=this.buttons.length)
                return resolve();
            this.buttons[index] = value;
            await buildScale.apply(this);
            resolve();
        },
        labels: function(resolve, position){            // Deprecated since 1.0
            this.labels = position;                     // Replaced with labelsPosition
            resolve();
        },
        labelsPosition: async function(resolve, position){    /* $AC$ Scale PElement.labelsPosition(position) Will show the labels on top, at the bottom, to the left or to the right of the options $AC$ */
            this.labels = position;
            await buildScale.apply(this);
            resolve();
        },
        log: function(resolve,  ...what){    /* $AC$ Scale PElement.log() Will log the selected option in the results file $AC$ */
            if (what.length)
                this.log = what;
            else
                this.log = ["last"];
            resolve();
        },
        once: function(resolve){    /* $AC$ Scale PElement.once() Will disable the scale after the first selection $AC$ */
            if (this.hasClicked)
                disable.apply(this);
            else{
                let originalChoice = this.choice;
                this.choice = value=>{
                    originalChoice.apply(this, [value]);
                    disable.apply(this);                    
                };
            }
            resolve();
        },
        radio: async function(resolve){    /* $AC$ Scale PElement.radio() Will show the scale's options as radio buttons $AC$ */
            this.scaleType = "radio";
            await buildScale.apply(this);                      // Rebuild the scale as a radio scale
            resolve();
        },
        size: async function(resolve, width, height){
            this.width = width;
            await buildScale.apply(this);
            PennEngine.elements.standardCommands.settings.size.apply(this, [resolve, width, height]);
        },
        slider: async function(resolve){    /* $AC$ Scale PElement.slider() Will show the scale as a slider $AC$ */
            this.scaleType = "slider";
            await buildScale.apply(this);
            resolve();
        },
        vertical: async function(resolve){    /* $AC$ Scale PElement.horizontal() Aligns the scale's options vertically $AC$ */
            this.orientation = "vertical";
            if (this.jQueryElement.parent().length){
                await buildScale.apply(this);
                // fixAesthetics.apply(this);
            }
            resolve();
        }
    };

    this.test = {
        selected: function(value){    /* $AC$ Scale PElement.test.selected(option) Checks that the option, or any option if none specified, is selected $AC$ */
            if (!this.choices.length || this.unselected)
                return false;
            else if (value == undefined)
                return true;
            else if (value == this.choices[this.choices.length-1][1])
                return true;
            else
                return false;
        }  
    };

});
