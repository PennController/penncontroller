/*! $AC$ PennController.newYoutube(name,url) Creates a new Youtube element with the specified URL $AC$$AC$ PennController.getYoutube(name) Retrieves an existing Youtube element $AC$$AC$ Youtube PElement.play() Starts playing the video (visible only if print was called) $AC$$AC$ Youtube PElement.pause() Pauses the video $AC$$AC$ Youtube PElement.print() Shows Youtube's video player $AC$$AC$ Youtube PElement.remove() Removes Youtube's video player $AC$$AC$ Youtube PElement.stop() Stops the video and goes back to the beginning $AC$$AC$ Youtube PElement.wait() Wait until the video reaches the end before proceeding $AC$$AC$ Youtube PElement.disable() Disables the Youtube video player $AC$$AC$ Youtube PElement.enable() Enables the Youtube video player (again) $AC$$AC$ Youtube PElement.once() Will disable the Youtube video player after the video has played once $AC$$AC$ Youtube PElement.log() Will log play and/or stop events in the results file $AC$$AC$ Youtube PElement.test.hasPlayed() Checks that the video has ever played through before $AC$$AC$ Youtube PElement.test.playing() Checks that the video is currently playing $AC$ */!function(e){var t={};function i(s){if(t[s])return t[s].exports;var n=t[s]={i:s,l:!1,exports:{}};return e[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=t,i.d=function(e,t,s){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)i.d(s,n,function(t){return e[t]}.bind(null,n));return s},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=44)}({44:function(e,t){window.PennController._AddElementType("Youtube",(function(e){const t=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver;let i=[];$(document).ready((function(){let e=document.createElement("script");e.src="https://www.youtube.com/iframe_api";let t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t),window.onYouTubeIframeAPIReady=function(){for(let e in i)i[e].call()}})),this.immediate=function(t,s,n){void 0===s&&"string"==typeof t&&(s=t),s&&"string"==typeof s||e.debug.error("Invalid code for Youtube element "+t,s),n=n&&!n.match(/^\W*no\W*controls?\W*$/i)?1:0,this.resource=e.resources.fetch(s,(function(t){let r=s+"-"+e.resources.list.length;this.ended=function(){},this.playing=function(){},this.paused=function(){},this.buffering=function(){};let l=!1,o=$("<iframe>");o.attr({src:"https://www.youtube-nocookie.com/embed/"+s+"?enablejsapi=1&controls="+n,id:r,frameborder:0}).bind("load",()=>l=!0).css({display:"none",position:"absolute"}),$(document).ready(()=>$(document.body).append(o)),i.push(()=>{let e=!0,i=()=>this.player=new YT.Player(r,{playerVars:{controls:n},events:{onReady:e=>{o=e.target.cueVideoById(s),e.target.playVideo()},onStateChange:i=>{i.data!=YT.PlayerState.ENDED||e?i.data==YT.PlayerState.PLAYING?e?(i.target.pauseVideo(),i.target.seekTo(0),e=!1,t()):this.playing(i):i.data!=YT.PlayerState.PAUSED||e?i.data!=YT.PlayerState.BUFFERING||e||this.buffering(i):this.paused(i):this.ended(i)}}});l?i():o.bind("load",i)}),this.object=o}),!1),this.id=t},this.uponCreation=function(e){this.iframe=this.resource.object,this.player=this.resource.player,this.log=!1,this.hasPlayed=!1,this.events=[],this.onplay=()=>this.events.push(["Play",this.player.getCurrentTime(),Date.now(),"NULL"]),this.onpause=()=>this.events.push(["Pause",this.player.getCurrentTime(),Date.now(),"NULL"]),this.onbuffer=()=>this.events.push(["Buffer",this.player.getCurrentTime(),Date.now(),"NULL"]),this.onend=()=>{this.hasPlayed=!0,this.events.push(["End",this.player.getCurrentTime(),Date.now(),"NULL"])};let t=this,i=this.resource.ended;this.resource.ended=function(e){i.apply(this,e),t.onend()};let s=this.resource.playing;this.resource.playing=function(e){s.apply(this,e),t.onplay()};let n=this.resource.paused;this.resource.paused=function(e){n.apply(this,e),t.onpause()};let r=this.resource.buffering;this.resource.buffering=function(e){r.apply(this,e),t.onbuffer()},this.jQueryElement=$("<div>").css("display","inline-block"),this.visual={top:0,left:0,width:this.iframe.width(),height:this.iframe.height()},this.jQueryElement.css({width:this.visual.width,height:this.visual.height}),this.player.seekTo(0),this.disabled=!1,this.jQueryDisable=null,this.printDisable=()=>{this.jQueryDisable instanceof jQuery&&this.jQueryDisable.remove(),this.jQueryDisable=$("<div>").css({position:"absolute",display:"inline-block","background-color":"gray",opacity:.5,width:this.jQueryElement.width(),height:this.jQueryElement.height()}),this.jQueryElement.before(this.jQueryDisable),this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-disabled")},e()},this.end=function(){if(this.observer&&this.observer instanceof t&&this.observer.disconnect(),this.player&&this.player.getPlayerState()==YT.PlayerState.PLAYING&&this.player.pauseVideo(),this.iframe.css("display","none"),this.jQueryDisable&&this.jQueryDisable.remove(),this.log&&this.log instanceof Array)if(this.events.length)if(this.log.indexOf("all")>-1)for(let t in this.events)e.controllers.running.save(this.type,this.id,...this.events[t]);else{if(this.log.indexOf("play")>-1){let t=this.events.filter(e=>"Play"==e[0]);for(let i in t)e.controllers.running.save(this.type,this.id,...t[i])}if(this.log.indexOf("end")>-1){let t=this.events.filter(e=>"End"==e[0]);for(let i in t)e.controllers.running.save(this.type,this.id,...t[i])}if(this.log.indexOf("pause")>-1){let t=this.events.filter(e=>"Pause"==e[0]);for(let i in t)e.controllers.running.save(this.type,this.id,...t[i])}if(this.log.indexOf("buffer")>-1){let t=this.events.filter(e=>"Buffer"==e[0]);for(let i in t)e.controllers.running.save(this.type,this.id,...t[i])}}else e.controllers.running.save(this.type,this.id,"play","NA","Never","The video was never played during the trial")},this.value=function(){return this.hasPlayed},this.actions={play:function(e){this.player.playVideo(),e()},pause:function(e){this.player.pauseVideo(),e()},print:function(i,...s){e.elements.standardCommands.actions.print.apply(this,[()=>{let e=this.jQueryElement.offset();this.iframe.css({position:"absolute",left:e.left,top:e.top,display:"inline-block"}),this.observer=new t(()=>{if(this.jQueryElement[0].offsetParent&&$.contains(document.body,this.jQueryElement[0])){this.iframe.css("display",this.jQueryElement.css("display"));let e=this.jQueryElement.width(),t=this.jQueryElement.height();e==this.visual.width&&t==this.visual.height||(this.iframe.css({width:e,height:t}),this.visual.width=e,this.visual.height=t);let i=this.jQueryElement.offset();i.left==this.visual.left&&i.top==this.visual.top||(this.iframe.css({left:i.left,top:i.top}),this.visual.left=i.left,this.visual.top=i.top),this.observer.disconnect(),this.observer.observe(this.jQueryElement.parent()[0],{childList:!0,attributes:!0,subtree:!0})}else this.iframe.css("display","none")}),this.observer.observe(this.jQueryElement.parent()[0],{childList:!0,attributes:!0,subtree:!0}),this.disabled&&this.printDisable(),i()},...s])},remove:function(t){this.iframe.css("display","none"),e.elements.standardCommands.actions.remove.apply(this,[t])},stop:function(e){this.player.pauseVideo(),this.player.seekTo(0),e()},wait:function(e,t){if("first"==t&&this.hasPlayed)e();else{let i=!1,s=this.onend;this.onend=function(...n){if(s.apply(this,n),!i)if(t instanceof Object&&t._runPromises&&t.success){let s=this.disabled;this.disabled="tmp",t._runPromises().then(t=>{"success"==t&&(i=!0,e()),"tmp"==this.disabled&&(this.disabled=s)})}else i=!0,e()}}}},this.settings={disable:function(e){this.printDisable(),this.disabled=!0,this.jQueryContainer.addClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),e()},enable:function(e){this.jQueryDisable instanceof jQuery&&(this.disabled=!1,this.jQueryDisable.remove(),this.jQueryDisable=null,this.jQueryContainer.removeClass("PennController-disabled"),this.jQueryElement.removeClass("PennController-disabled")),e()},once:function(e){if(this.hasPlayed)this.disabled=!0;else{let e=this.onend,t=this;this.onend=function(...i){e.apply(this,i),t.disabled=!0,t.printDisable()}}e()},log:function(e,...t){t.length?this.log=t:this.log=["play"],e()},size:function(t,i,s){e.elements.standardCommands.settings.size.apply(this,[()=>{this.iframe.css({width:i,height:s}),this.visual.width=i,this.visual.height=s,t()},i,s])}},this.test={hasPlayed:function(){return this.hasPlayed},playing:function(){return 1==this.player.getPlayerState()}}}))}});