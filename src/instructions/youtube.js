import {_autoPreloadVideos} from "../preload/preload.js";
//import {MutationObserver} from "../controller.js";
const MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

// Youtube videos to load
var _youtubeVideos = {};


// Load the Youtube API (see https://developers.google.com/youtube/iframe_api_reference)
// Will be executed when jQuery is ready
$(document).ready(function(){
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    var player;
    window.onYouTubeIframeAPIReady = function(){
        for (let y in _youtubeVideos) {
            _youtubeVideos[y].call();
        }
    }
});


// Adds a Youtube video
// Done immediately
class YTInstr extends Instruction {
    constructor(code) {
        super(code, "youtube");
        if (code != Abort){
            let ti = this;
            // This function creates a player through the YT API
            let createPlayer = function() {
                ti.origin.player = new YT.Player(code, {
                    videoId: code,
                    events: {
                        'onReady': function(event){ ti.origin._ready(event); },
                        'onStateChange': function(event){ 
                            if (event.data == YT.PlayerState.ENDED) ti.origin._ended(event);
                            else if (event.data == YT.PlayerState.BUFFERING) ti.origin._buffering(event);
                            else if (event.data == YT.PlayerState.PLAYING) ti.origin._playing(event);
                            else if (event.data == YT.PlayerState.CUED) ti.origin._canPlay(event);
                            else if (event.data == YT.PlayerState.PAUSED) ti.origin._paused(event);
                        }
                    }
                });
            };
            // IFRAME
            // Not loaded at first
            this.iframeLoaded = false;
            // Creating the iframe element (TODO: check preloaded files, no need to recreate each time)
            this.iframe = $("<iframe>");
            this.iframe.attr({src: "https://www.youtube-nocookie.com/embed/"+code+"?enablejsapi=1", id: code, frameborder: 0})
                        .bind("load", function(){ ti.origin.iframeLoaded = true; }); // Signal loading
            // Add the frame to html (invisible)
            $("html").append(this.iframe.css({display: "none", position: "absolute"}));
            // The instruction's element is a DIV, because iframe needs to be global (appending it would RECREATE it)
            this.setElement($("<div>"));
            // If the player has not already been created
            if (!_youtubeVideos.hasOwnProperty(code)) {
                // Add a player to be created when the YT API is ready (see above in PRELOADER ENGINE)
                _youtubeVideos[code] = function(){
                    // If the iframe is not ready yet, wait before creating the player
                    if (!ti.origin.iframeLoaded)
                        ti.origin.iframe.bind("load", createPlayer);
                    // If it is ready, create the player already
                    else
                        createPlayer();
                };
            }
            // Visual information
            this.visual = {
                top: 0,
                left: 0,
                width: 0,
                height: 0
            };
            // Autoplay by default
            this.autoPlay = true;
            // Asynchronous commands: need to keep track
            this.commandsQueue = [];
            // Not played yet
            this.hasPlayed = false;
            // Calling addToPreload immediately if settings say so 
            if (_autoPreloadVideos)
                this.origin._addToPreload();
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================
    run() {
        if (super.run() == Abort)
            return Abort;
        let ti = this.origin;
        // Bind any mutation to the div element to the iframe
        let observer = new MutationObserver(function(mutations) {
            // Check that the element is in the DOM and visible
            if ($.contains(document.body, ti.element[0]) && ti.element[0].offsetParent) {
                let w = ti.element.width(), h = ti.element.height();
                if (w != ti.visual.width || h != ti.visual.height) {
                    ti.iframe.css({width: w, height: h, display: "block"});
                    ti.visual.width = w;
                    ti.visual.height = h;
                }
                let o = ti.element.offset(), x = o.left, y = o.top;
                if (x != ti.visual.left || y != ti.visual.top) {
                    ti.iframe.css({left: x, top: y, display: "block"});
                    ti.visual.left = x;
                    ti.visual.top = y;
                }

            }
        });
        // Listen to any modification that might affect the display of the div
        observer.observe(document.body, { childList : true, attributes : true, subtree : true });
        // Add the div element to the document (any mutation is listened)
        this._addElement(this.parentElement);
        // If player exists, start playback
        if (ti.origin.player && ti.origin.autoPlay)
            ti._play();
        // Stop playing the video when the trial is over
        Ctrlr.running.callbackBeforeFinish(function(){
            ti._forcePause();
        });
    }

    // Force playing because playVideo sometimes simply has no effect at all
    _forcePlay() {
        let ti = this.origin, i = 0, ivl = setInterval(function(){
            if (ti.player.getPlayerState() == YT.PlayerState.PLAYING || i >= 5000)
                clearInterval(ivl);
            else
                ti.player.playVideo();
            i++;
        }, 1);
    }

    // Force pause because pauseVideo sometimes simply has no effect at all
    _forcePause() {
        let ti = this.origin, i = 0, ivl = setInterval(function(){
            if (ti.player.getPlayerState() == YT.PlayerState.PAUSED || ti.player.getPlayerState() == YT.PlayerState.ENDED || i >= 5000)
                clearInterval(ivl);
            else
                ti.player.pauseVideo();
            i++;
        }, 1);
    }

    _play() {
        if (!this.origin.player)
            return;
        this.origin.commandsQueue.push("play");
        // Force playing because it sometimes simply has no effect at all
        this._forcePlay();
    }

    _pause() {
        if (!this.origin.player)
            return;
        this.origin.commandsQueue.push("pause");
        this._forcePause();
    }

    _paused(event) {
        // If the currently pending command is PAUSE, remove it
        if (this.origin.commandsQueue.indexOf("pause") == 0)
            this.origin.commandsQueue.splice(0, 1);
        // If the next pending command is PLAY, play the video
        if (this.origin.commandsQueue.length > 0 && this.origin.commandsQueue[0] == "play")
            this._forcePlay();
    }

    _playing(event) {
        // If the currently pending command is PLAY, remove it
        if (this.origin.commandsQueue.indexOf("play") == 0)
            this.origin.commandsQueue.splice(0, 1);
        // If the next pending command is PAUSE, pause the video
        if (this.origin.commandsQueue.length > 0 && this.origin.commandsQueue[0] == "pause")
            this.origin.player.pauseVideo();

        // If not loaded yet, change that: it's now playing
        if (!this.origin.loaded) {
            this.origin.loaded = true;
            // Signal that it can play
            if (this.origin.buffering && !this.origin.canPlay)
                this.origin._canPlay(event);
        }
        // Signal it's no longer buffering
        if (this.origin.buffering)
            this.origin.buffering = false;
        // If origin has been run but is not done yet, change that
        if (this.origin.hasBeenRun && !this.origin.isDone)
            this.origin.done();
    }

    _buffering(event) {
        // Signal it's buffering
        if (!this.origin.buffering)
            this.origin.buffering = true;
    }

    // Triggered when the video has first started playing
    _canPlay(event) {
        if (!this.origin.canPlay) {
            this.origin.canPlay = true;
            // Listing the YT video as preloaded
            this.origin._setResource(this.iframe);
            // If video not played yet, play it
            if (this.hasBeenRun && event.target.getPlayerState() != YT.PlayerState.PLAYING)
                this._play();
            // If video already playing but not run yet, pause
            else if (!this.hasBeenRun && event.target.getPlayerState() == YT.PlayerState.PLAYING)
                this._pause();
        }

    }

    _ended(event) {
        this.hasPlayed = true;
    }

    _ready(event) {
        // Starting to play, to start buffering
        this._play();            
    }

    // ========================================
    // METHODS THAT RETURN NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to wait for the end of the video
    // Done when the video has been entirely played
    wait() {
        if (this.origin.hasPlayed)
            return this.newMeta(function(){ this.done(); });
        let instr = this.newMeta();
        this.origin._ended = this.origin.extend("_ended", function(){ instr.done(); });
        return instr;
    }

    // Returns an instruction to pause the video
    // Done immediately
    pause() {
        return this.newMeta(function(){
            this._pause();
            this.done();
        });
    }

    // Returns an instruction to play the video
    // Done immediately
    play() {
        return this.newMeta(function(){
            this._play();
            this.done();
        });
    }

    // Returns an instruction to preload the video
    // Done immediately
    preload() {
        this.origin._addToPreload();
        return this.newMeta(function(){ this.done(); });
    }
}

PennController.instruction.yt = function(code){ return new YTInstr(code); };