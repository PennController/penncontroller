// SCALE element
window.PennController._AddElementType("Scale", function(PennEngine) {

    // SCALE-SPECIFIC FUNCTIONS & METHODS
    //
    function disable(){                                             // Disable the scale
        this.table.find("input").attr("disabled", true);
        this.table.find("td").css("cursor", "");
        this.disabled = true;
    }

    function enable(){                                              // Enable the scale
        this.jQueryElement.find("input").removeAttr("disabled");
        this.jQueryElement.find("td.PennController-"+this.type+"-scaleButton").css("cursor", "pointer");
        this.disabled = false;
    }

    function selectIndex(index, simulate) {
        switch(this.scaleType){
            case "buttons":                                         // Button scale
            this.table.find("td.PennController-"+this.type+"-scaleButton").css("outline","");
            $(this.table.find("td.PennController-"+this.type+"-scaleButton")[index]).css("outline", "dotted 1px gray");
            break;
            case "slider":                                          // Slider is different (see below)
            this.table.find("input[type=range]")[0].value = index;
            break;
            case "radio":
            this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]").removeAttr("checked");
            $(this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]")[index]).attr("checked", true);
            break;
        }
        if (simulate)
            this.choice(this.buttons[index]);
    }

    function fixAesthetics(){                                       // Handle slider's rotation after table added to page
        if (this.scaleType=="slider"){                                 // (and fixed width)
            let slider = this.table.find("input");
            if (this.orientation=="vertical"){
                this.table.css({"table-layout": "fixed",                // Table's height = slider's width (= height after rotation)
                                height: slider.outerWidth(),            // Subtract half the slider's width from table's widths
                                width: this.table.width()-slider.width()+slider.height()+10+"px"});
                slider.parent().css("width", slider.height());          // Fix the slider's cell's width (slider's height ~> width)
                slider.css("margin-left", -0.5*(slider.width()-slider.height())+"px");  // Re-positioning the slider
            }
            else
                this.table.css("height", slider.height());
        }
        else if (this.width=="auto"){
            let maxWidth = 0, n = 0;
            this.table.find("td").each(function(){
                n++;
                let width = $(this).outerWidth();
                if (width>maxWidth)
                    maxWidth = width;
            });
            this.table.css({"table-layout": "fixed", width: (n/this.table.find("tr").length)*(maxWidth+1)});
        }
    }

    function buildScale(){                                  // Feeds this.table according to scale type
        let defaultValue = this.defaultValue;
        let orientation = this.orientation;
        let type = this.scaleType;
        this.table.empty();                                 // First empty the table
        let buttonLabelCells = [];                          // [<td button> , <td label>]
        for (let b  = 0; b < this.buttons.length; b++){
            let buttonCell = $("<td>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-scaleButton");
            let labelCell = $("<td>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-label");
            let value = this.buttons[b];
            if (!value)                                             // If the array's entry is void, use its index
                value = b;
            else if (value._runPromises)                            // If the value is an element command
                value.print( labelCell )._runPromises().then(()=>{  // Print the element in the cell
                    value._element.jQueryContainer.css({display: "inline-block", width: "100%"});
                });            
            else
                labelCell.html(value);                              // Add a label (null if value null at this point)
            switch(type){
                case "buttons":                                     // Button scale
                if (value._runPromises)
                    value.print( buttonCell )._runPromises().then(()=>{
                        value._element.jQueryContainer.css({display: "inline-block", width: "100%"});
                    });
                else
                    buttonCell.html(value);
                if (!this.disabled)
                    buttonCell.css("cursor", "pointer");            // Hand pointer when hover
                buttonCell.click(()=>{
                    if (this.disabled)                              // Only if enabled
                        return;
                    this.choice(this.buttons[b]);
                    this.table.find("td").css("outline","");        // Remove frame from other buttons
                    buttonCell.css("outline", "dotted 1px gray")    // Add a frame around the button
                });
                if (defaultValue == value || defaultValue == b)
                    buttonCell.css("outline", "dotted 1px gray");   // Frame a button if a default value was specified
                break;
                case "slider":                                      // Slider is different (see below)
                if (defaultValue == value || defaultValue == b)
                    var useDefaultValueSlider = b;                  // Only if the default value is valid
                break;
                case "radio":
                default:                                            // Radio scale (default)
                let input = $("<input>").attr({
                    name: this.id,
                    value: value,
                    type: "radio"
                });
                if (defaultValue == value || defaultValue == b)     // If default value, check the radio
                    input.attr("checked", true);
                if (this.disabled)
                    input.attr("disabled", true);
                buttonCell.append(input);
                input.click(()=>this.choice(this.buttons[b]||value));
                break;
            }
            buttonLabelCells.push([buttonCell,labelCell]);
        }
        if (type=="slider"){                                        // Slider scale: special case
            var slider = $("<input>").attr({
                type: "range",
                min: "0",
                max: String(this.buttons.length-1),
                value: String((this.buttons.length-1)/2),           // Middle value by default
                step: "1"
            });
            if (useDefaultValueSlider != undefined)                 // A valid default value was specified
                slider.attr("value", useDefaultValueSlider);
            if (this.disabled)
                slider.attr("disabled", true);
            slider[0].oninput = ()=>{if (this.firstClick) return; this.firstClick = Date.now(); };
            slider[0].onchange = ()=>this.choice(slider[0].value);
        }
        if (!orientation || orientation == "horizontal"){           // HORIZONTAL SCALE
            let scaleRow = $("<tr>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-scale");
            let labelsRow = $("<tr>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-labels");
            buttonLabelCells.map(cell=>{                            // Add TDs in TRs
                scaleRow.append(cell[0].css("text-align", "center"));
                labelsRow.append(cell[1].css("text-align", "center"))
                if (this.labels == "left"){
                    cell[0].before(cell[1]);
                }
                else if (this.labels == "right"){
                    cell[0].after(cell[1]);
                }
            });
            this.table.append(scaleRow);
            if (this.labels == "top"){
                this.table.prepend(labelsRow);
                this.jQueryElement.css("vertical-align", "bottom");
            }
            else if (this.labels == "bottom"){
                this.table.append(labelsRow);
                this.jQueryElement.css("vertical-align", "top");
            }
            if (slider)                                             // If slider, scale TDs are void
                scaleRow.after($("<tr>").append(
                    $("<td>")
                        .attr("colspan", buttonLabelCells.length)   // Slider's TD spans over all other TDs
                        .append(slider.css("width","100%"))         // Add slider's TD after (=below) empty TDs
                )).css("display", "none");
        }
        else{                                                       // VERTICAL SCALE
            buttonLabelCells.map((cell,i)=>{
                let row = $("<tr>");
                row.append(cell[0]);                                // Add TR+TD for each cell
                if (this.labels == "top")
                    row.prepend(cell[1]);                           // Labels are TDs in same TR
                else if (this.labels == "bottom")                   //  before or after
                    row.append(cell[1]);
                this.table.append(row);
                if (slider&&i>0)
                    row.css("display", "none");                     // Mask rows > 1 if slider
            });
            if (slider){                                            // If slider, scale TDs are empty
                buttonLabelCells[0][0].after(                       // Add a TD after the first scale TD
                    $("<td>").attr("rowspan", buttonLabelCells.length)  // span over TRs
                            .append(slider.css({transform: "rotate(-90deg)"}))  // rotate
                );
                buttonLabelCells.map(cell=>cell[0].css("width", 0));// Make sure scale TDs width is 0 (they are empty)
                if (this.jQueryElement.parent().length)             // If element already displayed:
                    fixAesthetics.apply(this);                      // apply fixes that require being added to the page
            }
        }
        if (this.width)
            this.table.css({"table-layout": "fixed", width: this.width});
    }
    //
    // END SCALE-SPECIFIC FUNCTIONS & METHODS
    

    this.immediate = function(id, ...buttons){
        if (buttons.length){
            if (typeof(buttons[0])!="string" && Number(buttons[0])>0)
                this.initialButtons = new Array(Number(buttons[0])); // Number: array of void values/labels
            else
                this.initialButtons = buttons;                       // Array of values/labels
        }
        else                                                         // No argument
            console.error("Invalid parameters for scale "+id+" in PennController #"+PennEngine.controllers.underConstruction.id);
    };

    this.uponCreation = function(resolve){
        this.table = $("<table>");
        this.jQueryElement = $("<div>").css("display", "inline-block").append(this.table);
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
        this.choice = value=>{                                      // (Re)set upon creation, since it can be modified during runtime
            if (this.disabled)
                return;                                             // Store the value + timestamp
            if (value && value._runPromises)
                value = value._element.id;
            let duration = null;
            if (this.scaleType=="slider"&&this.firstClick){
                duration = Date.now() - this.firstClick;
                this.firstClick = undefined;
            }
            this.choices.push(["Choice", value, Date.now(), duration]);
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
        if (this.log && this.log instanceof Array){
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
        if (this.choices.length)
            return this.choices[this.choices.length-1][1];
        else
            return NaN;
    };
    
    this.actions = {
        print: function(resolve, where){
            buildScale.apply(this);                         // (Re)Build the scale when printing
            let afterPrint = ()=>{
                fixAesthetics.apply(this);                  // Need table on the page to calculate widths and heights
                resolve();
            };                                              // Standard print, then afterPrint resolves
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, where]);
        },
        select: function(resolve, option, simulate){
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
                return resolve(console.warn("Option "+option+" not found for selection on scale "+this.id+" in PennController #"+PennEngine.controllers.underConstruction.id));
            selectIndex.apply(this, [b, simulate]);
            resolve();
        },
        wait: function(resolve, test){
            if (test == "first" && this.choices.length)     // If first and already chosen, resolve already
                resolve();
            else {                                          // Else, extend choice and do the checks
                let resolved = false;
                let oldChoice = this.choice;
                this.choice = value=>{
                    oldChoice.apply(this, [value]);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success)
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                        });
                    else{                                   // If no (valid) test command was provided
                        resolved = true;
                        resolve();                          // resolve anyway
                    }
                };
            }
        }
    };
    
    this.settings = {
        button: function(resolve){
            this.scaleType = "buttons";
            buildScale.apply(this);                         // Rebuild the scale as a button scale
            resolve();
        },
        callback: function(resolve, ...elementCommands){
            let originalChoice = this.choice;
            this.choice = async function(value) {
                originalChoice.apply(this, [value]);
                if (this.disabled)
                    return;
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        default: function(resolve, value){
            if (this.buttons.indexOf(value)>-1||(Number(value)>=0&&Number(value)<this.buttons.length)){
                this.defaultValue = value;
                if (value._element)
                    value = value._element.id;
                this.choices.push(["Default", value, Date.now(), this.scaleType]); // Log it
            }
            else
                console.warn("Invalid default value for scale "+this.id+" in controller #"+PennEngine.controllers.running.id, value);
            resolve();
        },
        disable: function(resolve){
            disable.apply(this);
            resolve();
        },
        enable: function(resolve){
            enable.apply(this);
            resolve();
        },
        horizontal: function(resolve){
            this.orientation = "horizontal";
            if (this.jQueryElement.parent().length){
                buildScale.apply(this);
                fixAesthetics.apply(this);
            }
            resolve();
        },
        keys: function(resolve, ...keys){
            if (keys instanceof Array && keys.length == this.buttons.length){
                if (keys.filter(e=>typeof(e)=="string"&&e.length==1).length!=keys.length)
                    return resolve(console.warn("Every key should be a string of length 1 in scale "+this.id+" in PennController #"+PennEngine.controllers.running.id, keys));
                this.keys = keys.map(k=>k.toUpperCase());
            }
            else if (this.buttons.filter(e=>typeof(e)=="string"&&e.length==1).length == this.buttons.length)
                this.keys = this.buttons.map(e=>e.toUpperCase());
            else
                this.keys = Array.from({length:this.buttons.length},(v,k)=>k+1);
            resolve();
        },
        label: function(resolve, index, value){
            if (isNaN(Number(index)) || index<0 || index>=this.buttons.length)
                return resolve();
            this.buttons[index] = value;
            if (this.jQueryElement.parent().length){    // If displayed, replace
                let labels = this.table.find("td.PennController-"+this.type+"-label");
                if (index < labels.length){
                    let jqLabel = $(labels[index]);
                    jqLabel.empty();
                    if ( value._runPromises )
                        value.print( jqLabel )._runPromises();
                    else
                        jqLabel.html( value );
                }
            }
            resolve();
        },
        labels: function(resolve, position){            // Deprecated since 1.0
            this.labels = position;                     // Replaced with labelsPosition
            resolve();
        },
        labelsPosition: function(resolve, position){
            this.labels = position;
            resolve();
        },
        log: function(resolve,  ...what){
            if (what.length)
                this.log = what;
            else
                this.log = ["last"];
            resolve();
        },
        once: function(resolve){
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
        radio: function(resolve){
            this.scaleType = "radio";
            buildScale.apply(this);                      // Rebuild the scale as a radio scale
            resolve();
        },
        size: function(resolve, width, height){
            this.width = width;
            PennEngine.elements.standardCommands.settings.size.apply(this, [resolve, width, height]);
        },
        slider: function(resolve, value){                // Rebuild the scale as a slider scale
            this.scaleType = "slider";
            buildScale.apply(this);
            resolve();
        },
        vertical: function(resolve){
            this.orientation = "vertical";
            if (this.jQueryElement.parent().length){
                buildScale.apply(this);
                fixAesthetics.apply(this);
            }
            resolve();
        }
    };

    this.test = {
        selected: function(value){
            if (!this.choices.length)
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