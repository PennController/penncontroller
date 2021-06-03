!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=42)}({42:function(e,t){window.PennController._AddElementType("MediaRecorder",(function(e){let t,n,r="This experiment collects recording samples from its participants. Your browser should now be prompting a permission request to use your recording device (if applicable). By giving your authorization to record, and by participating in this experiment, you are giving permission to the designer(s) of this experiment to anonymously collect the samples recorded during this experiment. The recordings will be uploaded to, and hosted on, a server designated by the experimenter(s). If you accept the request, a label will remain visible at the top of this window throughout the whole experiment, indicating whether you are currently being recorded.",o="By clicking this link I understand that I grant this experiment's script access to my recording device for the purpose of uploading recordings to the server designated by the experimenter(s).",i=e=>r=e,s={audio:null,video:null,onlyvideo:null},a=[],l="",d=!1,c=!1,u=[],p=new Map,h=[],m=[];const g=()=>new Promise(e=>setTimeout(()=>0==m.length&&e()||g(),10));let y=!1,f=!1;const b={audio:{"audio/webm":"webm","audio/ogg":"ogg"},video:{"video/webm":"webm","video/mp4":"mp4"}};function w(e){const t=b[e];for(let e in t)if(MediaRecorder.isTypeSupported(e))return{mimeType:e,extension:t[e]}}window.PennController.InitiateRecorder=function(a,c,m){if(void 0===window.MediaRecorder)return e.debug.error("This browser does not support audio recording"),alert("Your browser does not support audio recording");"string"!=typeof a&&e.debug.error("MediaRecorder's save URL is incorrect",a),l=a,d=!0;let g=e.controllers.new();g.id="InitiateRecorder",g.runHeader=!1,g.runFooter=!1,e.controllers.list.pop(),e.tmpItems.push(g),"string"==typeof c&&c.length&&i(c),"string"==typeof m&&m.length&&i(m),g.sequence=()=>new Promise(i=>{let a=e.controllers.running;if(!navigator.mediaDevices)return a.element.append($("<p>Sorry, you cannot complete this experiment because your browser does not support recording.</p>"));a.element.append($("<p>"+r+"</p>"));let l={};y&&(l.audio=!0),f&&(l.video=!0);let d=[];navigator.mediaDevices.getUserMedia(l).then((function(e){if(y){let t=e;f&&(t=t.clone(),t.getVideoTracks().map(e=>t.removeTrack(e))),s.audio=new MediaRecorder(t,{mimeType:w("audio").mimeType})}if(f){let t=e.clone();t.getAudioTracks().map(e=>t.removeTrack(e)),s.onlyvideo=t,s.video=new MediaRecorder(e,{mimeType:w("video").mimeType})}[s.audio,s.video].map(e=>{null!==e&&(e.recording=!1,e.onstop=function(r){n.css({"font-weight":"normal",color:"black","background-color":"lightgray"}),n.html("Not recording");let o=w(t.mediaType).mimeType;t.mediaPlayer.srcObject=null,t.blob=new Blob(d,{type:o}),t.mediaPlayer.src=URL.createObjectURL(t.blob),d=[];const i=p.get(t);for(;i&&i instanceof Array&&i.length;)i.shift().call();e.recording=!1},e.onstart=function(r){n.css({"font-weight":"bold",color:"white","background-color":"red"}),n.html("Recording..."),"video"==t.mediaType&&(t.mediaPlayer.srcObject=s.onlyvideo,t.mediaPlayer.play()),e.recording=!0,u.shift().call()},e.ondataavailable=function(e){d.push(e.data)})}),a.element.append($("<a>"+o+"</a>").addClass("Message-continue-link").click(i)),n=$("<div>Not recording</div>"),n.css({position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",padding:"2px","background-color":"lightgray"}),$("#bod").append(n)})).catch((function(e){a.element.append($("<p>The following error occurred: "+e+"</p>"))}))});let b=g.log;return g.log=(...e)=>(h.push(e),b.apply(g,e),g),g.warning=e=>(i(e),g),g.consent=e=>((e=>{o=e})(e),g),e.ArgumentCallback(t=>{t==g&&(e.tmpItems=e.tmpItems.filter(e=>e!=g))}),e.NewTrialArgumentCallback(t=>{t==g&&(e.tmpItems=e.tmpItems.filter(e=>e!=g))}),g._runPromises=g.sequence,g},window.PennController.UploadRecordings=function(t,n){let r=e.controllers.new();e.tmpItems.push(r);const o=t=>{t==r&&(e.tmpItems=e.tmpItems.filter(e=>e!=r))};e.NewTrialArgumentCallback(o),e.ArgumentCallback(o),"string"==typeof t&&t.length&&(r.useLabel=t),r.id="UploadRecordings",r.runHeader=!1,r.runFooter=!1,r.countsForProgressBar=!1,r.sequence=()=>new Promise((async function(t){let r=e.controllers.running;r.element.append($("<p>Please wait while the archive of your recordings is being uploaded to the server...</p>")),n||await g();const o=new e.utils.JSZip,i=[];if(a.forEach(e=>{"uploaded"!==e.uploadStatus&&(o.file(e.name,e.data),e.uploadStatus="uploading",i.push(e))}),0===i.length)return t();const s={};m.push(s),o.generateAsync({compression:"DEFLATE",type:"blob"}).then((function(o){window.PennController.downloadRecordingsArchive=()=>e.utils.saveAs(o,"RecordingsArchive.zip");let a=e.utils.guidGenerator()+".zip";var d=new File([o],a);l.match(/^aws:/i)?e.debug.error("The 'aws:' prefix in InitiateRecorder is no longer supported"):e.utils.upload(l,a,d,"application/zip").then(r=>{a=r,e.controllers.running.save("PennController","UploadRecordings","Filename",a,Date.now(),n?"async":"NULL"),e.controllers.running.save("PennController","UploadRecordings","Status","Success",Date.now(),n?"async":"NULL"),e.debug.log("Recordings sent to the server");for(let e=0;e<i.length;e++)i[e].uploadStatus="uploaded";n||t(),m=m.filter(e=>e!=s)}).catch(l=>{e.controllers.running.save("PennController","UploadRecordings","Filename",a,Date.now(),n?"async":"NULL");for(let e=0;e<i.length;e++)i[e].uploadStatus="local";window.PennController.UploadRecordingsError=l||"error",e.debug.error("MediaRecorder's Ajax post failed",l),e.controllers.running.save("PennController","UploadRecordings","Status","Failed",Date.now(),"Error Text: "+l),r.element.append($("<p>There was an error uploading the recordings: "+l+"</p>")).append($("<p>Please click here to download a copy of your recordings in case you need to send them manually.</p>").bind("click",()=>{e.utils.saveAs(o,"RecordingsArchive.zip"),n||t()}).addClass("Message-continue-link")),m=m.filter(e=>e!=s)})})),n&&t()}));for(let e=0;e<h.length;e++)uploadzipController.log(...h[e]);return r._promises=[r.sequence],r._runPromises=r.sequence,r},e.Prerun(()=>{let t=window.conf_modifyRunningOrder;window.conf_modifyRunningOrder=function(n){if(t instanceof Function&&(n=t.apply(this,[n])),!c)return n;let r=!1,o=!1,i=[-1,-1];for(let e=0;e<n.length;++e)for(let t=0;t<n[e].length;++t){const s=n[e][t].controller,a=n[e][t].options.id;"PennController"==s&&"UploadRecordings"==a?(r=!0,i[0]>=0&&alert("WARNING: upload of recording archive set AFTER sending of results; check your Sequence definition.")):"__SendResults__"==s&&i[0]<0&&!r?i=[e,t]:"PennController"==s&&"InitiateRecorder"==a&&(o=!0)}o||e.debug.error("This project uses MediaRecorder but InitiateRecorder is not included in the Sequence");const s=window.PennController.UploadRecordings();e.tmpItems.pop();const a=new DynamicElement("PennController",s);return i[0]>=0?n.splice(i[0],0,[a]):n.push([a]),n}}),this.immediate=function(e,t){c=!0,void 0===e||"string"!=typeof e||0==e.length?e="MediaRecorder":void 0===t&&(t=e),"string"!=typeof t||!t.match(/audio/)||t.match(/video/i)&&!t.match(/no\W*video/i)?"string"==typeof t&&(t.match(/(only\W*video|video\W*only)/i)||t.match(/video/i)&&t.match(/no\W*audio/))?(this.mediaType="video",f=!0):(this.mediaType="video",y=!0,f=!0):(this.mediaType="audio",y=!0),this.id=e,Object.defineProperty(this,"recorder",{get:()=>s[this.mediaType]})},this.uponCreation=function(n){0==l.length&&e.debug.error("Recorder not initiated. Make sure the sequence of items contains an InitiateRecorder trial."),p.set(this,[]),this.log=!1,this.recordings=[],this.recording=!1,"audio"==this.mediaType?this.mediaPlayer=document.createElement("audio"):"video"==this.mediaType&&(this.mediaPlayer=document.createElement("video")),this.mediaPlayer.setAttribute("controls",!0),this.mediaPlayer.onended=()=>this.hasPlayed=!0,this.videoFeedback=$("<div>").css({position:"absolute"}),this.jQueryElement=$("<span>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-ui");let r=$("<button>Record</button>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-record");r.click(()=>{this.mediaPlayer.pause(),this.mediaPlayer.currentTime=0,this.recording?(this.stop(),this.recording=!1,r.text("Record"),clearInterval(null)):(r.text("Stop"),this.recording=!0,this.start())}),this.start=()=>new Promise(e=>{t=this,"recording"==this.recorder.state&&this.recorder.stop(),this.recording=!0,u.push(()=>{this.recordings.push(["Recording","Start",Date.now(),"NULL"]),e()}),this.recorder.start(),r.text("Stop")}),this.stop=()=>new Promise(e=>{this.recording=!1,r.text("Record"),t=this,"recording"==this.recorder.state?(p.get(this).push(()=>{this.recordings.push(["Recording","Stop",Date.now(),"NULL"]),e()}),this.recorder.stop()):e()}),this.jQueryElement.append($(this.mediaPlayer)).append(r),n()},this.end=async function(){t=this,this.recorder&&"recording"==this.recorder.state&&await new Promise(e=>{const t=this.recorder.onstop;this.recorder.onstop=function(...n){"function"==typeof t&&t.apply(this,n),e()},this.recorder.stop()});const n=p.get(this);if(n instanceof Array&&n.length>0&&await new Promise(e=>n.push(e)),this.blob){const t=w(this.mediaType).extension,n=a.map(e=>e.name);let r=this.id+"."+t,o=0;for(;n.indexOf(r)>=0;)o++,r=this.id+"-"+o+"."+t;a.push({name:r,data:this.blob,uploadStatus:"local"}),e.controllers.running.save(this.type,this.id,"Filename",r,Date.now(),"NULL")}if(this.log)for(let t in this.recordings)e.controllers.running.save(this.type,this.id,...this.recordings[t])},this.value=function(){return this.blob},this.actions={play:function(e){this.mediaPlayer&&this.mediaPlayer.src?(this.mediaPlayer.currentTime&&0!=this.mediaPlayer.currentTime&&(this.mediaPlayer.currentTime=0),this.mediaPlayer.play().then(()=>e())):e()},record:async function(e){await this.start(),e()},stop:async function(e){await this.stop(),this.mediaPlayer&&this.mediaPlayer.src&&(this.mediaPlayer.pause(),this.mediaPlayer.currentTime&&0!=this.mediaPlayer.currentTime&&(this.mediaPlayer.currentTime=0)),e()},wait:function(e,t){if(t&&"string"==typeof t&&t.match(/first/i)&&this.recordings.length)e();else if(t&&"string"==typeof t&&t.match(/play/i)&&this.mediaPlayer){let t=this.mediaPlayer.onended;this.mediaPlayer.onended=function(...n){t instanceof Function&&t.apply(this,n),e()}}else{let n=!1,r=this.stop;this.stop=()=>new Promise(o=>{r.apply(this).then(()=>{if(o(),!n)if(t instanceof Object&&t._runPromises&&t.success){let r=this.disabled;this.disabled="",t._runPromises().then(t=>{"success"==t&&(n=!0,e()),""==this.disabled&&(this.disabled=r)})}else n=!0,e()})})}}},this.settings={disable:function(e){this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown"),this.jQueryContainer.addClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),e()},enable:function(e){this.disabled=!1,this.jQueryElement.find("button.PennController-"+this.type+"-record").removeAttr("disabled").css("background-color","red"),this.jQueryContainer.removeClass("PennController-disabled"),this.jQueryElement.removeClass("PennController-disabled"),e()},once:function(e){if(this.recordings.length)this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown");else{let e=this.stop;this.stop=()=>new Promise(t=>{e instanceof Function?e.apply(this).then(t):t(),this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown")})}e()},log:function(e){this.log=!0,e()}},this.test={hasPlayed:function(){return this.hasPlayed},playing:function(){return this.mediaPlayer.currentTime&&!this.mediaPlayer.paused},recorded:function(){return this.blob}}})),window.PennController.DownloadRecordingButton=function(e){return"<button type=\"button\" onclick=\"if (PennController.hasOwnProperty('downloadRecordingsArchive'))  PennController.downloadRecordingsArchive();  else  alert('ERROR: could not find an archive for recordings');\">"+e+"</button>"},window.PennController.DownloadVoiceButton=window.PennController.DownloadRecordingButton,window.PennController.Elements.newVoiceRecorder=e=>window.PennController.Elements.newMediaRecorder(e,"audio"),window.PennController.Elements.getVoiceRecorder=e=>window.PennController.Elements.getMediaRecorder(e)}});