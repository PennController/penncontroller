// TEXTINPUT element
window.PennController._AddElementType("TextInput", function(PennEngine) {

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, text){
        this.initialText = text;                            // In case this gets changed later
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.text = this.initialText;
        this.jQueryElement = $("<textarea>");
        this.jQueryElement.attr({name: this.id, rows: 1, cols: 40}).val(this.text);
        // Default settings
        this.rows = 1;
        this.disabled = false;
        this.log = [];
        this.types = [];
        this.validations = [];
        this.entered = false;
        this.pressEnter = ()=>{
            this.entered = true;
            this.validations.push(["EnterReturn",this.jQueryElement.val(),Date.now(),"NULL"]);
        };
        this.jQueryElement.bind("keydown", e=>{             // KEYDOWN
            let text = this.jQueryElement.val();
            this.types.push(["Type",text,Date.now(),e.which]);// Save _all_ typing events
            if (e.keyCode==13){                             // CASE: Enter/Return
                this.pressEnter();
                if (this.rows == 1)
                    return false;                           // Prevent insertion if one-line input
                else if (this.rows > 1){                    // Check # of lines if limit on rows
                    let returns = text.match(/[\r\n]/g);    // How many returns/newlines already
                    if (returns instanceof Array && returns.length+1 >= this.rows)
                        return false;                       // Prevent if limit reached
                }
            }
        });
        this.jQueryElement.keypress(e=>{
            if (e.charCode && this.length==this.jQueryElement.val().length)
                return false;                               // Prevent insertion if printable character and length limit reached
        })
        this.jQueryElement.bind("keyup", e=>{               // KEYUP [special case: pasted text]
            let text = this.jQueryElement.val();
            if (this.length && text.length > this.length)   // Truncate text if longer than max chars
                this.jQueryElement.val(text.substr(0,this.length));
            let returns = text.match(/[\r\n]/g);            // How many returns/newlines in text now
            if (this.rows > 0 && returns instanceof Array && returns.length >= this.rows+1) {
                let regx = "([\\n\\r]?[^\\n\\r]*){"+this.rows+"}";      // Capture text until correct # of returns/newlines
                this.jQueryElement.val(text.match(RegExp(regx))[0]);    // Truncate text
            }
        });
        resolve();
    }

    this.end = function(){
        if (!this.log || !(this.log instanceof Array))
            return;
        if (this.log.indexOf("all")>-1){                            // Special case: log all typing events
            let now = Date.now();
            PennEngine.controllers.running.save(this.type, this.id, "Final", csv_url_encode(this.jQueryElement.val()), now, "All saved, see documentation");
            if (this.types.length){
                PennEngine.controllers.running.save(this.type, this.id, "NTypingEvents", this.types.length, now, "All saved, see documentation");
                let texts = [], times = [], keys = [];
                this.types.map(t=>{ texts.push(csv_url_encode(t[1])); times.push(t[2]); keys.push(t[3]); });
                PennEngine.controllers.running.save(this.type, this.id, "TypingEvent", "Keys", "NULL", ...keys);   // As many comments
                PennEngine.controllers.running.save(this.type, this.id, "TypingEvent", "Texts", "NULL", ...texts);
                PennEngine.controllers.running.save(this.type, this.id, "TypingEvent", "Times", "NULL", ...times); // as typing events
            }
            for (let v in this.validations){
                this.validations[v][1] = csv_url_encode(this.validations[v][1]);
                PennEngine.controllers.running.save(this.type, this.id, ...this.validations[v]);
            }
        }
        else {
            if (this.log.indexOf("validate")>-1)
                for (let v in this.validations){
                    this.validations[v][1] = csv_url_encode(this.validations[v][1]);
                    PennEngine.controllers.running.save(this.type, this.id, ...this.validations[v]);
                }
            if (this.log.indexOf("final")>-1)
                PennEngine.controllers.running.save(this.type, this.id, "Final", csv_url_encode(this.jQueryElement.val()), Date.now(), "NULL");
            if (this.log.indexOf("first")>-1 && this.types.length){
                let first = [].concat(this.types[0]);               // Create a copy, do not modify original
                first[0] = "First";
                first[1] = csv_url_encode(first[1]);
                PennEngine.controllers.running.save(this.type, this.id, ...first);
            }
            if (this.log.indexOf("last")>-1 && this.types.length){
                let last = [].concat(this.types[this.types.length-1]); // Create a copy, do not modify original
                last[0] = "Last";
                last[1] = csv_url_encode(last[1]);
                PennEngine.controllers.running.save(this.type, this.id, ...last);
            }
        }
    };

    this.value = function(){                        // Value is content of box
        return this.jQueryElement.val();
    };
    
    this.actions = {
        print: function(resolve, where){
            let afterPrint = ()=>{
                this.jQueryElement.focus();         // Put focus on element when printed
                resolve();
            }
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, where]);
        },
        wait: function(resolve, test){
            if (test == "first" && this.entered)    // If first and already entered, resolve already
                resolve();
            else {                                  // Else, extend pressEnter and do the checks
                let resolved = false;
                let oldPressEnter = this.pressEnter;
                this.pressEnter = ()=> {
                    oldPressEnter.apply(this);
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
        length: function(resolve, n){
            this.length = Number(n);
            if (isNaN(this.length))
                this.length = 0;
            resolve();
        },
        lines: function(resolve, n){
            this.rows = Number(n);
            if (isNaN(this.rows))
                this.rows = 0;
            this.jQueryElement.attr("rows", this.rows);
            resolve();
        },
        log: function(resolve, ...what){
            if (!what.length)
                what = ["final", "validate", "first"];
            this.log = what;
            if (what.indexOf("all")>-1)
                console.warn("Now logging all typing events in inputText element "+this.id+
                             ": this can drastically increase the weight of the results file");
            resolve();
        },
        once: function(resolve){
            if (this.entered)
                this.jQueryElement.attr("disabled", true);
            else{
                let oldPressEnter = this.pressEnter;
                this.pressEnter = function(){
                    oldPressEnter.apply(this);
                    this.jQueryElement.attr("disabled",true)
                };
            }
            resolve();
        },
        text: function(resolve, text){
            this.text = text;
            this.jQueryElement.val(text);
            resolve();
        }
    };

    this.test = {
        text: function(text){
            if (text instanceof RegExp)
                return this.jQueryElement.val().match(text);
            else
                return this.jQueryElement.val() == text;
        }
    };

});