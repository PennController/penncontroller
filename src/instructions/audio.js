import {_autoPreloadAudio, _instructionsToPreload} from "../preload/preload.js";

// Adds an AUDIO to the parent element
// Done immediately
class AudioInstr extends Instruction {
    constructor(id, file) {
        super(id, file, "audio");
        if (file != Abort) {
            if (!file.match(/\.(ogg|wav|mp3)$/i)) {
                console.log("Error: "+file+" is not a valid audio file.");
                return Abort;
            }
            // Autoplay false by default
            this.autoPlay = false;
            // Do not show controls by default
            this.controls = false;
            // Will be set to true when playback ends
            this.ended = false;
            // A record of the different events (play, pause, stop, seek)
            this.eventsRecord = [];
            // Whether to save plays
            this.savePlays = false;
            // Whether to save pauses
            this.savePauses = false;
            // Whether to save ends
            this.saveEnds = false;
            // Whether to save seeks
            this.saveSeeks = false;
            // Set element to SPAN (will append audio later)
            this.setElement($("<span>"));
            // Calling addToPreload immediately if settings say so 
            if (_autoPreloadAudio)
                this.origin._addToPreload();
            // Fetch the file
            this.origin.fetchResource(file, "audio");
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        if (this.audio) {
            // Binding the whenEnded method (upon running because otherwise potential problems with other items' instructions)
            let ti = this;
            this.origin.audio.bind('ended', function(){ ti._whenEnded(); });
            // If audio not entirely preloaded yet, send an error signal
            if (this.audio.readyState < 4 && _instructionsToPreload.indexOf(this.origin)>=0)
                Ctrlr.running.save("ERROR_PRELOADING_AUDIO", this.content, Date.now(), "Audio was not fully loaded");
            // Show controls
            if (this.controls) {
                this.audio.attr('controls',true);
                this.audio.css("display", "inherit");
            }
            // Hide audio element
            else
                this.audio.css('display','none');
            // Adding it to the element
            this.element.append(this.audio);
            // Adding the element to the document
            this._addElement(this.parentElement);
            // Autoplay
            if (this.autoPlay)
                this.audio[0].play();
        }
        this.done();
    }

    // Set the AUDIO element
    _setResource(audio) {
        // Abort if origin's audio's already set
        if (this.origin.audio)
            return Abort;
        if (super._setResource(audio)==Abort)
            return Abort;
        let ti = this.origin;
        this.origin.audio = audio;
        // Record the different events
        audio.bind("play", function(){
            // Sometimes it takes time before the audio steam actually starts playing
            let actualPlay = setInterval(function() { 
                // Check PAUSED and CURRENTIME every millisecond: then it's time to record!
                if (!audio[0].paused && audio[0].currentTime) {
                    ti.eventsRecord.push(["play", Date.now(), audio[0].currentTime]);
                    clearInterval(actualPlay);
                }
            }, 1);
        }).bind("ended", function(){
            ti.eventsRecord.push(["end", Date.now(), audio[0].currentTime]);
        }).bind("pause", function(){
            ti.eventsRecord.push(["pause", Date.now(), audio[0].currentTime]);
        }).bind("seeked", function(){
            ti.eventsRecord.push(["seek", Date.now(), audio[0].currentTime]);
        });
        if (this.origin.hasBeenRun) {
            this.origin.hasBeenRun = false;
            this.origin.run();
        }
    }

    // Called when the audio ends
    _whenEnded() {
        this.origin.ended = true;
    }

    // ========================================
    // METHODS RETURNING NEW INSTRUCTIONS
    // ========================================

    // Returns an instruction to play the audio
    // Done immediately
    play() {
        return this.newMeta(function(){
            this.origin.audio[0].play();
            this.done();
        })           
    }

    // Returns an instruction to show the audio (and its controls)
    // Done immediately
    show(doShow) {
        if (typeof(doShow) == "undefined")
            doShow = true;
        return this.newMeta(function(){ 
            this.origin.controls = doShow;
            this.done();
        });
    }

    // Returns an instruction that users should click to start playing the audio
    // Done immediately
    clickToStart() {
        return this.newMeta(function(){ 
            // Making sure the controls are visible
            if (!this.origin.controls)
                this.origin.controls = true;
            this.origin.auto = false;
            this.done();
        });
    }
    
    // Returns an instruction to wait
    // Done when origin's element has been played
    wait() {
        // If sound's already completely played back, done immediately
        if (this.origin.ended)
            return this.newMeta(function(){ this.done(); });
        // Else, done when origin's played back
        let instr = this.newMeta();
        this.origin._whenEnded = this.origin.extend("_whenEnded", function(){
            instr.done();
        })
        return instr;
    }

    // Returns an instruction to SAVE the parameters
    // Done immediately
    record(parameters) {
        let o = this.origin, 
            saveFct = function(event) {
                if (event == "play") {
                    if (o.savePlays)
                        return Abort;
                    o.savePlays = true;
                }
                else if (event == "pause") {
                    if (o.savePauses)
                        return Abort;
                    o.savePauses = true;
                }
                else if (event == "end") {
                    if (o.saveEnds)
                        return Abort;
                    o.saveEnds = true;
                }
                else if (event == "seek") {
                    if (o.saveSeeks)
                        return Abort;
                    o.saveSeeks = true;
                }
                else
                    return Abort;
                // Adding it to done, because Ctrlr.running is not defined upon creation of instruction
                o.done = o.extend("done", function(){
                    Ctrlr.running.callbackBeforeFinish(function(){
                        for (let r in o.eventsRecord) {
                            let record = o.eventsRecord[r];
                            if (record[0] == event)
                                Ctrlr.running.save(o.content, record[0], record[1], record[2]);
                        }
                    });
                });
            };
        // Argument is a string
        if (arguments.length == 1 && typeof(parameters) == "string")
            saveFct(parameters);
        // Multiple arguments
        else if (arguments.length > 1) {
            for (let a = 0; a < arguments.length; a++)
                saveFct(arguments[a]);
        }
        // No argument (or unintelligible argument): save everything
        else {
            saveFct("play");
            saveFct("pause");
            saveFct("end");
            saveFct("seek");
        }
        return this.newMeta(function(){ this.done(); });
    }

    preload() {
        this.origin._addToPreload();
        return this.newMeta(function(){ this.done(); });
    }
}


AudioInstr._setDefaultsName("audio");

PennController.instruction.newAudio = function(id, audio){ 
    return AudioInstr._newDefault(new AudioInstr(id, audio));
};

PennController.instruction.getAudio = function(id){ return PennController.instruction(id); };