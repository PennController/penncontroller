// video element
/* $AC$ PennController.newVideo(name,file) Creates a new Video element using the specified file $AC$ */
/* $AC$ PennController.getVideo(name) Retrieves an existing Video element $AC$ */
window.PennController._AddElementType("Video", function(PennEngine) {

    this.immediate = function(id, file){
        if (typeof id == "string" && file===undefined)
            file = id;
        let addHostURLs = !file.match(/^http/i);
        this.resource = PennEngine.resources.fetch(file, function(resolve){
            this.object = document.createElement("video");
            this.object.src = this.value;                      // Creation of the video using the resource's value
            this.object.preload = true;                        // Preloading is over when can play (>> resolve)
            this.object.load();                                // Forcing 'autopreload'
            if (this.object.readyState > 3) 
                resolve();
            else 
                this.object.addEventListener("canplaythrough", resolve);  // Preloading is over when can play (>> resolve)
        }, addHostURLs);
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "Video";
        this.id = id;
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
        this.printDisable = opacity=>{
            opacity = Number(opacity) || 0.5;
            if (this.jQueryDisable instanceof jQuery)
                this.jQueryDisable.remove();
            this.jQueryDisable = $("<div>").css({
                position: "absolute",
                display: "inline-block",
                "background-color": "gray",
                opacity: opacity,
                width: this.jQueryElement.width(),
                height: this.jQueryElement.height()
            });
            this.jQueryElement.before(this.jQueryDisable);
            this.jQueryElement.removeAttr("controls");
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
        if (this.bufferEvents)
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
        play: function(resolve){        /* $AC$ Video PElement.play() Starts playing the video (visible only if print was called) $AC$ */
            if (this.hasOwnProperty("video") && this.video.nodeName && this.video.nodeName == "VIDEO")
                this.video.play();
            else
                PennEngine.debug.error("No video to play for Video ", this.id);
            resolve();
        },
        pause: function(resolve){        /* $AC$ Video PElement.pause() Pauses the video $AC$ */
            this.video.pause();
            resolve();
        }
        ,
        print: function(resolve, ...where){        /* $AC$ Video PElement.print() Shows a video player $AC$ */
            let afterPrint = ()=>{
                if (this.disabled)
                    this.printDisable(this.disabled);
                resolve();
            };
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, ...where]);
        },
        stop: function(resolve){        /* $AC$ Video PElement.stop() Stops playing the video $AC$ */
            this.video.pause();
            this.video.currentTime = 0;
            resolve();
        }
        ,
        // Here, we resolve only when the video ends (and the test is felicitous, if provided)
        wait: function(resolve, test){        /* $AC$ Video PElement.wait() Waits untils the video reaches the end before proceeding $AC$ */
            if (test == "first" && this.hasPlayed)  // If first and has already played, resolve already
                resolve();
            else {                                  // Else, extend onend and do the checks
                let resolved = false;
                let originalOnended = this.video.onended;
                this.video.onended = function(...rest){
                    originalOnended.apply(this, rest);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;    // Disable temporarilly
                        this.disabled = "tmp"; 
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled=="tmp")       // Restore old setting if not modified by test
                                this.disabled = oldDisabled;
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
        disable: function(resolve, opacity){    /* $AC$ Video PElement.disable(opacity) Disable controls on the Video element $AC$ */
            this.printDisable(opacity);
            this.disabled = opacity || true;
            this.jQueryContainer.addClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        }
        ,
        enable: function(resolve){
            if (this.jQueryDisable instanceof jQuery){
                this.disabled = false;
                this.jQueryDisable.remove();
                this.jQueryDisable = null;
                this.jQueryContainer.addClass("PennController-disabled");
                this.jQueryElement.addClass("PennController-disabled");
                this.jQueryElement.attr("controls", true);
            }
            resolve();
        }
        ,
        // Every setting is converted into a Promise (so resolve)
        once: function(resolve){        /* $AC$ Video PElement.once() Will disable the video player after the video has played through once $AC$ */
            if (this.hasPlayed){
                this.disabled = true;
                this.printDisable();
            }
            else {  // Extend onend
                let onended = this.video.onended, t = this;
                this.video.onended = function(...rest){
                    onended.apply(this, rest);
                    t.disabled = true;
                    t.printDisable();
                };
            }
            resolve();
        }
        ,
        log: function(resolve,  ...what){        /* $AC$ Video PElement.log() Will log play and/or stop events in the results file $AC$ */
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
        hasPlayed: function(){        /* $AC$ Video PElement.test.hasPlayed() Checks that the video has played through at least once before $AC$ */
            return this.hasPlayed;
        }
        ,
        playing: function(){        /* $AC$ Video PElement.test.playing() Checks that the video is currently playing $AC$ */
            return this.video.currentTime&&!this.video.paused;
        }
    };

});