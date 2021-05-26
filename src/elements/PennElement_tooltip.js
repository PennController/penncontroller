// TOOLTIP element
/* $AC$ PennController.newTooltip(name,text) Creates a new Tooltip element $AC$ */
/* $AC$ PennController.getTooltip(name) Retrieves an existing Tooltip element $AC$ */
window.PennController._AddElementType("Tooltip", function(PennEngine) {

    function remove(){                          // Special function to remove element from DOM
        this.jQueryElement.remove();
        if (this.jQueryContainer instanceof jQuery)
            this.jQueryContainer.detach();
        if (this.frame && this.frame instanceof jQuery)
            this.frame.detach();
    }

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, text, optionalOKLabel){
        if (text===undefined)
            text = id;
        this.initialText = text;                            // In case this gets changed later
        this.initialLabel = optionalOKLabel;
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "Tooltip";
        this.id = id;
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
        this.jQueryContainer = undefined;
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
        print: async function(resolve, element, ...more){  /* $AC$ Tooltip PElement.print(element) Prints the tooltip attached to the specified element $AC$ */
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
                if (more.length>1) this.jQueryContainer = undefined;  // Print to element: no container
                else this.jQueryContainer = $("<div>");               // Global print: need a container
                await new Promise(r=>PennEngine.elements.standardCommands.actions.print.apply(this, [r, element, ...more]));
                this.jQueryElement.css({position: "relative", left: "", top: "", margin: 0, display:"inline-block"});
                if (this.jQueryLabel.css("display")!="none")
                    this.jQueryElement.css("padding-bottom", "20px");
                resolve();
            }
        },
        remove: function(resolve){
            remove.apply(this);
            resolve()
        },
        wait: function(resolve, test){  /* $AC$ Tooltip PElement.wait() Waits until the tooltip gets validated before proceeding $AC$ */
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
            this.jQueryContainer.addClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            this.jQueryContainer.removeClass("PennController-disabled");
            this.jQueryElement.removeClass("PennController-disabled");
            resolve();
        },
        frame: function(resolve, css){  /* $AC$ Tooltip PElement.css(css) Applies the specified CSS to the frame around the target element $AC$ */
            if (typeof(css)=="string" && css.length)
                this.frameParent = css;
            else
                this.frameParent = "dotted 1px gray";       // By default
            resolve();
        },
        key: function(resolve, keys, noclick){  /* $AC$ Tooltip PElement.key(key) Will validate (and remove) the tooltip whenever the specified key is pressed $AC$ */
            if (keys != " " && !isNaN(Number(keys)))    // If keycode
                keys = String.fromCharCode(keys);
            if (typeof(keys) != "string")
                resolve(PennEngine.debug.error("Invalid key(s) passed to Tooltip &quot;"+id+"&quot; (should be a string or a key code number)", keys));
            keys = keys.toUpperCase();
            PennEngine.events.keypress(e=>{
                if (!this.jQueryElement.parent().length)
                    return;
                let isSpecialKey = e.key.isSpecialKey();
                let upperE = e.key.toUpperCase();
                let side = {0: "", 1: "LEFT", 2: "RIGHT"};
                if ((keys===undefined||keys.length==0) || // If no key specified, any key press will do
                    (isSpecialKey && (keys==upperE||keys==side[e.location]+upperE)) || // Special key
                    (!isSpecialKey && keys.indexOf(upperE)>-1) ) // Regular list of keys
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
        label: function(resolve, text){  /* $AC$ Tooltip PElement.label(text) Defines the text used for the validation label $AC$ */
            this.label = text;
            this.resetLabel = true;
            if (typeof(text)!="string" || text.match(/^[\s\t]*$/))
                this.jQueryLabel.css("display","none");
            else{
                this.jQueryLabel.html(text);
                this.jQueryLabel.css("display","inherit");
            }
            resolve();
        },
        log: function(resolve) {  /* $AC$ Tooltip PElement.log() Will log when the tooltip is validated in the results file $AC$ */
            this.log = true;
            resolve();
        },
        position: function(resolve, positionString){  /* $AC$ Tooltip PElement.position(position) Will show the tooltip at the top, at the bottom, to the left or to the right of the element it attaches to $AC$ */
            this.relativePosition = positionString;
            resolve();
        },
        text: function(resolve, text){  /* $AC$ Tooltip PElement.text(value) Redefines the text of the tooltip $AC$ */
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
