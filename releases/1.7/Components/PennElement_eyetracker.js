/*! $AC$ PennController.newEyeTracker(name) Creates a new EyeTracker element $AC$$AC$ PennController.getEyeTracker(name) Retrieves an existing EyeTracker element $AC$$AC$ EyeTracker PElement.calibrate(threshold,attempts) Starts a sequence of calibration $AC$$AC$ EyeTracker PElement.hideFeedback() Hides the red dot estimating the position of the eyes on the page $AC$$AC$ EyeTracker PElement.start() Starts parsing eye movements $AC$$AC$ EyeTracker PElement.stop() Stops parsing eye movements $AC$$AC$ EyeTracker PElement.stopTraining() Stop training the model whenever the mouse moves or clicks $AC$$AC$ EyeTracker PElement.showFeedback() Shows the red dot estimating the position of the eyes on the page $AC$$AC$ EyeTracker PElement.train() Starts training the model on every click and mouse movement (default) $AC$$AC$ EyeTracker PElement.settings.add(elements) Adds one or more elements of interest to the EyeTracker $AC$$AC$ EyeTracker PElement.settings.callback(function) Runs the specified javascript function whenever the eyes look at an element of interest $AC$$AC$ EyeTracker PElement.settings.log() Logs the X and Y positions of the eyes every N milliseconds (see documentation) $AC$$AC$ EyeTracker PElement.settings.trainOnMouseMove(true) Tells the model whether to use mouse movements to improve its estimations $AC$ */!function(e){var t={};function n(i){if(t[i])return t[i].exports;var o=t[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(i,o,function(t){return e[t]}.bind(null,o));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=122)}({122:function(e,t){window.PennController._AddElementType("EyeTracker",function(e){let t,n,i,o=!1,s=!1,r=[[],[]],a=!1,l=null;function u(e){for(var t,n={},i=(e+"").split(""),o=[],s=i[0],r=256,a=1;a<i.length;a++)null!=n[s+(t=i[a])]?s+=t:(o.push(s.length>1?n[s]:s.charCodeAt(0)),n[s+t]=r,r++,s=t);o.push(s.length>1?n[s]:s.charCodeAt(0));for(a=0;a<o.length;a++)o[a]=String.fromCharCode(o[a]);return o.join("")}function c(){if(window.webgazer&&t)return window.webgazer;e.debug.error("Tried to access the EyeTracker before it was set.")}function h(e){e=!(!1===e),c().showFaceFeedbackBox(e),c().showFaceOverlay(e),c().showPredictionPoints(e),c().showVideo(e),$("#webgazerGazeDot").css("pointer-events","none")}function d(e){let t=$(window).height(),n=$(window).width(),i=e[0],o=e[1],s=n/2,r=t/2,a=new Array(50);!function(e,t,n,i,o,s){for(x=0;x<50;x++){let r=o-n[x],a=s-i[x],l=Math.sqrt(r*r+a*a),u=t/2,c=0;l<=u&&l>-1?c=100-l/u*100:l>u?c=0:l>-1&&(c=100),e[x]=c}}(a,t,i,o,s,r);let l=function(e){let t=0;for(x=0;x<50;x++)t+=e[x];return t/=50}(a);return Math.round(l)}this.immediate=function(a,u,c){o||function(){i=e.utils.guidGenerator(),o=!0;let a=document.createElement("script");a.setAttribute("src","https://files.lab.florianschwarz.net/ibexfiles/webgazer/webgazer.js"),document.head.appendChild(a);let u=()=>{if(window.webgazer){t=window.webgazer.setRegression("weightedRidge").setTracker("clmtrackr").setGazeListener((e,t)=>{s&&(r[0].push(e.x),r[1].push(e.y),r[0].length>50&&r[0].shift(),r[1].length>50&&r[1].shift()),n&&n.look(e,t)});let e=document.addEventListener;document.addEventListener=function(...t){"mousemove"!=t[0]||"function"!=typeof t[1]||l||(l=t[1]),e.apply(document,t)},t.begin().showPredictionPoints(!0),h(!1)}else setTimeout(u,100)};void 0===t&&u()}(),"number"==typeof a&&(void 0===u||"number"==typeof u&&void 0===c)&&(c=u,u=a,void 0!==a&&"string"==typeof a&&0!=a.length||(a="EyeTracker")),this.id=a,this.span=Number(u),this.proportion=c},this.uponCreation=function(e){let t;this.enabled=!1,this.elements=[],this.counts={times:[]},this.callback=null,this.log=!1,this.trainOnMouseMove=!0,this.look=function(e,n){if(this.enabled&&null!=e&&void 0!==e.x&&void 0!==e.y){this.elements.map(e=>e.jQueryElement.removeClass("PennController-eyetracked"));for(let t=0;t<this.elements.length;t++){let n=this.elements[t].jQueryElement,i=n.offset(),o=n.width(),s=n.height(),r=i.left<=e.x&&i.top<=e.y&&i.left+o>=e.x&&i.top+s>=e.y;if(r?this.counts["_"+this.elements[t].id].push(1):this.counts["_"+this.elements[t].id].push(0),isNaN(this.span))r&&(n.addClass("PennController-eyetracked"),this.callback&&this.callback instanceof Function&&this.callback.call(this.elements[t],e.x,e.y));else{this.hasOwnProperty("gazes")&&this.elements.length==this.gazes.length||(this.gazes=this.elements.map(()=>[])),r?this.gazes[t].push(!0):this.gazes[t].push(!1),this.gazes[t].length>this.span&&this.gazes[t].shift();let i=Number(this.proportion);isNaN(i)&&(i=this.span/100),i<=0?i=.01:i>=1&&(i=.99),this.gazes[t].filter(e=>e).length/this.gazes[t].length>i&&n.addClass("PennController-eyetracked"),this.callback&&this.callback instanceof Function&&this.callback.call(this.elements[t],e.x,e.y)}}void 0===t&&(t=n),this.counts.times.push(Math.round(n-t)),t=n}},e()},this.end=function(){if(h(!1),c().removeMouseEventListeners(),this.enabled=!1,n=void 0,this.log&&this.counts.times.length){let t="https://files.lab.florianschwarz.net/ibexfiles/RecordingsFromIbex/trackerData.php",n=window.location.href.replace(/[^/]+$/,"").replace(/[^\w\d]/g,"").replace(/[\.]{2,}/g,"");e.debug.log("expname",n);let o=(o,s)=>{let r={experiment:n,id:i,pcnumber:e.controllers.running.id,parameter:o,value:s},a="json="+JSON.stringify(r);var l=new XMLHttpRequest;l.open("POST",t,!0),l.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),l.onreadystatechange=(()=>{200!=l.status&&e.controllers.running.save(this.type,this.id,"Upload","Error",Date.now(),o)}),l.send(a)};e.debug.log("about to send times",this.counts),o("times",u(this.counts.times.join("."))),delete this.counts.times;let s=Object.keys(this.counts);for(let e=0;e<s.length;e++)o(s[e],u(this.counts[s[e]].join(".")));e.controllers.running.save(this.type,this.id,"Filename",n+"/"+i,Date.now(),"NULL")}delete this.counts},this.value=function(){return"EyeTracker"},this.actions={calibrate(t,n,i){Number(i)>0||(i=-1),function t(n,i,o,u){c().addMouseEventListeners(),i.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),e.debug.log("Starting calibration"),r=[[],[]];let p=$("<div>").css({position:"absolute",left:0,top:0,width:"100vw",height:"100vh","background-color":"white","text-align":"center"}),b=()=>{p.find("button").remove(),p.append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",bottom:"48.75vw",width:"2.5vw",height:"2.5vw"}).click(function(){$(this).attr("disabled",!0),s=!0,setTimeout(()=>{let l=d(r);e.debug.log("Tracker's precision: "+l),s=!1,r=[[],[]],e.controllers.running.save(i.type,i.id,"calibration",l,Date.now(),1==u?"Last attempt":"NULL"),o&&Number(o)>0&&l<o&&1!=u?(a=!1,$(this).remove(),h(!0),p.append($("<div>").html("<p>It looks like we were not able to precisely calibrate the tracker:</p><p>You calibration score is "+l+" and you need at least "+o+"</p><p>Here are a few tips to help you better self-calibrate:</p><p>- try adjusting your webcam based on the video in the top-left corner.</p><p>- if you use an external webcam, make sure it is fixed to the top of your screen.</p><p>- try raising your screen so as to align your webcam with your eyes</p><p><img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookdown.png'><img style='display: inline-block; height: 75px;' src='http://files.lab.florianschwarz.net/ibexfiles/Pictures/lookstraight.png'></p><p>- make sure no one is standing next to you.</p><p>- make sure you are not wearing eyeglasses reflecting ambiant light.</p><p>- make sure the algorithm detects your face (it should appear green).</p><p>- make sure there is enough ambient light for face-detection.</p><p>- make sure you follow your mouse pointer with your eyes.</p><p>- make sure you keep looking at the middle button until the end.</p>").css({margin:"auto","margin-top":"5em"})).append($("<button>Retry</button>").click(function(){p.remove(),t(n,i,o,u-1)}).css("margin","auto"))):(a=!0,p.remove(),h(!1),c().removeMouseEventListeners(),n())},2e3)}))};if(a)b();else{let e=8,t=function(){$(this).attr("disabled",!0),--e<=0&&b()};p.append($("<button>Start calibration</button>").css({position:"absolute",top:"calc(50vh - 2.5vw)",left:"47.5vw",width:"5vw",height:"5vw"}).click(function(){$(this).remove(),h(!1),c().showPredictionPoints(!0),p.append($("<button>+</button>").css({position:"absolute",top:0,left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:0,right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",left:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:0,left:"48.75vw",width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",top:"calc(50vh - 1.25vw)",right:0,width:"2.5vw",height:"2.5vw"}).click(t)).append($("<button>+</button>").css({position:"absolute",bottom:0,left:"48.75vw",width:"2.5vw",height:"2.5vw"}).click(t))})),h(!0)}$("#webgazerVideoFeed").before(p)}(t,this,n,i)},hideFeedback:function(e){h(!1),e()},start:function(e){this.enabled=!0,n=this,e()},stop:function(e){this.enabled=!1,n=void 0,e()},stopTraining:function(e){c().removeMouseEventListeners(),c().showPredictionPoints(!1),e()},showFeedback:function(e){h(),e()},train:function(e,t){c().addMouseEventListeners(),this.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),c().showPredictionPoints(t),e()}},this.settings={add:function(e,...t){for(let e=0;e<t.length;e++){let n=t[e];n&&n._element&&this.elements.indexOf(n._element)<0&&(this.elements.push(n._element),this.counts["_"+n._element.id]=[])}e()},callback:function(e,t){t instanceof Function&&(this.callback=t),e()},log:function(e){this.log=!0,e()},trainOnMouseMove:function(e,t){this.trainOnMouseMove=void 0===t||t,this.trainOnMouseMove||document.removeEventListener("mousemove",l,!0),e()}}})}});