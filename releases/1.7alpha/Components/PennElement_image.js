/*! $AC$ PennController.newImage(name,file) Creates a new Image element $AC$$AC$ PennController.getImage(name) Retrieves an existing Image element $AC$ */!function(e){var t={};function n(r){if(t[r])return t[r].exports;var i=t[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(r,i,function(t){return e[t]}.bind(null,i));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=125)}({125:function(e,t){window.PennController._AddElementType("Image",function(e){this.immediate=function(t,n){"string"==typeof t&&void 0===n&&(n=t),this.id=t;let r=!n.match(/^http/i);this.resource=e.resources.fetch(n,function(e){this.object=new Image,this.object.onload=e,this.object.src=this.value},r)},this.uponCreation=function(e){this.image=this.resource.object,this.image.style=null,this.jQueryElement=$(this.image),e()},this.end=function(){this.log&&(this.printTime?e.controllers.running.save(this.type,this.id,"Print","NA",this.printTime,"NULL"):e.controllers.running.save(this.type,this.id,"Print","NA","Never","NULL"))},this.value=function(){return this.jQueryElement.parent().length}})}});