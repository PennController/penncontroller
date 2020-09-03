// MOUSETRACKER element
/* $AC$ PennController.newMouseTracker(name) Creates a new MouseTracker element $AC$ */
/* $AC$ PennController.getMouseTracker(name) Retrieves an existing MouseTracker element $AC$ */
window.PennController._AddElementType("MouseTracker", function(PennEngine) {

    // Example of R Script:
    //
    // time <- 1568404820111
    // stream <- "x962y192w1920h737t694+0+0t15+0+0t18-1+0t15-1+0t17-1-1t33-1-1t16-3-2t17-1-1t16-2-3t33-3-3t18-1-2t316+0+1t18+0+2t16+0+3t17+0+1t17+0+2t15+0+3t18+0+2"
    // pos <- data.frame(time=c(time),x=as.numeric(gsub("^x(\\d+)y.+$","\\1", stream)), y=as.numeric(gsub("^.+y(\\d+)w.+$","\\1", stream)))
    // ptime <- time
    // px <- pos[1,'x']
    // py <- pos[1,'y']
    // sapply(strsplit(stream,'t')[[1]][-1],function(s){
    //     row <- strsplit(gsub("^(\\d+)([+-]\\d+)([+-]\\d+)$","\\1 \\2 \\3",s),' ')
    //     ntime <- as.numeric(ptime+as.numeric(row[[1]][1]))
    //     nx <- as.numeric(px+as.numeric(row[[1]][2]))
    //     ny <- as.numeric(py+as.numeric(row[[1]][3]))
    //     pos <<- rbind(pos, data.frame(time=ntime,x=nx,y=ny))
    //     ptime <- ntime
    //     px <- nx
    //     py <- ny
    // })

    let MouseX, MouseY;

    this.immediate = function(id){
        if (id===undefined||typeof(id)!="string"||id.length==0)
            id = "MouseTracker";
        this.id = id;
        $(document).mousemove( e=>{
            MouseX = e.clientX;
            MouseY = e.clientY;
            if (this.move && this.move instanceof Function)
                this.move(e)
        });
    };

    this.uponCreation = function(resolve){
        this.coordinates = [];
        this.enabled = false;
        this.callbacks = [];
        this.currentStream = [];
        let t = this;
        this.move = async function() {
            if (!t.enabled)
                return;
            t.currentStream.push([Date.now(),MouseX,MouseY]);
            if (t.callbacks.length){
                for (let i = 0; i < t.callbacks.length; i++){
                    if (t.callbacks[i] instanceof Function)
                        await t.callbacks[i].apply(this, [MouseX, MouseY]);
                    else if (t.callbacks[i]._runPromises && t.callbacks[i]._runPromises instanceof Function)
                        await t.callbacks[i]._runPromises(MouseX, MouseY);
                }
            }
        };
        this.finishStream = ()=>{
            if (this.currentStream.length>1){
                let x = this.currentStream[0][1], y = this.currentStream[0][2], time = this.currentStream[0][0];
                if (x===undefined)
                    x = this.currentStream[1][1];
                if (y===undefined)
                    y = this.currentStream[1][2];
                let str = "x"+x+"y"+y+"w"+this.currentStream[0][3]+"h"+this.currentStream[0][4];
                for (let i = 1; i < this.currentStream.length; i++){
                    let xOffset = this.currentStream[i][1] - x, yOffset = this.currentStream[i][2] - y,
                        timeOffset = this.currentStream[i][0] - time;
                    str += "t"+timeOffset;
                    str += (xOffset>=0?"+":"")+xOffset;
                    str += (yOffset>=0?"+":"")+yOffset;
                    x = this.currentStream[i][1];
                    y = this.currentStream[i][2];
                    time = this.currentStream[i][0];
                }
                let notes = "NULL";
                if (window.innerWidth != this.currentStream[0][3] || window.innerHeight != this.currentStream[0][4])
                    notes = "Size of window changed to "+window.innerWidth+" * "+window.innerHeight;
                this.coordinates.push([str,this.currentStream[0][0],notes]);
            }
            this.currentStream = [];
        }
        resolve();
    };

    this.end = function(){
        this.enabled = false;
        if (this.finishStream && this.finishStream instanceof Function) this.finishStream();
        if (this.log && this.coordinates.length){
            for (let i = 0; i < this.coordinates.length; i++)
                PennEngine.controllers.running.save(this.type, this.id, "Move", ...this.coordinates[i]);
        }
    };

    this.value = function(){
        if (MouseX && MouseY)
            return MouseX+'-'+MouseY;
        return 'NA-NA';
    };

    this.actions = {
        start: function(resolve){    /* $AC$ Mouse PElement.start() Starts listening to mouse movements $AC$ */
            this.currentStream = [[Date.now(),MouseX,MouseY,window.innerWidth,window.innerHeight]];
            this.enabled = true;
            resolve();
        },
        stop: function(resolve){    /* $AC$ Mouse PElement.stop() Stops listening to mouse movements $AC$ */
            this.enabled = false;
            this.finishStream();
            resolve();
        }
    }

    this.settings = {
        callback: function(resolve, ...args){  /* $AC$ Mouse PElement.callback( commands ) Runs the specified command(s) when the mouse moves $AC$ */
            if (args.length==0)
                return;
            this.callbacks = this.callbacks.concat(args);
            resolve();
        },
        log: function(resolve){    /* $AC$ Mouse PElement.log() Logs the X and Y positions of the mouse $AC$ */
            this.log = true;
            resolve();
        }
    }
});
