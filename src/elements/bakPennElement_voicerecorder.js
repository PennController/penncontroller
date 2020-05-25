// // VOICERECORDER element
// /* $AC$ PennController.newVoiceRecorder(name,file) Creates a new VoiceRecorder element $AC$ */
// /* $AC$ PennController.getVoiceRecorder(name) Retrieves an existing Video element $AC$ */
// window.PennController._AddElementType("VoiceRecorder", function(PennEngine) {

//     // ====== INTERNAL SETTINGS AND FUNCTIONS ====== //
//     //
//     // The permission message displayed when the user is asked for access to the recording device
//     let permissionMessage = "This experiment collects voice recording samples from its participants. "+
//         "Your browser should now be prompting a permission request to use your recording device (if applicable). "+
//         "By giving your authorization to record, and by participating in this experiment, "+
//         "you are giving permission to the designer(s) of this experiment to anonymously collect "+
//         "the voice samples recorded during this experiment. "+
//         "The output audio files will be uploaded to and hosted on a server designated by the experimenter(s). "+
//         "If you accept the request, a label will remain visible at the top of this window throughout the whole experiment, "+
//         "indicating whether you are being recorded.";
//         //"You will be given the option to download a copy of the archive of your audio recordings before it is uploaded.";

//     // The text to click to consent
//     let authorizationMessage = "By clicking this link I understand that I grant this experiment's script access "+
//         "to my recording device for the purpose of uploading voice recordings "+
//         "to the server designated by the experimenter(s).";

//     let setWarning = message => permissionMessage = message;
//     let setConsent = message => authorizationMessage = message;

//     let mediaRecorder;              // The recording object
//     let audioStreams = [];          // This array contains all the samples recorded so far
//     let uploadURL = "";             // The URL to the PHP file that saves the archive
//     let initiated = false;          // Whether PennController.InitiateRecorder has been called
//     let currentVoiceElement;        // The voice element currently active
//     let statusElement;              // The top-right DOM element indicating whether it is currently recording
//     let resolveStart = [];          // List of promises to resolve on start
//     let resolveStop = [];           // List of promises to resolve on stop
//     let controllerLogs = [];        // List of columns to log for both initiaterecorder and uploadcontroller
//     let mimeType = '';              // The recording's mimetype, as output
//     let extension = '';             // The extension (should match mimetype)
//     let pendingRequests = [];       // The requests not resolved so far

//     // Set mime
//         let mimes = {'audio/webm': 'webm', 'audio/ogg': 'ogg'};
//         for (let type in mimes){
//             if (MediaRecorder.isTypeSupported(type)){
//                 mimeType = type;
//                 extension = mimes[type];
//             }
//         }
//     // Set mime end

//     // This controller MUST be manually added to items and specify a URL to a PHP file for uploading the archive
//     window.PennController.InitiateRecorder = function(saveURL,warning,consent) {    /* $AC$ global.PennController.InitiateRecorder(url,warning,consent) Sets the URL where to upload the recordings and creates a trial inviting the user to activate their microphone $AC$ */
//         if (window.MediaRecorder===undefined){
//             PennEngine.debug.error("This browser does not support audio recording");
//             return alert("Your browser does not support audio recording");
//         }
//         if (mimeType.length=0){
//             PennEngine.debug.error("This browser does not support expected encoding of audio recordings");
//             return alert("Your browser does not support expected encoding of audio recordings");
//         }
//         if (typeof(saveURL)!="string" || !saveURL.match(/^http.+/i))
//             PennEngine.debug.error("VoiceRecorder's save URL is incorrect", saveURL);
//         uploadURL = saveURL;                                    // Assign a URL
//         initiated = true;                                       // Indicate that recorder has been initiated
//         let controller = PennEngine.controllers.new();          // Create a new controller
//         controller.id = "InitiateRecorder";
//         controller.runHeader = false;                           // Don't run header and footer
//         controller.runFooter = false;
//         PennEngine.controllers.list.pop();                      // Remove from PennEngine's list immediately (not a 'real' controller)
//         PennEngine.tmpItems.push(controller);                   // Add it to the list of items to run
//         if (typeof warning == "string" && warning.length)
//             setWarning(warning);
//         if (typeof consent == "string" && consent.length)
//             setWarning(consent);
//         controller.sequence = ()=>new Promise(resolve=>{
//             let controller = PennEngine.controllers.running;    // In SEQUENCE, controller is the running instance
//             if (!navigator.mediaDevices)                        // Cannot continue if no media device available!
//                 return controller.element.append($("<p>Sorry, you cannot complete this experiment because your browser does not support voice recording.</p>"));
//             controller.element.append($("<p>"+permissionMessage+"</p>")); // Show message on screen
//             let constraints = { audio: true };                  // Retrieve audio only
//             let chunks = [];                                    // The chunks of audio streams recorded
//             navigator.mediaDevices.getUserMedia(constraints)
//             .then(function(stream) {                            // Create the mediaRecorder instance
//                 mediaRecorder = new MediaRecorder(stream,{mimeType:mimeType});
//                 mediaRecorder.recording = false;
//                 mediaRecorder.onstop = function(e) {            // When a recording is complete
//                     statusElement.css({'font-weight': "normal", color: "black", 'background-color': "lightgray"});
//                     statusElement.html("Not recording");        // Indicate that recording is over in status bar
//                     currentVoiceElement.blob = new Blob(chunks,{type:'audio/mpeg'});                        // Blob from chunks
//                     currentVoiceElement.audioPlayer.src = URL.createObjectURL(currentVoiceElement.blob);    // Can replay now
//                     chunks = [];                                                                            // Reset chunks
//                     currentVoiceElement = null;                                                             // Reset current element
//                     resolveStop.shift().call();
//                     mediaRecorder.recording = false;
//                 };
//                 mediaRecorder.onstart = function(e) {           // When a recording starts
//                     statusElement.css({'font-weight': "bold", color: "white", 'background-color': "red"});
//                     statusElement.html("Recording...");         // Indicate it in the status bar
//                     mediaRecorder.recording = true;
//                     resolveStart.shift().call();
//                 }
//                 mediaRecorder.ondataavailable = function(e) {   // Add chunks as they become available
//                     chunks.push(e.data);
//                 };
//                 controller.element.append(                      // Add the consent link to the page
//                     $("<a>"+authorizationMessage+"</a>")
//                         .addClass("Message-continue-link")
//                         .click(resolve)                         // Resolve sequence upon click
//                 );
//                 statusElement = $("<div>Not recording</div>");  // Initially not recording
//                 statusElement.css({
//                     position: "fixed",
//                     top: 0,
//                     left: "50%",
//                     transform: "translateX(-50%)",              // Trick to center (-width/2)
//                     padding: "2px",
//                     'background-color': "lightgray"
//                 });
//                 $("#bod").append(statusElement);                // Add status bar
        
//             })
//             .catch(function(err) {                              // Could not get audio device
//                 controller.element.append($("<p>The following error occurred: " + err + "</p>"));
//                 return;
//             });
//         });
//         let oldLog = controller.log;
//         controller.log = (...args)=>{
//             controllerLogs.push(args);
//             oldLog.apply(controller, args);
//             return controller;
//         };
//         controller.warning = message =>{
//             setWarning(message);
//             return controller;
//         };
//         controller.consent = message =>{
//             setConsent(message);
//             return controller;
//         };
//         return controller;
//     };


//     window.PennController.UploadVoiceRecordings = function(label,async) {  /* $AC$ global.PennController.UploadVoiceRecordings(label,noblock) Creates a trial that sends the voice recordings to the server $AC$ */
//         let uploadController = PennEngine.controllers.new();
//         PennEngine.tmpItems.push(uploadController);
//         if (typeof label == "string" && label.length)
//             uploadController.useLabel = label;
//         uploadController.id = "UploadRecordings";
//         uploadController.runHeader = false;         // Don't run header and footer
//         uploadController.runFooter = false;
//         uploadController.countsForProgressBar = false;
//         uploadController.sequence = ()=>new Promise(async function(resolve){
//             let controller = PennEngine.controllers.running;    // In SEQUENCE, controller is running instance
//             controller.element.append($("<p>Please wait while the archive of your recordings is being uploaded to the server...</p>"));
//             let zip = new PennEngine.utils.JSZip(); // Create the object representing the zip file
//             let uploadingStreams = [];
//             if (!async)                     // If not an async upload, wait for all requests to finish before proceeding
//                 await new Promise(r=>{
//                     let checkRequests = ()=>setTimeout( ()=>pendingRequests.length==0&&r()||checkRequests() , 10 );
//                     checkRequests();
//                 });
//             for (let s in audioStreams){             // Add each recording to the zip instance
//                 if (audioStreams[s].uploadStatus!="uploaded"){
//                     zip.file(audioStreams[s].name, audioStreams[s].data);
//                     audioStreams[s].uploadStatus = "uploading";
//                     uploadingStreams.push(audioStreams[s]);
//                 }
//             }
//             zip.generateAsync({
//                 compression: 'DEFLATE',
//                 type: 'blob'
//             }).then(function(zc) {                  // Generation/Compression of zip is complete
//                 window.PennController.downloadVoiceRecordingsArchive = ()=>PennEngine.utils.saveAs(zc, "VoiceRecordingsArchive.zip");
//                 let fileName = PennEngine.utils.guidGenerator()+'.zip';
//                 var fileObj = new File([zc], fileName); // Create file object to upload with uniquename
//                 var fd = new FormData();                // Submission-friendly format
//                 fd.append('fileName', fileName);
//                 fd.append('file', fileObj);
//                 fd.append('mimeType', 'application/zip');
//                 var xhr = new XMLHttpRequest();     // XMLHttpRequest rather than jQuery's Ajax (mysterious CORS problems with jQuery 1.8)
//                 xhr.open('POST', uploadURL, true);
//                 xhr.onreadystatechange = ()=>{
//                     if (xhr.readyState == 4){       // 4 means finished and response ready
//                         PennEngine.controllers.running
//                             .save("PennController", "UploadRecordings", "Filename", fileName, Date.now(), "NULL");
//                         let success = xhr.status == 200 && !xhr.responseText.match(/problem|error/i);
//                         if (success){ // Success
//                             PennEngine.controllers.running
//                                     .save("PennController", "UploadRecordings", "Status", "Success", Date.now(), "NULL");
//                             PennEngine.debug.log("Voice recordings sent to the server");
//                             for (let i = 0; i < uploadingStreams.length; i++)
//                                 uploadingStreams[i].uploadStatus = "uploaded";
//                                 // uploadingStreams[i].alreadyUploaded = true;
//                             if (!async)
//                                 resolve();              // Successful request
//                         }else {                                                              // Error
//                             for (let i = 0; i < uploadingStreams.length; i++)
//                                 uploadingStreams[i].uploadStatus = "local";
//                             window.PennController.uploadRecordingsError = xhr.responseText||"error";
//                             PennEngine.debug.error("VoiceRecorder's Ajax post failed. ("+xhr.status+")", xhr.responseText);
//                             PennEngine.controllers.running
//                                     .save("PennController", "UploadRecordings", "Status", "Failed", Date.now(), 
//                                           "Error Text: "+xhr.responseText+"; Status: "+xhr.status);
//                             controller.element
//                                 .append($("<p>There was an error uploading the recordings: "+xhr.responseText+"</p>"))
//                                 .append($("<p>Please click here to download a copy of your recordings "+
//                                           "in case you need to send them manually.</p>").bind('click', ()=>{
//                                                 PennEngine.utils.saveAs(zc, "VoiceRecordingsArchive.zip");
//                                                 if (!async)
//                                                     resolve();
//                                           }).addClass("Message-continue-link"));
//                         }
//                         // This request is no longer pending
//                         pendingRequests = pendingRequests.filter(v=>v!=xhr);
//                     } 
//                 };
//                 xhr.send(fd);                       // Send the request
//                 pendingRequests.push(xhr);
//                 if (async)
//                     resolve();
//             });
//         });
//         for (let i = 0; i < controllerLogs.length; i++)
//             uploadController.log(...controllerLogs[i]);
//         return uploadController;
//     }

//     // Handle uploading of the results automatically
//     PennEngine.Prerun(()=>{
//         let oldModify = window.conf_modifyRunningOrder;     // Trick: use Ibex's modifyRunningOrder to probe sequence of trials
//         window.conf_modifyRunningOrder = function (ro){     // Add the upload step automatically when sequence has been built  
//             if (oldModify instanceof Function)
//                 ro = oldModify.apply(this, [ro]);
//             if (!initiated)                                 // If InitiateRecorder has not been called, leave running order as is
//                 return ro;
//             let manualUpload = false;                       // Whether the sequence contains manual uploading of the results
//             let sendResultsID = [-1,-1];                    // Item + Element IDs of the __SendResults__ controller
//             for (let item = 0; item < ro.length; ++item) {  // Go through each element of each item in the running order
//                 for (let element = 0; element < ro[item].length; ++element) {
//                     console.log(`item ${item} element ${element}: controller ${ro[item][element].controller} id ${ro[item][element].options.id}`);
//                     if (ro[item][element].controller == "PennController" && ro[item][element].options.id == "UploadRecordings") {
//                         manualUpload = true;                // Uploading of recordings is manual
//                         if (sendResultsID[0]>=0)            // If __SendResults__ was found before
//                             alert("WARNING: upload of voice archive set AFTER sending of results; check your Sequence definition.");
//                     }
//                     else if (ro[item][element].controller == "__SendResults__" && sendResultsID[0]<0 && !manualUpload)
//                         sendResultsID = [item, element];    // Found __SendResults__: store item+element IDs
//                 }
//             }
//             // Edit v1.8: always try uploading one last time before sending, just in case
//             // if (!manualUpload) {                            // If no manual upload, add the upload controller before __SendResults__
//             //     console.log("No manual upload");
//                 let uploadController = window.PennController.UploadVoiceRecordings();
//                 PennEngine.tmpItems.pop();                  // Remove controller form list: manually added here
//                 let uploadElement = new DynamicElement("PennController", uploadController);
//                 if (sendResultsID[0]>=0)                    // Manual __SendResults__, add upload controller before it
//                     ro[sendResultsID[0]].splice(sendResultsID[1], 0, uploadElement);
//                 else                                        // Else, just add uploadElement at the end
//                     ro.push([uploadElement]);
//             // }
//             // console.log("ro", ro);
//             return ro;                                      // Return new running order
//         };
//     });
//     //
//     // ==== END INTERNAL SETTINGS AND FUNCTIONS ==== //


//     this.immediate = function(id){
//         if (id===undefined||typeof(id)!="string"||id.length==0)
//             id = "VoiceRecorder";
//         this.id = id;
//     };

//     this.uponCreation = function(resolve){
//         if (typeof(mediaRecorder)=="undefined")
//             PennEngine.debug.error("Recorder not initiated. Make sure the sequence of items contains an InitiateRecorder PennController.");
//         this.log = false;
//         this.recordings = [];
//         this.recording = false;
//         this.audioPlayer = document.createElement("audio");                                                // To play back recording
//         this.jQueryElement = $("<span>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-ui");   // The general UI 
//         let recordButton = $("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-record");// The record button
//         let recordStatus = $("<div>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-status");  // Small colored dot inside record button
//         let stopButton = $("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-stop");   // The stop button
//         let stopInner = $("<div>");                                                                        // The brownish/reddish square
//         let playButton = $("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-play");   // The play button
//         let playInner = $("<div>");                                                                        // The green triangle
//         $([recordButton, stopButton, playButton]).each(function(){ this.css({width: "25px", height: "25px", position: "relative"}); });
//         $([recordStatus, stopInner, playInner]).each(function(){ this.css({position: "absolute", left: "2px", top: "4px", width: "15px", height: "15px"}); });
//         recordButton.css({'background-color': "red", 'border-radius': "50%", "margin-right": "10px"});
//         recordStatus.css({'background-color': "brown", 'border-radius': "50%", left: "6px", top: "6px", width: "10px", height: "10px" });
//         stopInner.css({ 'background-color': "brown" });
//         playInner.css({                                                                                    // Triangles are more complicated
//             width: 0, height: 0, 'background-color': "transparent", padding: 0,
//             'border-top': "7.5px solid transparent", 'border-bottom': "7.5px solid transparent",
//             'border-right': "0px solid transparent", 'border-left': "15px solid green"
//         });

//         let showPlay = function(enabled){                                               // Show play triangle after recording
//             playButton.css("display", "inline-block");
//             stopButton.css("display", "none");
//             if (enabled){
//                 playInner.css('border-left', "15px solid green");
//                 playButton.attr("disabled", false);
//             }
//             else {
//                 playInner.css('border-left', "15px solid gray");
//                 playButton.attr("disabled", true);
//             }
//         };
//         let showStop = function(enabled){                                               // Show stop square while recording/playing
//             stopButton.css("display", "inline-block");
//             playButton.css("display", "none");
//             if (enabled){
//                 stopInner.css('background-color', "brown");
//                 stopButton.attr("disabled", false);
//             }
//             else {
//                 stopInner.css('background-color', "gray");
//                 stopButton.attr("disabled", true);
//             }
//         };
//         showPlay(false);                                                                // Start by showing (disabled) triangle
        
//         let statusInterval = null;
//         recordButton.click(()=>{                                                        // Click on RECORD button
//             if (this.audioPlayer.currentTime>0){
//                 this.audioPlayer.pause();                                               // stop playback
//                 this.audioPlayer.currentTime = 0;
//                 showPlay(false);                                                        // show disabled play triangle
//             }
//             if (this.recording){                                                        // while recording      ===>
//                 this.stop();                                                            // stop recording
//                 this.recording = false;
//                 clearInterval(statusInterval);                                          // stop indiciator's blinking
//                 recordStatus.css("background-color","brown");                           // change indicator's color
//                 showPlay(true);                                                         // show play triangle for playback
//             }
//             else {                                                                      // while NOT recording  ===>
//                 recordStatus.css("background-color", "lightgreen");                     // change indicator's color
//                 statusInterval = setInterval(()=>{
//                     if (recordStatus.css("background-color") == "rgb(255, 255, 255)")
//                         recordStatus.css("background-color", "lightgreen");             // blink betwen green
//                     else
//                         recordStatus.css("background-color", "white");                  // and white
//                 }, 750);
//                 showPlay(false);                                                        // show disabled play triangle
//                 this.recording = true;
//                 this.start();                                                           // start recording
//             }
//         });
//         playButton.click(()=>{                                                          // Click on PLAY button
//             showStop(true);                                                             // show stop square
//             this.audioPlayer.currentTime = 0;                                           // start from stream's beginning
//             this.audioPlayer.play();                                                    // and play back
//             this.hasPlayed = true;
//         });
//         stopButton.click(()=>{                                                          // Click on STOP button
//             if (this.audioPlayer.currentTime>0){
//                 this.audioPlayer.pause();                                               // stop playback
//                 this.audioPlayer.currentTime = 0;
//                 showPlay(true);                                                         // show play triangle
//             }
//         });
//         this.audioPlayer.onended = ()=>showPlay(true);                                  // show play triangle again after playback

//         this.start = ()=>new Promise(r=>{
//             this.recording = true;
//             resolveStart.push( ()=>{ this.recordings.push(["Recording", "Start", Date.now(), "NULL"]); r(); } );
//             mediaRecorder.start();
//         });

//         this.stop = ()=>new Promise(r=>{
//             this.recording = false;
//             currentVoiceElement = this;
//             resolveStop.push( ()=>{ this.recordings.push(["Recording", "Stop", Date.now(), "NULL"]); r(); } );
//             if (mediaRecorder.recording)
//                 mediaRecorder.stop();                                                  // This will look at currentVoiceElement
//             else
//                 r();
//         });

//         this.jQueryElement.append(
//             recordButton.append(recordStatus)
//         ).append(
//             playButton.append(playInner)
//         ).append(
//             stopButton.append(stopInner)
//         );
//         resolve();
//     }
    
//     this.end = function(){
//         if (this.blob){
//             let filename = this.id+'.'+extension;
//             let existing_fileanames = audioStreams.map(a=>a.name);
//             let i = 0;
//             while (existing_fileanames.indexOf(filename)>=0){
//                 i++;
//                 filename = this.id+'-'+i+'.'+extension;
//             }
//             audioStreams.push({
//                 name: filename,
//                 data: this.blob,
//                 uploadStatus: "local"
//             });
//             PennEngine.controllers.running.save(this.type, this.id, "Filename", filename, Date.now(), "NULL");
//         }
//         if (this.log)
//             for (let r in this.recordings)
//                 PennEngine.controllers.running.save(this.type, this.id, ...this.recordings[r]);
//     };

//     this.value = function(){        // Value is blob of recording
//         return this.blob;
//     };
    

//     this.actions = {
//         play: function(resolve){    /* $AC$ VoiceRecorder PElement.play() Starts playing back the recording $AC$ */
//             if (this.audioPlayer && this.audioPlayer.src){
//                 if (this.audioPlayer.currentTime && this.audioPlayer.currentTime != 0)
//                     this.audioPlayer.currentTime = 0;
//                 this.audioPlayer.play().then(()=>resolve());
//             }
//             else
//                 resolve();
//         },
//         record: async function(resolve){    /* $AC$ VoiceRecorder PElement.record() Starts recording $AC$ */
//             await this.start();
//             resolve();
//         },
//         stop: async function(resolve){    /* $AC$ VoiceRecorder PElement.stop() Stops playback or recording $AC$ */
//             await this.stop();
//             if (this.audioPlayer && this.audioPlayer.src){
//                 this.audioPlayer.pause();
//                 if (this.audioPlayer.currentTime && this.audioPlayer.currentTime != 0)
//                     this.audioPlayer.currentTime = 0;
//             }
//             resolve();
//         },
//         wait: function(resolve, test){    /* $AC$ VoiceRecorder PElement.wait() Waits until recording stops before proceeding $AC$ */
//             if (test && typeof(test)=="string" && test.match(/first/i) && this.recordings.length)
//                 resolve();                                  // If first and has already recorded, resolve already
//             else if (test && typeof(test)=="string" && test.match(/play/i) && this.audioPlayer){
//                 let oldEnded = this.audioPlayer.onended;
//                 this.audioPlayer.onended = function(...rest) {
//                     if (oldEnded instanceof Function)
//                         oldEnded.apply(this, rest);
//                     resolve();
//                 };
//             }
//             else {                                          // Else, extend stop and do the checks
//                 let resolved = false;
//                 let originalStop = this.stop;
//                 this.stop = ()=>new Promise(r=>{
//                     originalStop.apply(this).then(()=>{
//                         r();
//                         if (resolved)
//                             return;
//                         if (test instanceof Object && test._runPromises && test.success){
//                             let oldDisabled = this.disabled;    // Disable temporarilly
//                             this.disabled = "tmp";
//                             test._runPromises().then(value=>{   // If a valid test command was provided
//                                 if (value=="success"){
//                                     resolved = true;
//                                     resolve();                  // resolve only if test is a success
//                                 }
//                                 if (this.disabled == "tmp")     // Restore old setting if not modified by test
//                                     this.disabled = oldDisabled;
//                             });
//                         }
//                         else{                                   // If no (valid) test command was provided
//                             resolved = true;
//                             resolve();                          // resolve anyway
//                         }
//                     });
//                 });
//             }
//         }
//     };
    
//     this.settings = {
//         disable: function(resolve){
//             this.disabled = true;
//             this.jQueryElement.find("button.PennController-"+this.type+"-record")
//                 .attr("disabled", true)
//                 .css("background-color", "brown");
//             this.jQueryContainer.addClass("PennController-disabled");
//             this.jQueryElement.addClass("PennController-disabled");    
//             resolve();
//         },
//         enable: function(resolve){
//             this.disabled = false;
//             this.jQueryElement.find("button.PennController-"+this.type+"-record")
//                 .removeAttr("disabled")
//                 .css("background-color", "red");
//             this.jQueryContainer.removeClass("PennController-disabled");
//             this.jQueryElement.removeClass("PennController-disabled");
//             resolve();
//         },
//         once: function(resolve){    /* $AC$ VoiceRecorder PElement.once() Will disable the recording interface after the first recording is complete $AC$ */
//             if (this.recordings.length){
//                 this.disabled = true;
//                 this.jQueryElement.find("button.PennController-"+this.type+"-record")
//                     .attr("disabled", true)
//                     .css("background-color", "brown");
//             }
//             else{
//                 let originalStop = this.stop;
//                 this.stop = ()=>new Promise(r=>{
//                     if (originalStop instanceof Function)
//                         originalStop.apply(this).then(r);
//                     else
//                         r();
//                     this.disabled = true;
//                     this.jQueryElement.find("button.PennController-"+this.type+"-record")
//                         .attr("disabled", true)
//                         .css("background-color", "brown");
//                 });
//             }
//             resolve();
//         },
//         log: function(resolve){    /* $AC$ VoiceRecorder PElement.log() Will log events in the results file $AC$ */
//             this.log = true;
//             resolve();
//         }
//     };
    
//     this.test = {
//         // Every test is used within a Promise back-end, but it should simply return true/false
//         hasPlayed: function(){    /* $AC$ VoiceRecorder PElement.test.hasPlayed() Checks that the recording was fully played back before $AC$ */
//             return this.hasPlayed;
//         }
//         ,
//         playing: function(){    /* $AC$ VoiceRecorder PElement.test.playing() Checks that the recording is currently being played back $AC$ */
//             return this.audio.currentTime&&!this.audio.paused;
//         }
//         ,
//         recorded: function(){    /* $AC$ VoiceRecorder PElement.test.recorded() Checks that recording has happened $AC$ */
//             return this.blob;
//         }
//     };

// });

// // Handler generating a HTML button to download the zip archive containing the voice recordings
// window.PennController.DownloadVoiceButton = function (text) {    /* $AC$ global.PennController.DownloadVoiceButton(text) Returns an HTML string representing a button to download an archive of the recordings $AC$ */
//     return "<button type=\"button\" onclick=\""+
//            "if (PennController.hasOwnProperty('downloadVoiceRecordingsArchive'))"+
//            "  PennController.downloadVoiceRecordingsArchive();"+
//            "  "+
//            "else"+
//            "  alert('ERROR: could not find an archive for voice recordings');"+
//            "\">"+text+"</button>";
// };