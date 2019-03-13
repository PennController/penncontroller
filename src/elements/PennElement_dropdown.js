// TEXT element
window.PennController._AddElementType("DropDown", function(PennEngine) {

    this.immediate = function(id, text){
        if (text===undefined){
            text = id;
            this.id = PennEngine.utils.guidGenerator();
        }
        this.initialText = text;                                        // Keep track of this for reset
        this.text = text;
    };

    this.uponCreation = function(resolve){
        this.options = [];
        this.selections = [];
        this.change = ()=>{
            if (this.jQueryElement.attr("disabled"))
                return;
            this.selections.push(["Selected", this.jQueryElement.find("option:selected").val(), Date.now(), "NULL"]);
        }
        this.jQueryElement = $("<select>").append(
            $("<option>").html(this.initialText)
                        .attr({value: this.initialText, selected: true, disabled: true, hidden: true})
        ).change(()=>this.change());
        resolve();
    };

    this.value = function(){                                            // Value is text
        return this.text;
    };

    this.end = function(){
        if (this.log){
            if (this.selections.length){
                if (typeof(this.log)=="string" && this.log.match(/^\W*first\W*$/i))
                    PennEngine.controllers.running.save(this.type, this.id, "Selected", 
                                                        this.selections[0][1], this.selections[0][2], "First");
                else if (typeof(this.log)=="string" && this.log.match(/^\W*all\W*$/i))
                    for (let i=0; i<this.selections.length; i++)
                        PennEngine.controllers.running.save(this.type, this.id, ...this.selections[i]);
                else    // last
                    PennEngine.controllers.running.save(this.type, this.id, "Selected", this.selections[this.selections.length-1][1],
                                                         this.selections[this.selections.length-1][2], "Last");
            }
            else
                PennEngine.controllers.running.save(this.type, this.id, "Selected", 
                                                    this.jQueryElement.find("option:selected").val(), "Never", "Default");
        }
    }
    
    this.actions = {
        shuffle: function(resolve){
            fisherYates(this.options);
            this.jQueryElement.empty();
            this.jQueryElement.append( 
                $("<option>").html(this.initialText)
                        .attr({value: this.initialText, selected: true, disabled: true, hidden: true})
            );
            for (let i = 0; i < this.options.length; i++)
                this.jQueryElement.append( $("<option>").html(this.options[i]).attr("value",this.options[i]) );
            resolve();
        },
        select: function(resolve,  option, log){
            let index = this.options.indexOf(option);
            if (index>-1){
                this.jQueryElement.find("option").removeAttr("selected");
                this.jQueryElement.find("option[value='"+option+"']").attr("selected",true);
            }
            resolve();
        }
    };

    this.settings = {
        add: function(resolve,  ...options){
            for (let i = 0; i < options.length; i++){
                options[i] = String(options[i]);
                if (this.options.indexOf(options[i])<0){
                    this.options.push(options[i]);
                    this.jQueryElement.append($("<option>").html(options[i]).attr('value',options[i]));
                }
            }
            resolve();
        },
        remove: function(resolve,  option){
            let index = this.options.indexOf(option);
            if (index>-1){
                this.jQueryElement.find("option[value='"+option+"']").remove();
                this.options.splice(index,1);
            }
            resolve();
        }
    };
    
    this.test = {
        selected: function(option){
            let index = this.options.indexOf(option);
            if (index<0)
                return false;
            return this.jQueryElement.find("option[value='"+option+"']").attr("selected");
        }
    };

});