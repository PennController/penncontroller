// video element
PennController._AddElementType("Video", function(PennEngine) {

    this.immediate = function(id, file){
        let addHostURLs = !file.match(/^http/i);
        this.resource = PennEngine.resources.fetch(file, function(resolve){
            this.object = document.createElement("video");
            this.object.src = this.value;                      // Creation of the video using the resource's value
            this.object.addEventListener("canplay", resolve);  // Preloading is over when can play (>> resolve)
        }, addHostURLs);
    };

    this.uponCreation = function(resolve){
        this.resource.object.controls = true;   // Make the controls visible
        this.video = this.resource.object;      // video simply refers to the resource's object
        this.hasPlayed = false;                 // Whether the video has played before
        this.disabled = false;                  // Whether the video can be played
        this.resource.object.style = null;      // (Re)set any particular style applied to the resource's object
        this.resource.object.currentTime = 0;   // (Re)set to the beginning
        this.jQueryElement = $(this.video);     // The jQuery element
        this.jQueryDisable = null;              // The 'disable' element, to be printed on top
        this.playEvents = [];                   // List of ["play",time,position]
        this.endEvents = [];                    // List of ["end",time,position]
        this.pauseEvents = [];                  // List of ["pause",time,position]
        this.seekEvents = [];                   // List of ["seek",time,position]
        this.bufferEvents = [];                 // List of ["buffer",time,position]
        this.whatToSave = [];                   // ["play","end","pause","seek"] (buffer logged by default)
        this.resource.object.onplay = ()=>{
            this.playEvents.push(["play",this.video.currentTime,Date.now()]);
        };
        this.resource.object.onended = ()=>{
            this.hasPlayed=true;
            this.endEvents.push(["end",this.video.currentTime,Date.now()]);
        };
        this.resource.object.onpause = ()=>{
            this.pauseEvents.push(["pause",this.video.currentTime,Date.now()]);
        };
        this.resource.object.onseeked = ()=>{
            this.seekEvents.push(["seek",this.video.currentTime,Date.now()]);
        };
        this.resource.object.waiting = ()=>{
            this.bufferEvents.push(["buffer",this.video.currentTime,Date.now()]);
        };
        this.printDisable = ()=>{
            if (this.jQueryDisable instanceof jQuery)
                this.jQueryDisable.remove();
            this.jQueryDisable = $("<div>").css({
                position: "absolute",
                display: "inline-block",
                "background-color": "gray",
                opacity: 0.5,
                width: this.jQueryElement.width(),
                height: this.jQueryElement.height()
            });
            this.jQueryElement.before(this.jQueryDisable);
            this.jQueryElement.addClass("PennController-"+this.type+"-disabled");
        };
        resolve();
    };

    // This is executed at the end of a trial
    this.end = function(){
        if (this.whatToSave && this.whatToSave.indexOf("play")>-1){
            if (!this.playEvents.length)
                PennEngine.controllers.running.save(this.type, this.id, "play", "NA", "Never");
            for (let line in this.playEvents)
                PennEngine.controllers.running.save(this.type, this.id, ...this.playEvents[line]);
        }
        if (this.whatToSave && this.whatToSave.indexOf("end")>-1){
            if (!this.endEvents.length)
                PennEngine.controllers.running.save(this.type, this.id, "end", "NA", "Never");
            for (let line in this.endEvents)    
                PennEngine.controllers.running.save(this.type, this.id, ...this.endEvents[line]);
        }
        if (this.whatToSave && this.whatToSave.indexOf("pause")>-1){
            if (!this.pauseEvents.length)
                PennEngine.controllers.running.save(this.type, this.id, "pause", "NA", "Never");
            for (let line in this.pauseEvents)
                PennEngine.controllers.running.save(this.type, this.id, ...this.pauseEvents[line]);
        }
        if (this.whatToSave && this.whatToSave.indexOf("seek")>-1){
            if (!this.seekEvents.length)
                PennEngine.controllers.running.save(this.type, this.id, "seek", "NA", "Never");
            for (let line in this.seekEvents)
                PennEngine.controllers.running.save(this.type, this.id, ...this.seekEvents[line]);
        }
        for (let line in this.bufferEvents)
            PennEngine.controllers.running.save(this.type, this.id, ...this.bufferEvents[line]);
        if (this.jQueryDisable)
            this.jQueryDisable.remove();// Remove disabler from DOM
    };
    
    this.value = function(){                                    // Value is timestamp of last end event
        if (this.endEvents.length)                         
            return this.endEvents[this.endEvents.length-1][2];
        else
            return 0;
    };

    this.actions = {
        // Every method is converted into a Promise (so need to resolve)
        play: function(resolve){
            if (this.hasOwnProperty("video") && this.video instanceof video)
                this.video.play();
            else
                console.warn("No video to play for element ", this.id);
            resolve();
        },
        pause: function(resolve){
            this.video.pause();
            resolve();
        }
        ,
        print: function(resolve, where){
            let afterPrint = ()=>{
                if (this.disabled)
                    this.printDisable();
                resolve();
            };
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, where]);
        },
        stop: function(resolve){
            this.video.pause();
            this.currentTime = 0;
            resolve();
        }
        ,
        // Here, we resolve only when the video ends (and the test is felicitous, if provided)
        wait: function(resolve, test){
            if (test == "first" && this.hasPlayed)  // If first and has already played, resolve already
                resolve();
            else {                                  // Else, extend onend and do the checks
                let resolved = false;
                let originalOnended = this.video.onended;
                this.video.onended = function(...rest){
                    originalOnended.apply(this, rest);
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
        disable: function(resolve){
            this.printDisable();
            this.disabled = true;
            resolve();
        }
        ,
        enable: function(resolve){
            if (this.jQueryDisable instanceof jQuery){
                this.disabled = false;
                this.jQueryDisable.remove();
                this.jQueryDisable = null;
                this.jQueryElement.removeClass("PennController-"+this.type+"-disabled");
            }
            resolve();
        }
        ,
        // Every setting is converted into a Promise (so resolve)
        once: function(resolve){
            if (this.hasPlayed){
                this.disabled = true;
                resolve();
            }
            else {  // Extend onend
                let onended = this.video.onended, t = this;
                this.video.onended = function(...rest){
                    onended.apply(this, rest);
                    t.disabled = true;
                    resolve();
                };
            }
        }
        ,
        log: function(resolve,  ...what){
            if (what.length==1 && typeof(what[0])=="string")
                this.whatToSave.push(what);
            else if (what.length>1)
                this.whatToSave = this.whatToSave.concat(what);
            else
                this.whatToSave = ["play","end","pause","seek"];
            resolve();
        }
    };
    
    this.test = {
        // Every test is used within a Promise back-end, but it should simply return true/false
        hasPlayed: function(){
            return this.hasPlayed;
        }
        ,
        playing: function(){
            return this.video.currentTime&&!this.video.paused;
        }
    };

});