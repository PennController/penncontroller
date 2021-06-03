!function(t){var e={};function i(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)i.d(s,n,function(e){return t[e]}.bind(null,n));return s},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=34)}({34:function(t,e){window.PennController._AddElementType("Scale",(function(t){function e(){this.jQueryElement.find("input").attr("disabled",!0),this.jQueryElement.find("div,label").css("cursor",""),this.disabled=!0}function i(){this.jQueryElement.find("input").removeAttr("disabled"),this.jQueryElement.find("div").css("cursor","pointer"),this.disabled=!1}function s(t,e){if("slider"==this.scaleType?this.jQueryElement.find("input[type=range]")[0].value=t:this.jQueryElement.find(`input#${this.id}-${t}`).attr("checked",!0).change(),e){let e=this.buttons[t];null!=e&&""!=e||(e=t+1),this.choice(e)}}async function n(){let e=this.defaultValue,i=this.orientation,s=this.scaleType;if(this.jQueryElement.empty(),"slider"==s){var n=$("<input>").attr({type:"range",min:"0",max:String(this.buttons.length-1),value:String((this.buttons.length-1)/2),step:"1"});Number(e)>=0&&Number(e)<=this.buttons.length-1&&n.attr("value",String(e)),this.disabled&&n.attr("disabled",!0),n[0].oninput=()=>{this.firstClick||(this.firstClick=Date.now())},n[0].onchange=()=>this.choice(n[0].value),"vertical"==i&&(n.attr("orient","vertical"),n.css({"writing-mode":"vertical-lr","-webkit-appearance":"slider-vertical"})),n.css({width:"100%",height:"100%"}),this.jQueryElement.append(n)}else{this.jQueryElement.css({display:"inline-flex","justify-content":"space-between"});for(let i=0;i<this.buttons.length;i++){let n=this.buttons[i];(null==n||""==n||n instanceof t.PennElementCommands)&&(n=i+1);let l=$("<label>").attr({for:this.id+"-"+i}).html(n).css("cursor","pointer"),o=$("<input>").attr({name:this.id,value:n,type:"checkbox"==s?"checkbox":"radio",id:this.id+"-"+i}),h=$("<div>").addClass("option").css({cursor:"pointer",display:"flex","align-items":"center"}).append(o).append(l);n._runPromises&&n.print(l.empty())._runPromises(),e!=n&&e!=i||o.attr("checked",!0),this.disabled&&o.attr("disabled",!0),o[0].onchange=()=>{this.choice(this.buttons[i]||n,"checkbox"==s&&!o[0].checked),this.jQueryElement.find("label").css("outline","none"),"buttons"==s&&l.css("outline","dotted 1px black")},"buttons"==s&&o.css("display","none"),"top"==this.labels?h.css("flex-direction","column-reverse"):"bottom"==this.labels?h.css("flex-direction","column"):"left"==this.labels&&h.css("flex-direction","row-reverse"),this.jQueryElement.append(h),"radio"==s&&!1===this.labels?l.css("display","none"):this.buttons[i]instanceof t.PennElementCommands&&await this.buttons[i].print(l.empty())._runPromises()}"vertical"==i&&this.jQueryElement.css("flex-direction","column")}this.width||this.jQueryElement.css("max-width","max-content")}this.immediate=function(t,...e){e.length||(e=[t],void 0!==t&&"string"==typeof t&&0!=t.length||(t="Scale")),this.id=t,"string"!=typeof e[0]&&Number(e[0])>0?this.initialButtons=new Array(Number(e[0])):this.initialButtons=e},this.uponCreation=function(e){this.jQueryElement=$("<div>").css("display","inline-block"),this.choices=[],this.log=!1,this.labels=!1,this.disabled=!1,this.vertical=!1,this.scaleType="radio",this.defaultValue=null,this.orientation="horizontal",this.width=null,this.keys=[],this.buttons=this.initialButtons,this.choice=(t,e)=>{if(this.disabled)return;this.unselected=e||void 0,t&&t._runPromises&&(t=t._element.id);let i=null;"slider"==this.scaleType&&this.firstClick&&(i=Date.now()-this.firstClick,this.firstClick=void 0),this.choices.push([e?"Unselect":"Choice",t,Date.now(),i||"NULL"])},t.controllers.running.safeBind($(document),"keydown",t=>{if(!this.disabled)for(let e=0;e<this.keys.length;e++)if(String.fromCharCode(t.which)==this.keys[e])return s.apply(this,[e,!0])}),e()},this.end=function(){const e=this;if(this.log&&this.log instanceof Array)if("checkbox"==this.scaleType&&this.jQueryElement.find("input[type=checkbox]").each((function(i){t.controllers.running.save(e.type,e.id,e.buttons[i],this.checked?"checked":"unchecked",Date.now(),"Status")})),this.choices.length)if(1==this.choices.length)t.controllers.running.save(this.type,this.id,...this.choices[0]);else if(this.log.indexOf("all")>-1)for(let e in this.choices)t.controllers.running.save(this.type,this.id,...this.choices[e]);else this.log.indexOf("first")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[0]),this.log.indexOf("last")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[this.choices.length-1]);else t.controllers.running.save(this.type,this.id,"Choice","NA","Never","No selection happened")},this.value=function(){return this.choices.length&&void 0===this.unselected?this.choices[this.choices.length-1][1]:NaN},this.actions={print:async function(e,...i){await n.apply(this),t.elements.standardCommands.actions.print.apply(this,[e,...i])},select:function(e,i,n){for(var l=0;l<this.buttons.length;l++){let t=this.buttons[l];if(t&&t==i)break;if(t&&t._element&&t._element.id==i)break;if(l==i)break}if(l>=this.buttons.length)return e(t.debug.error("Option "+i+" not found for selection on Scale "+this.id));s.apply(this,[l,n]),e()},unselect:function(t){if("slider"==this.scaleType){let t=this.jQueryElement.find("input[type=range]")[0];t.value=(t.max-t.min)/2}else this.jQueryElement.find("input").removeAttr("checked").change();this.unselected=!0,t()},wait:function(t,e){if("first"==e&&this.choices.length)t();else{let i=!1,s=this.choice;this.choice=n=>{if(s.apply(this,[n]),!i)if(e instanceof Object&&e._runPromises&&e.success){let s=this.disabled;this.disabled="tmp",e._runPromises().then(e=>{"success"==e&&(i=!0,t()),"tmp"==this.disabled&&(this.disabled=s)})}else i=!0,t()}}}},this.settings={button:async function(t){this.scaleType="buttons",await n.apply(this),t()},callback:function(t,...e){let i=this.choice;this.choice=async function(t){let s=this.disabled;if(i.apply(this,[t]),!s)for(let t in e)await e[t]._runPromises()},t()},checkbox:async function(t){this.scaleType="checkbox",await n.apply(this),t()},default:function(e,i){this.buttons.indexOf(i)>-1||Number(i)>=0&&Number(i)<this.buttons.length?(this.defaultValue=i,i._element&&(i=i._element.id),this.choices.push(["Default",i,Date.now(),this.scaleType])):t.debug.error("Invalid default value for Scale "+this.id,i),e()},disable:function(t){e.apply(this),this.jQueryContainer.addClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),t()},enable:function(t){i.apply(this),this.jQueryContainer.removeClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),t()},horizontal:async function(t){this.orientation="horizontal",this.jQueryElement.parent().length&&await n.apply(this),t()},keys:function(e,...i){if(i instanceof Array&&i.length==this.buttons.length){if(i.filter(t=>"string"==typeof t&&1==t.length).length!=i.length)return e(t.debug.error("Every key should be a string of length 1 in Scale "+this.id,i));this.keys=i.map(t=>t.toUpperCase())}else this.buttons.filter(t=>"string"==typeof t&&1==t.length).length==this.buttons.length?this.keys=this.buttons.map(t=>t.toUpperCase()):this.keys=Array.from({length:this.buttons.length},(t,e)=>e+1);e()},label:async function(t,e,i){if(isNaN(Number(e))||e<0||e>=this.buttons.length)return t();this.buttons[e]=i,await n.apply(this),t()},labels:function(t,e){this.labels=e,t()},labelsPosition:async function(t,e){this.labels=e,await n.apply(this),t()},log:function(t,...e){e.length?this.log=e:this.log=["last"],t()},once:function(t){if(this.hasClicked)e.apply(this);else{let t=this.choice;this.choice=i=>{t.apply(this,[i]),e.apply(this)}}t()},radio:async function(t){this.scaleType="radio",await n.apply(this),t()},size:async function(e,i,s){this.width=i,await n.apply(this),t.elements.standardCommands.settings.size.apply(this,[e,i,s])},slider:async function(t){this.scaleType="slider",await n.apply(this),t()},vertical:async function(t){this.orientation="vertical",this.jQueryElement.parent().length&&await n.apply(this),t()}},this.test={selected:function(t){return!(!this.choices.length||this.unselected)&&(null==t||t==this.choices[this.choices.length-1][1])}}}))}});