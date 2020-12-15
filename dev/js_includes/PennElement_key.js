// KEY element
/* $AC$ PennController.newKey(name,key) Creates a new Key element $AC$ */
/* $AC$ PennController.getKey(name) Retrieves an existing Key element $AC$ */
window.PennController._AddElementType("Key", function(PennEngine) {

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, ...keys){
        if (keys.length<1){
            keys = [id];
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Key";
            this.id = id;
        }
        this.keys = [];
        this.specialKeys = [];
        for (let i = 0 ; i < keys.length ; i++) {
            if (Number(keys[i])>0)
                this.keys.push(String.fromCharCode(keys[i]));
            else if (typeof(keys[i])!="string")
                PennEngine.debug.error("Invalid key(s) passed to new Key &quot;"+id+"&quot; (should be a string or a key code number)", keys[i]);
            else if (keys[i].isSpecialKey() || keys[i].replace(/^(Left|Right)/i,'').isSpecialKey())
                this.specialKeys.push(keys[i].toUpperCase());
            else if (keys[i].length)
                this.keys.push(keys[i].toUpperCase());
        }
        //this.keys = keys;
        //this.keys.replace(/shift/i,String.fromCharCode(16));
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.pressed = [];
        this.pressedWait = [];
        this.log = false;
        this.enabled = true;
        PennEngine.events.keypress(e=>{
            if (!this.enabled)
                return;
            let isSpecialKey = e.key.isSpecialKey();
            let upperE = e.key.toUpperCase();
            let side = {0: "", 1: "LEFT", 2: "RIGHT"};
            if ((this.keys.length==0&&this.specialKeys.length==0) || // If no key specified, any key press will do
                (isSpecialKey && this.specialKeys.filter(k =>(k==upperE||k===side[e.location]+upperE)).length) || // Special key
                (!isSpecialKey && this.keys.filter(k=>k.indexOf(upperE)>-1).length)) // Regular list of keys
                    this.press(e.key);
        });
        this.press = key=>{                                 // (Re)set press upon creation for it can be modified during trial
            this.pressed.push(["PressedKey", key.toUpperCase(), Date.now(), "NULL"]);
        };
        resolve();
    }

    // This is executed at the end of a trial
    this.end = function(){
        if (this.log && this.log instanceof Array){
            if (this.pressed.length==0)
                PennEngine.controllers.running.save(this.type, this.id, "Key", "NA", "Never", "NULL");
            else if (this.log.indexOf("all")>-1){
                for (let key in this.pressed)                   // Save any clicks if logging
                    PennEngine.controllers.running.save(this.type, this.id, ...this.pressed[key]);
            }
            else if (this.log.indexOf("wait")>-1) {
                let atleastone = false;
                for (let key in this.pressed)
                    if (this.pressed[key][3]=="Wait success"){
                        PennEngine.controllers.running.save(this.type, this.id, ...this.pressed[key]);
                        atleastone = true;
                    }
                if (!atleastone)
                    PennEngine.controllers.running.save(this.type, this.id, "Key", "NA", "Never", "(failed keypresses happened)");
            }
            else if (this.pressed.length==1)
                PennEngine.controllers.running.save(this.type, this.id, ...this.pressed[0]);
            else {
                if (this.log.indexOf("first")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.pressed[0]);
                if (this.log.indexOf("last")>-1)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.pressed[this.pressed.length-1]);
            }
        }
    };

    this.value = function(){                                // Value is last key that was pressed
        if (this.pressed.length)
            return this.pressed[this.pressed.length-1][1];
        else
            return "";
    };
    
    this.actions = {
        wait: function(resolve, test){  /* $AC$ Key PElement.wait() Waits until the key, or one of the keys, is pressed before proceeding $AC$ */
            if (test == "first" && this.pressed.length)     // If first and already pressed, resolve already
                resolve();
            else {                                          // Else, extend remove and do the checks
                let resolved = false;
                let oldPress = this.press;
                // Unfocus the active element if disabled, as it would prevent keydown events
                let el = document.activeElement;
                while (el){
                    if (el.disabled){
                        el.blur();
                        el = null;
                    }
                    else
                        el = el.parentElement;
                }
                this.press = key => {
                    oldPress.apply(this, [key]);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldEnabled = this.enabled;      // Disable temporarilly
                        this.enabled = 0;
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                this.pressed[this.pressed.length-1][3] = "Wait success";
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            else 
                                this.pressed[this.pressed.length-1][3] = "Wait failure";
                            if (this.enabled === 0)         // Restore old setting if not modified by test
                                this.enabled = oldEnabled;
                        });
                    }
                    else{                                   // If no (valid) test command was provided
                        this.pressed[this.pressed.length-1][3] = "Wait success";
                        resolved = true;
                        resolve();                          // resolve anyway  
                    }
                };
            }
        }
    };
    
    this.settings = {
        callback: function(resolve, ...elementCommands){  /* $AC$ Key PElement.callback(commands) Will run the specified command(s) whenever a valid keypress happens $AC$ */
            let oldPress = this.press;
            this.press = async function (key) {
                oldPress.apply(this, [key]);
                if (this.enabled)
                    for (let c in elementCommands)
                        await elementCommands[c]._runPromises();
            };
            resolve();
        },
        disable: function(resolve){ /* since 1.2 */   /* $AC$ Key PElement.disable() Stops listening to keypresses $AC$ */
            this.enabled = false;
            resolve();
        },
        enable: function(resolve){ /* since 1.2 */   /* $AC$ Key PElement.enable() Starts listening to keypresses (again) $AC$ */
            this.enabled = true;
            resolve();
        },
        log: function(resolve,  ...what){   /* $AC$ Key PElement.log() Will log any valid keypress in the results file $AC$ */
            if (what.length)
                this.log = what;
            else
                this.log = ["wait"];
            resolve();
        }
    };

    this.test = {
        pressed: function(keys, first){   /* $AC$ Key PElement.test.pressed(key) Checks that the key, or any key if none specified, has been pressed before $AC$ */
            for (let k in this.pressed){
                let key = this.pressed[k][1];
                if (Number(keys)>0 && key.toUpperCase() == String.fromCharCode(keys).toUpperCase())
                    return true;                            // If one keycode matches, true
                else if (typeof(keys)=="string" && keys.toUpperCase() == key.toUpperCase())
                    return true;                            // If one key that was pressed is contained in keys, true
                else if (typeof(keys)=="undefined")
                    return true;                            // Inside the for loop: at least one key was pressed, true
                else if (first)
                    return false;                           // If only checking first and no match, false
            }
            return false;                                   // No match, false
        }
    };

});
