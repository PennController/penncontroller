// YOUTUBE element
window.PennController._AddElementType("Youtube", function(PennEngine) {

    const MutationObserver =
        window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    let youtubeVideos = []; // Youtube videos to load

    // Load the Youtube API (see https://developers.google.com/youtube/iframe_api_reference)
    // Will be executed when jQuery is ready
    $(document).ready(function(){
        let tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = function(){
            for (let y in youtubeVideos) {
                youtubeVideos[y].call();
            }
        }
    });

    // This is executed when Ibex runs the script in data_includes (not a promise, no need to resolve)
    this.immediate = function(id, code, showControls){
        if (!(code && typeof(code)=="string"))
            console.error("Invalid code for Youtube element "+id, code);
        if (showControls && !showControls.match(/^\W*no\W*controls?\W*$/i))
            showControls = 1;
        else
            showControls = 0;
        this.resource = PennEngine.resources.fetch(code, function(resolve){
            let playerID = code+"-"+PennEngine.resources.list.length;// Unique ID (if copies of resource, e.g. duplicates on same page)
            this.ended = function(){};                  // Called when YT resource playback ends
            this.playing = function(){};                // Called when YT resource playback starts playing
            this.paused = function(){};                 // Called when YT resource is paused
            this.buffering = function(){};              // Called when YT resource is buffering
            let iframeLoaded = false;                   // IFRAME not loaded at first
            let iframe = $("<iframe>");                 // Create iframe element (TODO: check preloaded files, no need to recreate each time)
            iframe.attr({
                src: "https://www.youtube-nocookie.com/embed/"+code+"?enablejsapi=1&controls="+showControls,
                id: playerID,
                frameborder: 0
            }).bind("load", ()=>iframeLoaded = true)    // Signal loading
                .css({display: "none", position: "absolute"});
            $(document).ready(()=>$(document.body).append(iframe)); // Add frame to body (invisible)
            youtubeVideos.push( ()=>{                   // Create a player when the YT API is ready
                let loading = true;
                let createPlayer = () =>
                    this.player = new YT.Player(playerID, { playerVars: { 'controls': showControls },
                        events: {
                            onReady: e=>{               // Cue and start playing video when ready
                                iframe = 
                                e.target.cueVideoById(code);
                                e.target.playVideo();
                            },
                            onStateChange: event=>{ 
                                if (event.data == YT.PlayerState.ENDED && !loading)
                                    this.ended(event);
                                else if (event.data == YT.PlayerState.PLAYING) {
                                    if (loading){       // Stop video as soon as it starts playing
                                        event.target.pauseVideo();
                                        event.target.seekTo(0);
                                        loading = false;
                                        resolve();      // Now it's loaded and ready to play
                                    }
                                    else                // Do no log loading event
                                        this.playing(event);
                                }
                                else if (event.data == YT.PlayerState.PAUSED && !loading)
                                    this.paused(event);
                                else if (event.data == YT.PlayerState.BUFFERING && !loading)
                                    this.buffering(event);
                                //else if (event.data == YT.PlayerState.CUED)
                            }
                        }});
                if (!iframeLoaded)                      // If the iframe is not ready yet, wait before creating the player
                    iframe.bind("load", createPlayer);
                else
                    createPlayer();                     // If it is ready, create the player already
            });
            this.object = iframe;
        }, false);                                      // Do not try to add host urls
    };

    this.uponCreation = function(resolve){
        this.iframe = this.resource.object;
        this.player = this.resource.player;
        this.log = false;
        this.hasPlayed = false;
        this.events = [];
        this.onplay = ()=>this.events.push(["Play",this.player.getCurrentTime(),Date.now(),"NULL"]);
        this.onpause = ()=>this.events.push(["Pause",this.player.getCurrentTime(),Date.now(),"NULL"]);
        this.onbuffer = ()=>this.events.push(["Buffer",this.player.getCurrentTime(),Date.now(),"NULL"]);
        this.onend = ()=>{
            this.hasPlayed = true;
            this.events.push(["End",this.player.getCurrentTime(),Date.now(),"NULL"]);
        };
        let t = this;
        let oldEnded = this.resource.ended;
        this.resource.ended = function(e){ oldEnded.apply(this,e); t.onend(); };
        let oldPlaying = this.resource.playing;
        this.resource.playing = function(e){ oldPlaying.apply(this,e); t.onplay(); };
        let oldPaused = this.resource.paused;
        this.resource.paused = function(e){ oldPaused.apply(this,e); t.onpause(); };
        let oldBuffering = this.resource.buffering;
        this.resource.buffering = function(e){ oldBuffering.apply(this,e); t.onbuffer(); };
        this.jQueryElement = $("<div>").css("display","inline-block");
        this.visual = {top: 0, left: 0, width: this.iframe.width(), height: this.iframe.height()};
        this.jQueryElement.css({width: this.visual.width, height: this.visual.height});
        this.player.seekTo(0);                  // (Re)set to the beginning
        this.disabled = false;                  // Whether the audio can be played
        this.jQueryDisable = null;              // The 'disable' element, to be printed on top
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

    this.end = function(){
        if (this.observer && this.observer instanceof MutationObserver)
            this.observer.disconnect();
        if (this.player && this.player.getPlayerState()==YT.PlayerState.PLAYING)
            this.player.pauseVideo();
        this.iframe.css("display", "none");
        if (this.jQueryDisable)
            this.jQueryDisable.remove();// Remove disabler from DOM
        if (this.log && this.log instanceof Array){
            if (!this.events.length)
                PennEngine.controllers.running.save(this.type, this.id, "play", "NA", "Never", "The video was never played during the trial");
            else if (this.log.indexOf("all")>-1)
                for (let e in this.events)
                    PennEngine.controllers.running.save(this.type, this.id, ...this.events[e]);
            else {
                if (this.log.indexOf("play")>-1){
                    let playEvents = this.events.filter(e=>e[0]=="Play");
                    for (let line in playEvents)
                        PennEngine.controllers.running.save(this.type, this.id, ...playEvents[line]);
                }
                if (this.log.indexOf("end")>-1){
                    let endEvents = this.events.filter(e=>e[0]=="End");
                    for (let line in endEvents)
                        PennEngine.controllers.running.save(this.type, this.id, ...endEvents[line]);
                }
                if (this.log.indexOf("pause")>-1){
                    let pauseEvents = this.events.filter(e=>e[0]=="Pause");
                    for (let line in pauseEvents)
                        PennEngine.controllers.running.save(this.type, this.id, ...pauseEvents[line]);
                }
                if (this.log.indexOf("buffer")>-1){
                    let bufferEvents = this.events.filter(e=>e[0]=="Buffer");
                    for (let line in bufferEvents)
                        PennEngine.controllers.running.save(this.type, this.id, ...bufferEvents[line]);
                }
            }
        }
    };

    this.value = function(){            // Value is whether the video was played
        return this.hasPlayed;
    };

    this.actions = {
        play: function(resolve){
            this.player.playVideo();
            resolve();
        },
        pause: function(resolve){
            this.player.pauseVideo();
            resolve();
        },
        print: function(resolve, where){
            let afterPrint = ()=>{
                let pos = this.jQueryElement.offset();
                this.iframe.css({position:"absolute", left: pos.left, top: pos.top, display: "inline-block"});
                this.observer = new MutationObserver(()=>{                                  // Bind mutations to iframe
                                                                                            // Element in DOM & visible
                    if (this.jQueryElement[0].offsetParent && $.contains(document.body, this.jQueryElement[0])) {
                        this.iframe.css("display", this.jQueryElement.css("display"));      // Inherit display
                        let w = this.jQueryElement.width(), h = this.jQueryElement.height();
                        if (w != this.visual.width || h != this.visual.height) {            // Update size
                            this.iframe.css({width: w, height: h});
                            this.visual.width = w;
                            this.visual.height = h;
                        }
                        let pos = this.jQueryElement.offset();
                        if (pos.left != this.visual.left || pos.top != this.visual.top) {   // Update position
                            this.iframe.css({left: pos.left, top: pos.top});
                            this.visual.left = pos.left;
                            this.visual.top = pos.top;
                        }
                        this.observer.disconnect();                                         // Update observer, if new position in DOM
                        this.observer.observe(this.jQueryElement.parent()[0], { childList : true, attributes : true, subtree : true });
                    }
                    else
                        this.iframe.css("display", "none");
                });
                this.observer.observe(this.jQueryElement.parent()[0], { childList : true, attributes : true, subtree : true });
                if (this.disabled)
                    this.printDisable();
                resolve();
            };
            PennEngine.elements.standardCommands.actions.print.apply(this, [afterPrint, where]);
        },
        remove: function(resolve){
            this.iframe.css("display","none");
            PennEngine.elements.standardCommands.actions.remove.apply(this, [resolve]);
        },
        stop: function(resolve){
            this.player.playVideo();
            this.player.seekTo(0);
            resolve();
        },
        wait: function(resolve, test){
            if (test == "first" && this.hasPlayed)  // If first and has already played, resolve already
                resolve();
            else {                                  // Else, extend onend and do the checks
                let resolved = false;
                let originalEnd = this.onend;
                this.onend = function(...rest){
                    originalEnd.apply(this, rest);
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
        },
        enable: function(resolve){
            if (this.jQueryDisable instanceof jQuery){
                this.disabled = false;
                this.jQueryDisable.remove();
                this.jQueryDisable = null;
                this.jQueryElement.removeClass("PennController-"+this.type+"-disabled");
            }
            resolve();
        },
        once: function(resolve){
            if (this.hasPlayed)
                this.disabled = true;
            else {
                let originalEnd = this.onend, t = this;
                this.onend = function(...rest){
                    originalEnd.apply(this, rest);
                    t.disabled = true;
                    t.printDisable();
                };
            }
            resolve();
        },
        log: function(resolve,  ...what){
            if (what.length)
                this.log = what;
            else
                this.log = ["play"];
            resolve();
        },
        size: function(resolve, width, height){
            let afterSize = ()=>{
                this.iframe.css({width: width, height: height});
                this.visual.width = width;
                this.visual.height = height;
                resolve();
            };
            PennEngine.elements.standardCommands.settings.size.apply(this, [afterSize, width, height]);
        }
    };
    
    this.test = {
        hasPlayed: function(){
            return this.hasPlayed;
        },
        playing: function(){
            return this.player.getPlayerState()==1;
        }
    };

});