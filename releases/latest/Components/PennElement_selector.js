/*! $AC$ PennController.newSelector(name) Creates a new Selector element $AC$$AC$ PennController.getSelector(name) Retrieves an existing Selector element $AC$$AC$ Selector PElement.select(element) Selects the specified element $AC$$AC$ Selector PElement.shuffle() Shuffles the positions on the page of the selector's elements $AC$$AC$ Selector PElement.unselect() Unselects the element that is currently selected $AC$$AC$ Selector PElement.wait() Waits until a selection happens before proceeding $AC$$AC$ Selector PElement.settings.add(elements) Adds one or more elements to the selector $AC$$AC$ Selector PElement.settings.callback(commands) Will execute the specified command(s) whenever selection happens $AC$$AC$ Selector PElement.settings.disableClicks() Disables selection by click $AC$$AC$ Selector PElement.settings.enableClicks() Enables selection by click (again) $AC$$AC$ Selector PElement.settings.frame(css) Attributes the CSS style to the selection frame $AC$$AC$ Selector PElement.settings.keys(keys) Associates the elements in the selector (in the order they were added) with the specified keys $AC$$AC$ Selector PElement.settings.log() Will log any selection to the results file $AC$$AC$ Selector PElement.settings.once() Will disable the selector after the first selection $AC$$AC$ Selector PElement.test.selected(element) Checks that the specified element, or any element if non specified, is selected $AC$$AC$ Selector PElement.test.index(element,index) Checks that the specified element is at the specified index position in the selector $AC$$AC$ all PElements.settings.selector(selector) Adds the element to the specified selector $AC$ */!function(e){var t={};function s(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,s),i.l=!0,i.exports}s.m=e,s.c=t,s.d=function(e,t,n){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(s.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)s.d(n,i,function(t){return e[t]}.bind(null,i));return n},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=127)}({127:function(e,t){window.PennController._AddElementType("Selector",function(e){function t(t,...s){let n=[];if(s.length)for(let t in s){if(!(s[t]._element&&s[t]._element.jQueryElement instanceof jQuery)){e.debug.error("Invalid element #"+t+" in shuffling selector "+this.id);continue}let i=this.elements.map(e=>e[0]).indexOf(s[t]._element);i<0?e.debug.error("Cannot shuffle element "+s[t]._element.id+" for it has not been added to selector "+this.id):n.push(this.elements[i])}else n=[].concat(this.elements);let i=[].concat(n);fisherYates(i);let l=i.map((e,t)=>Object({old:{element:n[t],index:this.elements.indexOf(n[t])},new:{element:e,index:this.elements.indexOf(e)}})),r=[];l.map((e,t)=>{this.elements[e.old.index]=e.new.element;let s=$("<shuffle>").attr("i",t);e.old.element[0].jQueryElement.before(s),s.css({position:e.old.element[0].jQueryElement.css("position"),left:e.old.element[0].jQueryElement.css("left"),top:e.old.element[0].jQueryElement.css("top")}),r.push(s)}),r.map(e=>{let t=e.attr("i"),s=l[t].new.element[0].jQueryElement;e.after(s),s.css({position:e.css("position"),left:e.css("left"),top:e.css("top")}),this.selections.length&&this.selections[this.selections.length-1][1]==l[t].new.element[0].id&&s.before(this.frame),e.remove()}),t()}this.immediate=function(e){},this.uponCreation=function(t){this.elements=[],this.selections=[],this.disabled=!1,this.frame=$("<div>").css({position:"absolute",display:"inline-block",margin:"auto",outline:"dotted 1px grey","z-index":100}).addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-selectionFrame"),this.noClick=!1,this.select=(t=>{if(!this.disabled){if(this.elements.map(e=>e[0]).indexOf(t)<0)return e.debug.error("Tried to select an element not part of Selector "+this.id);this.selections.push(["Selection",t.id,Date.now(),"NULL"]),this.frame.css({width:t.jQueryElement.outerWidth(),height:t.jQueryElement.outerHeight(),"pointer-events":"none"}),"absolute"==t.jQueryElement.css("position")&&this.frame.css({left:t.jQueryElement.css("left"),top:t.jQueryElement.css("top")}),t.jQueryElement.before(this.frame),this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-selected")),t.jQueryElement.addClass("PennController-"+this.type.replace(/[\s_]/g,"")+"-selected")}}),e.events.keypress(e=>{if(!this.disabled)for(let t in this.elements){let s="";if(this.elements[t].length>1&&(s=this.elements[t][1]),s&&"string"==typeof s&&s.toUpperCase().indexOf(String.fromCharCode(e.which).toUpperCase())>-1)return this.select(this.elements[t][0])}}),t()},this.end=function(){if(this.select=(()=>void 0),this.elements=[],this.frame&&this.frame instanceof jQuery&&this.frame.remove(),this.log&&this.log instanceof Array)if(this.selections.length)if(1==this.selections.length)e.controllers.running.save(this.type,this.id,...this.selections[0]);else if(this.log.indexOf("all")>-1)for(let t in this.selections)e.controllers.running.save(this.type,this.id,...this.selections[t]);else this.log.indexOf("first")>-1&&e.controllers.running.save(this.type,this.id,...this.selections[0]),this.log.indexOf("last")>-1&&e.controllers.running.save(this.type,this.id,...this.selections[this.selections.length-1]);else e.controllers.running.save(this.type,this.id,"Selection","NA","Never","No selection happened")},this.value=function(){if(this.selections.length){let e=this.selections[this.selections.length-1][1],t=this.elements.filter(t=>t[0].id==e)[0][0];return window.PennController.Elements["get"+t.type](t.id)}return null},this.actions={select:function(t,s){if(!isNaN(Number(s))&&Number(s)>=0&&Number(s)<this.elements.length&&(s={_element:this.elements[Number(s)][0]}),s._element&&s._element.jQueryElement instanceof jQuery){let e=this.disabled;this.disabled=!1,this.select(s._element),this.disabled=e}else e.debug.error("Invalid element passed to select command for selector "+this.id);t()},shuffle:function(e,...s){t.apply(this,[e].concat(s))},unselect:function(e){this.selections.push(["Unselect","Unselect",Date.now(),"From script"]),this.frame.detach(),this.elements.map(e=>e[0].jQueryElement.removeClass("PennController-"+this.type+"-selected")),e()},wait:function(e,t){if("first"==t&&this.selections.length)e();else{let s=!1,n=this.select;this.select=(i=>{let l=n.apply(this,[i]);if(!(s||this.disabled&&!l))if(t instanceof Object&&t._runPromises&&t.success){let n=this.disabled;this.disabled="tmp",t._runPromises().then(t=>{"success"==t&&(s=!0,e()),"tmp"==this.disabled&&(this.disabled=n)})}else s=!0,e()})}}},this.settings={add:function(t,...s){for(w in s){let t=s[w]._element;if(null==t||null==t.id)e.debug.error("Invalid element added to selector "+this.id);else if(this.elements.map(e=>e[0]).indexOf(t)>-1)e.debug.error("Element "+t.id+" already part of selector "+this.id);else if(null!=t.jQueryElement&&t.jQueryElement instanceof jQuery){this.elements.push([t]);let e=()=>{this.noClick||t.jQueryElement.css("cursor","pointer");let e=t.jQueryElement[0].onclick;t.jQueryElement[0].onclick=((...s)=>{e instanceof Function&&e.apply(t.jQueryElement[0],s),this.noClick||this.select(t)})};t.jQueryElement.parent().length?e():t._printCallback.push(e)}else e.debug.error("Element "+t.id+" has no visble element to be chosen in selector "+this.id)}t()},callback:function(e,...t){let s=this.select;this.select=async function(e){let n=this.disabled;if(s.apply(this,[e]),!n)for(let e in t)await t[e]._runPromises()},e()},disable:function(e){this.disabled=!0,this.elements.map(e=>e[0].jQueryElement.css("cursor","")),this.jQueryContainer.addClass("PennController-disabled"),this.jQueryElement.addClass("PennController-disabled"),e()},disableClicks:function(e){this.noClick=!0,this.elements.map(e=>e[0].jQueryElement.css("cursor","")),e()},enable:function(e){this.disabled=!1,this.noClick||this.elements.map(e=>e[0].jQueryElement.css("cursor","pointer")),this.jQueryContainer.removeClass("PennController-disabled"),this.jQueryElement.removeClass("PennController-disabled"),e()},enableClicks:function(e){this.noClick=!1,this.elements.map(e=>e[0].jQueryElement.css("cursor","pointer")),e()},frame:function(e,t){this.frame.css.apply(this.frame,["outline",t]),e()},keys:function(e,...t){for(let e in t){if(e>=this.elements.length)break;let s=t[e];"string"!=typeof s&&Number(s)>0&&(s=String.fromCharCode(s)),this.elements[e]=[this.elements[e][0],s]}e()},log:function(e,...t){t.length?this.log=t:this.log=["last"],e()},once:function(e){if(this.selections.length)this.disabled=!0,this.elements.map(e=>e[0].jQueryElement.css("cursor",""));else{let e=this.select;this.select=(t=>{if(e.apply(this,[t]),!this.disabled)return this.disabled=!0,this.elements.map(e=>e[0].jQueryElement.css("cursor","")),"once"})}e()},shuffle:function(e,...s){t.apply(this,[e].concat(s))}},this.test={selected:function(t){return null==t?this.selections.length:t._element?this.selections[this.selections.length-1][1]==t._element.id:(e.debug.error("Invalid element tested for Selector "+this.id,t._element.id),!1)},index:function(t,s){return null==t||null==t._element?e.debug.error("Invalid element tested for selector "+this.id,t._element.id):Number(s)>=0?this.elements.map(e=>e[0]).indexOf(t._element)==Number(s):this.elements.map(e=>e[0]).indexOf(t._element)>=0}}}),window.PennController._AddStandardCommands(function(e){this.settings={selector:async function(t,s){var n;if("string"==typeof s){let t=e.controllers.running.options.elements;if(!t.hasOwnProperty("Selector")||!t.Selector.hasOwnProperty(s))return e.debug.error("No selector found named "+s);n=t.Selector[s]}else s._element&&s._runPromises&&("Selector"==s._element.type?(await s._runPromises(),n=s._element):e.debug.error("Tried to add "+this.name+" to an invalid Selector"));if(n.elements.map(e=>e[0]).indexOf(this)>-1)e.debug.error("Element "+this.id+" already part of Selector "+n.id);else if(null!=this.jQueryElement&&this.jQueryElement instanceof jQuery){n.elements.push([this]),this.noClick||this.jQueryElement.css("cursor","pointer");let e=this.jQueryElement[0].onclick;this.jQueryElement[0].onclick=((...t)=>{e instanceof Function&&e.apply(this.jQueryElement[0],t),n.noClick||n.select(this)})}else e.debug.error("Element "+this.id+" has no visble element to be chosen in Selector "+n.id);t()}}})}});