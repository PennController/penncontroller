<<<<<<< HEAD
!function(t){var e={};function i(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:s})},i.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=66)}({66:function(t,e){window.PennController._AddElementType("Scale",function(t){function e(){this.table.find("input").attr("disabled",!0),this.table.find("td").css("cursor",""),this.disabled=!0}function i(t,e){switch(this.scaleType){case"buttons":this.table.find("td.PennController-"+this.type+"-scaleButton").css("outline",""),$(this.table.find("td.PennController-"+this.type+"-scaleButton")[t]).css("outline","dotted 1px gray");break;case"slider":this.table.find("input[type=range]")[0].value=t;break;case"radio":this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]").removeAttr("checked"),$(this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]")[t]).attr("checked",!0)}e&&this.choice(this.buttons[t])}function s(){if("slider"==this.scaleType){let t=this.table.find("input");"vertical"==this.orientation?(this.table.css({"table-layout":"fixed",height:t.outerWidth(),width:this.table.width()-t.width()+t.height()+10+"px"}),t.parent().css("width",t.height()),t.css("margin-left",-.5*(t.width()-t.height())+"px")):this.table.css("height",t.height())}else if("auto"==this.width){let t=0,e=0;this.table.find("td").each(function(){e++;let i=$(this).outerWidth();i>t&&(t=i)}),this.table.css({"table-layout":"fixed",width:e/this.table.find("tr").length*(t+1)})}}function n(){let t=this.defaultValue,e=this.orientation,i=this.scaleType;this.table.empty();let n=[];for(let e=0;e<this.buttons.length;e++){let s=$("<td>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-scaleButton"),h=$("<td>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-label"),o=this.buttons[e];switch(o?o._runPromises?o.print(h)._runPromises().then(()=>{o._element.jQueryContainer.css({display:"inline-block",width:"100%"})}):h.html(o):o=e,i){case"buttons":o._runPromises?o.print(s)._runPromises().then(()=>{o._element.jQueryContainer.css({display:"inline-block",width:"100%"})}):s.html(o),this.disabled||s.css("cursor","pointer"),s.click(()=>{this.disabled||(this.choice(this.buttons[e]),this.table.find("td").css("outline",""),s.css("outline","dotted 1px gray"))}),t!=o&&t!=e||s.css("outline","dotted 1px gray");break;case"slider":if(t==o||t==e)var l=e;break;case"radio":default:let n=$("<input>").attr({name:this.id,value:o,type:"radio"});t!=o&&t!=e||n.attr("checked",!0),this.disabled&&n.attr("disabled",!0),s.append(n),n.click(()=>this.choice(this.buttons[e]||o))}n.push([s,h])}if("slider"==i){var h=$("<input>").attr({type:"range",min:"0",max:String(this.buttons.length-1),value:String((this.buttons.length-1)/2),step:"1"});void 0!=l&&h.attr("value",l),this.disabled&&h.attr("disabled",!0),h[0].oninput=(()=>{this.firstClick||(this.firstClick=Date.now())}),h[0].onchange=(()=>this.choice(h[0].value))}if(e&&"horizontal"!=e)n.map((t,e)=>{let i=$("<tr>");i.append(t[0]),"top"==this.labels?i.prepend(t[1]):"bottom"==this.labels&&i.append(t[1]),this.table.append(i),h&&e>0&&i.css("display","none")}),h&&(n[0][0].after($("<td>").attr("rowspan",n.length).append(h.css({transform:"rotate(-90deg)"}))),n.map(t=>t[0].css("width",0)),this.jQueryElement.parent().length&&s.apply(this));else{let t=$("<tr>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-scale"),e=$("<tr>").addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-labels");n.map(i=>{t.append(i[0].css("text-align","center")),e.append(i[1].css("text-align","center")),"left"==this.labels?i[0].before(i[1]):"right"==this.labels&&i[0].after(i[1])}),this.table.append(t),"top"==this.labels?(this.table.prepend(e),this.jQueryElement.css("vertical-align","bottom")):"bottom"==this.labels&&(this.table.append(e),this.jQueryElement.css("vertical-align","top")),h&&t.after($("<tr>").append($("<td>").attr("colspan",n.length).append(h.css("width","100%")))).css("display","none")}this.width&&this.table.css({"table-layout":"fixed",width:this.width})}this.immediate=function(e,...i){i.length?"string"!=typeof i[0]&&Number(i[0])>0?this.initialButtons=new Array(Number(i[0])):this.initialButtons=i:console.error("Invalid parameters for scale "+e+" in PennController #"+t.controllers.underConstruction.id)},this.uponCreation=function(e){this.table=$("<table>"),this.jQueryElement=$("<div>").css("display","inline-block").append(this.table),this.choices=[],this.log=!1,this.labels=!1,this.disabled=!1,this.vertical=!1,this.scaleType="radio",this.defaultValue=null,this.orientation="horizontal",this.width=null,this.keys=[],this.buttons=this.initialButtons,this.choice=(t=>{if(this.disabled)return;t&&t._runPromises&&(t=t._element.id);let e=null;"slider"==this.scaleType&&this.firstClick&&(e=Date.now()-this.firstClick,this.firstClick=void 0),this.choices.push(["Choice",t,Date.now(),e])}),t.controllers.running.safeBind($(document),"keydown",t=>{if(!this.disabled)for(let e=0;e<this.keys.length;e++)if(String.fromCharCode(t.which)==this.keys[e])return i.apply(this,[e,!0])}),e()},this.end=function(){if(this.log&&this.log instanceof Array)if(this.choices.length)if(1==this.choices.length)t.controllers.running.save(this.type,this.id,...this.choices[0]);else if(this.log.indexOf("all")>-1)for(let e in this.choices)t.controllers.running.save(this.type,this.id,...this.choices[e]);else this.log.indexOf("first")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[0]),this.log.indexOf("last")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[this.choices.length-1]);else t.controllers.running.save(this.type,this.id,"Choice","NA","Never","No selection happened")},this.value=function(){return this.choices.length?this.choices[this.choices.length-1][1]:NaN},this.actions={print:function(e,i){n.apply(this);t.elements.standardCommands.actions.print.apply(this,[()=>{s.apply(this),e()},i])},select:function(e,s,n){for(var l=0;l<this.buttons.length;l++){let t=this.buttons[l];if(t&&t==s)break;if(t&&t._element&&t._element.id==s)break;if(l==s)break}if(l>=this.buttons.length)return e(console.warn("Option "+s+" not found for selection on scale "+this.id+" in PennController #"+t.controllers.underConstruction.id));i.apply(this,[l,n]),e()},wait:function(t,e){if("first"==e&&this.choices.length)t();else{let i=!1,s=this.choice;this.choice=(n=>{s.apply(this,[n]),i||(e instanceof Object&&e._runPromises&&e.success?e._runPromises().then(e=>{"success"==e&&(i=!0,t())}):(i=!0,t()))})}}},this.settings={button:function(t){this.scaleType="buttons",n.apply(this),t()},callback:function(t,...e){let i=this.choice;this.choice=async function(t){if(i.apply(this,[t]),!this.disabled)for(let t in e)await e[t]._runPromises()},t()},default:function(e,i){this.buttons.indexOf(i)>-1||Number(i)>=0&&Number(i)<this.buttons.length?(this.defaultValue=i,i._element&&(i=i._element.id),this.choices.push(["Default",i,Date.now(),this.scaleType])):console.warn("Invalid default value for scale "+this.id+" in controller #"+t.controllers.running.id,i),e()},disable:function(t){e.apply(this),t()},enable:function(t){(function(){this.jQueryElement.find("input").removeAttr("disabled"),this.jQueryElement.find("td.PennController-"+this.type+"-scaleButton").css("cursor","pointer"),this.disabled=!1}).apply(this),t()},horizontal:function(t){this.orientation="horizontal",this.jQueryElement.parent().length&&(n.apply(this),s.apply(this)),t()},keys:function(e,...i){if(i instanceof Array&&i.length==this.buttons.length){if(i.filter(t=>"string"==typeof t&&1==t.length).length!=i.length)return e(console.warn("Every key should be a string of length 1 in scale "+this.id+" in PennController #"+t.controllers.running.id,i));this.keys=i.map(t=>t.toUpperCase())}else this.buttons.filter(t=>"string"==typeof t&&1==t.length).length==this.buttons.length?this.keys=this.buttons.map(t=>t.toUpperCase()):this.keys=Array.from({length:this.buttons.length},(t,e)=>e+1);e()},label:function(t,e,i){if(isNaN(Number(e))||e<0||e>=this.buttons.length)return t();if(this.buttons[e]=i,this.jQueryElement.parent().length){let t=this.table.find("td.PennController-"+this.type+"-label");if(e<t.length){let s=$(t[e]);s.empty(),i._runPromises?i.print(s)._runPromises():s.html(i)}}t()},labels:function(t,e){this.labels=e,t()},labelsPosition:function(t,e){this.labels=e,t()},log:function(t,...e){e.length?this.log=e:this.log=["last"],t()},once:function(t){if(this.hasClicked)e.apply(this);else{let t=this.choice;this.choice=(i=>{t.apply(this,[i]),e.apply(this)})}t()},radio:function(t){this.scaleType="radio",n.apply(this),t()},size:function(e,i,s){this.width=i,t.elements.standardCommands.settings.size.apply(this,[e,i,s])},slider:function(t,e){this.scaleType="slider",n.apply(this),t()},vertical:function(t){this.orientation="vertical",this.jQueryElement.parent().length&&(n.apply(this),s.apply(this)),t()}},this.test={selected:function(t){return!!this.choices.length&&(void 0==t||t==this.choices[this.choices.length-1][1])}}})}});
=======
!function(t){var e={};function i(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:s})},i.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=66)}({66:function(t,e){window.PennController._AddElementType("Scale",function(t){function e(){this.table.find("input").attr("disabled",!0),this.table.find("td").css("cursor",""),this.disabled=!0}function i(t,e){switch(this.scaleType){case"buttons":this.table.find("td.PennController-"+this.type+"-scaleButton").css("border",""),$(this.table.find("td.PennController-"+this.type+"-scaleButton")[t]).css("border","dotted 1px gray");break;case"slider":this.table.find("input[type=range]")[0].value=t;break;case"radio":this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]").removeAttr("checked"),$(this.table.find(".PennController-"+this.type+"-scaleButton input[type=radio]")[t]).attr("checked",!0)}e&&this.choice(this.buttons[t])}function s(){if("slider"==this.scaleType&&"vertical"==this.orientation){let t=this.table.find("input");this.table.css({"table-layout":"fixed",height:t.width(),width:this.table.width()-t.width()+t.height()+10+"px"}),t.parent().css("width",t.height()),t.css("margin-left",-.5*(t.width()-t.height())+"px")}else if("auto"==this.width){let t=0,e=0;this.table.find("td").each(function(){e++;let i=$(this).outerWidth();i>t&&(t=i)}),this.table.css({"table-layout":"fixed",width:e/this.table.find("tr").length*(t+1)})}}function n(){let t=this.defaultValue,e=this.orientation,i=this.scaleType;this.table.empty();let n=[];for(let e=0;e<this.buttons.length;e++){let s=$("<td>").addClass("PennController-"+this.type+"-scaleButton"),o=$("<td>").addClass("PennController-"+this.type+"-label"),h=this.buttons[e];switch(h?h._runPromises?(h.print(o)._runPromises(),h=h._element.id):o.html(h):h=e,i){case"buttons":s.html(h),this.disabled||s.css("cursor","pointer"),s.click(()=>{this.disabled||(this.choice(this.buttons[e]),this.table.find("td").css("border",""),s.css("border","dotted 1px gray"))}),t!=h&&t!=e||(s.css("border","dotted 1px gray"),this.choices.push(["Default",t,Date.now(),"button"]));break;case"slider":if(t==h||t==e)var l=e;break;case"radio":default:let n=$("<input>").attr({name:this.id,value:h,type:"radio"});t!=h&&t!=e||(n.attr("checked",!0),this.choices.push(["Default",t,Date.now(),"radio"])),this.disabled&&n.attr("disabled",!0),s.append(n),n.click(()=>this.choice(this.buttons[e]||h))}n.push([s,o])}if("slider"==i){var o=$("<input>").attr({type:"range",min:"0",max:String(this.buttons.length-1),value:String((this.buttons.length-1)/2),step:"1"});void 0!=l&&(o.attr("value",l),this.choices.push(["Default",t,Date.now(),"slider"])),this.disabled&&o.attr("disabled",!0),o[0].oninput=(()=>{this.firstClick||(this.firstClick=Date.now())}),o[0].onchange=(()=>this.choice(o[0].value))}if(e&&"horizontal"!=e)n.map(t=>{let e=$("<tr>");e.append(t[0]),"top"==this.labels?e.prepend(t[1]):"bottom"==this.labels&&e.append(t[1]),this.table.append(e)}),o&&(n[0][0].after($("<td>").attr("rowspan",n.length).append(o.css({transform:"rotate(-90deg)"}))),n.map(t=>t[0].css("width",0)),this.jQueryElement.parent().length&&s.apply(this));else{let t=$("<tr>").addClass("PennController-"+this.type+"-scale"),e=$("<tr>").addClass("PennController-"+this.type+"-labels");n.map(i=>{t.append(i[0].css("text-align","center")),e.append(i[1].css("text-align","center")),"left"==this.labels?i[0].before(i[1]):"right"==this.labels&&i[0].after(i[1])}),this.table.append(t),"top"==this.labels?(this.table.prepend(e),this.jQueryElement.css("vertical-align","bottom")):"bottom"==this.labels&&(this.table.append(e),this.jQueryElement.css("vertical-align","top")),o&&t.after($("<tr>").append($("<td>").attr("colspan",n.length).append(o.css("width","100%"))))}this.width&&this.table.css({"table-layout":"fixed",width:this.width})}this.immediate=function(e,...i){i.length?"string"!=typeof i[0]&&Number(i[0])>0?this.initialButtons=new Array(Number(i[0])):this.initialButtons=i:console.error("Invalid parameters for scale "+e+" in PennController #"+t.controllers.underConstruction.id)},this.uponCreation=function(e){this.table=$("<table>"),this.jQueryElement=$("<div>").css("display","inline-block").append(this.table),this.choices=[],this.log=!1,this.labels=!1,this.disabled=!1,this.vertical=!1,this.scaleType="radio",this.defaultValue=null,this.orientation="horizontal",this.width=null,this.keys=[],this.buttons=this.initialButtons,this.choice=(t=>{if(this.disabled)return;t&&t._runPromises&&(t=t._element.id);let e=null;"slider"==this.scaleType&&this.firstClick&&(e=Date.now()-this.firstClick,this.firstClick=void 0),this.choices.push(["Choice",t,Date.now(),e])}),t.controllers.running.safeBind($(document),"keydown",t=>{if(!this.disabled)for(let e=0;e<this.keys.length;e++)if(String.fromCharCode(t.which)==this.keys[e])return i.apply(this,[e,!0])}),e()},this.end=function(){if(this.log&&this.log instanceof Array)if(this.choices.length)if(1==this.choices.length)t.controllers.running.save(this.type,this.id,...this.choices[0]);else if(this.log.indexOf("all")>-1)for(let e in this.choices)t.controllers.running.save(this.type,this.id,...this.choices[e]);else this.log.indexOf("first")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[0]),this.log.indexOf("last")>-1&&t.controllers.running.save(this.type,this.id,...this.choices[this.choices.length-1]);else t.controllers.running.save(this.type,this.id,"Choice","NA","Never","No selection happened")},this.value=function(){return this.choices.length?this.choices[this.choices.length-1][1]:NaN},this.actions={print:function(e,i){n.apply(this);t.elements.standardCommands.actions.print.apply(this,[()=>{s.apply(this),e()},i])},select:function(e,s,n){for(var l=0;l<this.buttons.length;l++){let t=this.buttons[l];if(t&&t==s)break;if(t&&t._element&&t._element.id==s)break;if(l==s)break}if(l>=this.buttons.length)return e(console.warn("Option "+s+" not found for selection on scale "+this.id+" in PennController #"+t.controllers.underConstruction.id));i.apply(this,[l,n]),e()},wait:function(t,e){if("first"==e&&this.choices.length)t();else{let i=!1,s=this.choice;this.choice=(n=>{s.apply(this,[n]),i||(e instanceof Object&&e._runPromises&&e.success?e._runPromises().then(e=>{"success"==e&&(i=!0,t())}):(i=!0,t()))})}}},this.settings={button:function(t){this.scaleType="buttons",n.apply(this),t()},callback:function(t,...e){let i=this.choice;this.choice=async function(t){if(i.apply(this,[t]),!this.disabled)for(let t in e)await e[t]._runPromises()},t()},default:function(e,i){this.buttons.indexOf(i)>-1||Number(i)>=0&&Number(i)<this.buttons.length?this.defaultValue=i:console.warn("Invalid default value for scale "+this.id+" in controller #"+t.controllers.running.id,i),e()},disable:function(t){e.apply(this),t()},enable:function(t){(function(){this.jQueryElement.find("input").removeAttr("disabled"),this.jQueryElement.find("td.PennController-"+this.type+"-scaleButton").css("cursor","pointer"),this.disabled=!1}).apply(this),t()},horizontal:function(t){this.orientation="horizontal",t()},keys:function(e,...i){if(i instanceof Array&&i.length==this.buttons.length){if(i.filter(t=>"string"==typeof t&&1==t.length).length!=i.length)return e(console.warn("Every key should be a string of length 1 in scale "+this.id+" in PennController #"+t.controllers.running.id,i));this.keys=i.map(t=>t.toUpperCase())}else this.buttons.filter(t=>"string"==typeof t&&1==t.length).length==this.buttons.length?this.keys=this.buttons.map(t=>t.toUpperCase()):this.keys=Array.from({length:this.buttons.length},(t,e)=>e+1);e()},label:function(t,e,i){if(isNaN(Number(e))||e<0||e>=this.buttons.length)return t();if(this.buttons[e]=i,this.jQueryElement.parent().length){let t=this.table.find("td.PennController-"+this.type+"-label");if(e<t.length){let s=$(t[e]);s.empty(),i._runPromises?i.print(s)._runPromises():s.html(i)}}t()},labels:function(t,e){this.labels=e,t()},labelsPosition:function(t,e){this.labels=e,t()},log:function(t,...e){e.length?this.log=e:this.log=["last"],t()},once:function(t){if(this.hasClicked)e.apply(this);else{let t=this.choice;this.choice=(i=>{t.apply(this,[i]),e.apply(this)})}t()},radio:function(t){this.scaleType="radio",n.apply(this),t()},size:function(e,i,s){this.width=i,t.elements.standardCommands.settings.size.apply(this,[e,i,s])},slider:function(t,e){this.scaleType="slider",n.apply(this),t()},vertical:function(t){this.orientation="vertical",t()}},this.test={selected:function(t){return!!this.choices.length&&(void 0==t||t==this.choices[this.choices.length-1][1])}}})}});
>>>>>>> origin/master
