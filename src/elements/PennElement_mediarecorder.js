// MediaRecorder element
/* $AC$ PennController.newMediaRecorder(name,type) Creates a new MediaRecorder element of type "audio" or "video" $AC$ */
/* $AC$ PennController.getMediaRecorder(name) Retrieves an existing MediaRecorder element $AC$ */
window.PennController._AddElementType("MediaRecorder", function(PennEngine) {

    // ====== INTERNAL SETTINGS AND FUNCTIONS ====== //
    //
    // The permission message displayed when the user is asked for access to the recording device
    let permissionMessage = "This experiment collects recording samples from its participants. "+
        "Your browser should now be prompting a permission request to use your recording device (if applicable). "+
        "By giving your authorization to record, and by participating in this experiment, "+
        "you are giving permission to the designer(s) of this experiment to anonymously collect "+
        "the samples recorded during this experiment. "+
        "The recordings will be uploaded to, and hosted on, a server designated by the experimenter(s). "+
        "If you accept the request, a label will remain visible at the top of this window throughout the whole experiment, "+
        "indicating whether you are currently being recorded.";
        //"You will be given the option to download a copy of the archive of your audio recordings before it is uploaded.";

    // The text to click to consent
    let authorizationMessage = "By clicking this link I understand that I grant this experiment's script access "+
        "to my recording device for the purpose of uploading recordings "+
        "to the server designated by the experimenter(s).";

    let setWarning = message => permissionMessage = message;
    let setConsent = message => authorizationMessage = message;

    // let mediaRecorder;              // The recording object
    let recorders = {audio: null, video: null, onlyvideo: null};
    let streams = [];               // This array contains all the samples recorded so far
    let uploadURL = "";             // The URL to the PHP file that saves the archive
    let initiated = false;          // Whether PennController.InitiateRecorder has been called
    let useMediaRecorder = false;   // Whether a newMediaRecorder command is present in the code
    let currentMediaElement;        // The media element currently active
    let statusElement;              // The top-right DOM element indicating whether it is currently recording
    let resolveStart = [];          // List of promises to resolve on start
    let resolveStop = new Map();    // Associates MediaRecorder elements with promises to stop
    let controllerLogs = [];        // List of columns to log for both InitiateRecorder and uploadcontroller
    let pendingRequests = [];       // The requests not resolved so far
    const checkRequests = ()=>new Promise(r=>setTimeout( ()=>pendingRequests.length==0&&r()||checkRequests() , 10 ));

    let captureAudio = false;
    let captureVideo = false;

    // Set mime
    const mimes = {
        audio: {'audio/webm': 'webm', 'audio/ogg': 'ogg'},
        video: {'video/webm': 'webm', 'video/mp4': 'mp4'}
    }
    function getMimeExtension(type){
        const submimes = mimes[type];
        for (let mime in submimes){
            if (MediaRecorder.isTypeSupported(mime))
                return{mimeType: mime, extension: submimes[mime]};
        }
    }

    // This controller MUST be manually added to items and specify a URL to a PHP file for uploading the archive
    window.PennController.InitiateRecorder = function(saveURL,warning,consent) {    /* $AC$ global.PennController.InitiateRecorder(url,warning,consent) Sets the URL where to upload the recordings and creates a trial inviting the user to activate their microphone $AC$ */
        if (window.MediaRecorder===undefined){
            PennEngine.debug.error("This browser does not support audio recording");
            return alert("Your browser does not support audio recording");
        }
        if (typeof(saveURL)!="string" /* || !saveURL.match(/^(https?|aws):.+/i) */ )
            PennEngine.debug.error("MediaRecorder's save URL is incorrect", saveURL);
        uploadURL = saveURL;                                    // Assign a URL
        initiated = true;                                       // Indicate that recorder has been initiated
        let controller = PennEngine.controllers.new();          // Create a new controller
        controller.id = "InitiateRecorder";
        controller.runHeader = false;                           // Don't run header and footer
        controller.runFooter = false;
        PennEngine.controllers.list.pop();                      // Remove from PennEngine's list immediately (not a 'real' controller)
        PennEngine.tmpItems.push(controller);                   // Add it to the list of items to run
        if (typeof warning == "string" && warning.length)
            setWarning(warning);
        if (typeof consent == "string" && consent.length)
            setWarning(consent);
        controller.sequence = ()=>new Promise(resolve=>{
            let controller = PennEngine.controllers.running;    // In SEQUENCE, controller is the running instance
            if (!navigator.mediaDevices)                        // Cannot continue if no media device available!
                return controller.element.append($("<p>Sorry, you cannot complete this experiment because your browser does not support recording.</p>"));
            controller.element.append($("<p>"+permissionMessage+"</p>")); // Show message on screen

            let constraints = {};
            if (captureAudio) constraints.audio = true;
            if (captureVideo) constraints.video = true;

            let chunks = [];                                    // The chunks of audio streams recorded
            navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {                            // Create the mediaRecorder instance
                // Create up to three streams: audio only, video only(?), both
                if (captureAudio){
                    let audiostream = stream;
                    if (captureVideo){
                        audiostream = audiostream.clone();
                        audiostream.getVideoTracks().map(track=>audiostream.removeTrack(track));
                    }
                    recorders.audio = new MediaRecorder(audiostream,{mimeType:getMimeExtension('audio').mimeType});
                }
                if (captureVideo) {
                    let videoonlystream = stream.clone();
                    videoonlystream.getAudioTracks().map(track=>videoonlystream.removeTrack(track));
                    recorders.onlyvideo = videoonlystream;
                    recorders.video = new MediaRecorder(stream,{mimeType:getMimeExtension('video').mimeType});
                }
                [recorders.audio,recorders.video].map( mediaRecorder => {
                    if (mediaRecorder===null) return;
                    mediaRecorder.recording = false;
                    mediaRecorder.onstop = function(e) {            // When a recording is complete
                        statusElement.css({'font-weight': "normal", color: "black", 'background-color': "lightgray"});
                        statusElement.html("Not recording");        // Indicate that recording is over in status bar
                        let mime = getMimeExtension(currentMediaElement.mediaType).mimeType;
                        currentMediaElement.mediaPlayer.srcObject = null;
                        currentMediaElement.blob = new Blob(chunks,{type:mime});                        // Blob from chunks
                        currentMediaElement.mediaPlayer.src = URL.createObjectURL(currentMediaElement.blob);    // Can replay now
                        chunks = [];                                                                            // Reset chunks
                        const thisResolveStop = resolveStop.get(currentMediaElement);
                        while (thisResolveStop && thisResolveStop instanceof Array && thisResolveStop.length)
                            thisResolveStop.shift().call();
                        mediaRecorder.recording = false;
                    };
                    mediaRecorder.onstart = function(e) {           // When a recording starts
                        statusElement.css({'font-weight': "bold", color: "white", 'background-color': "red"});
                        statusElement.html("Recording...");         // Indicate it in the status bar
                        if (currentMediaElement.mediaType=="video"){
                            currentMediaElement.mediaPlayer.srcObject = recorders.onlyvideo;
                            currentMediaElement.mediaPlayer.play();
                        }
                        mediaRecorder.recording = true;
                        resolveStart.shift().call();
                    }
                    mediaRecorder.ondataavailable = function(e) {   // Add chunks as they become available
                        chunks.push(e.data);
                    };
                });
                controller.element.append(                      // Add the consent link to the page
                    $("<a>"+authorizationMessage+"</a>")
                        .addClass("Message-continue-link")
                        .click(resolve)                         // Resolve sequence upon click
                );
                statusElement = $("<div>Not recording</div>");  // Initially not recording
                statusElement.css({
                    position: "fixed",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",              // Trick to center (-width/2)
                    padding: "2px",
                    'background-color': "lightgray"
                });
                $("#bod").append(statusElement);                // Add status bar
        
            })
            .catch(function(err) {                              // Could not get audio device
                controller.element.append($("<p>The following error occurred: " + err + "</p>"));
                return;
            });
        });
        let oldLog = controller.log;
        controller.log = (...args)=>{
            controllerLogs.push(args);
            oldLog.apply(controller, args);
            return controller;
        };
        controller.warning = message =>{
            setWarning(message);
            return controller;
        };
        controller.consent = message =>{
            setConsent(message);
            return controller;
        };
        PennEngine.ArgumentCallback( a=>{
            if (a==controller)
                PennEngine.tmpItems = PennEngine.tmpItems.filter(i=>i!=controller);
        });
        PennEngine.NewTrialArgumentCallback(a=>{
            if (a==controller)
                PennEngine.tmpItems = PennEngine.tmpItems.filter(i=>i!=controller);
        });
        controller._runPromises = controller.sequence;
        return controller;
    };

    window.PennController.UploadRecordings = function(label,async) {  /* $AC$ global.PennController.UploadRecordings(label,noblock) Creates a trial that sends the recordings to the server $AC$ */
        let uploadController = PennEngine.controllers.new();
        PennEngine.tmpItems.push(uploadController);
        const callback = a=>{
            if (a==uploadController)
                PennEngine.tmpItems = PennEngine.tmpItems.filter(i=>i!=uploadController)
        }
        PennEngine.NewTrialArgumentCallback(callback);
        PennEngine.ArgumentCallback(callback);
        if (typeof label == "string" && label.length)
            uploadController.useLabel = label;
        uploadController.id = "UploadRecordings";
        uploadController.runHeader = false;         // Don't run header and footer
        uploadController.runFooter = false;
        uploadController.countsForProgressBar = false;
        uploadController.sequence = ()=>new Promise(async function(resolve){
            let controller = PennEngine.controllers.running;    // In SEQUENCE, controller is running instance
            controller.element.append($("<p>Please wait while the archive of your recordings is being uploaded to the server...</p>"));
            if (!async) await checkRequests();  // If not an async upload, wait for all requests to finish before proceeding
            const zip = new PennEngine.utils.JSZip(); // Create the object representing the zip file
            const uploadingStreams = [];
            streams.forEach(s=>{
                if (s.uploadStatus==="uploaded") return;
                zip.file(s.name, s.data);
                s.uploadStatus = "uploading";
                uploadingStreams.push(s);
            });
            if (uploadingStreams.length===0) return resolve();
            // Create and push the request now, without any further delay
            const request = {};
            pendingRequests.push(request);
            zip.generateAsync({
                compression: 'DEFLATE',
                type: 'blob'
            }).then(function(zc) {                  // Generation/Compression of zip is complete
                window.PennController.downloadRecordingsArchive = ()=>PennEngine.utils.saveAs(zc, "RecordingsArchive.zip");
                let fileName = PennEngine.utils.guidGenerator()+'.zip';
                var fileObj = new File([zc], fileName); // Create file object to upload with uniquename
                if (uploadURL.match(/^aws:/i))
                    PennEngine.debug.error("The 'aws:' prefix in InitiateRecorder is no longer supported");
                else {
                    PennEngine.utils.upload(uploadURL, fileName, fileObj, 'application/zip')
                        .then( f=>{
                            fileName = f;
                            PennEngine.controllers.running
                                .save("PennController", "UploadRecordings", "Filename", fileName, Date.now(), (async?"async":"NULL"));
                            PennEngine.controllers.running
                                .save("PennController", "UploadRecordings", "Status", "Success", Date.now(), (async?"async":"NULL"));
                            PennEngine.debug.log("Recordings sent to the server");
                            for (let i = 0; i < uploadingStreams.length; i++)
                                uploadingStreams[i].uploadStatus = "uploaded";
                            if (!async)
                                resolve();              // Successful request
                            pendingRequests = pendingRequests.filter(v=>v!=request);
                    // Error
                        }).catch( e => {
                            PennEngine.controllers.running
                                .save("PennController", "UploadRecordings", "Filename", fileName, Date.now(), (async?"async":"NULL"));
                            for (let i = 0; i < uploadingStreams.length; i++)
                                uploadingStreams[i].uploadStatus = "local";
                            window.PennController.UploadRecordingsError = e||"error";
                            PennEngine.debug.error("MediaRecorder's Ajax post failed", e);
                            PennEngine.controllers.running
                                    .save("PennController", "UploadRecordings", "Status", "Failed", Date.now(), 
                                        "Error Text: "+e);
                            controller.element
                                .append($("<p>There was an error uploading the recordings: "+e+"</p>"))
                                .append($("<p>Please click here to download a copy of your recordings "+
                                        "in case you need to send them manually.</p>").bind('click', ()=>{
                                                PennEngine.utils.saveAs(zc, "RecordingsArchive.zip");
                                                if (!async)
                                                    resolve();
                                        }).addClass("Message-continue-link"));
                            pendingRequests = pendingRequests.filter(v=>v!=request);
                        });
                    }
            });
            if (async)
                resolve();
        });
        for (let i = 0; i < controllerLogs.length; i++)
            uploadzipController.log(...controllerLogs[i]);
        uploadController._promises = [uploadController.sequence];
        uploadController._runPromises = uploadController.sequence;
        return uploadController;
    }

    // Handle uploading of the results automatically
    PennEngine.Prerun(()=>{
        let oldModify = window.conf_modifyRunningOrder;     // Trick: use Ibex's modifyRunningOrder to probe sequence of trials
        window.conf_modifyRunningOrder = function (ro){     // Add the upload step automatically when sequence has been built  
            if (oldModify instanceof Function)
                ro = oldModify.apply(this, [ro]);
            // if (!initiated)                                 // If InitiateRecorder has not been called, leave running order as is
            if (!useMediaRecorder)
                return ro;
            let foundUploadRecordings = false;              // Whether the sequence contains manual uploading of the results
            let initiateRecorder = false;                   // Wehther InitiateRecorder is in the Sequence
            let sendResultsID = [-1,-1];                    // Item + Element IDs of the __SendResults__ controller
            for (let item = 0; item < ro.length; ++item) {  // Go through each element of each item in the running order
                for (let element = 0; element < ro[item].length; ++element) {
                    const type = ro[item][element].controller, id = ro[item][element].options.id;
                    if (type == "PennController" && id == "UploadRecordings") {
                        foundUploadRecordings = true;       // Uploading of recordings is manual
                        if (sendResultsID[0]>=0)            // If __SendResults__ was found before
                            alert("WARNING: upload of recording archive set AFTER sending of results; check your Sequence definition.");
                    }
                    else if (type == "__SendResults__" && sendResultsID[0]<0 && !foundUploadRecordings)
                        sendResultsID = [item, element];    // Found __SendResults__: store item+element IDs
                    else if (type == "PennController" && id == "InitiateRecorder")
                        initiateRecorder = true;
                }
            }
            if (!initiateRecorder)
                PennEngine.debug.error("This project uses MediaRecorder but InitiateRecorder is not included in the Sequence");
            // Edit v1.8: always try uploading one last time before sending, just in case
            // if (!foundUploadRecordings) {                            // If no manual upload, add the upload controller before __SendResults__
            //     console.log("No manual upload");
                const uploadController = window.PennController.UploadRecordings();
                PennEngine.tmpItems.pop();                  // Remove controller form list: manually added here
                const uploadElement = new DynamicElement("PennController", uploadController);
                if (sendResultsID[0]>=0)                    // Manual __SendResults__, add upload controller before it
                    ro.splice(sendResultsID[0], 0, [uploadElement]);
                else                                        // Else, just add uploadElement at the end
                    ro.push([uploadElement]);
            // }
            // console.log("ro", ro);
            return ro;                                      // Return new running order
        };
    });
    //
    // ==== END INTERNAL SETTINGS AND FUNCTIONS ==== //


    this.immediate = function(id, type){
        useMediaRecorder = true;
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "MediaRecorder";
        else if (type===undefined)
            type = id
        if (typeof(type)=="string" && type.match(/audio/) && (!type.match(/video/i) || type.match(/no\W*video/i))){
            this.mediaType = "audio";
            captureAudio = true;
        }
        else if (typeof(type)=="string" && (type.match(/(only\W*video|video\W*only)/i) || (type.match(/video/i) && type.match(/no\W*audio/)))){
            this.mediaType = "video";
            captureVideo = true;
        }
        else{
            // this.type = "audiovideo";
            this.mediaType = "video";
            captureAudio = true;
            captureVideo = true;
        }
        this.id = id;
        Object.defineProperty(this, "recorder", {get: ()=>recorders[this.mediaType]});
    };

    this.uponCreation = function(resolve){
        if (uploadURL.length==0)
            PennEngine.debug.error("Recorder not initiated. Make sure the sequence of items contains an InitiateRecorder trial.");
        resolveStop.set(this, []);  // no callback for mediarecorder.onstop yet
        this.log = false;
        this.recordings = [];
        this.recording = false;
        if (this.mediaType=="audio")
            this.mediaPlayer = document.createElement("audio");                                         // To play back recording
        else if (this.mediaType=="video")
            this.mediaPlayer = document.createElement("video");
        this.mediaPlayer.setAttribute("controls", true);
        this.mediaPlayer.onended = ()=>this.hasPlayed=true;
        this.videoFeedback = $("<div>").css({position:"absolute"});
        this.jQueryElement = $("<span>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-ui");   // The general UI 
        let recordButton = $("<button>Record</button>").addClass("PennController-"+this.type.replace(/[\s_]/g,'')+"-record");// The record button
        
        let statusInterval = null;
        recordButton.click(()=>{                                                        // Click on RECORD button
            this.mediaPlayer.pause();                                                   // stop playback
            this.mediaPlayer.currentTime = 0;
            if (this.recording){                                                        // while recording      ===>
                this.stop();                                                            // stop recording
                this.recording = false;
                recordButton.text("Record");
                clearInterval(statusInterval);                                          // stop indiciator's blinking
            }
            else {                                                                      // while NOT recording  ===>
                recordButton.text("Stop");
                this.recording = true;
                this.start();                                                           // start recording
            }
        });

        this.start = ()=>new Promise(r=>{
            currentMediaElement = this;
            if (this.recorder.state=="recording")
                this.recorder.stop();
            this.recording = true;
            resolveStart.push( ()=>{ this.recordings.push(["Recording", "Start", Date.now(), "NULL"]); r(); } );
            this.recorder.start();
            recordButton.text("Stop");
        });

        this.stop = ()=>new Promise(r=>{
            this.recording = false;
            recordButton.text("Record");
            currentMediaElement = this;
            if (this.recorder.state=="recording"){
                resolveStop.get(this).push( ()=>{ this.recordings.push(["Recording", "Stop", Date.now(), "NULL"]); r(); } );
                this.recorder.stop();                                                  // This will look at currentMediaElement
            }
            else
                r();
        });

        this.jQueryElement
            .append( $(this.mediaPlayer) )
            .append( recordButton );
        resolve();
    }
    
    this.end = async function(){
        currentMediaElement = this;
        if (this.recorder && this.recorder.state=="recording")
            await new Promise(r=>{  // Wait that the recorder has fully stopped
                const oldStop = this.recorder.onstop;
                this.recorder.onstop = function(...args){
                    if (typeof oldStop == "function")
                        oldStop.apply(this, args);
                    r();
                }
                this.recorder.stop();
            });
        const thisResolveStop = resolveStop.get(this);
        if (thisResolveStop instanceof Array && thisResolveStop.length>0)
            await new Promise(r=>thisResolveStop.push(r));  // Wait until blob is created so stream can be pushed
        if (this.blob){
            const extension = getMimeExtension(this.mediaType).extension;
            const existing_filenames = streams.map(a=>a.name);
            let filename = this.id+'.'+extension;
            let i = 0;
            while (existing_filenames.indexOf(filename)>=0){
                i++;
                filename = this.id+'-'+i+'.'+extension;
            }
            streams.push({
                name: filename,
                data: this.blob,
                uploadStatus: "local"
            });
            PennEngine.controllers.running.save(this.type, this.id, "Filename", filename, Date.now(), "NULL");
        }
        if (this.log)
            for (let r in this.recordings)
                PennEngine.controllers.running.save(this.type, this.id, ...this.recordings[r]);
    };

    this.value = function(){        // Value is blob of recording
        return this.blob;
    };
    

    this.actions = {
        play: function(resolve){    /* $AC$ MediaRecorder PElement.play() Starts playing back the recording $AC$ */
            if (this.mediaPlayer && this.mediaPlayer.src){
                if (this.mediaPlayer.currentTime && this.mediaPlayer.currentTime != 0)
                    this.mediaPlayer.currentTime = 0;
                this.mediaPlayer.play().then(()=>resolve());
            }
            else
                resolve();
        },
        record: async function(resolve){    /* $AC$ MediaRecorder PElement.record() Starts recording $AC$ */
            await this.start();
            resolve();
        },
        stop: async function(resolve){    /* $AC$ MediaRecorder PElement.stop() Stops playback or recording $AC$ */
            await this.stop();
            if (this.mediaPlayer && this.mediaPlayer.src){
                this.mediaPlayer.pause();
                if (this.mediaPlayer.currentTime && this.mediaPlayer.currentTime != 0)
                    this.mediaPlayer.currentTime = 0;
            }
            resolve();
        },
        wait: function(resolve, test){    /* $AC$ MediaRecorder PElement.wait() Waits until recording stops before proceeding $AC$ */
            if (test && typeof(test)=="string" && test.match(/first/i) && this.recordings.length)
                resolve();                                  // If first and has already recorded, resolve already
            else if (test && typeof(test)=="string" && test.match(/play/i) && this.mediaPlayer){
                let oldEnded = this.mediaPlayer.onended;
                this.mediaPlayer.onended = function(...rest) {
                    if (oldEnded instanceof Function)
                        oldEnded.apply(this, rest);
                    resolve();
                };
            }
            else {                                          // Else, extend stop and do the checks
                let resolved = false;
                let originalStop = this.stop;
                this.stop = ()=>new Promise(r=>{
                    originalStop.apply(this).then(()=>{
                        r();
                        if (resolved)
                            return;
                        if (test instanceof Object && test._runPromises && test.success){
                            let oldDisabled = this.disabled;    // Disable temporarilly
                            this.disabled = "";
                            test._runPromises().then(value=>{   // If a valid test command was provided
                                if (value=="success"){
                                    resolved = true;
                                    resolve();                  // resolve only if test is a success
                                }
                                if (this.disabled == "")     // Restore old setting if not modified by test
                                    this.disabled = oldDisabled;
                            });
                        }
                        else{                                   // If no (valid) test command was provided
                            resolved = true;
                            resolve();                          // resolve anyway
                        }
                    });
                });
            }
        }
    };
    
    this.settings = {
        disable: function(resolve){
            this.disabled = true;
            this.jQueryElement.find("button.PennController-"+this.type+"-record")
                .attr("disabled", true)
                .css("background-color", "brown");
            this.jQueryContainer.addClass("PennController-disabled");
            this.jQueryElement.addClass("PennController-disabled");
            resolve();
        },
        enable: function(resolve){
            this.disabled = false;
            this.jQueryElement.find("button.PennController-"+this.type+"-record")
                .removeAttr("disabled")
                .css("background-color", "red");
            this.jQueryContainer.removeClass("PennController-disabled");
            this.jQueryElement.removeClass("PennController-disabled");
            resolve();
        },
        once: function(resolve){    /* $AC$ MediaRecorder PElement.once() Will disable the recording interface after the first recording is complete $AC$ */
            if (this.recordings.length){
                this.disabled = true;
                this.jQueryElement.find("button.PennController-"+this.type+"-record")
                    .attr("disabled", true)
                    .css("background-color", "brown");
            }
            else{
                let originalStop = this.stop;
                this.stop = ()=>new Promise(r=>{
                    if (originalStop instanceof Function)
                        originalStop.apply(this).then(r);
                    else
                        r();
                    this.disabled = true;
                    this.jQueryElement.find("button.PennController-"+this.type+"-record")
                        .attr("disabled", true)
                        .css("background-color", "brown");
                });
            }
            resolve();
        },
        log: function(resolve){    /* $AC$ MediaRecorder PElement.log() Will log events in the results file $AC$ */
            this.log = true;
            resolve();
        }
    };
    
    this.test = {
        // Every test is used within a Promise back-end, but it should simply return true/false
        hasPlayed: function(){    /* $AC$ MediaRecorder PElement.test.hasPlayed() Checks that the recording was fully played back before $AC$ */
            return this.hasPlayed;
        }
        ,
        playing: function(){    /* $AC$ MediaRecorder PElement.test.playing() Checks that the recording is currently being played back $AC$ */
            return this.mediaPlayer.currentTime&&!this.mediaPlayer.paused;
        }
        ,
        recorded: function(){    /* $AC$ MediaRecorder PElement.test.recorded() Checks that recording has happened $AC$ */
            return this.blob;
        }
    };

});

// Handler generating a HTML button to download the zip archive containing the recordings
window.PennController.DownloadRecordingButton = function (text) {    /* $AC$ global.PennController.DownloadRecordingButton(text) Returns an HTML string representing a button to download an archive of the recordings $AC$ */
    return "<button type=\"button\" onclick=\""+
           "if (PennController.hasOwnProperty('downloadRecordingsArchive'))"+
           "  PennController.downloadRecordingsArchive();"+
           "  "+
           "else"+
           "  alert('ERROR: could not find an archive for recordings');"+
           "\">"+text+"</button>";
};
window.PennController.DownloadVoiceButton = window.PennController.DownloadRecordingButton;

window.PennController.Elements.newVoiceRecorder = name => window.PennController.Elements.newMediaRecorder(name,"audio");
window.PennController.Elements.getVoiceRecorder = name => window.PennController.Elements.getMediaRecorder(name);
