// EYETRACKER element
/* $AC$ PennController.newEyeTracker(name) Creates a new EyeTracker element $AC$ */
/* $AC$ PennController.getEyeTracker(name) Retrieves an existing EyeTracker element $AC$ */
window.PennController._AddElementType("EyeTracker", function(PennEngine) {

    let tracker;
    let initiated = false;
    let currentTracker;
    let sessionID;
    let storePoints = false;
    let past50Array = [[], []];
    let calibrated = false;
    let moveEvent = null;
    let clickEvent = null;
    let uploadURL = "";
    let detectedFace = false;

    window.PennController.EyeTrackerURL = url => uploadURL = url; /* $AC$ PennController.EyeTrackerURL(url) Will send eye-tracking data to specified URL $AC$ */

    // GENERIC FUNCTIONS
    //
    // from https://stackoverflow.com/a/23395136
    const beep = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    // from https://gist.github.com/revolunet/843889
    function lzw_encode(s) {
        var dict = {};
        var data = (s + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i=1; i<data.length; i++) {
            currChar=data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase=currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        for (var i=0; i<out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        return out.join("");
    }

    // Handler to access the global webgazer object
    function getGazer() {
        if (window.webgazer && tracker)
            return window.webgazer;
        PennEngine.debug.error("Tried to access the EyeTracker before it was set.")
    }

    // Show/Hide the video and the tracking point
    function showTracker(show){
        show = !(show===false);
        getGazer().showFaceFeedbackBox(show);
        getGazer().showFaceOverlay(show);
        getGazer().showPredictionPoints(show);
        getGazer().showVideo(show);
        $("#webgazerGazeDot").css('pointer-events', 'none');
    }

    // Calibration functions from WebGazer's example page
    function calculatePrecisionPercentages(precisionPercentages, windowHeight, x50, y50, staringPointX, staringPointY) {
        for (n = 0; n < 50; n++) {
          // Calculate distance between each prediction and staring point
          let xDiff = staringPointX - x50[n];
          let yDiff = staringPointY - y50[n];
          let distance = Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
          // Calculate precision percentage
          let halfWindowHeight = windowHeight / 2;
          let precision = 0;
          if (distance <= halfWindowHeight)
            precision = 100 - (distance / halfWindowHeight * 100);
          else
            precision = 0;
          // Store the precision
          precisionPercentages[n] = precision;
        }
    }
    function calculateAverage(precisionPercentages) {
        let precision = 0;
        for (n = 0; n < 50; n++) {
          precision += precisionPercentages[n];
        }
        precision = precision / 50;
        return precision;
    }
    function calculatePrecision(past50Array) {
        let windowHeight = window.innerHeight;
        let windowWidth = window.innerWidth;
        // Retrieve the last 50 gaze prediction points
        let x50 = past50Array[0];
        let y50 = past50Array[1];
        // Calculate the position of the point the user is staring at
        let staringPointX = windowWidth / 2;
        let staringPointY = windowHeight / 2;
        let precisionPercentages = new Array(50);
        calculatePrecisionPercentages(precisionPercentages, windowHeight, x50, y50, staringPointX, staringPointY);
        let precision = calculateAverage(precisionPercentages);
        // Return the precision measurement as a rounded percentage
        return Math.round(precision);
    };


    // Shows a calibration screen
    function calibrate(resolve, element, threshold, remainingAttempts){
        // Start training the model
        getGazer().addMouseEventListeners();        // Retrieve moveEvent
        PennEngine.debug.log("Starting calibration");
        past50Array = [[], []];                 // To keep track of 50 last looks
        let calibrationDiv = $("<div>").css({
            position: 'absolute', left: 0, top: 0, width: "100vw", height: "100vh",
            'background-color': 'white', 'text-align': 'center'
        });
        // Will print a dot in the middle of the screen
        let startCalculation = async()=>{
            await new Promise(r=>setTimeout(r,1000));
            const dot = $("<div>").css({position:'fixed',display: 'block',width:'48px',height:'48px',background:'green',
                        'border-radius':'100%',left:'calc(50vw - 24px)',top:'calc(50vh - 24px)','z-index': 999999});
            $("body").append(dot);
            clickEvent({clientX: window.innerWidth/2, clientY: window.innerHeight/2});
            // Launches calculation per se
            $(this).attr('disabled', true);
            storePoints = true;
            setTimeout(()=>{
                storePoints = false;
                dot.detach();
                let precision = calculatePrecision(past50Array);
                element._precision = precision;
                PennEngine.debug.log("Tracker's precision: "+precision);
                past50Array = [[],[]];
                PennEngine.controllers.running.save(element.type, element.id, "calibration", precision, 
                                                    Date.now(), (remainingAttempts==1?"Last attempt":"NULL"));
                if (threshold && Number(threshold)>0 && precision < threshold && remainingAttempts != 1){
                    calibrated = false;
                    $(this).remove();
                    showTracker(true);
                    calibrationDiv.append(
                        $("<div>").html("<p>It looks like we were not able to precisely calibrate the tracker:</p>"+
                                        "<p>You calibration score is "+precision+" and you need at least "+threshold+"</p>"+
                                        "<p>Here are a few tips to help you better self-calibrate:</p>"+
                                        "<p>- try adjusting your webcam based on the video in the top-left corner.</p>"+
                                        "<p>- if you use an external webcam, make sure it is fixed to the top of your screen.</p>"+
                                        "<p>- try raising your screen so as to align your webcam with your eyes</p>"+
                                        "<p><img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookdown.png'>"+
                                        "<img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookstraight.png'></p>"+
                                        "<p>- make sure no one is standing next to you.</p>"+
                                        "<p>- make sure you are not wearing eyeglasses reflecting ambiant light.</p>"+
                                        "<p>- make sure the algorithm detects your face (it should appear green).</p>"+
                                        "<p>- make sure there is enough ambient light for face-detection.</p>"+
                                        "<p>- make sure you follow your mouse pointer with your eyes.</p>"+
                                        "<p>- make sure you keep looking at the middle button until the end.</p>")
                                    .css({margin: 'auto', 'margin-top': '5em'})
                    ).append(
                        // Retry button
                        $("<button>Retry</button>").click(function(){
                            calibrationDiv.remove();
                            // Reset the model (forget previous estimations)
                            window.webgazer.reg.RidgeWeightedReg.call(window.webgazer.getRegression()[0]);
                            calibrate(resolve, element, threshold, remainingAttempts-1);
                        }).css('margin','auto')
                    );
                }
                // Threshold met: tracker is calibrated OR no attempts left
                else {
                    calibrated = true;
                    calibrationDiv.remove();
                    // showTracker(false);
                    // Do not train the model on actual trials (too much on screen)
                    getGazer().removeMouseEventListeners();
                    resolve();
                }
            }, 3000);   // 3s for calculation
        };
        // If not calibrated yet, print 'Start calibration'
        if (!calibrated){
            showTracker(true);
            const width = 48, height = 48;
            const stay_cycles = 120;
            let points = [];
            const nextDot = async timestamp=>{
                const position = points.shift();
                const dot = $("<div>").css({
                    position:'fixed',
                    display: 'block',
                    width:width+'px',
                    height:height+'px',
                    background:'green',
                    'border-radius':'100%',
                    left: position[0],
                    top: position[1],
                    'z-index': 999999
                });
                await new Promise(r=>setTimeout(r,750));
                $("body").append(dot);
                beep.play();
                await new Promise(r=>setTimeout(r,250));
                let remaining_cycles = stay_cycles;
                const trainDot = ()=> {
                    if (remaining_cycles%2) // Click ever other cycle
                        clickEvent({clientX:position[0]+width/2,clientY:position[1]+height/2});
                    if (remaining_cycles==0){
                        dot.detach();
                        if (points.length)
                            nextDot();
                        else
                            startCalculation();
                    }
                    else{
                        remaining_cycles--;
                        window.requestAnimationFrame(trainDot);
                    }
                }
                trainDot();
            }
            const printStartButton = ()=>$("body").append(
                $("<button>I'm ready. Start calibration</button>").bind('click',e=>{
                    getGazer().removeMouseEventListeners();     // Will manually call moveEvent
                    showTracker(false);
                    $(e.target).detach();
                    const wwidth = window.innerWidth, wheight = window.innerHeight;
                    points = [
                        [(wwidth-width)/2,(wheight-height)/2], // middle center
                        ...[
                            [0,0], // top left
                            [(wwidth-width)/2,0], // top center
                            [wwidth-width,wheight-height], // bottom right
                            [(wwidth-width)/2,wheight-height], // bottom center
                            [wwidth-width,(wheight-height)/2], // middle right
                            [wwidth-width,0], // top right
                            [0,(wheight-height)/2], // middle left
                            [0,wheight-height], // bottom left
                        ].sort(v=>0.5-Math.random())
                        ,
                        [(wwidth-width)/2,(wheight-height)/2] // middle center (again)
                    ];
                    nextDot();
                }).css({position:'fixed',display:'block',left:'50vw',top:'50vh',transform:'translate(-50%,-50%)'})
            );
            if (detectedFace) printStartButton();
            else{
                const waitmessage = $("<p>Wait until your face is detected (you should see green contours around it)\
                                    and then click anywhere on the page until you see a red dot</p>");
                waitmessage.css({position:'fixed',left:'50vw',top:'50vh',transform:'translate(-50%,-50%)'});
                $("body").append(waitmessage);
                const gotRedDot = ()=>{
                    if (detectedFace) {
                        waitmessage.remove();
                        printStartButton();
                    } 
                    else
                        window.requestAnimationFrame(gotRedDot);
                }
                gotRedDot();
            }
        }
        else
            startCalculation();
        // Make sure the video appears over our div
        $("#webgazerVideoFeed").before(calibrationDiv);
    }

    const parseData = (data,clock) => {
        detectedFace = true;
        if (storePoints){
            past50Array[0].push(data.x);
            past50Array[1].push(data.y);
            if (past50Array[0].length>50)
                past50Array[0].shift();
            if (past50Array[1].length>50)
                past50Array[1].shift();
        }
        if (currentTracker)
            currentTracker.look(data,clock);
    }

    // (Re)set the tracker and its regression model
    let resetTracker = function(){
        past50Array = [[],[]];
        tracker = window.webgazer.setRegression('weightedRidge')
            .setTracker('TFFacemesh')
            .setGazeListener((data, clock) => {
                if (data == null) return;
                else if (data instanceof Promise) data.then( d=>parseData(d,clock) );
                else if (data.x) parseData(data,clock);
            });        
        let oldAME = document.addEventListener;         // Catch the mousemove function
        document.addEventListener = function(...args){  // NOW!
            if (args[0]=="mousemove"&&typeof(args[1])=="function"&&args[2]===true&&!moveEvent)
                moveEvent = args[1];
            if (args[0]=="click"&&typeof(args[1])=="function"&&args[2]===true&&!clickEvent)
                clickEvent = args[1];
            oldAME.apply(document, args);
        };
        tracker.params.showVideoPreview = true;
        tracker.begin();
        window.webgazer.showPredictionPoints(true);
        showTracker(false);
    }

    // ELEMENT
    //
    let initiate = function(){
        sessionID = PennEngine.utils.guidGenerator();
        initiated = true;
        let webgazer = document.createElement('script');
        webgazer.setAttribute('src','https://expt.pcibex.net/static/webgazer/webgazer.min.js');
        document.head.appendChild(webgazer);
        let checkIfReady = () => {
            if (window.webgazer) {
                resetTracker();
            } else {
                setTimeout(checkIfReady, 100);
            }
        }
        if (tracker===undefined)
            checkIfReady();
    }

    this.immediate = function(id, span, proportion){
        if (!initiated)
            initiate();
        if (typeof(id)=="number" && (span===undefined||(typeof(span)=="number"&&proportion===undefined))){
            proportion = span;
            span = id;
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "EyeTracker";
            this.id = id;
        }
        this.span = Number(span);
        this.proportion = proportion;
    };

    this.uponCreation = function(resolve){
        this.enabled = false;
        this.elements = [];
        this.counts = {times: []};
        this.callback = null;
        this.log = false;
        this.trainOnMouseMove = true;
        let previousClock;
        // Called every few ms (varies w/ performance) when EyeTracker started
        this.look = function (data,clock) {
            if (!this.enabled || data==null || data.x===undefined || data.y===undefined)
                return;

            this.elements.map(el=>el.jQueryElement.removeClass("PennController-eyetracked"));
            // Check every element
            for (let e = 0; e < this.elements.length; e++){
                const element = this.elements[e].jQueryElement,
                      within = PennEngine.utils.overToScale.call(element,data.x,data.y);
                if (within)
                    this.counts['_'+this.elements[e].id].push(1);
                else
                    this.counts['_'+this.elements[e].id].push(0);
                // Span-based triggering: check proportion of gazes over SPAN cycles
                if (!isNaN(this.span)){
                    // GAZES stores looks (true vs false) to each element over SPAN cycles
                    if (!this.hasOwnProperty('gazes') || this.elements.length != this.gazes.length)
                        this.gazes = this.elements.map(()=>[]);
                    if (within)
                        this.gazes[e].push(true);
                    else
                        this.gazes[e].push(false);
                    if (this.gazes[e].length>this.span)
                        this.gazes[e].shift()
                    let proportion = Number(this.proportion);
                    if (isNaN(proportion))
                        proportion = this.span/100;
                    if (proportion <= 0)
                        proportion = 0.01;
                    else if (proportion >= 1)
                        proportion = 0.99;                  
                    if (this.gazes[e].filter(e=>e).length/this.gazes[e].length>proportion)
                        element.addClass("PennController-eyetracked");  
                    // If there is a callback function
                    if (this.callback && this.callback instanceof Function)
                        this.callback.call(this.elements[e], data.x, data.y);
                }
                // Else, each cycle counts
                else if (within){
                    element.addClass("PennController-eyetracked");
                    // If there is a callback function
                    if (this.callback && this.callback instanceof Function)
                        this.callback.call(this.elements[e], data.x, data.y);
                }
            }
            // Keep track of cycles' timestamps (relative for shorter encoding)
            if (previousClock === undefined)
                previousClock = clock;
            this.counts.times.push(Math.round(clock - previousClock));
            previousClock = clock;
        };
        resolve();
    };

    this.end = function(){
        showTracker(false);
        getGazer().removeMouseEventListeners();
        this.enabled = false;
        currentTracker = undefined;
        if (this.log && this.counts.times.length){
            let url = uploadURL;
            let expName = window.location.href.replace(/[^/]+$/,'')
                                              .replace(/[^\w\d]/g,'')
                                              .replace(/[\.]{2,}/g,'');
            PennEngine.debug.log("expname", expName);
            let sendLine = (parameter, value) => {
                let data = {
                    'experiment': expName,
                    'id': sessionID,
                    'pcnumber': PennEngine.controllers.running.id,
                    'parameter': parameter,
                    'value': value
                 };
                 let fd = "json="+JSON.stringify(data);
                 var xhr = new XMLHttpRequest();     // XMLHttpRequest rather than jQuery's Ajax (mysterious CORS problems with jQuery 1.8)
                 xhr.open('POST', url, true);
                 xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                 xhr.onreadystatechange = ()=>{
                     if (xhr.status != 200)
                        PennEngine.controllers.running.save(this.type, this.id, "Upload", "Error", Date.now(), parameter);
                 };
                 xhr.send(fd);
            }
            PennEngine.debug.log("about to send times", this.counts);
            sendLine('times', lzw_encode(this.counts.times.join('.')));
            delete this.counts.times;
            let keys = Object.keys(this.counts);
            for (let k = 0; k < keys.length; k++){
                sendLine(keys[k], lzw_encode(this.counts[keys[k]].join('.')));
            }
            PennEngine.controllers.running.save(this.type, this.id, "Filename", expName+'/'+sessionID, Date.now(), "NULL");
        }
        delete this.counts;
    };

    this.value = function(){
        return 'EyeTracker';
    };

    this.actions = {
        calibrate(resolve, threshold, attempts){    /* $AC$ EyeTracker PElement.calibrate(threshold,attempts) Starts a sequence of calibration $AC$ */
            if (!(Number(attempts)>0))
                attempts = -1;
            calibrate(resolve, this, threshold, attempts);
        },
        hideFeedback: function(resolve){    /* $AC$ EyeTracker PElement.hideFeedback() Hides the red dot estimating the position of the eyes on the page $AC$ */
            showTracker(false);
            resolve();
        },
        start: function(resolve){    /* $AC$ EyeTracker PElement.start() Starts parsing eye movements $AC$ */
            this.enabled = true;
            currentTracker = this;
            resolve();
        },
        stop: function(resolve){    /* $AC$ EyeTracker PElement.stop() Stops parsing eye movements $AC$ */
            this.enabled = false;
            currentTracker = undefined;
            resolve();
        },
        stopTraining: function(resolve){    /* $AC$ EyeTracker PElement.stopTraining() Stop training the model whenever the mouse moves or clicks $AC$ */
            getGazer().removeMouseEventListeners();
            getGazer().showPredictionPoints(false);
            resolve();
        },
        showFeedback: function(resolve){    /* $AC$ EyeTracker PElement.showFeedback() Shows the red dot estimating the position of the eyes on the page $AC$ */
            showTracker();
            resolve();
        },
        train: function(resolve, showDot){    /* $AC$ EyeTracker PElement.train() Starts training the model on every click and mouse movement (default) $AC$ */
            getGazer().addMouseEventListeners();
            if (!this.trainOnMouseMove)
                document.removeEventListener("mousemove", moveEvent, true);
            getGazer().showPredictionPoints(showDot);
            resolve();
        }
    }

    this.settings = {
        add: function(resolve, ...elements){    /* $AC$ EyeTracker PElement.add(elements) Adds one or more elements of interest to the EyeTracker $AC$ */
            for (let e = 0; e < elements.length; e++){
                let element = elements[e];
                if (element && element._element && this.elements.indexOf(element._element)<0){
                    this.elements.push(element._element);
                    this.counts['_'+element._element.id] = [];
                }
            }
            resolve();
        },
        callback: function(resolve, func){    /* $AC$ EyeTracker PElement.callback(function) Runs the specified javascript function whenever the eyes look at an element of interest $AC$ */
            if (func instanceof Function)
                this.callback = func;
            resolve();
        },
        log: function(resolve){    /* $AC$ EyeTracker PElement.log() Logs the X and Y positions of the eyes every N milliseconds (see documentation) $AC$ */
            this.log = true;
            resolve();
        },
        trainOnMouseMove: function(resolve, yesNo){    /* $AC$ EyeTracker PElement.trainOnMouseMove(true) Tells the model whether to use mouse movements to improve its estimations $AC$ */
            this.trainOnMouseMove = yesNo===undefined||yesNo;
            if (!this.trainOnMouseMove)
                document.removeEventListener("mousemove", moveEvent, true);
            resolve();
        }
    }

    this.test = {
        calibrated: function(){
            return calibrated;
        },
        ready: function(){
            return window.webgazer && window.webgazer.isReady();
        },
        score : function(arg){
            const s = this._precision;
            if (arg instanceof Function)
                return arg.call(this, s);
            else if (!isNaN(Number(arg)))
                return s >= Number(arg);
            else 
                return calibrated;
        }
    }

});
