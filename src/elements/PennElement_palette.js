// PALETTE element
window.PennController._AddElementType("Palette", function(PennEngine) {

    this.immediate = function(id, mode){
        this.mode = mode||"background";
    };

    this.uponCreation = function(resolve){
        this.currentColor = null;
        this.enabled = true;
        this.elements = [];
        this.colors = [];
        this.brushes = [];
        this.log = false;
        this.select = element=>{
            if (!this.enabled||!this.currentColor)
                return;
            let index = this.elements.map(e=>e[0]).indexOf(element);
            if (index<0)
                return;
            this.elements[index][1] = this.currentColor;
            let jel = element.jQueryElement;
            this.brushes.push( [ element.id , this.currentColor , Date.now() ] );
            if (this.mode=="background")
                jel.css('background-color', this.currentColor);
            else{
                if (jel._tinter && jel._tinter instanceof jQuery)
                    jel._tinter.remove();
                jel._tinter = $('<div>').css({
                    display: 'block',
                    position: 'absolute',
                    width: jel.width(),
                    height: jel.height(),
                    'margin-top': -1 * jel.width(),
                    background: this.elements[index][1],
                    opacity: 0.5
                });
                jel.before( jel._tinter );
            }
        };
        resolve();
    };

    this.end = function(){
        this.enabled = false;
        $('#bod').css('cursor','default');
        if (this.log){
            if (this.log == "all")
                for (let b = 0; b < this.brushes.length; b++)
                    PennEngine.controllers.running.save(this.type, this.id, this.brushes[b][0], this.brushes[b][1], this.brushes[b][2], "NULL");
            for (let e = 0; e < this.elements.length; e++)
                PennEngine.controllers.running.save(this.type, this.id, this.elements[e][0].id, this.elements[e][1], "Final", "NULL");
        }
    };

    this.value = function(){                                    // Value is how many brushes there have been
        return this.brushes.length;
    };
    
    this.actions = {
        brush: function(resolve, element, color){
            if (element._element){
                let oldCurrent = this.currentColor;
                this.currentColor = color;
                this.select( element._element );
                this.currentColor = oldCurrent;
            }
            resolve();
        },
        clear: function(resolve){
            for (let e in this.elements){
                if (this.mode=="background")
                    this.elements[e][0].jQueryElement.css('background-color', 'transparent');
                else if (this.elements[e].jQueryElement._tinter)
                    this.elements[e][0].jQueryElement._tinter.remove();
                this.elements[e][1] = null;
            }
            resolve();
        },
        unselect: function(resolve){
            $('.PennController-'+this.type+'-palette-selected').removeClass('PennController-'+this.type+'-palette-selected');
            $('#bod').css('cursor','default');
            this.currentColor = null;
            resolve();
        },
        wait: function(resolve, test){
            if (test=="first" && this.brushes.length)
                resolve();
            else {
                let resolved = false;
                let oldSelect = this.select;
                this.select = element => {
                    let once = oldSelect.apply(this, [element]);
                    if (resolved || (!this.enabled && !once))
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
        addColor: function(resolve, color, ...elementsOrKeys){
            let index = this.colors.indexOf(color);
            if (index<0)
                this.colors.push(color);
            let allElements = [];
            let selectColor = ()=>{
                if (this.colors.indexOf(color)<0)
                    return;
                this.currentColor = color;
                $('.PennController-'+this.type+'-palette-selected').removeClass('PennController-'+this.type+'-palette-selected');
                allElements.map(e=>e.jQueryElement.addClass("PennController-"+this.type+"-palette-selected"));
                $('#bod').css('cursor','crosshair');
            };
            for (let e in elementsOrKeys){
                let elementOrKey = elementsOrKeys[e];
                if (typeof(elementOrKey)=="string")
                    PennEngine.events.keypress(e=>{
                        if (elementOrKey.toUpperCase().indexOf(String.fromCharCode(e.which).toUpperCase())>-1)
                            selectColor();
                        else if (e.which==27) { // ESCAPE
                            $('.PennController-'+this.type+'-palette-selected').removeClass('PennController-'+this.type+'-palette-selected');
                            $('#bod').css('cursor','default');
                            this.currentColor = null;
                        }
                    })
                else if (elementOrKey._element && elementOrKey._element.jQueryElement){
                    elementOrKey._element.jQueryElement.bind("click", selectColor);
                    elementOrKey._element.jQueryElement.addClass("PennController-"+this.type+"-palette");
                    elementOrKey._element.jQueryElement.addClass("PennController-"+this.id+"-palette");
                    allElements.push( elementOrKey._element );
                }
            }
            resolve();
        },
        addElement: function(resolve, ...elements){
            for (let e in elements){
                let element = elements[e];
                if (element._element && element._element.jQueryElement){
                    element._element.jQueryElement.bind("click", ()=>{
                        this.select( element._element );
                    });
                    if (this.elements.map(e=>e[0]).indexOf(element._element)<0)
                        this.elements.push([element._element, null]);
                }
            }
            resolve();
        },
        callback: function(resolve, ...commands){
            let oldSelect = this.select;
            this.select = async function(element) {
                oldSelect.apply(this, [element]);
                if (!this.enabled)
                    return;
                for (let c in commands)
                    await commands[c]._runPromises();
            };
            resolve();
        },
        enable: function(resolve){
            this.enabled = true;
            resolve();
        },
        disable: function(resolve){
            this.enabled = false;
            resolve();
        },
        log: function(resolve, what){
            this.log = what||"all";
            resolve();
        },
        once: function(resolve){
            if (this.brushes.length){
                this.enabled = false;
                $('.PennController-'+this.type+'-palette-selected').removeClass('PennController-'+this.type+'-palette-selected');
                $('#bod').css('cursor','default');
                this.currentColor = null;
            }
            else{
                let oldSelect = this.select;
                this.select = element => {
                    oldSelect.apply(this, [element]);
                    if (!this.enabled)
                        return;
                    this.enabled = false;
                    $('.PennController-'+this.type+'-palette-selected').removeClass('PennController-'+this.type+'-palette-selected');
                    $('#bod').css('cursor','default');
                    this.currentColor = null;
                    return "once";
                };
            }
            resolve();
        },
        removeColor: function(resolve, color){
            let index = this.colors.indexOf(color);
            if (index>-1)
                this.colors.splice(index,1);
            resolve();
        }
    };

    this.test = {
        color: function( element , color ) {
            if ( element._element && element._element){
                let index = this.elements.map(e=>e[0]).indexOf(element._element);
                if (index<0) 
                    return false;
                return this.elements[index][1] == color;
            }
            return false;
        }
    }

});