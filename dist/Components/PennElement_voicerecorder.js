!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=131)}({131:function(e,t){window.PennController._AddElementType("VoiceRecorder",function(e){let t,r,n,o=[],i="",s=!1,a=[],l=[];window.PennController.InitiateRecorder=function(o,d){o.match(/^http.+/i)||e.debug.error("VoiceRecorder's save URL is incorrect",o),i=o,s=!0;let c=e.controllers.new();return c.id="InitiateRecorder",c.runHeader=!1,c.runFooter=!1,e.controllers.list.pop(),e.tmpItems.push(c),c.sequence=(()=>new Promise(o=>{let i=e.controllers.running;if(!navigator.mediaDevices)return i.element.append($("<p>Sorry, you cannot complete this experiment because your browser does not support voice recording.</p>"));d||(d="This experiment collects voice recording samples from its participants. Your browser should now be prompting a permission request to use your recording device (if applicable). By giving your authorization to record, and by participating in this experiment, you are giving permission to the designer(s) of this experiment to anonymously collect the voice samples recorded during this experiment. The output audio files will be uploaded to and hosted on a server designated by the experimenter(s). If you accept the request, a label will remain visible at the top of this window throughout the whole experiment, indicating whether you are being recorded."),i.element.append($("<p>"+d+"</p>"));let s=[];navigator.mediaDevices.getUserMedia({audio:!0}).then(function(e){(t=new MediaRecorder(e)).recording=!1,t.onstop=function(e){n.css({"font-weight":"normal",color:"black","background-color":"lightgray"}),n.html("Not recording"),r.filename="msr-"+(new Date).toISOString().replace(/:|\./g,"-")+".ogg",r.blob=new Blob(s,{type:"audio/ogg; codecs=opus"}),r.audioPlayer.src=URL.createObjectURL(r.blob),s=[],r=null,l.shift().call(),t.recording=!1},t.onstart=function(e){n.css({"font-weight":"bold",color:"white","background-color":"red"}),n.html("Recording..."),t.recording=!0,a.shift().call()},t.ondataavailable=function(e){s.push(e.data)},i.element.append($("<a>By clicking this link I understand that I grant this experiment's script access to my recording device for the purpose of uploading voice recordings to the server designated by the experimenter(s).</a>").addClass("Message-continue-link").click(o)),(n=$("<div>Not recording</div>")).css({position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",padding:"2px","background-color":"lightgray"}),$("#bod").append(n)}).catch(function(e){i.element.append($("<p>The following error occurred: "+e+"</p>"))})})),c},e.Prerun(()=>{let t=window.conf_modifyRunningOrder;window.conf_modifyRunningOrder=function(r){if(t instanceof Function&&(r=t.apply(this,[r])),!s)return r;let n=!1,a=[-1,-1];for(let e=0;e<r.length;++e)for(let t=0;t<r[e].length;++t)"PennController"==r[e][t].controller&&"UploadRecordings"==r[e][t].options.id?(n=!0,a[0]>=0&&alert("WARNING: upload of voice archive set AFTER sending of results; check the 'items' and 'shuffleSequence' variables.")):"__SendResults__"==r[e][t].controller&&a[0]<0&&!n&&(a=[e,t]);if(!n){let t=e.controllers.new();t.id="UploadRecordings",t.runHeader=!1,t.runFooter=!1,t.countsForProgressBar=!1,t.sequence=(()=>new Promise(t=>{let r=e.controllers.running;r.element.append($("<p>Please wait while the archive is being uploaded to the server...</p>"));let n=new e.utils.JSZip;for(let e in o)n.file(o[e].name,o[e].data);n.generateAsync({compression:"DEFLATE",type:"blob"}).then(function(n){window.PennController.downloadVoiceRecordingsArchive=(()=>e.utils.saveAs(n,"VoiceRecordingsArchive.zip"));let o="msr-"+(new Date).toISOString().replace(/:|\./g,"-")+".zip";var s=new File([n],o),a=new FormData;a.append("fileName",o),a.append("file",s),a.append("mimeType","application/zip");var l=new XMLHttpRequest;l.open("POST",i,!0),l.onreadystatechange=(()=>{if(4==l.readyState){r.save("PennController","UploadRecordings","Filename",o,Date.now(),"NULL"),200==l.status&&!l.responseText.match(/problem|error/i)?r.save("PennController","UploadRecordings","Status","Success",Date.now(),"NULL"):(alert("There was an error uploading the recordings ("+l.responseText+")."),window.PennController.uploadRecordingsError=l.responseText||"error",e.debug.error("VoiceRecorder's Ajax post failed. ("+l.status+")",l.responseText),r.save("PennController","UploadRecordings","Status","Failed",Date.now(),"Error Text: "+l.responseText+"; Status: "+l.status)),t()}}),l.send(a)})}));let n=new DynamicElement("PennController",t);a[0]>=0?r[a[0]].splice(a[1],0,n):r.push([n])}return r}}),this.immediate=function(e){},this.uponCreation=function(n){void 0===t&&e.debug.error("Recorder not initiated. Make sure the sequence of items contains an InitiateRecorder PennController."),this.log=!1,this.recordings=[],this.recording=!1,this.audioPlayer=document.createElement("audio"),this.jQueryElement=$("<span>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-ui");let o=$("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-record"),i=$("<div>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-status"),s=$("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-stop"),d=$("<div>"),c=$("<button>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-play"),u=$("<div>");$([o,s,c]).each(function(){this.css({width:"25px",height:"25px",position:"relative"})}),$([i,d,u]).each(function(){this.css({position:"absolute",left:"2px",top:"4px",width:"15px",height:"15px"})}),o.css({"background-color":"red","border-radius":"50%","margin-right":"10px"}),i.css({"background-color":"brown","border-radius":"50%",left:"6px",top:"6px",width:"10px",height:"10px"}),d.css({"background-color":"brown"}),u.css({width:0,height:0,"background-color":"transparent",padding:0,"border-top":"7.5px solid transparent","border-bottom":"7.5px solid transparent","border-right":"0px solid transparent","border-left":"15px solid green"});let p=function(e){c.css("display","inline-block"),s.css("display","none"),e?(u.css("border-left","15px solid green"),c.attr("disabled",!1)):(u.css("border-left","15px solid gray"),c.attr("disabled",!0))};p(!1);let h=null;o.click(()=>{this.audioPlayer.currentTime>0&&(this.audioPlayer.pause(),this.audioPlayer.currentTime=0,p(!1)),this.recording?(this.stop(),this.recording=!1,clearInterval(h),i.css("background-color","brown"),p(!0)):(i.css("background-color","lightgreen"),h=setInterval(()=>{"rgb(255, 255, 255)"==i.css("background-color")?i.css("background-color","lightgreen"):i.css("background-color","white")},750),p(!1),this.recording=!0,this.start())}),c.click(()=>{!function(e){s.css("display","inline-block"),c.css("display","none"),e?(d.css("background-color","brown"),s.attr("disabled",!1)):(d.css("background-color","gray"),s.attr("disabled",!0))}(!0),this.audioPlayer.currentTime=0,this.audioPlayer.play()}),s.click(()=>{this.audioPlayer.currentTime>0&&(this.audioPlayer.pause(),this.audioPlayer.currentTime=0,p(!0))}),this.audioPlayer.onended=(()=>p(!0)),this.start=(()=>new Promise(e=>{this.recording=!0,a.push(()=>{this.recordings.push(["Recording","Start",Date.now(),"NULL"]),e()}),t.start()})),this.stop=(()=>new Promise(e=>{this.recording=!1,r=this,l.push(()=>{this.recordings.push(["Recording","Stop",Date.now(),"NULL"]),e()}),t.recording?t.stop():e()})),this.jQueryElement.append(o.append(i)).append(c.append(u)).append(s.append(d)),n()},this.end=function(){if(this.blob&&(o.push({name:this.filename,data:this.blob}),e.controllers.running.save(this.type,this.id,"Filename",this.filename,Date.now(),"NULL")),this.log)for(let t in this.recordings)e.controllers.running.save(this.type,this.id,...this.recordings[t])},this.value=function(){return this.blob},this.actions={play:function(e){this.audioPlayer&&this.audioPlayer.src?(this.audioPlayer.currentTime&&0!=this.audioPlayer.currentTime&&(this.audioPlayer.currentTime=0),this.audioPlayer.play().then(()=>e())):e()},record:async function(e){await this.start(),e()},stop:async function(e){await this.stop(),this.audioPlayer&&this.audioPlayer.src&&(this.audioPlayer.pause(),this.audioPlayer.currentTime&&0!=this.audioPlayer.currentTime&&(this.audioPlayer.currentTime=0)),e()},wait:function(e,t){if(t&&"string"==typeof t&&t.match(/first/i)&&this.recordings.length)e();else if(t&&"string"==typeof t&&t.match(/play/i)&&this.audioPlayer){let t=this.audioPlayer.onended;this.audioPlayer.onended=function(...r){t instanceof Function&&t.apply(this,r),e()}}else{let r=!1,n=this.stop;this.stop=(()=>new Promise(o=>{n.apply(this).then(()=>{if(o(),!r)if(t instanceof Object&&t._runPromises&&t.success){let n=this.disabled;this.disabled="tmp",t._runPromises().then(t=>{"success"==t&&(r=!0,e()),"tmp"==this.disabled&&(this.disabled=n)})}else r=!0,e()})}))}}},this.settings={disable:function(e){this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown"),e()},enable:function(e){this.disabled=!1,this.jQueryElement.find("button.PennController-"+this.type+"-record").removeAttr("disabled").css("background-color","red"),e()},once:function(e){if(this.recordings.length)this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown");else{let e=this.stop;this.stop=(()=>new Promise(t=>{e instanceof Function?e.apply(this).then(t):t(),this.disabled=!0,this.jQueryElement.find("button.PennController-"+this.type+"-record").attr("disabled",!0).css("background-color","brown")}))}e()},log:function(e){this.log=!0,e()}},this.test={hasPlayed:function(){return this.hasPlayed},playing:function(){return this.audio.currentTime&&!this.audio.paused},recorded:function(){return this.blob}}}),window.PennController.DownloadVoiceButton=function(e){return"<button type=\"button\" onclick=\"if (PennController.hasOwnProperty('downloadVoiceRecordingsArchive'))  PennController.downloadVoiceRecordingsArchive();  else  alert('ERROR: could not find an archive for voice recordings');\">"+e+"</button>"}}});