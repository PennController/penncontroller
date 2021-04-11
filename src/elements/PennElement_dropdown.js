// DROPDOWN element
/* $AC$ PennController.newDropDown(name,text) Creates a new DropDown element $AC$ */
/* $AC$ PennController.getDropDown(name) Retrieves an existing DropDown element $AC$ */
window.PennController._AddElementType("DropDown", function(PennEngine) {

    this.immediate = function(id, text){
        if (text===undefined){
            text = id;
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "DropDown";
            this.id = id;
        }
        this.id = id;
        this.initialText = text;                                        // Keep track of this for reset
    };

    this.uponCreation = function(resolve){
        this.options = [];
        this.selections = [];
        this.change = ()=>{
            if (this.jQueryElement.attr("disabled"))
                return;
            let value = this.jQueryElement.find("option:selected").val();
            let n = 0;
            for (let i = 0; i<this.options.length; i++)
                if (this.options[i]==value)
                    n = i;
            this.selections.push(["Selected", value, Date.now(), n]);
        }
        this.jQueryElement = $("<select>").append(
            $("<option>").html(this.initialText)
                        .attr({value: this.initialText, selected: true, disabled: true, hidden: true})
        );
        resolve();
    };

    this.value = function(){                                            // Value is text
        let s = this.selections;
        if (s instanceof Array && s.length>0) return s[s.length-1][1];
        else return "";
    };

    this.end = function(){
        if (this.log){
            if (this.selections.length){
                if (typeof(this.log)=="string" && this.log.match(/^\W*first\W*$/i))
                    PennEngine.controllers.running.save(this.type, this.id, ...this.selections[0]);
                else if (typeof(this.log)=="string" && this.log.match(/^\W*all\W*$/i))
                    for (let i=0; i<this.selections.length; i++)
                        PennEngine.controllers.running.save(this.type, this.id, ...this.selections[i]);
                else    // last
                    PennEngine.controllers.running.save(this.type, this.id, ...this.selections[this.selections.length-1]);
            }
            else
                PennEngine.controllers.running.save(this.type, this.id, "Selected", 
                                                    this.jQueryElement.find("option:selected").val(), "Never", "Default");
        }
    }
    
    let t = this;       // Needed to call settings form actions
    this.actions = {
        print: function(resolve, ...args){
            PennEngine.elements.standardCommands.actions.print.call(this, ()=>{
                this.jQueryElement.change(()=>this.change());
                resolve();
            }, ...args);
        },
        shuffle: function(resolve, keepSelected){   /* $AC$ DropDown PElement.shuffle() Shuffles the options currently in the drop-down $AC$ */
            if (keepSelected){
                let selected = this.jQueryElement.find("option:selected");
                if (selected.length)
                    keepSelected = selected.val();
                else
                    keepSelected = false;
            }
            fisherYates(this.options);
            this.jQueryElement.empty();
            this.jQueryElement.append( 
                $("<option>").html(this.initialText)
                        .attr({value: this.initialText, selected: true, disabled: true, hidden: true})
            );
            for (let i = 0; i < this.options.length; i++)
                this.jQueryElement.append( $("<option>").html(this.options[i]).attr("value",this.options[i]) );
            if (keepSelected)
                this.jQueryElement.find("option[value='"+keepSelected+"']").attr("selected",true);
            resolve();
        },
        remove: function(resolve, ...options){
            if (options.length)
                t.settings.remove.call(this, resolve, ...options);
            else
                PennEngine.elements.standardCommands.actions.remove.call(this, resolve);
        },
        select: function(resolve,  option){   /* $AC$ DropDown PElement.select(option) Selects the specified option $AC$ */
            let index = this.options.indexOf(option);
            if (index>-1){
                this.jQueryElement.find("option").removeAttr("selected");
                this.jQueryElement.find("option[value='"+option+"']").attr("selected",true);
            }
            else if (Number(option) > -1 && Number(option) < this.options.length){
                this.jQueryElement.find("option").removeAttr("selected");
                this.jQueryElement.find("option[value='"+this.options[Number(option)]+"']").attr("selected",true);
            }
            resolve();
        },
        wait: function(resolve, test){   /* $AC$ DropDown PElement.wait() Wait until an option is selectd before proceeding $AC$ */
            if (test == "first" && this.selections.length)  // If first and already selected, resolve already
                resolve();
            else {                                          // Else, extend change and do the checks
                let resolved = false;
                let oldChange = this.change;
                this.change = ()=>{
                    oldChange.call(this);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;  // Disable temporarilly
                        this.jQueryElement.attr("disabled", true);
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success") {
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled=="tmp"){
                                this.disabled = oldDisabled;
                                this.jQueryElement.attr("disabled", oldDisabled);
                            }   
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
        add: function(resolve,  ...options){   /* $AC$ DropDown PElement.add(options) Adds one or more options to the drop-down $AC$ */
            for (let i = 0; i < options.length; i++){
                options[i] = String(options[i]);
                if (this.options.indexOf(options[i])<0){
                    this.options.push(options[i]);
                    this.jQueryElement.append($("<option>").html(options[i]).attr('value',options[i]));
                }
            }
            resolve();
        },
        callback: function(resolve, ...commands){
            let oldChange = this.change;
            this.change = async function () {
                let disabled = this.jQueryElement.attr("disabled");
                await oldChange.apply(this);
                if (disabled)
                    return;
                for (let i = 0; i < commands.length; i++){
                    if (commands[i]._runPromises)
                        await commands[i]._runPromises();
                    else if (commands[i] instanceof Function)
                        await commands[i]();
                }
            }
            resolve();
        },
        once: function (resolve) {
            let oldChange = this.change;
            this.change = ()=>{
                oldChange.apply(this);
                this.jQueryElement.attr("disabled", true);
            }
            resolve();
        },
        remove: function(resolve,  option){   /* $AC$ DropDown PElement.remove(option) Removes the specified option from the drop-down $AC$ */
            let index = this.options.indexOf(option);
            if (index>-1){
                this.jQueryElement.find("option[value='"+option+"']").remove();
                this.options.splice(index,1);
            }
            resolve();
        }
    };
    
    this.test = {
        selected: function(option){   /* $AC$ DropDown PElement.test.selected(option) Checks that the specified option, or any if none specified, is selected $AC$ */
            let selected = this.jQueryElement.find("option:selected");
            if (!this.selections.length)
                return false;
            else if (option===undefined)
                return true;
            else if (option == selected.val())
                return true;
            else if (Number(option) > -1 && Number(option) < this.options.length)
                return selected.val() == this.options[Number(option)];
        }
    };

});
