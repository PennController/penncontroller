/*! $AC$ PennController.newTimer(name,duration) Creates a new Timer element $AC$$AC$ PennController.getTimer(name) Retrieves an existing Timer element $AC$$AC$ Timer PElement.start() Starts the timer $AC$$AC$ Timer PElement.stop() Stops the timer $AC$$AC$ Timer PElement.wait() Waits until the timer elapses before proceeding $AC$$AC$ Timer PElement.callback(commands) Will execute the specified command(s) whenever the timer elapses $AC$$AC$ Timer PElement.log() Will log when the timer starts and ends in the results file $AC$$AC$ Timer PElement.test.ended() Checks that the timer has ever elapsed before $AC$$AC$ Timer PElement.test.running() Checks that the timer is currently running $AC$ */!function(t){var e={};function i(n){if(e[n])return e[n].exports;var s=e[n]={i:n,l:!1,exports:{}};return t[n].call(s.exports,s,s.exports,i),s.l=!0,s.exports}i.m=t,i.c=e,i.d=function(t,e,n){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var s in t)i.d(n,s,function(e){return t[e]}.bind(null,s));return n},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=39)}({39:function(t,e){window.PennController._AddElementType("Timer",(function(t){this.immediate=function(e,i){void 0===i&&Number(e)>0&&(i=e,void 0!==e&&"string"==typeof e&&0!=e.length||(e="Timer")),this.id=e,this.initialDuration=0,Number(i)>0?this.initialDuration=Number(i):t.debug.error("Invalid duration for Timer &quot;"+e+"&quot;")},this.uponCreation=function(t){this.elapsed=!1,this.events=[],this.log=!1,this.running=!1,this.duration=this.initialDuration,this.start=()=>{this.startTime=Date.now(),this.running=!0,this.events.push(["Start","Start",this.startTime,"NULL"]);let t=()=>{this.running&&(Date.now()-this.startTime>=this.duration?this.done():setTimeout(t,0))};t()},this.done=()=>{this.running=!1,this.events.push(["End","End",Date.now(),"NULL"]),this.elapsed=!0,this.startTime=null},t()},this.end=function(){if(this.running&&(this.running=!1,this.events.push(["End","NA","Never","Had to halt the timer at the end of the trial"])),this.log)for(let e in this.events)t.controllers.running.save(this.type,this.id,...this.events[e])},this.value=function(){return this.elapsed},this.actions={pause:function(t){this.running&&(this.running=!1,this.pausedTimestamp=Date.now(),this.events.push(["Pause","Pause",this.pausedTimestamp,"NULL"])),t()},resume:function(t){if(!this.running&&this.pausedTimestamp){this.resumedTimestamp=Date.now();const t=this.resumedTimestamp-this.pausedTimestamp,e=this.startTime+t;this.events.push(["Resume","Resume",this.resumedTimestamp,"NULL"]),this.start(),this.startTime=e}t()},set:function(e,i){const n=Number(i);isNaN(n)||n<0?t.debug.error(`Invalid duration passed for timer ${this.id} (&quot;${i}&quot;)`):this.duration=n,e()},start:function(t){this.start(),t()},stop:function(t){this.running&&this.done(),t()},wait:function(t,e){if("first"==e&&this.elapsed)t();else{let i=!1,n=this.done;this.done=()=>{n.apply(this),i||(e instanceof Object&&e._runPromises&&e.success?e._runPromises().then(e=>{"success"==e&&(i=!0,t())}):(i=!0,t()))}}}},this.settings={callback:function(t,...e){let i=this.done;this.done=async function(){i.apply(this);for(let t in e)await e[t]._runPromises()},t()},log:function(t){this.log=!0,t()}},this.test={ended:function(){return this.elapsed},running:function(){return this.running}}}))}});