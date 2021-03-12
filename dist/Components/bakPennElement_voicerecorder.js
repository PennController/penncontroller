/*! $AC$ PennController.newVoiceRecorder(name,file) Creates a new VoiceRecorder element $AC$$AC$ PennController.getVoiceRecorder(name) Retrieves an existing Video element $AC$$AC$ global.PennController.InitiateRecorder(url,warning,consent) Sets the URL where to upload the recordings and creates a trial inviting the user to activate their microphone $AC$$AC$ global.PennController.UploadVoiceRecordings(label,noblock) Creates a trial that sends the voice recordings to the server $AC$$AC$ VoiceRecorder PElement.play() Starts playing back the recording $AC$$AC$ VoiceRecorder PElement.record() Starts recording $AC$$AC$ VoiceRecorder PElement.stop() Stops playback or recording $AC$$AC$ VoiceRecorder PElement.wait() Waits until recording stops before proceeding $AC$$AC$ VoiceRecorder PElement.once() Will disable the recording interface after the first recording is complete $AC$$AC$ VoiceRecorder PElement.log() Will log events in the results file $AC$$AC$ VoiceRecorder PElement.test.hasPlayed() Checks that the recording was fully played back before $AC$$AC$ VoiceRecorder PElement.test.playing() Checks that the recording is currently being played back $AC$$AC$ VoiceRecorder PElement.test.recorded() Checks that recording has happened $AC$$AC$ global.PennController.DownloadVoiceButton(text) Returns an HTML string representing a button to download an archive of the recordings $AC$ */!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=46)}({46:function(e,t){}});