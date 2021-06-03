(function(){

var prefix = null;
let oldResPref = window.PennController.ResetPrefix;
window.PennController.ResetPrefix = function(prefixName) {
    oldResPref(prefixName);
    if (typeof(prefix)=="string")           // Catch the new prefix
        prefix = window[prefixName];
    else
        prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
};

// GROUP element
/* $AC$ PennController.newGroup(name,elements) Creates a new Group element $AC$ */
/* $AC$ PennController.getGroup(name) Retrieves an existing Group element $AC$ */
window.PennController._AddElementType("Group", function(PennEngine) {

    PennEngine.Prerun(()=>{
        for (let get in PennController.Elements){
            if (!get.match(/get[A-Z]/))
                continue;
            let oldGet = PennController.Elements[get];
            PennController.Elements[get] = function (id) {
                if (id instanceof Object && id.hasOwnProperty("type") && id.type == "Group"){
                    let ret = oldGet();
                    let oldSettings = {};
                    let oldActions = {};
                    for (let s in ret.settings)
                        oldSettings[s] = ret.settings[s];
                    for (let a in ret)
                        if (a instanceof Function)
                            oldActions[a] = ret[a];        
                    let elements = [];
                    for (let e in id._element.elements){
                        let element = id._element.elements[e];
                        if (!get.match(element.type))
                            continue;
                        elements.push(element);
                    }
                    if (!elements.length)
                        return PennEngine.debug.error("No element for "+get+" in Group &quot;"+id._element.id+"&quot;");
                    for (let s in ret.settings){
                        ret.settings[s] = function(...rest){
                            for (let e in elements)
                                ret._promises = ret._promises.concat(oldGet(elements[e].id).settings[s](...rest)._promises);
                            return ret;
                        }
                    }
                    for (let a in ret){
                        if (a instanceof Function){
                            ret[a] = function(...rest){
                                for (let e in elements)
                                    ret._promises = ret._promises.concat(oldGet(elements[e].id)[a](...rest)._promises);
                                return ret;
                            }
                        }
                    }
                    return ret;
                }
                else
                    return oldGet(id);
            }
            if (prefix)
                prefix[get] = window.PennController.Elements[get];
        }
    });

    function shuffle(resolve, ...elementCommands){
        let elementsToShuffle = [];
        if (!elementCommands.length)                // If no argument, just add every element
            elementsToShuffle = [].concat(this.elements);
        else {                                      // Else, first feed elementsToShuffle
            for (let e in elementCommands) {        // Go through each elementCommand
                if (!(elementCommands[e]._element && elementCommands[e]._element.jQueryElement instanceof jQuery)){
                    PennEngine.debug.error("Invalid element #"+e+" in shuffling Group "+this.id);
                    continue;
                }
                let index = this.elements.map(e=>e[0]).indexOf(elementCommands[e]._element);
                if (index<0){
                    PennEngine.debug.error("Cannot shuffle element "+elementCommands[e]._element.id+" for it has not been added to Group "+this.id);
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
            m.old.element.jQueryElement.before(shuf);    // Place a shuffle tag before the unshuffled element
            shuf.css({                                      // Store unshuffled element's style to apply to new element later
                        position: m.old.element.jQueryElement.css("position"),
                        left: m.old.element.jQueryElement.css("left"),
                        top: m.old.element.jQueryElement.css("top")
                });
            shuffleTags.push(shuf);                         // Add the shuffle tag to the list
        }); 
        shuffleTags.map(tag=>{                              // Go through each shuffle tag
            let i = tag.attr('i');                          // Retrieve the index in the map
            let jQueryElementToMove = map[i].new.element.jQueryElement;
            tag.after( jQueryElementToMove );               // Move the new element after the tag
            jQueryElementToMove.css({                       // And apply the old element's style
                position: tag.css("position"),
                left: tag.css("left"),
                top: tag.css("top")
            });
            tag.remove();                                   // Remove shuffle tag from DOM
        });
        resolve();
    }

    this.immediate = function(id, ...elements){
        if (typeof(id) != "string" && id instanceof Object && id.hasOwnProperty("_element")){
            elements = [id, ...elements];
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Group";
            this.id = id;
        }
        this.initialElements = elements;
    };

    this.uponCreation = function(resolve){
        this.elements = this.initialElements.map(command=>command._element||PennEngine.debug.error("Invalid element passed to Group"));
        resolve();
    };

    this.end = function(){
        this.elements = [];
    };

    this.value = function(){                                // Value is last selection
        return this.elements.length;
    };
    
    this.actions = {
        shuffle: function(resolve, ...elementCommands){ /* $AC$ Group PElement.shuffle() Shuffles the positions of the elements on the page $AC$ */
            shuffle.apply(this, [resolve].concat(elementCommands));
        }
    };
    
    let t = this;   // Needed to call settings from actions
    this.actions = {
        remove: function(resolve, ...elementCommands){
            if (elementCommands.length)
                t.settings.remove.call(this, resolve, ...elementCommands);
            else
                PennEngine.elements.standardCommands.actions.remove.call(this, resolve);
        }
    };

    this.settings = {
        add: function(resolve, ...elementCommands){ /* $AC$ Group PElement.add(elements) Adds one or more elements to the group $AC$ */
            for (e in elementCommands) {
                let element = elementCommands[e]._element;
                if (element == undefined || element.id == undefined)
                    PennEngine.debug.error("Invalid element added to Group "+this.id);
                else if (this.elements.indexOf(element)>-1)
                    PennEngine.debug.error("Element &quot;"+element.id+"&quot; already part of Group "+this.id);
                else
                    this.elements.push(element);
            }
            resolve();
        },
        remove: function(resolve, ...elementCommands){ /* $AC$ Group PElement.remove(elements) Removes one or more elements from the group $AC$ */
            for (e in elementCommands) {
                let element = elementCommands[e]._element;
                let index = this.elements.indexOf(element);
                if (index>-1)
                    this.elements = this.elements.splice(index,1);
            }
            resolve();
        }
    };

    for (let a in PennEngine.elements.standardCommands.actions){
        this.actions[a] = async function(resolve, ...rest){
            for (let e = 0; e < this.elements.length; e++)
                await PennController.Elements['get'+this.elements[e].type](this.elements[e].id)[a](...rest)._runPromises();
            resolve();
        }
    }
    for (let s in PennEngine.elements.standardCommands.settings){
        this.settings[s] = async function(resolve, ...rest){
            for (let e = 0; e < this.elements.length; e++){
                console.log("this",this.elements, this.elements[e].type);
                await PennController.Elements['get'+this.elements[e].type](this.elements[e].id).settings[s](...rest)._runPromises();
            }
            resolve();
        }
    }

    this.test = {
        index: function(elementCommand, index){     /* $AC$ Group PElement.test.index(element,index) Checks the index of the specified element in the group $AC$ */
            if (elementCommand == undefined || elementCommand._element == undefined)
                return PennEngine.debug.error("Invalid element tested for Group "+this.id, elementCommand._element.id);
            else if (Number(index) >= 0)
                return ( this.elements.indexOf(elementCommand._element) == Number(index) );
            else 
                return ( this.elements.indexOf(elementCommand._element) >= 0 );
        }
    };

});

// Add a .settings.group command to all elements
window.PennController._AddStandardCommands(function(PennEngine){
    this.settings = {
        group: async function(resolve, groupRef){     /* $AC$ all PElements.group(name) Adds the element to the Group element with the specified name $AC$ */
            var group;
            if (typeof(groupRef)=="string"){
                let elements = PennEngine.controllers.running.options.elements;
                if (elements.hasOwnProperty("Group") && elements.Group.hasOwnProperty(groupRef))
                    group = elements.Group[groupRef];
                else
                    return PennEngine.debug.error("No Group found named &quot;"+groupRef+"&quot;");
            }
            else if (groupRef._element && groupRef._runPromises){
                if (groupRef._element.type=="Group"){
                    await groupRef._runPromises();
                    group = groupRef._element;
                }
                else
                    PennEngine.debug.error("Tried to add &quot;"+this.name+"&quot; to an invalid Group");
            }
            if (group.elements.indexOf(this)>-1)
                PennEngine.debug.error("Element &quot;"+this.id+"&quot; already part of Group &quot;"+group.id+"&quot;");
            else
                group.elements.push(this);
            resolve();
        }
    }
});

})();
