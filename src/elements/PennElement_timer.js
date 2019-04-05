// TIMER element
/* $AC$ PennController.newTimer(name,duration) Creates a new Timer element $AC$ */
/* $AC$ PennController.getTimer(name) Retrieves an existing Timer element $AC$ */
window.PennController._AddElementType("Timer", function(PennEngine) {

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, duration){
        if (duration===undefined&&Number(id)>0){
            this.id = PennEngine.utils.guidGenerator();
            duration = id;
        }
        this.duration = 0;
        if (Number(duration)>0)
            this.duration = Number(duration);
        else
            PennEngine.debug.error("Invalid duration for Timer &quot;"+id+"&quot;");
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.elapsed = false;
        this.instance = undefined;          // The timeout instance
        this.events = [];
        this.log = false;
        this.running = false;
        this.start = ()=>{                  // Starts the timer
            if (this.instance)
                clearTimeout(this.instance);// Clear any previous running
            this.events.push(["Start","Start",Date.now(),"NULL"]);
            this.instance = setTimeout(()=>this.done(), this.duration);
            this.running = true;
        };
        this.done = ()=>{                   // Called when finished running
            this.events.push(["End","End",Date.now(),"NULL"]);
            this.elapsed = true;
            this.running = false;
        };
        resolve();
    }

    // This is executed at the end of a trial
    this.end = function(){
        if (this.instance){
            clearTimeout(this.instance);                 // Clear any unfinished timer
            this.events.push(["End","NA","Never","Had to halt the timer at the end of the trial"]);
        }
        if (this.log)
            for (let e in this.events)                   // Save events
                PennEngine.controllers.running.save(this.type, this.id, ...this.events[e]);
    };

    this.value = function(){                            // Value is whether timer has ended
        return this.elapsed;
    };
    
    this.actions = {
        start: function(resolve){   /* $AC$ Timer PElement.start() Starts the timer $AC$ */
            this.start();
            resolve();
        },
        stop: function(resolve){   /* $AC$ Timer PElement.stop() Stops the timer $AC$ */
            if (!this.instance)
                return resolve();
            clearTimeout(this.instance);
            this.done();
            resolve();
        },
        wait: function(resolve, test){   /* $AC$ Timer PElement.wait() Waits until the timer elapses before proceeding $AC$ */
            if (test == "first" && this.elapsed)            // If first and already elapsed, resolve already
                resolve();
            else {                                          // Else, extend remove and do the checks
                let resolved = false;
                let oldDone = this.done;
                this.done = () => {
                    oldDone.apply(this);
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
        callback: function(resolve, ...elementCommands){   /* $AC$ Timer PElement.settings.callback(commands) Will execute the specified command(s) whenever the timer elapses $AC$ */
            let oldDone = this.done;
            this.done = async function() {
                oldDone.apply(this);
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        log: function(resolve){   /* $AC$ Timer PElement.settings.log() Will log when the timer starts and ends in the results file $AC$ */
            this.log = true;
            resolve();
        }
    };

    this.test = {
        ended: function(){   /* $AC$ Timer PElement.test.ended() Checks that the timer has ever elapsed before $AC$ */
            return this.elapsed;
        },
        running: function(){   /* $AC$ Timer PElement.test.running() Checks that the timer is currently running $AC$ */
            return this.running;
        }
    };

});