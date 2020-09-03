/*! $AC$ PennController.newHtml(name,file) Creates a new Html element $AC$$AC$ PennController.getHtml(name) Retrieves an existing Html element $AC$$AC$ Html PElement.warn() Displays warning messages if some obligatory fields were not filled $AC$$AC$ Html PElement.checkboxWarning(message) Defines the warning message displayed when an obligatory checkbox group is not checked $AC$$AC$ Html PElement.inputWarning(message) Defines the warning message displayed when an obligatory input is not filled $AC$$AC$ Html PElement.log() Logs the values of the fields from the Html in the results file $AC$$AC$ Html PElement.radioWarning(message) Defines the warning message displayed when an radio button group input is not selected $AC$$AC$ Html PElement.test.complete() Checks that all the obligatory fields have been filled $AC$ */!function(t){var e={};function n(r){if(e[r])return e[r].exports;var a=e[r]={i:r,l:!1,exports:{}};return t[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)n.d(r,a,function(e){return t[e]}.bind(null,a));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=126)}({126:function(t,e){window.PennController._AddElementType("Html",function(t){function e(t,e){var n=$("label.error[for=__ALL_FIELDS__]");if(n.length>0)n.addClass("Form-error-text").text(e);else{var r=$("label.error[for="+escape(t)+"]");r.length>0?r.addClass("Form-error-text").text(e):alert(e)}}function n(){for(var t=this.jQueryElement[0],e=$(t).find("input[type=text]"),n=$(t).find("textarea"),r=0;r<n.length;++r)e.push(n[r]);for(r=0;r<e.length;++r){var a=$(e[r]);if(a.hasClass("obligatory")&&(!a.attr("value")||a.attr("value").match(/^\s*$/)))return!1}var i=$(t).find("input[type=checkbox]");for(r=0;r<i.length;++r){var o=$(i[r]);if(!o.attr("checked")&&o.hasClass("obligatory"))return!1}var s=$(t).find("input[type=radio]"),l={};for(r=0;r<s.length;++r){var u=$(s[r]);u.attr("name")&&(l[u.attr("name")]||(l[u.attr("name")]=[]),l[u.attr("name")].push(u))}for(var h in l){var c=!1,f=!1;for(r=0;r<l[h].length;++r)l[h][r].hasClass("obligatory")&&(c=!0),l[h][r].attr("checked")&&(f=!0);if(c&&!f)return!1}return!0}this.immediate=function(t,e){void 0===e&&(e=t,void 0!==t&&"string"==typeof t&&0!=t.length||(t="Html"),this.id=t),this.html=e},this.uponCreation=function(t){CHUNKS_DICT.hasOwnProperty(this.html)?this.jQueryElement=$("<div>").html(htmlCodeToDOM({include:this.html})):this.jQueryElement=$("<div>").append(this.html),this.log=!1,this.checkboxWarningMessage="You must check the %name% checkbox to continue.",this.inputWarningMessage="The ‘%name%’ field is obligatory.",this.radioWarningMessage="You must select an option for ‘%name%’.",t()},this.end=function(){if(this.log){for(var e=this.jQueryElement[0],n=$(e).find("input[type=text]"),r=$(e).find("textarea"),a=0;a<r.length;++a)n.push(r[a]);for(a=0;a<n.length;++a){var i=$(n[a]);t.controllers.running.save(this.type,this.id,csv_url_encode(i.attr("name")),csv_url_encode(i.attr("value")),Date.now(),"text input")}var o=$(e).find("input[type=checkbox]");for(a=0;a<o.length;++a){var s=$(o[a]);t.controllers.running.save(this.type,this.id,s.attr("name"),s.attr("checked")?"checked":"unchecked",Date.now(),"checkbox")}var l=$(e).find("input[type=radio]"),u={};for(a=0;a<l.length;++a){var h=$(l[a]);h.attr("name")&&(u[h.attr("name")]||(u[h.attr("name")]=[]),u[h.attr("name")].push(h))}for(var c in u){var f,d=!1;for(a=0;a<u[c].length;++a)u[c][a].attr("checked")&&(d=!0,f=a);d&&t.controllers.running.save(this.type,this.id,u[c][0].attr("name"),u[c][f].attr("value"),Date.now(),"radio button")}}},this.value=function(){return n.apply(this)},this.actions={warn:function(t){for(var n=this.jQueryElement[0],r=$(n).find("input[type=text]"),a=$(n).find("textarea"),i=0;i<a.length;++i)r.push(a[i]);for(i=0;i<r.length;++i){var o=$(r[i]);!o.hasClass("obligatory")||o.attr("value")&&!o.attr("value").match(/^\s*$/)||e(o.attr("name"),this.inputWarningMessage.replace(/%name%/gi,o.attr("name")))}var s=$(n).find("input[type=checkbox]");for(i=0;i<s.length;++i){var l=$(s[i]);!l.attr("checked")&&l.hasClass("obligatory")&&e(l.attr("name"),this.checkboxWarningMessage.replace(/%name%/gi,l.attr("name")))}var u=$(n).find("input[type=radio]"),h={};for(i=0;i<u.length;++i){var c=$(u[i]);c.attr("name")&&(h[c.attr("name")]||(h[c.attr("name")]=[]),h[c.attr("name")].push(c))}for(var f in h){var d=!1,g=!1;for(i=0;i<h[f].length;++i)h[f][i].hasClass("obligatory")&&(d=!0),h[f][i].attr("checked")&&(g=!0);d&&!g&&e(h[f][0].attr("name"),this.radioWarningMessage.replace(/%name%/gi,h[f][0].attr("name")))}t()}},this.settings={checkboxWarning:function(t,e){this.checkboxWarningMessage=e,t()},inputWarning:function(t,e){this.inputWarningMessage=e,t()},log:function(t){this.log=!0,t()},radioWarning:function(t,e){this.radioWarningMessage=e,t()}},this.test={complete:function(){return n.apply(this)}}})}});