// AUDIO element
/* $AC$ PennController.newAudio(name,file) Creates a new Audio element $AC$ */
/* $AC$ PennController.getAudio(name) Retrieves an existing Audio element $AC$ */
window.PennController._AddElementType("Audio", function(PennEngine) {

    const RATIO_PRELOADED = 0.95;

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, file){
        if (typeof id == "string" && file===undefined)
            file = id;
        let addHostURLs = !file.match(/^http/i);

        this.resource = PennEngine.resources.new(file, function(uri, resolve){
            const object = document.createElement("audio");
            object.muted = true;
            let loading = false;
            const checkLoaded = ()=>{
                if (!loading){
                    console.log("Starting to preload "+file, object);
                    object.muted = true;
                    object.play();
                }
                loading = true;
                if (object.buffered.length && object.seekable.length){
                    const ratio = object.buffered.end(0) / object.seekable.end(0);
                    if (object.currentTime == object.duration || ratio >= RATIO_PRELOADED){
                        object.pause();
                        object.currentTime = 0;
                        object.muted = false;
                        loading = false;
                        return resolve(object);
                    }
                }
                window.requestAnimationFrame(checkLoaded);
                return true;
            };
            object.addEventListener("progress", ()=>loading||checkLoaded());
            object.src = uri;
            object.load();                                // Forcing 'autopreload'
        }, addHostURLs);
        // this.resource = PennEngine.resources.fetch(file, function(resolve){
        //     this.object = new Audio();               // Creation of the audio using the resource's value
        //     this.object.muted = true;
        //     let playing = false, checking = false;
        //     const checkLoaded = ()=>{
        //         checking = true;
        //         if (this.object.buffered.length && this.object.seekable.length){
        //             if (this.object.buffered.end(0) == this.object.seekable.end(0)){
        //                 this.object.pause();
        //                 this.object.currentTime = 0;
        //                 this.object.muted = false;
        //                 resolved = true;
        //                 return resolve();
        //             }
        //             else if (!playing){
        //                 this.object.muted = true;
        //                 this.object.play();
        //             }
        //         }
        //         window.requestAnimationFrame(checkLoaded);
        //         return true;
        //     };
        //     this.object.addEventListener("progress", ()=>checking||checkLoaded());
        //     this.object.src = this.value;
        //     this.object.load();                                // Forcing 'autopreload'
        // }, addHostURLs);
        // Naming
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "Audio";
        this.id = id;
    };

    // This is executed when 'newAudio' is executed in the trial (converted into a Promise, so call resolve)
    this.uponCreation = function(resolve){
        this.resource.object.controls = true;   // Make the controls visible
        this.audio = this.resource.object;      // Audio simply refers to the resource's object
        this.hasPlayed = false;                 // Whether the audio has played before
        this.disabled = false;                  // Whether the audio can be played
        this.resource.object.style = null;      // (Re)set any particular style applied to the resource's object
        this.jQueryElement = $(this.audio);     // The jQuery element
        this.jQueryElement.removeClass();
        this.jQueryDisable = null;              // The 'disable' element, to be printed on top
        this.playEvents = [];                   // List of ["play",time,position]
        this.endEvents = [];                    // List of ["end",time,position]
        this.pauseEvents = [];                  // List of ["pause",time,position]
        this.seekEvents = [];                   // List of ["seek",time,position]
        this.bufferEvents = [];                 // List of ["buffer",time,position]
        this.whatToSave = [];                   // ["play","end","pause","seek"] (buffer logged by default)
        this.resource.object.onplay = ()=>{
            this.playEvents.push(["play",this.audio.currentTime,Date.now()]);
        };
        this.resource.object.onended = ()=>{
            this.hasPlayed=true;
            this.endEvents.push(["end",this.audio.currentTime,Date.now()]);
        };
        this.resource.object.onpause = ()=>{
            this.pauseEvents.push(["pause",this.audio.currentTime,Date.now()]);
        };
        this.resource.object.onseeked = ()=>{
            this.seekEvents.push(["seek",this.audio.currentTime,Date.now()]);
        };
        this.resource.object.onwaiting = ()=>{
            this.bufferEvents.push(["buffer",this.audio.currentTime,Date.now()]);
        };
        this.printDisable = opacity=>{
            if (opacity===undefined) opacity = this.disabled;
            if (opacity===true||isNaN(Number(opacity))) opacity = 0.5;
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
            // this.jQueryElement.removeAttr("controls");
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
        this.resource.object.pause();
        this.resource.object.currentTime = 0;                   // Reset to the beginning
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
        play: function(resolve, loop){        /* $AC$ Audio PElement.play() Starts the audio playback $AC$ */
            if (this.hasOwnProperty("audio") && this.audio instanceof Audio){
                if (loop && loop=="once")
                    this.audio.removeAttribute("loop");
                else if (loop)
                    this.audio.loop = true;
                this.audio.play();
            }
            else
                PennEngine.debug.error("No audio to play for element ", this.id);
            resolve();
        },
        pause: function(resolve){      /* $AC$ Audio PElement.pause() Pauses the audio playback $AC$ */
            this.audio.pause();
            resolve();
        }
        ,
        print: function(resolve, ...where){      /* $AC$ Audio PElement.print() Prints an interface to control the audio playback $AC$ */
            let afterPrint = ()=>{
                if (this.disabled || (this.disabled!==null&&this.disabled!==false&&!isNaN(this.disabled)))
                    this.printDisable(this.disabled);
                resolve();
            };
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, ...where]);
        },
        stop: function(resolve){      /* $AC$ Audio PElement.stop() Stops the audio playback $AC$ */
            // this.audio.pause();
            this.audio.currentTime = this.audio.duration;
            resolve();
        }
        ,
        // Here, we resolve only when the audio ends (and the test is felicitous, if provided)
        wait: function(resolve, test){      /* $AC$ Audio PElement.wait() Waits until the audio playback has ended $AC$ */
            if (test == "first" && this.hasPlayed)  // If first and has already played, resolve already
                resolve();
            else {                                  // Else, extend onend and do the checks
                let resolved = false;
                let originalOnended = this.audio.onended;
                this.audio.onended = function(...rest){
                    originalOnended.apply(this, rest);
                    if (resolved)
                        return;
                    if (test instanceof Object && test._runPromises && test.success){
                        let oldDisabled = this.disabled;     // Temporarilly disable
                        this.disabled = "tmp";
                        test._runPromises().then(value=>{   // If a valid test command was provided
                            if (value=="success"){
                                resolved = true;
                                resolve();                  // resolve only if test is a success
                            }
                            if (this.disabled == "tmp")     // Restore to previous setting if not modified by test
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
        disable: function(resolve, opacity){      /* $AC$ Audio PElement.disable(opacity) Disables the interface $AC$ */
            this.jQueryElement.addClass("PennController-disabled");
            this.jQueryContainer.addClass("PennController-disabled");
            if (isNaN(opacity)||opacity===null) opacity = true;
            else opacity = Number(opacity);
            this.disabled = opacity;
            this.printDisable(opacity);
            resolve();
        }
        ,
        enable: function(resolve){      /* $AC$ Audio PElement.enable() Enables the interface $AC$ */
            if (this.jQueryDisable instanceof jQuery){
                this.disabled = false;
                this.jQueryDisable.remove();
                this.jQueryDisable = null;
                this.jQueryElement.removeClass("PennController-disabled");
                this.jQueryContainer.removeClass("PennController-disabled");
                this.jQueryElement.attr("controls", true);
            }
            resolve();
        }
        ,
        // Every setting is converted into a Promise (so resolve)
        once: function(resolve){      /* $AC$ Audio PElement.once() The interface will be disabled after the first playback $AC$ */
            if (this.hasPlayed){
                this.disabled = true;
                this.printDisable();
            }
            else {  // Extend onend
                let onended = this.audio.onended, t = this;
                this.audio.onended = function(...rest){
                    onended.apply(this, rest);
                    t.disabled = true;
                    t.printDisable();
                };
            }
            resolve();
        }
        ,
        log: function(resolve,  ...what){      /* $AC$ Audio PElement.log() Logs playback events $AC$ */
            if (what.length==1 && typeof(what[0])=="string")
                this.whatToSave.push(what[0]);
            else if (what.length>1)
                this.whatToSave = this.whatToSave.concat(what);
            else
                this.whatToSave = ["play","end","pause","seek"];
            resolve();
        }
    };
    
    this.test = {
        // Every test is used within a Promise back-end, but it should simply return true/false
        hasPlayed: function(){      /* $AC$ Audio PElement.test.hasPlayed() Checks whether the audio has ever been played fully $AC$ */
            return this.hasPlayed;
        }
        ,
        playing: function(){      /* $AC$ Audio PElement.test.playing() Checks whether the audio is currently playing $AC$ */
            return this.audio.currentTime&&!this.audio.paused;
        }
    };

});
