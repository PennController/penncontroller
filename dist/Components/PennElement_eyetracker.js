/*! $AC$ PennController.newEyeTracker(name) Creates a new EyeTracker element $AC$$AC$ PennController.getEyeTracker(name) Retrieves an existing EyeTracker element $AC$$AC$ PennController.EyeTrackerURL(url) Will send eye-tracking data to specified URL $AC$$AC$ EyeTracker PElement.calibrate(threshold,attempts) Starts a sequence of calibration $AC$$AC$ EyeTracker PElement.hideFeedback() Hides the red dot estimating the position of the eyes on the page $AC$$AC$ EyeTracker PElement.start() Starts parsing eye movements $AC$$AC$ EyeTracker PElement.stop() Stops parsing eye movements $AC$$AC$ EyeTracker PElement.stopTraining() Stop training the model whenever the mouse moves or clicks $AC$$AC$ EyeTracker PElement.showFeedback() Shows the red dot estimating the position of the eyes on the page $AC$$AC$ EyeTracker PElement.train() Starts training the model on every click and mouse movement (default) $AC$$AC$ EyeTracker PElement.add(elements) Adds one or more elements of interest to the EyeTracker $AC$$AC$ EyeTracker PElement.callback(function) Runs the specified javascript function whenever the eyes look at an element of interest $AC$$AC$ EyeTracker PElement.log() Logs the X and Y positions of the eyes every N milliseconds (see documentation) $AC$$AC$ EyeTracker PElement.trainOnMouseMove(true) Tells the model whether to use mouse movements to improve its estimations $AC$ */!function(e){var t={};function n(i){if(t[i])return t[i].exports;var o=t[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(i,o,function(t){return e[t]}.bind(null,o));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=26)}({26:function(e,t){window.PennController._AddElementType("EyeTracker",(function(e){let t,n,i,o=!1,s=!1,r=[[],[]],a=!1,l=null,c="";function u(e){for(var t,n={},i=(e+"").split(""),o=[],s=i[0],r=256,a=1;a<i.length;a++)null!=n[s+(t=i[a])]?s+=t:(o.push(s.length>1?n[s]:s.charCodeAt(0)),n[s+t]=r,r++,s=t);o.push(s.length>1?n[s]:s.charCodeAt(0));for(a=0;a<o.length;a++)o[a]=String.fromCharCode(o[a]);return o.join("")}function h(){if(window.webgazer&&t)return window.webgazer;e.debug.error("Tried to access the EyeTracker before it was set.")}function d(e){e=!(!1===e),h().showFaceFeedbackBox(e),h().showFaceOverlay(e),h().showPredictionPoints(e),h().showVideo(e),$("#webgazerGazeDot").css("pointer-events","none")}function p(e){let t=$(window).height(),n=$(window).width(),i=e[0],o=e[1],s=n/2,r=t/2,a=new Array(50);!function(e,t,n,i,o,s){for(x=0;x<50;x++){let r=o-n[x],a=s-i[x],l=Math.sqrt(r*r+a*a),c=t/2,u=0;l<=c&&l>-1?u=100-l/c*100:l>c?u=0:l>-1&&(u=100),e[x]=u}}(a,t,i,o,s,r);let l=function(e){let t=0;for(x=0;x<50;x++)t+=e[x];return t/=50,t}(a);return Math.round(l)}window.PennController.EyeTrackerURL=e=>c=e;const b=(e,t)=>{s&&(r[0].push(e.x),r[1].push(e.y),r[0].length>50&&r[0].shift(),r[1].length>50&&r[1].shift()),n&&n.look(e,t)};let g=function(){i=e.utils.guidGenerator(),o=!0;let n=document.createElement("script");n.setAttribute("src","https://expt.pcibex.net/static/webgazer/webgazer.min.js"),document.head.appendChild(n);let s=()=>{window.webgazer?function(){r=[[],[]],t=window.webgazer.setRegression("weightedRidge").setTracker("TFFacemesh").setGazeListener((e,t)=>{null!=e&&(e instanceof Promise?e.then(e=>b(e,t)):e.x&&b(e,t))});let e=document.addEventListener;document.addEventListener=function(...t){"mousemove"!=t[0]||"function"!=typeof t[1]||l||(l=t[1]),e.apply(document,t)},t.params.showVideoPreview=!0,t.begin(),window.webgazer.showPredictionPoints(!0),d(!1)}():setTimeout(s,100)};void 0===t&&s()};this.immediate=function(e,t,n){o||g(),"number"==typeof e&&(void 0===t||"number"==typeof t&&void 0===n)&&(n=t,t=e,void 0!==e&&"string"==typeof e&&0!=e.length||(e="EyeTracker"),this.id=e),this.span=Number(t),this.proportion=n},this.uponCreation=function(t){let n;this.enabled=!1,this.elements=[],this.counts={times:[]},this.callback=null,this.log=!1,this.trainOnMouseMove=!0,this.look=function(t,i){if(this.enabled&&null!=t&&void 0!==t.x&&void 0!==t.y){this.elements.map(e=>e.jQueryElement.removeClass("PennController-eyetracked"));for(let n=0;n<this.elements.length;n++){const i=this.elements[n].jQueryElement,o=e.utils.overToScale.call(i,t.x,t.y);if(o?this.counts["_"+this.elements[n].id].push(1):this.counts["_"+this.elements[n].id].push(0),isNaN(this.span))o&&(i.addClass("PennController-eyetracked"),this.callback&&this.callback instanceof Function&&this.callback.call(this.elements[n],t.x,t.y));else{this.hasOwnProperty("gazes")&&this.elements.length==this.gazes.length||(this.gazes=this.elements.map(()=>[])),o?this.gazes[n].push(!0):this.gazes[n].push(!1),this.gazes[n].length>this.span&&this.gazes[n].shift();let e=Number(this.proportion);isNaN(e)&&(e=this.span/100),e<=0?e=.01:e>=1&&(e=.99),this.gazes[n].filter(e=>e).length/this.gazes[n].length>e&&i.addClass("PennController-eyetracked"),this.callback&&this.callback instanceof Function&&this.callback.call(this.elements[n],t.x,t.y)}}void 0===n&&(n=i),this.counts.times.push(Math.round(i-n)),n=i}},t()},this.end=function(){if(d(!1),h().removeMouseEventListeners(),this.enabled=!1,n=void 0,this.log&&this.counts.times.length){let t=c,n=window.location.href.replace(/[^/]+$/,"").replace(/[^\w\d]/g,"").replace(/[\.]{2,}/g,"");e.debug.log("expname",n);let o=(o,s)=>{let r={experiment:n,id:i,pcnumber:e.controllers.running.id,parameter:o,value:s},a="json="+JSON.stringify(r);var l=new XMLHttpRequest;l.open("POST",t,!0),l.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),l.onreadystatechange=()=>{200!=l.status&&e.controllers.running.save(this.type,this.id,"Upload","Error",Date.now(),o)},l.send(a)};e.debug.log("about to send times",this.counts),o("times",u(this.counts.times.join("."))),delete this.counts.times;let s=Object.keys(this.counts);for(let e=0;e<s.length;e++)o(s[e],u(this.counts[s[e]].join(".")));e.controllers.running.save(this.type,this.id,"Filename",n+"/"+i,Date.now(),"NULL")}delete this.counts},this.value=function(){return"EyeTracker"},this.actions={calibrate(t,n,i){Number(i)>0||(i=-1),function t(n,i,o,c){h().addMouseEventListeners(),i.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),e.debug.log("Starting calibration"),r=[[],[]];let u=$("<div>").css({position:"absolute",left:0,top:0,width:"100vw",height:"100vh","background-color":"white","text-align":"center"}),b=()=>{u.find("button").remove(),u.append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",bottom:"48.75vw",width:"2.5vw",height:"2.5vw"}).click((function(){$(this).attr("disabled",!0),s=!0,setTimeout(()=>{console.log("Past 50",r);let l=p(r);i._precision=l,e.debug.log("Tracker's precision: "+l),s=!1,r=[[],[]],e.controllers.running.save(i.type,i.id,"calibration",l,Date.now(),1==c?"Last attempt":"NULL"),o&&Number(o)>0&&l<o&&1!=c?(a=!1,$(this).remove(),d(!0),u.append($("<div>").html("<p>It looks like we were not able to precisely calibrate the tracker:</p><p>You calibration score is "+l+" and you need at least "+o+"</p><p>Here are a few tips to help you better self-calibrate:</p><p>- try adjusting your webcam based on the video in the top-left corner.</p><p>- if you use an external webcam, make sure it is fixed to the top of your screen.</p><p>- try raising your screen so as to align your webcam with your eyes</p><p><img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookdown.png'><img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookstraight.png'></p><p>- make sure no one is standing next to you.</p><p>- make sure you are not wearing eyeglasses reflecting ambiant light.</p><p>- make sure the algorithm detects your face (it should appear green).</p><p>- make sure there is enough ambient light for face-detection.</p><p>- make sure you follow your mouse pointer with your eyes.</p><p>- make sure you keep looking at the middle button until the end.</p>").css({margin:"auto","margin-top":"5em"})).append($("<button>Retry</button>").click((function(){u.remove(),window.webgazer.reg.RidgeWeightedReg.call(window.webgazer.getRegression()[0]),t(n,i,o,c-1)})).css("margin","auto"))):(a=!0,u.remove(),d(!1),h().removeMouseEventListeners(),n())},2e3)})))};if(a)b();else{let e=8,t=function(){$(this).attr("disabled",!0),e--,e<=0&&b()};u.append($("<button>Start calibration</button>").css({position:"absolute",top:"calc(50vh - 2.5vw)",left:"47.5vw",width:"5vw",height:"5vw"}).click((function(){$(this).remove(),d(!1),u.append($("<button>+</button>").css({position:"absolute",top:0,left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:0,right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:0,left:"48.75vw",width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,left:"48.75vw",width:"2.5vw",height:"2.5vw"}).click(t))}))),d(!0)}$("#webgazerVideoFeed").before(u)}(t,this,n,i)},hideFeedback:function(e){d(!1),e()},start:function(e){this.enabled=!0,n=this,e()},stop:function(e){this.enabled=!1,n=void 0,e()},stopTraining:function(e){h().removeMouseEventListeners(),h().showPredictionPoints(!1),e()},showFeedback:function(e){d(),e()},train:function(e,t){h().addMouseEventListeners(),this.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),h().showPredictionPoints(t),e()}},this.settings={add:function(e,...t){for(let e=0;e<t.length;e++){let n=t[e];n&&n._element&&this.elements.indexOf(n._element)<0&&(this.elements.push(n._element),this.counts["_"+n._element.id]=[])}e()},callback:function(e,t){t instanceof Function&&(this.callback=t),e()},log:function(e){this.log=!0,e()},trainOnMouseMove:function(e,t){this.trainOnMouseMove=void 0===t||t,this.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),e()}},this.test={calibrated:function(){return a},ready:function(){return window.webgazer&&window.webgazer.isReady()},score:function(e){const t=this._precision;return e instanceof Function?e.call(this,t):isNaN(Number(e))?a:t>=Number(e)}}}))}});