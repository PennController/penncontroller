// NOTE(S)
//  change for two-button interface: (stop)record & play/stop
//  add an icon (position:absolute) that signals when recorder is active?
//  should save every recording attempt?

import * as JSZip from 'jszip';
import { changeRunningOrder } from "../controller.js";
import { saveAs } from 'file-saver';

// This array contains all the samples recorded so far
var audioStreams = [];
// The URL to the PHP file that saves the archive
var uploadURL = "";
// The recording object
var mediaRecorder;
// Whether PennController.InitiateRecorder has been called
var initiated = false;
// The zip file
var zipFile;
// The voice instruction currently active
var currentVoiceInstruction;


// The permission message displayed when the user is asked for access to the recording device
var permissionMessage = "This experiment collects voice recordings from its participants. "+
                        "Your browser should now be asking for your permission to use your recording device (if applicable). "+
                        "By giving you authorization to record and by participating in this experiment, "+
                        "you are giving permission to the designer(s) of this experiment to anonymously collect "+
                        "the voice  samples recorded during this experiment. "+
                        "The output audio files will be uploaded to and hosted on a server designated by the experimenter(s). ";
                        //"You will be given the option to download a copy of the archive of your audio recordings before it is uploaded.";

// This function defines a controller that initates the recording device
// It asks the user their permission to use their recording device to record their voice
// and then upload it for research purposes
// The controller should be placed before any recording is done in the running order
function initiateRecorder(controller){

    if (!navigator.mediaDevices){
        controller.element.append($("<p>Sorry, you cannot complete this experiment because your browser does not support voice recording.</p>"));
        return Abort;
    }
    
    let message = dget(controller.options, "permissionMessage", permissionMessage);

    controller.element.append($("<p>"+message+"</p>"));

    var constraints = { audio: true };
    var chunks = [];
    
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
    
        mediaRecorder = new MediaRecorder(stream);
    
        mediaRecorder.onstop = function(e) {
            console.log("data available after MediaRecorder.stop() called.");

            currentVoiceInstruction.filename = 'msr-' + (new Date).toISOString().replace(/:|\./g, '-') + '.ogg';
            console.log("Filename:", currentVoiceInstruction.filename);
            currentVoiceInstruction.blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
            console.log("Blob:", currentVoiceInstruction.blob);
            currentVoiceInstruction.audioPlayer.src = URL.createObjectURL(currentVoiceInstruction.blob);
            console.log("src:", currentVoiceInstruction.audioPlayer.src);

            chunks = [];
            currentVoiceInstruction = null;

            console.log("recorder stopped");
        };
    
        mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
        };

        let authorizationMessage = "By clicking this link I understand that I grant this experiment's script access "+
                                    "to my recording device for the purpose of uploading voice recordings "+
                                    "to the server designated by the experimenter(s).";

        // Add authorization/"continue" link now that the participant has granted access to the recording device
        controller.element.append(
            $("<a>"+authorizationMessage+"</a>")
                .addClass("Message-continue-link")
                .click(controller.finishedCallback)
        );

    })
    .catch(function(err) {
        controller.element.append($("<p>The following error occurred: " + err + "</p>"));
        return Abort;
    })
}


// Defines a controller that uploads the archive containing the audio recordings
// It will be automatically added before __SendResults__ if it is not manually added to items
// It asks the participant for their express permission to send the archive on the servers
// and gives them the option to download a copy of the archive
function uploadRecordings(controller) {

    controller.element.append($("<p>Please wait while the archive is being uploaded to the server...</p>"));

    var zip = new JSZip();   // Create the object representing the zip file

    for (let s in audioStreams) {
        var file = audioStreams[s];
        zip.file(file.name, file.data);
    }

    console.log('Generating compressed archive...');
    zip.generateAsync({
        compression: 'DEFLATE',
        type: 'blob'
    }).then(function(zc) { // Function called when the generation is complete
        // Create a function to download the archive
        PennController.downloadVoiceRecordingsArchive = function(){ saveAs(zc, "VoiceRecordingsArchive.zip"); };
        console.log('Compression complete!');
        var fileName = 'msr-' + (new Date).toISOString().replace(/:|\./g, '-') + '.zip';
        // Create file object to upload
        var fileObj = new File([zc], fileName);
        console.log('File object created:', fileObj);
        var fd = new FormData();
        fd.append('fileName', fileName);
        fd.append('file', fileObj);
        fd.append('mimeType', 'application/zip');
        console.log("Upload URL:", uploadURL);
        // Using XMLHttpRequest rather than jQuery's Ajax (mysterious CORS problems with jQuery 1.8)
        var xhr = new XMLHttpRequest();
        xhr.open('POST', uploadURL, true);
        xhr.onreadystatechange = function () {
          // 4 means finished and response ready
          if (xhr.readyState == 4){
            // 200 means success
            if (xhr.status == 200 && !xhr.responseText.match(/problem|error/i)) {
              console.log('Ajax post was successful. ', xhr.responseText);
              controller.finishedCallback([[["VoiceRecordingsFilename", fileName], ["UploadStatus", "Success"]]]);
            }
            // Else, error
            else { 
              alert("There was an error uploading the recordings ("+xhr.responseText+").");
              console.log('Ajax post failed. ('+xhr.status+')', xhr.responseText);
              controller.finishedCallback([[["VoiceRecordingsFilename", fileName], 
                                            ["UploadStatus", "Failed"],
                                            ["Error Text", xhr.responseText],
                                            ["Status", xhr.status]]]);
            }
          } 
        };
        xhr.send(fd);
    });
}


// Adding the upload step if not already there
changeRunningOrder(function (ro) {
    // If PennController.InitiateRecorder has not been called, leave running order as is
    if (!initiated)
        return ro;
    let manualUpload = false;
    let sendResultsID = [-1,-1];
    // Go through each element of each item in the running order
    for (let item = 0; item < ro.length; ++item) {
        for (let element = 0; element < ro[item].length; ++element) {
            // If current element is 'uploadRecordings' then upload is manual
            if (ro[item][element].controller == "PennController") {
                if (ro[item][element].options.hasOwnProperty("custom") && ro[item][element].options.custom == uploadRecordings) {
                    manualUpload = true;
                    if (sendResultsID[0]>=0)
                        alert("WARNING: upload of voice archive set AFTER sending of results; check the 'items' and 'shuffleSequence' variables.");
                }
            }
            // If current element is first encountered '__SendResults__' (and manualUpload not detected so far)
            else if (ro[item][element].controller == "__SendResults__" && sendResultsID[0]<0 && !manualUpload)
                sendResultsID = [item, element];
        }
    }
    // If no manual upload detected, then add the upload controller before __SendResults__
    if (!manualUpload) {
        console.log("No manual upload");
        let uploadElement = new DynamicElement("PennController", {custom: uploadRecordings});
        // If __SendResults__ was added manually, add upload controller before it
        if (sendResultsID[0]>=0)
            ro[sendResultsID[0]].splice(sendResultsID[1], 0, uploadElement);
        // Else, just add uploadElement at the end
        else 
            ro.push([uploadElement]);
    }
    console.log("Returning ro from voice:", ro);
    return ro;
});



// InitiateRecorder MUST be manually added to items and specify a URL to a PHP file for uploading the archive
PennController.InitiateRecorder = function(saveURL, message) {
    if (!typeof(url)=="string" || !saveURL.match(/^http.+/i))
        return console.log("ERROR: save URL is incorrect", saveURL);
    uploadURL = saveURL;
    initiated = true;
    return {custom: initiateRecorder, permissionMessage: message};
};


// Handler generating a HTML button to download the zip archive containing the voice recordings
PennController.DownloadVoiceButton = function (text) {
    return "<button type=\"button\" onclick=\""+
           "if (PennController.hasOwnProperty('downloadVoiceRecordingsArchive'))"+
           "  PennController.downloadVoiceRecordingsArchive();"+
           "  "+
           "else"+
           "  alert('ERROR: could not find an archive for voice recordings');"+
           "\">"+text+"</button>";
};


// Adds an VOICE to the parent element
// Done immediately
class VoiceRecorderInstr extends Instruction {
    constructor(arg) {
        super(arg, "voice");
        if (arg != Abort) {

            this.recording = false;

            this.audioPlayer = document.createElement("audio");

            let recorderUI = $("<span>").addClass("PennController-VoiceRecorderUI");
            let recordButton = $("<button>").addClass("PennController-VoiceRecorderRecord");
            let recordStatus = $("<div>").addClass("PennController-VoiceRecorderStatus");
            let playButton = $("<button>").addClass("PennController-VoiceRecorderPlay");
            let playInner = $("<div>");
            let stopButton = $("<button>").addClass("PennController-VoiceRecorderStop");
            let stopInner = $("<div>");

            // CSS
            $([recordButton, playButton, stopButton]).each(function(){ this.css({width: "25px", height: "25px", position: "relative"}); });
            $([playInner, stopInner, recordStatus]).each(function(){ this.css({position: "absolute", left: "2px", top: "4px", width: "15px", height: "15px"}); });
            recordButton.css({'background-color': "red", 'border-radius': "50%", "margin-right": "10px"});
            recordStatus.css({'background-color': "brown", 'border-radius': "50%", left: "6px", top: "6px", width: "10px", height: "10px" });
            playInner.css({
                width: 0, height: 0, 'background-color': "transparent", padding: 0,
                'border-top': "7.5px solid transparent", 'border-bottom': "7.5px solid transparent",
                'border-right': "0px solid transparent", 'border-left': "15px solid green"
            });
            stopInner.css({ 'background-color': "brown" });

            let showPlay = function(enabled){
                playButton.css("display", "inline-block");
                stopButton.css("display", "none");
                if (enabled){
                    playInner.css('border-left', "15px solid green");
                    playButton.attr("disabled", false);
                }
                else {
                    playInner.css('border-left', "15px solid gray");
                    playButton.attr("disabled", true);
                }
            };
            let showStop = function(enabled){
                stopButton.css("display", "inline-block");
                playButton.css("display", "none");
                if (enabled){
                    stopInner.css('background-color', "brown");
                    stopButton.attr("disabled", false);
                }
                else {
                    stopInner.css('background-color', "gray");
                    stopButton.attr("disabled", true);
                }
            };

            showPlay(false);

            // Handlers
            let ti = this;
            let statusInterval = null;
            recordButton.click(function(){
                if (ti.recording){
                    if (ti.audioPlayer.currentTime>0){
                        ti.audioPlayer.pause();
                        ti.audioPlayer.currentTime = 0;
                        showPlay(false);
                    }
                    ti.recording = false;
                    clearInterval(statusInterval);
                    recordStatus.css("background-color","brown");
                    showPlay(true);
                    ti._stop();
                }
                else {
                    recordStatus.css("background-color", "lightgreen");
                    statusInterval = setInterval(function(){
                        if (recordStatus.css("background-color") == "rgb(255, 255, 255)")
                            recordStatus.css("background-color", "lightgreen");
                        else
                            recordStatus.css("background-color", "white");
                    }, 750);
                    showPlay(false);
                    ti.recording = true;
                    ti._start();
                }
            });
            playButton.click(function(){
                showStop(true);
                ti.audioPlayer.currentTime = 0;
                ti.audioPlayer.play();
            });
            stopButton.click(function(){
                if (ti.audioPlayer.currentTime>0){
                    ti.audioPlayer.pause();
                    ti.audioPlayer.currentTime = 0;
                    showPlay(true);
                }
            });
            this.audioPlayer.onended = function(){ showPlay(true); };

            recorderUI.append(recordButton.append(recordStatus)).append(playButton.append(playInner)).append(stopButton.append(stopInner));

            // Set element to SPAN (will append audio later)
            this.setElement(recorderUI);
        }
    }

    // ========================================
    // PRIVATE & INTRINSIC METHODS
    // ========================================

    run() {
        if (super.run() == Abort)
            return Abort;
        
        if (typeof(mediaRecorder)=="undefined")
            return console.log("ERROR: recorder not initiated. "+
                               "Make sure your items variable contains an InitiateRecorder controller.");

        let ti = this;
        Ctrlr.running.callbackBeforeFinish(function(){
            if (ti.blob)
                audioStreams.push({
                    name: ti.filename,
                    data: ti.blob
                });
            if (ti.StartRecording)
                Ctrlr.running.save("VoiceRecorder", "StartRecording", ti.StartRecording, ti._id);
            if (ti.StopRecording)
                Ctrlr.running.save("VoiceRecorder", "StopRecording", ti.StopRecording, ti._id);
            if (ti.filename)
                Ctrlr.running.save("VoiceRecorder", "Filename", ti.filename, ti._id);
        });

        this._addElement(this.parentElement);

        this.done();
    }

    _start() {
        this.recording = true;
        this.StartRecording = Date.now();
        mediaRecorder.start();
    }

    _stop() {
        this.recording = false;
        this.StopRecording = Date.now();
        currentVoiceInstruction = this;
        mediaRecorder.stop();
    }
}

PennController.instruction.voiceRecorder = function(){ return new VoiceRecorderInstr(); };