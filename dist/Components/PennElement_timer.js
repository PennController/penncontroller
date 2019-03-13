!function(t){var e={};function n(i){if(e[i])return e[i].exports;var s=e[i]={i:i,l:!1,exports:{}};return t[i].call(s.exports,s,s.exports,n),s.l=!0,s.exports}n.m=t,n.c=e,n.d=function(t,e,i){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var s in t)n.d(i,s,function(e){return t[e]}.bind(null,s));return i},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=127)}({127:function(t,e){window.PennController._AddElementType("Timer",function(t){this.immediate=function(e,n){void 0===n&&Number(e)>0&&(this.id=t.utils.guidGenerator(),n=e),this.duration=0,Number(n)>0?this.duration=Number(n):t.debug.error("Invalid duration for Timer &quot;"+e+"&quot;")},this.uponCreation=function(t){this.elapsed=!1,this.instance=void 0,this.events=[],this.log=!1,this.running=!1,this.start=(()=>{this.instance&&clearTimeout(this.instance),this.events.push(["Start","Start",Date.now(),"NULL"]),this.instance=setTimeout(()=>this.done(),this.duration),this.running=!0}),this.done=(()=>{this.events.push(["End","End",Date.now(),"NULL"]),this.elapsed=!0,this.running=!1}),t()},this.end=function(){if(this.instance&&(clearTimeout(this.instance),this.events.push(["End","NA","Never","Had to halt the timer at the end of the trial"])),this.log)for(let e in this.events)t.controllers.running.save(this.type,this.id,...this.events[e])},this.value=function(){return this.elapsed},this.actions={start:function(t){this.start(),t()},stop:function(t){if(!this.instance)return t();clearTimeout(this.instance),this.done(),t()},wait:function(t,e){if("first"==e&&this.elapsed)t();else{let n=!1,i=this.done;this.done=(()=>{i.apply(this),n||(e instanceof Object&&e._runPromises&&e.success?e._runPromises().then(e=>{"success"==e&&(n=!0,t())}):(n=!0,t()))})}}},this.settings={callback:function(t,...e){let n=this.done;this.done=async function(){n.apply(this);for(let t in e)await e[t]._runPromises()},t()},log:function(t){this.log=!0,t()}},this.test={ended:function(){return this.elapsed},running:function(){return this.running}}})}});