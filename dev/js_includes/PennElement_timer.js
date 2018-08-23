// TIMER element
PennController._AddElementType("Timer", function(PennEngine) {

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, duration){
        this.duration = 0;
        if (Number(duration)>0)
            this.duration = Number(duration);
        else
            console.warn("Invalid duration for timer "+id+" in PennController #"+PennEngine.controllers.underConstruction.id);
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
            this.events.push(["Event","Start",Date.now(),"NULL"]);
            this.instance = setTimeout(()=>this.done(), this.duration);
            this.running = true;
        };
        this.done = ()=>{                   // Called when finished running
            this.events.push(["Event","End",Date.now(),"NULL"]);
            this.elapsed = true;
            this.running = false;
        };
        resolve();
    }

    // This is executed at the end of a trial
    this.end = function(){
        if (this.instance)
            clearTimeout(this.instance);                 // Clear any unfinished timer
        if (this.log)
            for (let e in this.events)                   // Save events
                PennEngine.controllers.running.save(this.type, this.id, ...this.events[e]);
    };

    this.value = function(){                            // Value is whether timer has ended
        return this.elapsed;
    };
    
    this.actions = {
        start: function(resolve){
            this.start();
            resolve();
        },
        wait: function(resolve, test){
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
        callback: function(resolve, ...elementCommands){
            let oldDone = this.done;
            this.done = async function() {
                oldDone.apply(this);
                for (let c in elementCommands)
                    await elementCommands[c]._runPromises();
            };
            resolve();
        },
        log: function(resolve){
            this.log = true;
            resolve();
        }
    };

    this.test = {
        ended: function(){
            return this.elapsed;
        },
        running: function(){
            return this.running;
        }
    };

});