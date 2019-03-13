// TOOLTIP element
window.PennController._AddElementType("Tooltip", function(PennEngine) {

    function remove(){                          // Special function to remove element from DOM
        this.jQueryElement.remove();
        if (this.jQueryContainer instanceof jQuery)
            this.jQueryContainer.remove();
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
        this.resetLabel = false;                            // Use initial label
        this.jQueryElement = $("<div>").html(this.text);    // The tooltip itself
        this.jQueryLabel = $("<a>").html(this.label);       // The confirmation button
        this.validations = [];                              // Stores all the validations of the tooltip
        this.frame = $("<div>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-tooltip-frame");
        this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-tooltip");
        this.jQueryElement.addClass("PennController-"+this.id.replace(/[\s_]/g,''));
        // Default aesthetics
        this.jQueryElement.css({background: "floralwhite", position: "relative"});
        this.jQueryLabel.css({border: "dotted 1px gray", cursor: "pointer", position: "absolute", bottom: "2px", right: "2px"});
        // Default settings
        this.wasValidated = false;
        this.disabled = false;
        this.log = false;
        this.validate = ()=>{                              // (Re)set upon creation, for it can be modified during runtime
            if (this.delayedPrinting||this.disabled)       // delayedPrinting to prevent early validation
                return;
            this.wasValidated = true;
            this.validations.push(["Validate", "Validate", Date.now(), "NULL"]);
            remove.apply(this);
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
            this.jQueryElement.append(this.jQueryLabel);                        // Label, aligned to the right
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
                    visibility: "hidden",                                       // Hide until position is final
                    overflow: "auto",
                    top: "auto",
                    left: "auto",
                    "margin-top": 1+parenth,                                    // Default relative position: Bottom-Right
                    "margin-left": 1+parentw,
                    "z-index": 9999,                                            // In case * layer (e.g. canvas)
                    padding: "1px"                                              // Just aesthetics
                });
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
                this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,''));
                if (this.jQueryLabel.css("display")!="none")
                    this.jQueryElement.css("padding-bottom", "20px");
                if (this.relativePosition){                                         // If other specified...
                    let set_top = ()=>{ 
                        if (this.relativePosition.match(/top/i))                    // Top
                            return -1 * this.jQueryElement.outerHeight() - 1;
                        else if (this.relativePosition.match(/middle/i))            // Middle
                            return 0.5 * (element.height() - this.jQueryElement.outerHeight());
                        else
                            return element.height() + 1;
                    };
                    let set_left = ()=>{ 
                        if (this.relativePosition.match(/left/i))                   // Left
                            return -1 * this.jQueryElement.outerWidth() - 1;
                        else if (this.relativePosition.match(/center/i))            // Center
                            return 0.5* (element.width() -  this.jQueryElement.outerWidth());
                        else
                            return element.width() + 1;
                    };
                    this.delayedPrinting = true;                              // To prevent early validation
                    setTimeout(()=>{                                          // Only accurate 2nd time for some reason
                        this.jQueryElement.css({"margin-top": set_top(), "margin-left": set_left()});
                        setTimeout(()=>{
                            this.jQueryElement.css({"margin-top": set_top(), "margin-left": set_left(), visibility: "visible"});
                            this.delayedPrinting = false;
                            resolve();
                        });
                    });
                }
                else{
                    this.jQueryElement.css("visibility", "visible");
                    resolve();
                }
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
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;    // Disable temporarilly
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled=="tmp")       // Restore old setting if not modified by test
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
        disable: function(resolve){
            this.disabled = true;
            this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-disabled");
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            this.jQueryElement.removeClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-disabled");
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
                PennEngine.events.keypress(e=>{
                    if (!this.jQueryElement.parent().length)
                        return;
                    if (e.keyCode==keys)
                        this.validate();
                });
            else if (typeof(keys)=="string")                // If string of key(s)
                PennEngine.events.keypress(e=>{
                    if (!this.jQueryElement.parent().length)
                        return;
                    let key = e.keyCode;
                    if (!keys.length||keys.toUpperCase().includes(String.fromCharCode(key).toUpperCase()))
                        this.validate();
                });
            if (noclick){                                   // If noclick was specified
                this.noClicks = true;
                this.jQueryLabel.css("cursor", "");         // No pointer when hovering the label
                if (!this.initialLabel&&!this.resetLabel)   // If no label initially set
                    this.jQueryLabel.css("display","none"); // Just remove it
            }
            resolve();
        },
        label: function(resolve, text){
            this.label = text;
            this.resetLabel = true;
            this.jQueryLabel.html(text);
            this.jQueryLabel.css("display","inherit");
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
            this.jQueryElement.append(this.jQueryLabel);
            this.jQueryLabel.click(()=>{
                if (!this.noClicks)
                    this.validate();
            });
            if (this.jQueryLabel.css("display")!="none")
                this.jQueryElement.css("padding-bottom", "20px");
            resolve();
        }
    };

});