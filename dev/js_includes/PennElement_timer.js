// TIMER element
/* $AC$ PennController.newTimer(name,duration) Creates a new Timer element $AC$ */
/* $AC$ PennController.getTimer(name) Retrieves an existing Timer element $AC$ */
window.PennController._AddElementType("Timer", function(PennEngine) {

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, duration){
        if (duration===undefined&&Number(id)>0){
            duration = id;
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Timer";
        }
        this.id = id;
        this.initialDuration = 0;
        if (Number(duration)>0)
            this.initialDuration = Number(duration);
        else
            PennEngine.debug.error("Invalid duration for Timer &quot;"+id+"&quot;");
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.elapsed = false;
        this.events = [];
        this.log = false;
        this.running = false;
        this.duration = this.initialDuration;
        this.start = ()=>{                  // Starts the timer
            this.startTime = Date.now();
            this.running = true;
            this.events.push(["Start","Start",this.startTime,"NULL"]);
            let check = ()=>{
                if (!this.running)
                    return;
                if (Date.now()-this.startTime >= this.duration)
                    this.done();
                else
                    setTimeout(check, 0);
                    // window.requestAnimationFrame(check);
            };
            check();
        };
        this.done = ()=>{                   // Called when finished running
            this.running = false;
            this.events.push(["End","End",Date.now(),"NULL"]);
            this.elapsed = true;
            this.startTime = null;
        };
        resolve();
    }

    // This is executed at the end of a trial
    this.end = function(){
        if (this.running){
            this.running = false;
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
        pause: function (resolve){
            if (this.running) {
                this.running = false;
                this.pausedTimestamp = Date.now();
                this.events.push(["Pause","Pause",this.pausedTimestamp,"NULL"]);
            }
            resolve();
        },
        resume: function(resolve){
            if (!this.running && this.pausedTimestamp) {
                this.resumedTimestamp = Date.now();
                const offset = this.resumedTimestamp-this.pausedTimestamp;
                const newStartTime = this.startTime + offset;
                this.events.push(["Resume","Resume",this.resumedTimestamp,"NULL"]);
                this.start();
                this.startTime = newStartTime;
            }
            resolve();
        },
        set: function(resolve, duration){
            const nduration = Number(duration);
            if (isNaN(nduration) || nduration < 0)
                PennEngine.debug.error(`Invalid duration passed for timer ${this.id} (&quot;${duration}&quot;)`);
            else
                this.duration = nduration;
            resolve();
        },
        start: function(resolve){   /* $AC$ Timer PElement.start() Starts the timer $AC$ */
            this.start();
            resolve();
        },
        stop: function(resolve){   /* $AC$ Timer PElement.stop() Stops the timer $AC$ */
            if (this.running)   
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
        callback: function(resolve, ...elementCommands){   /* $AC$ Timer PElement.callback(commands) Will execute the specified command(s) whenever the timer elapses $AC$ */
            let oldDone = this.done;
            this.done = async function() {
                oldDone.apply(this);
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        log: function(resolve){   /* $AC$ Timer PElement.log() Will log when the timer starts and ends in the results file $AC$ */
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
