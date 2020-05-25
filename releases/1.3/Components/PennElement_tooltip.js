/*! $AC$ PennController.newTooltip(name,text) Creates a new Tooltip element $AC$$AC$ PennController.getTooltip(name) Retrieves an existing Tooltip element $AC$$AC$ Tooltip PElement.print(element) Prints the tooltip attached to the specified element $AC$$AC$ Tooltip PElement.wait() Waits until the tooltip gets validated before proceeding $AC$$AC$ Tooltip PElement.settings.css(css) Applies the specified CSS to the frame around the target element $AC$$AC$ Tooltip PElement.settings.key(key) Will validate (and remove) the tooltip whenever the specified key is pressed $AC$$AC$ Tooltip PElement.settings.label(text) Defines the text used for the validation label $AC$$AC$ Tooltip PElement.settings.log() Will log when the tooltip is validated in the results file $AC$$AC$ Tooltip PElement.settings.position(position) Will show the tooltip at the top, at the bottom, to the left or to the right of the element it attaches to $AC$$AC$ Tooltip PElement.settings.text(value) Redefines the text of the tooltip $AC$ */!function(e){var t={};function i(s){if(t[s])return t[s].exports;var n=t[s]={i:s,l:!1,exports:{}};return e[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=t,i.d=function(e,t,s){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)i.d(s,n,function(t){return e[t]}.bind(null,n));return s},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=131)}({131:function(e,t){window.PennController._AddElementType("Tooltip",function(e){function t(){this.jQueryElement.remove(),this.jQueryContainer instanceof jQuery&&this.jQueryContainer.remove(),this.frame&&this.frame instanceof jQuery&&this.frame.remove()}this.immediate=function(e,t,i){this.initialText=t,this.initialLabel=i},this.uponCreation=function(e){this.text=this.initialText,"string"==typeof this.initialLabel&&this.initialLabel.length?this.label=this.initialLabel:this.label="OK",this.resetLabel=!1,this.jQueryElement=$("<div>").html(this.text),this.jQueryLabel=$("<a>").html(this.label),this.validations=[],this.frame=$("<div>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-tooltip-frame"),this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-tooltip"),this.jQueryElement.addClass("PennController-"+this.id.replace(/[\s_]/g,"")),this.jQueryElement.css({background:"floralwhite",position:"relative"}),this.jQueryLabel.css({border:"dotted 1px gray",cursor:"pointer",position:"absolute",bottom:"2px",right:"2px"}),this.wasValidated=!1,this.disabled=!1,this.log=!1,this.validate=(()=>{this.delayedPrinting||this.disabled||(this.wasValidated=!0,this.validations.push(["Validate","Validate",Date.now(),"NULL"]),t.apply(this))}),e()},this.end=function(){if(this.jQueryElement&&this.jQueryElement instanceof jQuery&&t.apply(this),this.log)for(let t in this.validations)e.controllers.running.save(this.type,this.id,...this.validations[t])},this.value=function(){return this.wasValidated},this.actions={print:function(t,i){if(i&&i.hasOwnProperty("_element")&&i._element.jQueryElement instanceof jQuery&&(i=i._element.jQueryElement),this.jQueryElement.append(this.jQueryLabel),this.jQueryLabel.click(()=>{this.noClicks||this.validate()}),this.jQueryElement.css("text-align","left"),i instanceof jQuery){i.before(this.jQueryElement);let e=i.width(),s=i.height();this.jQueryElement.css({position:"absolute",display:"inline-block",visibility:"hidden",overflow:"auto",top:"auto",left:"auto","margin-top":1+s,"margin-left":1+e,"z-index":9999,padding:"1px"}),this.frameParent&&i.before(this.frame.css({position:"absolute",display:"inline-block",width:e,height:s,border:this.frameParent,"z-index":100,"pointer-events":"none"}));let n=i.css("top"),l=i.css("left");if("0px"==n&&(n="auto"),"0px"==l&&(l="auto"),this.jQueryElement.css({left:l,top:n}),this.frame.css({left:l,top:n}),this.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,"")),"none"!=this.jQueryLabel.css("display")&&this.jQueryElement.css("padding-bottom","20px"),this.relativePosition){let e=()=>this.relativePosition.match(/top/i)?-1*this.jQueryElement.outerHeight()-1:this.relativePosition.match(/middle/i)?.5*(i.height()-this.jQueryElement.outerHeight()):i.height()+1,s=()=>this.relativePosition.match(/left/i)?-1*this.jQueryElement.outerWidth()-1:this.relativePosition.match(/center/i)?.5*(i.width()-this.jQueryElement.outerWidth()):i.width()+1;this.delayedPrinting=!0,setTimeout(()=>{this.jQueryElement.css({"margin-top":e(),"margin-left":s()}),setTimeout(()=>{this.jQueryElement.css({"margin-top":e(),"margin-left":s(),visibility:"visible"}),this.delayedPrinting=!1,t()})})}else this.jQueryElement.css("visibility","visible"),t()}else this.jQueryElement.css({position:"relative",left:"",top:"",margin:0,display:"inline-block"}),"none"!=this.jQueryLabel.css("display")&&this.jQueryElement.css("padding-bottom","20px"),e.elements.standardCommands.actions.print.apply(this,[t,i])},remove:function(e){t.apply(this),e()},wait:function(e,t){if("first"==t&&this.wasValidated)e();else{let i=!1,s=this.validate;this.validate=(()=>{if(s.apply(this),!i)if(t instanceof Object&&t._runPromises&&t.success){let s=this.disabled;this.disabled="tmp",t._runPromises().then(t=>{"success"==t&&(i=!0,e()),"tmp"==this.disabled&&(this.disabled=s)})}else i=!0,e()})}}},this.settings={disable:function(e){this.disabled=!0,this.jQueryContainer.addClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),e()},enable:function(e){this.disabled=!1,this.jQueryContainer.removeClass("PennController-disabled"),this.jQueryElement.removeClass("PennController-disabled"),e()},frame:function(e,t){"string"==typeof t&&t.length?this.frameParent=t:this.frameParent="dotted 1px gray",e()},key:function(t,i,s){Number(i)>0?e.events.keypress(e=>{this.jQueryElement.parent().length&&e.keyCode==i&&this.validate()}):"string"==typeof i&&e.events.keypress(e=>{if(!this.jQueryElement.parent().length)return;let t=e.keyCode;i.length&&!i.toUpperCase().includes(String.fromCharCode(t).toUpperCase())||this.validate()}),s&&(this.noClicks=!0,this.jQueryLabel.css("cursor",""),this.initialLabel||this.resetLabel||this.jQueryLabel.css("display","none")),t()},label:function(e,t){this.label=t,this.resetLabel=!0,this.jQueryLabel.html(t),this.jQueryLabel.css("display","inherit"),e()},log:function(e){this.log=!0,e()},position:function(e,t){this.relativePosition=t,e()},text:function(e,t){this.text=t,this.jQueryElement.html(t),this.jQueryElement.append(this.jQueryLabel),this.jQueryLabel.click(()=>{this.noClicks||this.validate()}),"none"!=this.jQueryLabel.css("display")&&this.jQueryElement.css("padding-bottom","20px"),e()}}})}});