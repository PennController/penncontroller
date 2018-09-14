// TOOLTIP element
window.PennController._AddElementType("Tooltip", function(PennEngine) {

    function remove(){                          // Special function to remove element from DOM
        this.jQueryElement.remove();
        if (this.frame && this.frame instanceof jQuery)
            this.frame.remove();
    }

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, text, optionalOKLabel){
        this.initialText = text;                            // In case this gets changed later
        this.initialLabel = optionalOKLabel;
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.text = this.initialText;
        if (typeof(this.initialLabel)=="string" && this.initialLabel.length)
            this.label = this.initialLabel;
        else
            this.label = "OK";
        this.jQueryElement = $("<div>").html(this.text);    // The tooltip itself
        this.jQueryLabel = $("<a>").html(this.label);       // The confirmation button
        this.validations = [];                              // Stores all the validations of the tooltip
        this.frame = $("<div>").addClass("PennController-"+this.type+"-tooltip-frame");
        this.jQueryElement.addClass("PennController-"+this.type+"-tooltip");
        // Default aesthetics
        this.jQueryElement.css({background: "floralwhite", position: "relative"});
        this.jQueryLabel.css({border: "dotted 1px gray", cursor: "pointer", position: "absolute", bottom: "2px", right: "2px"});
        // Default settings
        this.wasValidated = false;
        this.disabled = false;
        this.log = false;
        this.validate = ()=>{                              // (Re)set upon creation, for it can be modified during runtime
            if (!this.disabled){
                this.wasValidated = true;
                this.validations.push(["Validate", "Validate", Date.now(), "NULL"]);
                remove.apply(this);
            }
        };
        resolve();
    }

    // This is executed at the end of a trial
    this.end = function(){
        if (this.jQueryElement && this.jQueryElement instanceof jQuery)
            remove.apply(this);                     // Remove element (and frame) from DOM
        if (this.log)
            for (let v in this.validations)     // Save any validation if logging
                PennEngine.controllers.running.save(this.type, this.id, ...this.validations[v]);
    };

    this.value = function(){                    // Value is whether it was validated
        return this.wasValidated;
    };
    
    this.actions = {
        print: function(resolve, element){
            if (element && element.hasOwnProperty("_element") && element._element.jQueryElement instanceof jQuery)
                element = element._element.jQueryElement;
            this.jQueryElement.append(this.jQueryLabel);                        // Label, aligned on the right
            this.jQueryLabel.click(()=>{
                if (!this.noClicks)
                    this.validate();                                            // Validate on click
            });
            this.jQueryElement.css("text-align", "left");
            if (element instanceof jQuery){                                     // Add to an existing element
                element.before(this.jQueryElement);
                let parentw = element.width(), parenth = element.height();
                this.jQueryElement.css({
                    position: "absolute",                                       // may be moved anywhere on the page
                    display: "inline-block",
                    overflow: "scroll",
                    "margin-top": parenth,                                      // Default relative position: Bottom-Right
                    "margin-left": parentw,
                    "z-index": 9999,                                            // In case * layer (e.g. canvas)
                    padding: "1px"                                              // Just aesthetics
                });
                let w = this.jQueryElement.width(), h = this.jQueryElement.height();
                if (typeof(this.relativePosition) == "string"){                 // If other specified...
                    // Vertical
                    if (this.relativePosition.match(/top/i))                    // Top
                        this.jQueryElement.css("margin-top", -1 * h);
                    else if (this.relativePosition.match(/middle/i))            // Middle
                        this.jQueryElement.css("margin-top", 0.5*(parenth-h));
                    // Horizontal
                    if (this.relativePosition.match(/left/i))                   // Left
                        this.jQueryElement.css("margin-left", -1 * w);
                    else if (this.relativePosition.match(/center/i))            // Center
                        this.jQueryElement.css("margin-left", 0.5*(parentw-w));
                }
                if (this.frameParent)                                           // Add a frame to the parent element
                    element.before(this.frame.css({
                        position: "absolute", 
                        display: "inline-block",
                        width: parentw,
                        height: parenth,
                        border: this.frameParent,
                        "z-index": 100,
                        "pointer-events": "none"                                // Can click through it
                    }));
                let top = element.css("top"), left = element.css("left");
                if (top=="0px")
                    top = "auto";
                if (left=="0px")
                    left = "auto";
                this.jQueryElement.css({left: left, top: top});
                this.frame.css({left: left, top: top});
                this.jQueryElement.addClass("PennController-"+this.type);
                if (this.jQueryLabel.css("display")!="none")
                    this.jQueryElement.css("padding-bottom", "20px");
                resolve();
            }
            else{                                                              // Add to the page
                this.jQueryElement.css({position: "relative", left: "", top: "", margin: 0, display:"inline-block"});
                if (this.jQueryLabel.css("display")!="none")
                    this.jQueryElement.css("padding-bottom", "20px");
                PennEngine.elements.standardCommands.actions.print.apply(this, [resolve, element]);  // standard print
            }
        },
        remove: function(resolve){
            remove.apply(this);
            resolve()
        },
        wait: function(resolve, test){
            if (test == "first" && this.wasValidated) // If first and already validated, resolve already
                resolve();
            else {                                  // Else, extend validate and do the checks
                let resolved = false;
                let oldValidate = this.validate;
                this.validate = ()=>{
                    oldValidate.apply(this);
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
        disable: function(resolve){
            this.disabled = true;
            this.jQueryElement.addClass("PennController-"+this.type+"-disabled");
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            this.jQueryElement.removeClass("PennController-"+this.type+"-disabled");
            resolve();
        },
        frame: function(resolve, css){
            if (typeof(css)=="string" && css.length)
                this.frameParent = css;
            else
                this.frameParent = "dotted 1px gray";       // By default
            resolve();
        },
        key: function(resolve, keys, noclick){              // noclick is optional
            if (Number(keys)>0)                             // If keycode
                PennEngine.controllers.running.safeBind($(document),"keydown",(e)=>{
                    if (!this.jQueryElement.parent().length)
                        return;
                    if (e.which==keys)
                        this.validate();
                });
            else if (typeof(keys)=="string")                // If string of key(s)
                PennEngine.controllers.running.safeBind($(document),"keydown",(e)=>{
                    if (!this.jQueryElement.parent().length)
                        return;
                    let _to_ascii = {'188': '44', '109': '45', '190': '46', '191': '47', '192': '96', '220': '92',
                     '222': '39', '221': '93', '219': '91', '173': '45', '187': '61', '186': '59', '189': '45'};
                    let shiftUps = {"96": "~", "49": "!", "50": "@", "51": "#", "52": "$", "53": "%", "54": "^",
                        "55": "&", "56": "*", "57": "(", "48": ")", "45": "_", "61": "+", "91": "{", "93": "}",
                        "92": "|", "59": ":", "39": "\"", "44": "<", "46": ">", "47": "?"};
                    let key = e.which;
                    if (_to_ascii.hasOwnProperty(key))
                        key = _to_ascii[key];
                    if (!e.shiftKey && (key >= 65 && key <= 90))
                        key = String.fromCharCode(key + 32);
                    else if (e.shiftKey && shiftUps.hasOwnProperty(key))
                        key = shiftUps[key];
                    if (keys.toUpperCase().includes(String.fromCharCode(key).toUpperCase()))
                        this.validate();
                });
            if (noclick){                                   // If noclick was specified
                this.noClicks = true;
                this.jQueryLabel.css("cursor", "");         // No pointer when hovering the label
                if (!this.initialLabel)                     // If no label initially set
                    this.jQueryLabel.css("display","none"); // Just remove it
            }
            resolve();
        },
        label: function(resolve, text){
            this.label = text;
            this.jQueryLabel.html(text);
            resolve();
        },
        log: function(resolve,  ...what){
            this.log = true;
            resolve();
        },
        position: function(resolve, positionString){
            this.relativePosition = positionString;
            resolve();
        },
        text: function(resolve, text){
            this.text = text;
            this.jQueryElement.html(text);
            resolve();
        }
    };

});