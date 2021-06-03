// DRAGDROP element
/* $AC$ PennController.newDragDrop(name,bungee,swap,single) Creates a new DragDrop element $AC$ */
/* $AC$ PennController.getDragDrop(name) Retrieves an existing DragDrop element $AC$ */
(()=>{

let dragging;
let start;

PennController._AddElementType( "DragDrop" , function(PennEngine) {
  this.immediate = function(id, ...parameters){
    this._initParameters = parameters;
    this.drop = (dragIndex,dropIndex,shouldLog=true)=>{
      if (this.disabled) return;
      const element = this._drops[dropIndex].pointer._element.jQueryElement;
      const draggedElement = this._drags[dragIndex].pointer._element.jQueryElement;
      const indicesDrag = this._drops[dropIndex].indicesDrag;
      let fromDrop = null;
      if (this._drags[dragIndex].indexDrop>=0) fromDrop = this._drops[this._drags[dragIndex].indexDrop];
      let shouldSwap = this._drops[dropIndex].swap;
      if (shouldSwap===undefined) shouldSwap = this._swap;
      if (shouldSwap && indicesDrag.length>=0){
        indicesDrag.forEach(id=>{
          const chairingDrag = this._drags[id].pointer._element.jQueryElement;
          chairingDrag.appendTo(draggedElement.parent());
          if (dragging<0)
            chairingDrag.css({
              position: draggedElement.css("position"), 
              top: draggedElement.css("top"),
              left: draggedElement.css("left")
            });
          else
            chairingDrag.css({position: start.old_position, top: start.old_top, left: start.old_left});
          if (fromDrop) {
            fromDrop.indicesDrag = fromDrop.indicesDrag.filter(id2=>id2!=dragIndex);
            fromDrop.indicesDrag.push(id);
          }
          else
            chairingDrag.css({top: 0, left: 0});
          this._drags[id].indexDrop = this._drags[dragIndex].indexDrop;
        });
        this._drops[dropIndex].indicesDrag = [];
      }
      const offset = this._drops[dropIndex].offset;
      if (offset.length>1 && (offset[0]!="unset"||offset[1]!="unset"))
        draggedElement.css({position: 'absolute', top: offset[1], left: offset[0]});
      else{
        const rect_drag = draggedElement[0].getBoundingClientRect();
        const rect_drop = this._drops[dropIndex].pointer._element.jQueryElement[0].getBoundingClientRect();
        draggedElement.css({position: 'absolute', top: rect_drag.top-rect_drop.top, left: rect_drag.left-rect_drop.left});
      }
      draggedElement.appendTo(element);
      if (shouldLog){
        this._events[this._events.length-1][2] = Date.now();
        this._events[this._events.length-1][3] = this._drops[dropIndex].pointer._element.id;
      }
      if (this._drags[dragIndex].indexDrop>=0){
        const drop = this._drops[this._drags[dragIndex].indexDrop];
        drop.indicesDrag = drop.indicesDrag.filter(id=>id!=dragIndex);
      }
      this._drags[dragIndex].indexDrop = dropIndex;
      this._drops[dropIndex].indicesDrag.push(dragIndex);
      if (shouldLog){
        this._callbacks.forEach(async c=>{
          for (let i = 0; i < c.length; i++){
            if (c[i] instanceof Function) await c.call(this);
            else if (c[i]._runPromises instanceof Function) await c[i]._runPromises();
          }
        });
        this._waits = this._waits.filter( w=> w.call() );
      }
    };
    this._mousedown = ev=>{
      if (this.disabled) return;
      for (let i = 0; i < this._drags.length; i++) {
        const d = this._drags[i].pointer;
        if (d._runPromises===undefined || d._element===undefined) return;
        const e = d._element;
        if (!(e.jQueryElement instanceof jQuery)) return;
        const element = e.jQueryElement;
        if (element[0] === ev.target){
          dragging = i;
          const rect = ev.target.getBoundingClientRect();
          start = {x: ev.clientX, y: ev.clientY, top: rect.top, left: rect.left, 
                  old_top: ev.target.style.top, old_left: ev.target.style.left, old_position: ev.target.style.position};
          $(ev.target).css({position: 'fixed', top: rect.top, left: rect.left});
          this._events.push([e.id,Date.now()]);
          break;
        }
      }
    };
    this._mousemove = ev=>{
      if (this.disabled) return;
      if (dragging<0) return;
      const draggedElement = this._drags[dragging].pointer._element.jQueryElement;
      draggedElement.css({top: start.top + (ev.clientY - start.y), left: start.left + (ev.clientX - start.x), 'z-index': 999999});
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    };
    this._mouseup = ev=>{
      if (this.disabled) return dragging=-1;
      if (dragging<0) return dragging=-1;
      const draggedElement = this._drags[dragging].pointer._element.jQueryElement;
      let foundDrop = false;
      for (let i = 0; i < this._drops.length; i++){
        const d = this._drops[i].pointer;
        if (d._runPromises===undefined || d._element===undefined) return dragging=-1;
        const e = d._element;
        if (!(e.jQueryElement instanceof jQuery)) return dragging=-1;
        const element = e.jQueryElement;
        const indicesDrag = this._drops[i].indicesDrag;
        const rect = element[0].getBoundingClientRect();
        if (ev.clientX > rect.left && ev.clientX < rect.left+rect.width && 
            ev.clientY > rect.top && ev.clientY < rect.top+rect.height &&
            (!this._single || indicesDrag.length===0)){
          this.drop(dragging,i,/*shouldLog=*/true);
          foundDrop = true;
          break;
        }
      }
      if (!foundDrop){
        if (this._bungee)
          draggedElement.css({position: start.old_position, left: start.old_left, top: start.old_top});
        else{
          const rect = draggedElement[0].getBoundingClientRect();
          draggedElement.appendTo($("body")).css({
            position: 'absolute',
            top: rect.top+window.scrollY,
            left: rect.left+window.scrollX
          });
        }
      }
      dragging = -1;
    };
    this._touch = e=>{
        ev = e.originalEvent;
        const sim_ev = {clientX: 0, clientY: 0, preventDefault: ()=>ev.preventDefault(), stopPropagation: ()=>ev.stopPropagation()};
        let touches = ev.changedTouches;
        if (touches===undefined || touches.length<1) touches = ev.targetTouches;
        if (touches===undefined || touches.length<1) touches = ev.touches;
        for (let i = 0; i < touches.length; i++){
            const touch = touches[i];
            sim_ev.clientX += touch.clientX;
            sim_ev.clientY += touch.clientY;
            sim_ev.target = touch.target;
        }
        sim_ev.clientX = sim_ev.clientX / touches.length;
        sim_ev.clientY = sim_ev.clientY / touches.length;
        switch (ev.type) {
            case "touchstart":
                this._mousedown(sim_ev);
                break;
            case "touchmove":
                if (dragging>=0) ev.preventDefault();
                this._mousemove(sim_ev);
                break;
            case "touchend": //
                if (dragging>=0) ev.preventDefault();
                this._mouseup(sim_ev);
                break;
        }
    };
    Object.defineProperty(this, "dragElements", {get: ()=>this._drags.map(d=>d.pointer._element)});
    Object.defineProperty(this, "dropElements", {get: ()=>this._drops.map(d=>d.pointer._element)});
  };

  this.uponCreation = function(resolve){
    this._log = false;
    this._drags = [];
    this._drops = [];
    this._offset = [];
    this._waits = [];
    this._events = [];
    this._callbacks = [];
    this._bungee = false;
    this._swap = false;
    this._single = false;
    this._initParameters.forEach(p=>{
      if (p.match(/bungee/i)) this._bungee = true;
      else if (p.match(/swap/i)) this._swap = true;
      else if (p.match(/single/i)) this._single = true;
    });
    dragging = -1;
    start = {x: 0, y: 0, top: 0, left: 0, old_top: 0, old_left: 0, old_position: 'unset'};
    $(document).bind("mousedown", ".PennController-elementContainer > *", this._mousedown);
    $(document).bind("mousemove", this._mousemove);
    $(document).bind("mouseup", this._mouseup);
    $(document).bind("touchstart", ".PennController-elementContainer > *", this._touch);
    $(document).bind("touchmove", this._touch);
    $(document).bind("touchend", this._touch);
    resolve();
  }
  
  this.end = function(){
    $(document).unbind("mousedown", ".PennController-elementContainer > *", this._mousedown);
    $(document).unbind("mousemove", this._mousemove);
    $(document).unbind("mouseup", this._mouseup);
    $(document).unbind("touchstart", ".PennController-elementContainer > *", this._touch);
    $(document).unbind("touchmove", this._touch);
    $(document).unbind("touchend", this._touch);
    dragging = -1;
    if (this._log=="all")
      this._events.forEach(e=>{
        if (e.length<3)
          PennEngine.controllers.running.save(this.type, this.id, "Drag", e[0], e[1], "Not dropped");
        else{
          PennEngine.controllers.running.save(this.type, this.id, "Drag", e[0], e[1], "Dropped on "+e[3]);
          PennEngine.controllers.running.save(this.type, this.id, "Drop", e[3], e[2], "Dopped "+e[0]);
        }
      });
    if (this._log){
      let final_string = [];
      this._drags.forEach(d=>{
        if (d.pointer===undefined || d.pointer._element===undefined || d.pointer._runPromises===undefined) return;
        const id = d.pointer._element.id.replace(/:;/g,'_');
        if (d.indexDrop>=0) final_string.push(id+':'+this._drops[d.indexDrop].pointer._element.id.replace(/:;/g,'_') );
        else final_string.push(id+':');
      });
      PennEngine.controllers.running.save(this.type, this.id, "Final", final_string.join(";"), Date.now(), "NULL");
    }
  };

  this.value = function(){
    // nothing
  };

  this.actions = {
    addDrag: function(resolve, ...elements) {  /* $AC$ DragDrop PElement.addDrag(element1,element2,...) Makes the passed PennController elements draggable $AC$ */
      elements.forEach( e=>this._drags.push({pointer: e, indexDrop: -1}) );
      resolve();
    },
    addDrop: function(resolve, ...elements){  /* $AC$ DragDrop PElement.addDrop(element1,element2,...) Marks the passed PennController elements as dropzones $AC$ */
      if (this._offset.length>1)
        elements.forEach( e=>this._drops.push({pointer: e, indicesDrag: [], offset: [this._offset[0], this._offset[1]]}) );
      else
        elements.forEach( e=>this._drops.push({pointer: e, indicesDrag: [], offset: [], swap: undefined}) );
      resolve();
    },
    bungee: function(resolve, ...dropzones){  /* $AC$ DragDrop PElement.bungee() Elements will go back to their origin if dropped outside dropzones $AC$ */
      this._bungee = true;
      resolve();
    },
    callback: function(resolve, ...commands){  /* $AC$ DragDrop PElement.callback(commands) Will execute the commands whenever an element is dropped $AC$ */
      this._callbacks.push(commands);
      resolve();
    },
    drop: function(resolve,ref1,ref2,shouldLog=false){  /* $AC$ DragDrop PElement.drop(element1,element2,shouldLog) Simulates a drop of element1 onto element2 $AC$ */
      if (ref1._element===undefined || ref2._element===undefined) return;
      const dragElements = this.dragElements;
      const dropElements = this.dropElements;
      let dragged, dropzone;
      dragged = dragElements.indexOf(ref1._element);
      if (dragged<0){
        dragged = dragElements.indexOf(ref2._element);
        if (dragged<0) return resolve();
        dropzone = dropElements.indexOf(ref1);
        if (dropzone<0) return resolve();
      }
      else{
        dropzone = dropElements.indexOf(ref2._element);
        if (dropzone<0) return resolve();
      }
      this.drop(dragged,dropzone,shouldLog);
      resolve();
    },
    log: function(resolve,what=true){  /* $AC$ DragDrop PElement.log() Will log all drag and drop events $AC$ */
      this._log = what;
      resolve();
    },
    offset: function(resolve, x, y, ...dropzones){  /* $AC$ DragDrop PElement.offset(x,y[,elements]) Adds a (x,y) offset to all or only the specified dropzones $AC$ */
      if (y===undefined) y = x;
      else if (y._runPromises) {
        dropzones = [y, ...dropzones];
        y = x;
      }
      if (dropzones.length>0){
        const dropElements = this._drops.map(d=>d.pointer._element);
        dropzones.forEach(d=>{
          const index = dropElements.indexOf(d._element);
          if (index<0) return;
          this._drops[index].offset = [x,y];
        });
      }
      else{
        this._drops.forEach(d=>d.offset = [x,y]);
        this._offset = [x,y];
      }
      resolve();
    },
    removeDrag: function(resolve, ...elements) {  /* $AC$ DragDrop PElement.removeDrag(element1,element2,...) Makes the specified elements no longer draggable $AC$ */
      const elementReferents = elements.map(e=>e._element);
      this._drags = this._drags.filter(d=>
        d.pointer._element===undefined || elementReferents.indexOf(d.pointer._element)<0
      );
      resolve();
    },
    removeDrop: function(resolve, ...elements){  /* $AC$ DragDrop PElement.removeDrop(element1,element2,...) No longer marks the specified elements as dropzones $AC$ */
      const elementReferents = elements.map(e=>e._element);
      this._drops = this._drops.filter(d=>
        d.pointer._element===undefined || elementReferents.indexOf(d.pointer._element)<0
      );
      resolve();
    },
    single: function(resolve, ...dropzones){  /* $AC$ DragDrop PElement.single() Allows only one element per dropzone at a time $AC$ */
      this._single = true;
      resolve();
    },
    swap: function(resolve, ...dropzones){  /* $AC$ DragDrop PElement.swap([element1,element2,...]) Will swap elements if dropping one onto an occupied dropzone $AC$ */
      if (dropzones.length>0){
        const dropElements = this._drops.map(d=>d.pointer._element);
        dropzones.forEach(d=>{
          const index = dropElements.indexOf(d._element);
          if (index<0) return;
          this._drops[index].swap = true;
        });
      }
      else{
        this._drops.forEach(d=>d.swap = true);
        this._swap = true;
      }
      resolve();
    },
    wait: function(resolve, test){  /* $AC$ DragDrop PElement.wait([test]) Pauses the script's execution until one element is dragged and dropped onto a dropzone $AC$ */
      let fnText = resolve;
      if (test && test._runPromises instanceof Function && test.success)
        fnText = ()=>test._runPromises().then(v=>v=="success"&&resolve());
      this._waits.push(fnText);
    }
  };

  this.test = {
    dropped: function(...elements){  /* $AC$ DragDrop PElement.test.dropped([element1,element2]) Succeeds if any element, or the specified ones, have been dragged and/or dropped $AC$ */
      if (elements.length==0)
        return this._drags.filter(d=>d.indexDrop>=0).length>0;
      const dragElements = this.dragElements;
      const dropElements = this.dropElements;
      if (elements.length>1){
        let dragged = elements[0], dropzone = elements[1];
        if (dragged._element===undefined||dropzone._element===undefined) 
          return this._drags.filter(d=>d.indexDrop>=0).length;
        let dragIndex = dragElements.indexOf(dragged._element), dropIndex;
        if (dragIndex<0){
          dragged = elements[1];
          dragIndex = dragElements.indexOf(dragged._element);
          dropzone = elements[0];
        }
        dropIndex = dropElements.indexOf(dropzone._element);
        if (dragIndex>=0 && dropIndex>=0) // testing a pair
          return this._drags[dragIndex].indexDrop == dropIndex;
      }
      // testing each element separately
      let result = true;
      elements.forEach(e=>{
        if (e._element===undefined) return;
        const dragIndex = dragElements.indexOf(e._element);
        if (dragIndex>=0) return result = result && this._drags[dragIndex].indexDrop>=0;
        const dropIndex = dropElements.indexOf(e._element);
        if (dropIndex>=0) return result = result && this._drops[dropIndex].indicesDrag.length>0;
      });
      return result;
    }
  };

});

})();
