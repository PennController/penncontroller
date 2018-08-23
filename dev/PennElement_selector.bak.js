// SELECTOR element
PennController._AddElementType(function(PennEngine) {

    this.name = "Selector";

    function shuffle(resolve, ...elementCommands){
        let elementsToShuffle = [];
        if (!elementCommands.length)                // If no argument, just add every element
            elementsToShuffle = [].concat(this.shuffledElements);
        else {                                      // Else, first feed elementsToShuffle
            for (let e in elementCommands) {        // Go through each elementCommand
                if (!(elementCommands._element && elementCommands._element.jQueryElement instanceof jQuery)){
                    console.warn("Invalid element #"+e+" in shuffling selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                    continue;
                }
                let index = this.shuffledElements.map(e=>e[0]).indexOf(elementCommands._element);
                if (index<0){
                    console.warn("Cannot shuffle element "+element.id+" for it has not been added to selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
                    continue;
                }
                elementsToShuffle.push(this.shuffledElements[index]);
            }
        }
        let shuffled = [].concat(elementsToShuffle);
        fisherYates(shuffled);                              // Now, shuffle the elements
        let map = shuffled.map((s,i)=>Object({              // Create an association map of old to new elements
            old: {element: elementsToShuffle[i], index: this.shuffledElements.indexOf(elementsToShuffle[i])},
            new: {element: s, index: this.shuffledElements.indexOf(s)}
        }));
        let shuffleTags = [];
        map.map((m,i)=>{
            this.shuffledElements[m.old.index] = m.new.element;
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
        console.log("Unshuffled:", this.elements.map(s=>s[0].id), this.elements.map(s=>s[1]));
        console.log("Shuffled:", this.shuffledElements.map(s=>s[0].id), this.shuffledElements.map(s=>s[1]));
        resolve();

        // let elementsToShuffle = [];
        // if (!elementCommands.length)                // If no argument, just add every element's index
        //     for (let e in this.elements)
        //         elementsToShuffle.push(e);
        // else {                                      // Else, first feed elementsToShuffle
        //     for (let e in elementCommands) {        // Go through each elementCommand
        //         if (!(elementCommands._element && elementCommands._element.jQueryElement instanceof jQuery)){
        //             console.warn("Invalid element #"+e+" in shuffling selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
        //             continue;
        //         }
        //         let index = this.elements.map(e=>e[0]).indexOf(elementCommands._element);
        //         if (index<0){
        //             console.warn("Cannot shuffle element "+element.id+" for it has not been added to selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
        //             continue;
        //         }
        //         elementsToShuffle.push(index);
        //     }
        // }
        // let unshuffledIndices = [].concat(elementsToShuffle);
        // let shuffledIndices = elementsToShuffle;
        // fisherYates(shuffledIndices);                       // Now, shuffle the elements' indices
        // this.shuffledElements = [].concat(this.elements);
        // let shuffleTags = [];
        // for (let e in shuffledIndices) {                    // Go through each index now
        //     let indexOld = unshuffledIndices[e];            //  e.g. [1,3]
        //     let indexNew = shuffledIndices[e];              //  e.g. [3,1]
        //     this.shuffledElements[indexOld] = this.elements[indexNew]; // e.g. [t.el[0], t.el[3], t.el[2], t.el[1]]
        //                                                                //       same     updated  same     updated
        //     let shuf = $("<shuffle>").attr("id", indexOld)  // SHUFFLE tag to indicate correspondance in DOM
        //                              .css({                 // Associate indexOld to indexNew's element (but could be other way, just be consistent)
        //         position: this.elements[indexNew][0].jQueryElement.css("position"),
        //         left: this.elements[indexNew][0].jQueryElement.css("left"),
        //         top: this.elements[indexNew][0].jQueryElement.css("top")
        //     });
        //     this.elements[indexNew][0].jQueryElement.before(shuf);  // Later, will replace shuf with indexOld's element
        //     shuffleTags.push(shuf);
        // } 
        // shuffleTags.map(tag=>{                               // Go through each shuffle tag
        //     let index = tag.attr('id');
        //     let jQueryElement = this.elements[index][0].jQueryElement;
        //     tag.after(jQueryElement);                       // Add the indexOld's element here
        //     jQueryElement.css({                             // And update relevant CSS
        //         position: tag.css("position"),
        //         left: tag.css("left"),
        //         top: tag.css("top")
        //     });
        //     if (this.selections.length && this.selections[this.selections.length-1][1] == this.elements[index][0].id)
        //         jQueryElement.before(this.frame);           // Update selection frame
        //     tag.remove();                                   // Remove tag from DOM
        // });
        // console.log("Unshuffled:", this.elements.map(s=>s[0].id), this.elements.map(s=>s[1]));
        // console.log("Shuffled:", this.shuffledElements.map(s=>s[0].id), this.shuffledElements.map(s=>s[1]));
    }

    this.immediate = function(id){
    };

    this.uponCreation = function(resolve){
        this.elements = [];                 // [[element, keys], [element, keys], ...]
        this.shuffledElements = [];         // Same
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
            console.log("Selected", element);
            if (this.disabled)
                return;
            if (this.elements.map(e=>e[0]).indexOf(element)<0)
                return console.warn("Tried to select an element not part of selector "+this.id+" in PennController #"+PennEngine.controllers.running.id);
            this.selections.push(["Selection", element.id, Date.now(), "NULL"]);
            this.frame.css({
                width: element.jQueryElement.width(),
                height: element.jQueryElement.height()
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
            for (let s in this.shuffledElements){
                let key = "";
                if (this.shuffledElements[s].length>1)
                    key = this.shuffledElements[s][1];
                if (key && typeof(key)=="string" && key.match(RegExp(String.fromCharCode(e.which), "i")))
                    return this.select(this.shuffledElements[s][0]);
            }
        });
        resolve();
    };

    this.end = function(){
        this.elements = [];
        this.shuffledElements = [];
        this.frame.remove();
        if (this.log)
            for (let s in this.selections)
                PennEngine.controllers.running.save(this.type, this.id, ...this.selections[s]);
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
            console.log("shuffling");
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
                    oldSelect.apply(this, [element]);
                    if (this.disabled || resolved)
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
                    this.elements.push([element]);                // Each member of this.elements is an array [2nd member = keys]
                    this.shuffledElements.push([element]);        // When adding an element, append it to shuffledElements as well
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
        enableClicks: function(resolve, what){
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
                this.shuffledElements[k] = [this.shuffledElements[k][0], key];
            }
            console.log("Reassigned keys", this.shuffledElements.map(s=>s[0].id), this.shuffledElements.map(s=>s[1]));
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