
// SELECTOR element
PennController._AddElementType("Selector", function(PennEngine) {

    function shuffle(resolve, ...elementCommands){
        let elementsToShuffle = [];
        if (!elementCommands.length)                // If no argument, just add every element
            elementsToShuffle = [].concat(this.elements);
        else {                                      // Else, first feed elementsToShuffle
            for (let e in elementCommands) {        // Go through each elementCommand
                if (!(elementCommands._element && elementCommands._element.jQueryElement instanceof jQuery)){
                    console.warn("Invalid element #"+e+" in shuffling selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                    continue;
                }
                let index = this.elements.map(e=>e[0]).indexOf(elementCommands._element);
                if (index<0){
                    console.warn("Cannot shuffle element "+element.id+" for it has not been added to selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                    continue;
                }
                elementsToShuffle.push(this.elements[index]);
            }
        }
        let shuffled = [].concat(elementsToShuffle);
        fisherYates(shuffled);                              // Now, shuffle the elements
        let map = shuffled.map((s,i)=>Object({              // Create an association map of old to new elements
            old: {element: elementsToShuffle[i], index: this.elements.indexOf(elementsToShuffle[i])},
            new: {element: s, index: this.elements.indexOf(s)}
        }));
        let shuffleTags = [];
        map.map((m,i)=>{
            this.elements[m.old.index] = m.new.element;
            let shuf = $("<shuffle>").attr("i", i);         // Indicate the position in the map
            m.old.element[0].jQueryElement.before(shuf);    // Place a shuffle tag before the unshuffled element
            shuf.css({                                      // Store unshuffled element's style to apply to new element later
                        position: m.old.element[0].jQueryElement.css("position"),
                        left: m.old.element[0].jQueryElement.css("left"),
                        top: m.old.element[0].jQueryElement.css("top")
                });
            shuffleTags.push(shuf);                         // Add the shuffle tag to the list
        }); 
        shuffleTags.map(tag=>{                              // Go through each shuffle tag
            let i = tag.attr('i');                          // Retrieve the index in the map
            let jQueryElementToMove = map[i].new.element[0].jQueryElement;
            tag.after( jQueryElementToMove );               // Move the new element after the tag
            jQueryElementToMove.css({                       // And apply the old element's style
                position: tag.css("position"),
                left: tag.css("left"),
                top: tag.css("top")
            });
            if (this.selections.length && this.selections[this.selections.length-1][1] == map[i].new.element[0].id)
                jQueryElementToMove.before(this.frame);     // Also move frame if new element has frame
            tag.remove();                                   // Remove shuffle tag from DOM
        });
        resolve();
    }

    this.immediate = function(id){
    };

    this.uponCreation = function(resolve){
        this.elements = [];                // [[element, keys], [element, keys], ...]
        this.selections = [];
        this.disabled = false;
        this.frame = $("<div>").css({
            position: "absolute",
            display: "inline-block",
            border: "dotted 1px grey",
            "z-index": 100
        }).addClass("PennController-"+this.type+"-selectionFrame");
        this.noClick = false;
        this.select = element=>{          // (Re)set select upon creation, for it can be modified during trial
            if (this.disabled)
                return;
            if (this.elements.map(e=>e[0]).indexOf(element)<0)
                return console.warn("Tried to select an element not part of selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
            this.selections.push(["Selection", element.id, Date.now(), "NULL"]);
            this.frame.css({
                width: element.jQueryElement.width(),
                height: element.jQueryElement.height(),
                "pointer-events": "none" // Can click through it
            });
            if (element.jQueryElement.css("position")=="absolute")
                this.frame.css({
                    left: element.jQueryElement.css("left"),
                    top: element.jQueryElement.css("top")
                });
            element.jQueryElement.before(this.frame);
            this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type+"-selected"));
            element.jQueryElement.addClass("PennController-"+this.type+"-selected");
        };
        PennEngine.controllers.running.safeBind($(document), "keydown", (e)=>{
            if (this.disabled)
                return;
            for (let s in this.elements){
                let key = "";
                if (this.elements[s].length>1)
                    key = this.elements[s][1];
                if (key && typeof(key)=="string" && key.match(RegExp(String.fromCharCode(e.which), "i")))
                    return this.select(this.elements[s][0]);
            }
        });
        resolve();
    };

    this.end = function(){
        this.elements = [];
        this.frame.remove();
        if (this.log)
            for (let s in this.selections)
                PennEngine.controllers.running.save(this.type, this.id, ...this.selections[s]);
    };

    this.value = function(){                                // Value is last selection
        if (this.selections.length){
            let selectedElement = this.selections[this.selections.length-1][1];
            return PennController.Elements["get"+selectedElement.type](selectedElement.id);
        }
        else
            return null;
    };
    
    this.actions = {
        select: function(resolve, elementCommand){
            if (!(elementCommand._element && elementCommand._element.jQueryElement instanceof jQueryElement))
                console.warn("Invalid element passed to select command for selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
            else{
                let disabled = this.disabled;
                this.disabled = true;
                this.select(elementCommand._element);
                this.disabled = disabled;
            }
            resolve();
        },
        shuffle: function(resolve, ...elements){
            shuffle.apply(this, [resolve].concat(elements));
        },
        unselect: function(resolve){
            this.selections.push(["Unselect", "Unselect", Date.now(), "From script"]);
            this.frame.detach();
            this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type+"-selected"));
            resolve();
        },
        wait: function(resolve, test){
            if (test=="first" && this.selections.length)
                resolve();
            else {
                let resolved = false;
                let oldSelect = this.select;
                this.select = element => {
                    if (this.disabled || resolved)
                        return;
                    oldSelect.apply(this, [element]);
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
        add: function(resolve, ...what){
            for (w in what) {
                let element = what[w]._element;
                if (element == undefined || element.id == undefined)
                    console.warn("Invalid element added to selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                else if (this.elements.map(e=>e[0]).indexOf(element)>-1)
                    console.warn("Element "+element.id+" already part of selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                else if (element.jQueryElement == undefined || !(element.jQueryElement instanceof jQuery))
                    console.warn("Element "+element.id+" has no visble element to be chosen in selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                else {
                    this.elements.push([element]);        // Each member of this.elements is an array [2nd member = keys]
                    if (!this.noClick)
                        element.jQueryElement.css("cursor", "pointer");
                    element.jQueryElement.click(()=>{
                        if (!this.noClick)
                            this.select(element);
                    });
                }
            }
            resolve();
        },
        callback: function(resolve, ...elementCommands){
            let oldSelect = this.select;
            this.select = async function(element) {
                oldSelect.apply(this, [element]);
                if (this.disabled)
                    return;
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        disable: function(resolve){
            this.disabled = true;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", ""));
            resolve();
        },
        disableClicks: function(resolve, what){
            this.noClick = true;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", ""));
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            if (!this.noClick)
                this.elements.map(element=>element[0].jQueryElement.css("cursor", "pointer"));
            resolve();
        },
        enableClicks: function(resolve){
            this.noClick = false;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", "pointer"));
            resolve();
        },
        frame: function(resolve, css){
            this.frame.css.apply(this.frame, ["border", css]);
            resolve();
        },
        keys: function(resolve, ...keys){
            for (let k in keys){
                if (k >= this.elements.length)
                    break;
                let key = keys[k];
                if (Number(key)>0)
                    key = String.fromCharCode(key);
                this.elements[k] = [this.elements[k][0], key];
            }
            resolve();
        },
        log: function(resolve){
            this.log = true;
            resolve();
        },
        once: function(resolve, what){
            if (this.selections.length){
                this.disabled = true;
                this.elements.map(e=>e[0].jQueryElement.css("cursor",""));
            }
            else{
                let oldSelect = this.select;
                this.select = element => {
                    oldSelect.apply(this, [element]);
                    if (this.disabled)
                        return;
                    this.disabled = true;
                    this.elements.map(e=>e[0].jQueryElement.css("cursor",""));
                };
            }
            resolve();
        },
        shuffle: function(resolve, ...elements){                       // DEPRECATED SINCE BETA 0.3, USE ACTION
            shuffle.apply(this, [resolve].concat(elements));
        }
    };

    this.test = {
        selected: function(elementCommand){
            if (elementCommand == undefined)
                return this.selections.length;
            else if (elementCommand._element)
                return this.selections[this.selections.length-1][1] == elementCommand._element.id;
            console.warn("Invalid element tested for selector "+this.id+" in PennController #"+PennEngine.controllers.running.id, elementCommand._element.id);
            return false;
        }
    };

});

// Add a .settings.selector command to all elements
PennController._AddStandardCommands(function(PennEngine){
    this.settings = {
        selector: async function(resolve, selectorRef){
            var selector;
            if (typeof(selectorRef)=="string"){
                selector = PennEngine.controllers.running.options.elements[selectorRef];
                if (!selector)
                    console.warn("No selector found named "+selectorRef+" for PennController #"+PennEngine.controllers.running.id);
            }
            else if (selectorRef._element && selectorRef._runPromises){
                if (selectorRef._element.type=="Selector"){
                    await selectorRef._runPromises();
                    selector = selectorRef._element;
                }
                else
                    console.warn("Tried to add "+this.name+" to an invalid selector in PennController #"+PennEngine.controllers.running.id);
            }
            if (selector.elements.map(e=>e[0]).indexOf(this)>-1)
                console.warn("Element "+this.id+" already part of selector "+selector.id+" in PennController #"+PennEngine.controllers.running.id);
            else if (this.jQueryElement == undefined || !(this.jQueryElement instanceof jQuery))
                console.warn("Element "+this.id+" has no visble element to be chosen in selector "+selector.id+" in PennController #"+PennEngine.controllers.running.id);
            else {
                selector.elements.push([this]);        // Each member of this.elements is an array [2nd member = keys]
                if (!this.noClick)
                    this.jQueryElement.css("cursor", "pointer");
                this.jQueryElement.click(()=>{
                    if (!selector.noClick)
                        selector.select(this);
                });
            }
            resolve();
        }
    }
});