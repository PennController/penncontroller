// SELECTOR element
/* $AC$ PennController.newSelector(name) Creates a new Selector element $AC$ */
/* $AC$ PennController.getSelector(name) Retrieves an existing Selector element $AC$ */
window.PennController._AddElementType("Selector", function(PennEngine) {

    async function shuffle(resolve, ...elementCommands){
        let indicesToShuffle = [];
        if (!elementCommands.length)                // If no argument, just add every index
            indicesToShuffle = [...new Array(this.elements.length)].map((v,i)=>i);
        else {                                      // Else, first feed elementsToShuffle
            for (let e in elementCommands) {        // Go through each elementCommand
                if (!(elementCommands[e]._element && elementCommands[e]._element.jQueryElement instanceof jQuery)){
                    PennEngine.debug.error("Invalid element #"+e+" in shuffling selector "+this.id);
                    continue;
                }
                let index = this.elements.map(e=>e[0]).indexOf(elementCommands[e]._element);
                if (index<0){
                    PennEngine.debug.error("Cannot shuffle element "+elementCommands[e]._element.id+" for it has not been added to selector "+this.id);
                    continue;
                }
                indicesToShuffle.push(index);
            }
        }
        let shuffledIndices = [...indicesToShuffle];
        fisherYates(shuffledIndices);                              // Now, shuffle the indices
        const tmpPrints = [];
        const prints = indicesToShuffle.map(i=>{
            const element = this.elements[i][0];
            const lastPrint = element._lastPrint;
            if (lastPrint[0]===undefined){
                const container = element.jQueryContainer;
                if (container instanceof jQuery && container.parent().length){
                    const tmpContainer = $("<span>");
                    container.before( tmpContainer );
                    tmpPrints[i] = tmpContainer;
                }
            }
            else if (lastPrint[0] instanceof jQuery && (lastPrint[0].hasClass("PennController-after")||lastPrint[0].hasClass("PennController-before"))){
                // this print command was called to add this element before or after another element
                const r = {};
                let befOrAft = lastPrint[0][0].className.replace(/^.*PennController-(after|before).*$/,"$1");
                befOrAft = befOrAft.replace(/^[ab]/,c=>c.toUpperCase());
                // let us find out whether the other element is part of the shuffle
                for (let n = 0; n < indicesToShuffle.length; n++){
                    const other_element = this.elements[indicesToShuffle[n]][0];
                    if (!(other_element['jQuery'+befOrAft] instanceof Array)) continue;
                    const prelength = other_element['jQuery'+befOrAft].length;
                    other_element['jQuery'+befOrAft] = other_element['jQuery'+befOrAft].filter(a=>a._element!=element);
                    if (other_element['jQuery'+befOrAft].length<prelength){
                        // the other element is part of the shuffle, 
                        // so we'll want to print on the associated post-shuffle element instead
                        r[befOrAft] = this.elements[shuffledIndices[n]][0];
                        return r;
                    }
                }
            }
            return lastPrint;
        });
        indicesToShuffle.forEach(async i=>{
            const el = this.elements[i][0];
            await window.PennController.Elements['get'+el.type](el.id).remove()._runPromises();
        });
        shuffledIndices.forEach(async (index,i)=>{
            let element = this.elements[index][0], print = prints[i];
            if (print===undefined) return;
            const handler = window.PennController.Elements['get'+element.type](element.id);
            if (print.hasOwnProperty("After"))
                await window.PennController.Elements['get'+print.After.type](print.After.id).after( handler )._runPromises();
            else if (print.hasOwnProperty("Before"))
                await window.PennController.Elements['get'+print.Before.type](print.Before.id).after( handler )._runPromises();
            else
                await handler.print(...print)._runPromises();
            const tmpPrint = tmpPrints[indicesToShuffle[i]];
            if (tmpPrint instanceof jQuery){
                element.jQueryContainer.css('position', 'unset');
                tmpPrint.before(element.jQueryContainer);
                tmpPrint.remove();
            }
        });
        const copyOfElements = [...this.elements];
        indicesToShuffle.forEach((original_index,i)=>this.elements[original_index]=copyOfElements[shuffledIndices[i]]);
        resolve();
    }

    this.immediate = function(id){
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "Selector";
        this.id = id;
    };

    this.uponCreation = function(resolve){
        this.elements = [];                // [[element, keys], [element, keys], ...]
        this.selections = [];
        this.disabled = false;
        this.frame = $("<div>").css({
            position: "absolute",
            display: "inline-block",
            margin: "auto",
            outline: "dotted 1px grey",
            "z-index": 100
        }).addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-selectionFrame");
        this.noClick = false;
        this.select = element=>{          // (Re)set select upon creation, for it can be modified during trial
            if (this.disabled)
                return;
            if (this.elements.map(e=>e[0]).indexOf(element)<0)
                return PennEngine.debug.error("Tried to select an element not part of Selector "+this.id);
            this.selections.push(["Selection", element.id, Date.now(), this.elements.map(e=>e[0].id).join(';')]);
            this.frame.css({
                width: element.jQueryElement.outerWidth(),
                height: element.jQueryElement.outerHeight(),
                "pointer-events": "none" // Can click through it
            });
            if (element.jQueryElement.css("position")=="absolute")
                this.frame.css({
                    left: element.jQueryElement.css("left"),
                    top: element.jQueryElement.css("top")
                });
            element.jQueryElement.before(this.frame);
            this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-selected"));
            element.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-selected");
        };
        //PennEngine.controllers.running.safeBind($(document), "keydown", (e)=>{
        PennEngine.events.keypress(e=>{
            if (this.disabled)
                return;
            for (let s = 0; s < this.elements.length; s++){
                let element = this.elements[s], key = "";
                if (element.length>1)
                    key = this.elements[s][1];
                let isSpecialKey = e.key.isSpecialKey();
                let upperE = e.key.toUpperCase();
                let side = {0: "", 1: "LEFT", 2: "RIGHT"};
                if (isSpecialKey===key.replace(/^(Left|Right)/i,'').isSpecialKey() &&
                    (key.toUpperCase() == upperE || key.toUpperCase() == side[e.location]+upperE))
                    return this.select(this.elements[s][0]);
            }
        });
        resolve();
    };

    this.end = function(){
        this.select = ()=>undefined;
        if (this.frame && this.frame instanceof jQuery)
            this.frame.remove();
        if (this.log && this.log instanceof Array){
            if (!this.selections.length)
                PennEngine.controllers.running.save(this.type, this.id, "Selection", "NA", "Never", this.elements.map(e=>e[0].id).join(';')+";No selection happened");
            else if (this.selections.length==1)
                PennEngine.controllers.running.save(this.type, this.id, ...this.selections[0]);
            else if (this.log.indexOf("all")>-1)
                for (let s in this.selections)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.selections[s]);
            else {
                if (this.log.indexOf("first")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.selections[0]);
                if (this.log.indexOf("last")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.selections[this.selections.length-1]);
            }
        }
        this.elements = [];
    };

    this.value = function(){                                // Value is last selection
        if (this.selections.length){
            let selectedElementID = this.selections[this.selections.length-1][1];
            let selectedElement = this.elements.filter(e=>e[0].id==selectedElementID);
            if (selectedElement.length){
                selectedElement = selectedElement[0][0];
                return window.PennController.Elements["get"+selectedElement.type](selectedElement.id);
            }
            else
                return null;
        }
        else
            return null;
    };
    
    this.actions = {
        select: function(resolve, elementCommand){  /* $AC$ Selector PElement.select(element) Selects the specified element $AC$ */
            if (!isNaN(Number(elementCommand)) && Number(elementCommand) >= 0 && Number(elementCommand) < this.elements.length)
                elementCommand = {_element: this.elements[Number(elementCommand)][0]};
            if (elementCommand._element && elementCommand._element.jQueryElement instanceof jQuery){
                let disabled = this.disabled;
                this.disabled = false;
                this.select(elementCommand._element);
                this.disabled = disabled;
            }
            else
                PennEngine.debug.error("Invalid element passed to select command for selector "+this.id);
            resolve();
        },
        shuffle: function(resolve, ...elements){  /* $AC$ Selector PElement.shuffle() Shuffles the positions on the page of the selector's elements $AC$ */
            shuffle.apply(this, [resolve].concat(elements));
        },
        unselect: function(resolve){  /* $AC$ Selector PElement.unselect() Unselects the element that is currently selected $AC$ */
            this.selections.push(["Unselect", "Unselect", Date.now(), this.elements.map(e=>e[0].id).join(';')+";From script"]);
            this.frame.detach();
            this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type+"-selected"));
            resolve();
        },
        wait: function(resolve, test){  /* $AC$ Selector PElement.wait() Waits until a selection happens before proceeding $AC$ */
            if (test=="first" && this.selections.length)
                resolve();
            else {
                let resolved = false;
                let oldSelect = this.select;
                this.select = element => {
                    let once = oldSelect.apply(this, [element]);
                    if (resolved || (this.disabled && !once))
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;    // Disable temporarilly
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled == "tmp")     // Restore old setting if not modified by test
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
        add: function(resolve, ...what){  /* $AC$ Selector PElement.add(elements) Adds one or more elements to the selector $AC$ */
            for (w in what) {
                let element = what[w]._element;
                if (element == undefined || element.id == undefined)
                    PennEngine.debug.error("Invalid element added to selector "+this.id);
                else if (this.elements.map(e=>e[0]).indexOf(element)>-1)
                    PennEngine.debug.error("Element "+element.id+" already part of selector "+this.id);
                else if (element.jQueryElement == undefined || !(element.jQueryElement instanceof jQuery))
                    PennEngine.debug.error("Element "+element.id+" has no visble element to be chosen in selector "+this.id);
                else {
                    this.elements.push([element]);        // Each member of this.elements is an array [2nd member = keys]
                    let addClick = ()=>{
                        if (!this.noClick)
                            element.jQueryElement.css("cursor", "pointer");
                        let oldClick = element.jQueryElement[0].onclick;
                        element.jQueryElement[0].onclick = (...args)=>{
                            if (oldClick instanceof Function)
                                oldClick.apply(element.jQueryElement[0], args);
                            if (!this.noClick)
                                this.select(element);
                        };
                    }
                    if (element.jQueryElement.parent().length)  // If element already displayed
                        addClick();
                    else                                        // Else, add on print
                        element._printCallback.push(addClick);
                }
            }
            resolve();
        },
        callback: function(resolve, ...elementCommands){  /* $AC$ Selector PElement.callback(commands) Will execute the specified command(s) whenever selection happens $AC$ */
            let oldSelect = this.select;
            this.select = async function(element) {
                let disabled = this.disabled;
                oldSelect.apply(this, [element]);
                if (disabled)
                    return;
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        disable: function(resolve){
            this.disabled = true;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", ""));
            this.jQueryContainer.addClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        },
        disableClicks: function(resolve){  /* $AC$ Selector PElement.disableClicks() Disables selection by click $AC$ */
            this.noClick = true;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", ""));
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            if (!this.noClick)
                this.elements.map(element=>element[0].jQueryElement.css("cursor", "pointer"));
            this.jQueryContainer.removeClass("PennController-disabled");
            this.jQueryElement.removeClass("PennController-disabled");    
            resolve();
        },
        enableClicks: function(resolve){  /* $AC$ Selector PElement.enableClicks() Enables selection by click (again) $AC$ */
            this.noClick = false;
            this.elements.map(element=>element[0].jQueryElement.css("cursor", "pointer"));
            resolve();
        },
        frame: function(resolve, css){  /* $AC$ Selector PElement.frame(css) Attributes the CSS style to the selection frame $AC$ */
            this.frame.css.apply(this.frame, ["outline", css]);
            resolve();
        },
        keys: function(resolve, ...keys){  /* $AC$ Selector PElement.keys(keys) Associates the elements in the selector (in the order they were added) with the specified keys $AC$ */
            for (let k = 0; k < keys.length; k++){
                let key = keys[k];
                if (k >= this.elements.length) break;
                if (typeof(key) != "string" && Number(key)>0)
                    key = String.fromCharCode(key);
                this.elements[k] = [this.elements[k][0], key];
            }
            resolve();
        },
        log: function(resolve, ...what){  /* $AC$ Selector PElement.log() Will log any selection to the results file $AC$ */
            if (what.length)
                this.log = what;
            else
                this.log = ["last"];
            resolve();
        },
        once: function(resolve){  /* $AC$ Selector PElement.once() Will disable the selector after the first selection $AC$ */
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
                    return "once";
                };
            }
            resolve();
        },
        shuffle: function(resolve, ...elements){                       // DEPRECATED SINCE BETA 0.3, USE ACTION
            shuffle.apply(this, [resolve].concat(elements));
        }
    };

    this.test = {
        selected: function(elementCommand){  /* $AC$ Selector PElement.test.selected(element) Checks that the specified element, or any element if non specified, is selected $AC$ */
            if (this.selections.length===0)
                return false;
            let selectedId = this.selections[this.selections.length-1][1];
            if (elementCommand == undefined)
                return this.selections.length>0;
            else if (typeof (elementCommand) == "string")
                return elementCommand==selectedId;
            else if (elementCommand._element)
                return elementCommand._element.id == selectedId;
            PennEngine.debug.error("Invalid element tested for Selector "+this.id, elementCommand._element.id);
            return false;
        },
        index: function(elementCommand, index){  /* $AC$ Selector PElement.test.index(element,index) Checks that the specified element is at the specified index position in the selector $AC$ */
            if (elementCommand == undefined || elementCommand._element == undefined)
                return PennEngine.debug.error("Invalid element tested for selector "+this.id, elementCommand._element.id);
            else if (Number(index) >= 0)
                return ( this.elements.map(e=>e[0]).indexOf(elementCommand._element) == Number(index) );
            else 
                return ( this.elements.map(e=>e[0]).indexOf(elementCommand._element) >= 0 );
        }
    };

});

// Add a .settings.selector command to all elements
window.PennController._AddStandardCommands(function(PennEngine){
    this.settings = {
        selector: async function(resolve, selectorRef){  /* $AC$ all PElements.selector(selector) Adds the element to the specified selector $AC$ */
            var selector;
            if (typeof(selectorRef)=="string"){
                let elements = PennEngine.controllers.running.options.elements;
                if (elements.hasOwnProperty("Selector") && elements.Selector.hasOwnProperty(selectorRef))
                    selector = elements.Selector[selectorRef];
                else
                    return PennEngine.debug.error("No selector found named "+selectorRef);
            }
            else if (selectorRef._element && selectorRef._runPromises){
                if (selectorRef._element.type=="Selector"){
                    await selectorRef._runPromises();
                    selector = selectorRef._element;
                }
                else
                    PennEngine.debug.error("Tried to add "+this.name+" to an invalid Selector");
            }
            if (selector.elements.map(e=>e[0]).indexOf(this)>-1)
                PennEngine.debug.error("Element "+this.id+" already part of Selector "+selector.id);
            else if (this.jQueryElement == undefined || !(this.jQueryElement instanceof jQuery))
                PennEngine.debug.error("Element "+this.id+" has no visble element to be chosen in Selector "+selector.id);
            else {
                selector.elements.push([this]);        // Each member of this.elements is an array [2nd member = keys]
                if (!this.noClick)
                    this.jQueryElement.css("cursor", "pointer");
                let oldClick = this.jQueryElement[0].onclick;
                this.jQueryElement[0].onclick = (...args)=>{
                    if (oldClick instanceof Function)
                        oldClick.apply(this.jQueryElement[0], args);
                    if (!selector.noClick)
                        selector.select(this);
                };
            }
            resolve();
        }
    }
});
