/*! $AC$ PennController.newKey(name,key) Creates a new Key element $AC$$AC$ PennController.getKey(name) Retrieves an existing Key element $AC$$AC$ Key PElement.wait() Waits until the key, or one of the keys, is pressed before proceeding $AC$$AC$ Key PElement.callback(commands) Will run the specified command(s) whenever a valid keypress happens $AC$$AC$ Key PElement.disable() Stops listening to keypresses $AC$$AC$ Key PElement.enable() Starts listening to keypresses (again) $AC$$AC$ Key PElement.log() Will log any valid keypress in the results file $AC$$AC$ Key PElement.test.pressed(key) Checks that the key, or any key if none specified, has been pressed before $AC$ */!function(e){var s={};function t(i){if(s[i])return s[i].exports;var n=s[i]={i:i,l:!1,exports:{}};return e[i].call(n.exports,n,n.exports,t),n.l=!0,n.exports}t.m=e,t.c=s,t.d=function(e,s,i){t.o(e,s)||Object.defineProperty(e,s,{enumerable:!0,get:i})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,s){if(1&s&&(e=t(e)),8&s)return e;if(4&s&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(t.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&s&&"string"!=typeof e)for(var n in e)t.d(i,n,function(s){return e[s]}.bind(null,n));return i},t.n=function(e){var s=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(s,"a",s),s},t.o=function(e,s){return Object.prototype.hasOwnProperty.call(e,s)},t.p="",t(t.s=32)}({32:function(e,s){window.PennController._AddElementType("Key",(function(e){this.immediate=function(s,...t){t.length<1&&(t=[s],void 0!==s&&"string"==typeof s&&0!=s.length||(s="Key"),this.id=s),this.keys=[],this.specialKeys=[];for(let i=0;i<t.length;i++)Number(t[i])>0?this.keys.push(String.fromCharCode(t[i])):"string"!=typeof t[i]?e.debug.error("Invalid key(s) passed to new Key &quot;"+s+"&quot; (should be a string or a key code number)",t[i]):t[i].isSpecialKey()||t[i].replace(/^(Left|Right)/i,"").isSpecialKey()?this.specialKeys.push(t[i].toUpperCase()):t[i].length&&this.keys.push(t[i].toUpperCase())},this.uponCreation=function(s){this.pressed=[],this.pressedWait=[],this.log=!1,this.enabled=!0,e.events.keypress(e=>{if(!this.enabled)return;let s=e.key.isSpecialKey(),t=e.key.toUpperCase(),i={0:"",1:"LEFT",2:"RIGHT"};(0==this.keys.length&&0==this.specialKeys.length||s&&this.specialKeys.filter(s=>s==t||s===i[e.location]+t).length||!s&&this.keys.filter(e=>e.indexOf(t)>-1).length)&&this.press(e.key)}),this.press=e=>{this.pressed.push(["PressedKey",e.toUpperCase(),Date.now(),"NULL"])},s()},this.end=function(){if(this.log&&this.log instanceof Array)if(0==this.pressed.length)e.controllers.running.save(this.type,this.id,"Key","NA","Never","NULL");else if(this.log.indexOf("all")>-1)for(let s in this.pressed)e.controllers.running.save(this.type,this.id,...this.pressed[s]);else if(this.log.indexOf("wait")>-1){let s=!1;for(let t in this.pressed)"Wait success"==this.pressed[t][3]&&(e.controllers.running.save(this.type,this.id,...this.pressed[t]),s=!0);s||e.controllers.running.save(this.type,this.id,"Key","NA","Never","(failed keypresses happened)")}else 1==this.pressed.length?e.controllers.running.save(this.type,this.id,...this.pressed[0]):(this.log.indexOf("first")>-1&&e.controllers.running.save(this.type,this.id,...this.pressed[0]),this.log.indexOf("last")>-1&&e.controllers.running.save(this.type,this.id,...this.pressed[this.pressed.length-1]))},this.value=function(){return this.pressed.length?this.pressed[this.pressed.length-1][1]:""},this.actions={wait:function(e,s){if("first"==s&&this.pressed.length)e();else{let t=!1,i=this.press,n=document.activeElement;for(;n;)n.disabled?(n.blur(),n=null):n=n.parentElement;this.press=n=>{if(i.apply(this,[n]),!t)if(s instanceof Object&&s._runPromises&&s.success){let i=this.enabled;this.enabled=0,s._runPromises().then(s=>{"success"==s?(this.pressed[this.pressed.length-1][3]="Wait success",t=!0,e()):this.pressed[this.pressed.length-1][3]="Wait failure",0===this.enabled&&(this.enabled=i)})}else this.pressed[this.pressed.length-1][3]="Wait success",t=!0,e()}}}},this.settings={callback:function(e,...s){let t=this.press;this.press=async function(e){if(t.apply(this,[e]),this.enabled)for(let e in s)await s[e]._runPromises()},e()},disable:function(e){this.enabled=!1,e()},enable:function(e){this.enabled=!0,e()},log:function(e,...s){s.length?this.log=s:this.log=["wait"],e()}},this.test={pressed:function(e,s){for(let t in this.pressed){let i=this.pressed[t][1];if(Number(e)>0&&i.toUpperCase()==String.fromCharCode(e).toUpperCase())return!0;if("string"==typeof e&&e.toUpperCase()==i.toUpperCase())return!0;if(void 0===e)return!0;if(s)return!1}return!1}}}))}});