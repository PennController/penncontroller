import { PennEngine } from "./engine";
import { levensthein } from "./utils";

$.prototype.left = function(){ return Number(this.css("left").replace(/px/,'')); }
$.prototype.top = function(){ return Number(this.css("top").replace(/px/,'')); }

const VERSION = "2.0";

PennEngine.Prerun( ()=>{
    const xppath = window.location.pathname;
    if (!PennEngine.debug.on || VERSION.match(/beta/i)===null || (window.localStorage && window.localStorage.getItem(xppath))) return;
    const beta_warning = new PopIn("Beta Version", 400, 200, "calc(50vw - 200px)", "calc(50vh - 100px)");
    beta_warning.container.find("div:nth-child(3)").remove();   // remove 'DebugOff' warning
    beta_warning.content.html(`<p>Please note that this project is using a <strong>beta</strong> version of PennController (${VERSION}).</p>
                               <p>Report new bugs at <a href='https://www.pcibex.net/bug-report/' target='_blank'>https://www.pcibex.net/bug-report/</a>
                                  or at <a href='mailto:support@pcibex.net'>support@pcibex.net</a></p>`);
    beta_warning.popIn();
    beta_warning.titleExpand.click().remove();
    const popout = beta_warning.popOut;
    beta_warning.popOut = ()=>{window.localStorage.setItem(xppath,true); popout.call(beta_warning);};
});

const WIDTH = 450;
const HEIGHT = 250;

class PopIn {
    constructor(title, width, height, x, y) {
        let t = this;
        this.title = title;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.tabs = [];
        this.container = $("<div>").css({
            width: width, 
            // height: height, 
            height: "3em",
            overflow: 'hidden',
            position: "fixed", 
            'border-radius': "5px", 
            'background-color': 'floralwhite',
            'min-height': "3em",
            'min-width': "3em",
            'z-index': 9999
        });
        this.titleBar = $("<div>").css({
            width: "100%", 
            height: "1.5em", 
            margin: 0, 
            padding: 0, 
            'background-color': 'gray', 
            cursor: 'move', 
            color: 'white',
            'border-radius': '5px 5px 0px 0px'
        });
        this.titleExpand = $("<span>&#9656;</span>").css({
            display: 'inline-block',
            'line-height': '1.3em',
            padding: '2px',
            'margin-right': '0.25em',
            cursor: 'pointer'
        }).click(()=>{
            if (this.titleExpand.html().charCodeAt(0)==9656){
                this.titleExpand.html("&#9662;");
                this.container.css({
                    height: this.height,
                    overflow: "unset",
                });
            }
            else{
                this.titleExpand.html("&#9656;");
                this.container.css({
                    height: "3em",
                    overflow: "hidden",
                });
            }
        });
        this.titleSpan = $("<span>"+title+"</span>").css({
            display: "inline-block", 
            padding: "2px", 'line-height': "1.3em",
            overflow: "hidden"
        });
        this.titleBar.append(this.titleSpan.prepend(this.titleExpand)).append(
            $("<span>X</span>").css({
                width: "1.3em",
                height: "1.3em",
                margin: "0.1em",
                'line-height': "1.3em",
                'border-radius': "2px",
                'text-align': "center",
                position: "absolute",
                right: 0,
                cursor: "pointer",
                overflow: "hidden"
            }).click(function(){
                t.popOut();
            }).mouseenter(function(){ $(this).css({border: "solid 1px lightgray", 'border-radius': "2px"}); })
            .mouseleave(function(){ $(this).css({border: "none"}); })
        ).mousedown(function(e){
            t.updatePosition = {x: e.clientX, y: e.clientY, left: t.container.left(), top: t.container.top()};
            e.preventDefault();
        });
        this.tabBar = $("<div>").css({
            width: "calc(100% - 10px)",
            height: "1.5em",
            'margin-bottom': "0px",
            overflow: "hidden",
            display: "flex",
            'margin-left': "5px",
            'margin-right': "5px"
        });
        this.tabBar.append($("<div>").css({width:"100%",'border-bottom':"solid 1px lightgray"}));
        this.newTab = (title,content) => {
            if (!(title instanceof jQuery))
                title = $("<span>").append(title);
            if (!(content instanceof jQuery))
                content = $("<div>").append(content);
            let tab = {
                title: title,
                content: content,
                jQuery: $("<div>").append(title).css({
                    border: "solid 1px lightgray",
                    'border-top-right-radius': "5px",
                    'border-top-left-radius': "5px",
                    'padding-left': "5px",
                    'padding-right': "5px",
                    cursor: "pointer"
                }).click(()=>{
                    this.content.children().detach();
                    this.content.append(tab.content);
                    this.tabBar.children().css({
                        background: "linen", 
                        color: "darkgray", 
                        'border-bottom': "solid 1px lightgray"
                    });
                    tab.jQuery.css({color: "black", background: "inherit", 'border-bottom': 'none'});
                    debug.activeTab = tab;
                }),
                remove: ()=>this.jQuery.remove()
            };
            this.tabs.push(tab);
            this.tabBar.prepend(tab.jQuery);
            // tab.jQuery.click();
            return tab;
        };
        this.container.append($("<div>").css({
            display: "inline-block", width: "1.3em", height: "1.3em", position: "absolute", bottom: 0, right: 0, cursor: "se-resize",
            background: "repeating-linear-gradient(135deg,rgba(255,255,255,.5),rgba(255,255,255,.5) 2px,#777 2px,#777 4px)",
            'clip-path': "polygon(90% 0,90% 90%,0 90%)", opacity: "0.5"
        }).mousedown(function(e){
            t.updateSize = true;
            t.offsetRight = e.clientX - (t.container.left() + t.container.width());
            t.offsetBottom = e.clientY - (t.container.top() + t.container.height());
            e.preventDefault();
        }));
        this.content = $("<div>").css({
            border: "solid 1px lightgray",
            'font-family': "monospace",
            'font-size': "0.9em",
            margin: '0px 5px 5px 5px',
            padding: '2px',
            height: 'calc(100% - 4.5em - 30px)',
            overflow: 'auto',
            'border-top': "none"
        })
        this.container.append(this.titleBar);
        this.container.append($("<div>Use <tt>DebugOff()</tt> before publishing.</div>").css({
            height: "1.5em", 'overflow-x': "hidden"
        }));
        this.container.append(this.tabBar);
        this.container.append(this.content);
        this.container.css({left: x, top: y});
        $(document).mousemove(function(e){
            if (t.updatePosition){
                // t.x = e.clientX - t.offsetX;
                // t.y = e.clientY - t.offsetY;
                t.x = t.updatePosition.left + (e.clientX-t.updatePosition.x);
                t.y = t.updatePosition.top + (e.clientY-t.updatePosition.y);
                t.container.css({left: t.x, top: t.y});
            }
            if (t.updateSize){
                t.width = (e.clientX - t.container.left()) - t.offsetRight;
                t.height = (e.clientY - t.container.top()) - t.offsetBottom;
                t.container.css({width: t.width, height: t.height});
            }
        }).mouseup(function(){ t.updatePosition = undefined; t.updateSize = false; });
    }
    popIn() {
        $(document.body).append(this.container);
    }
    popOut() {
        this.container.detach();
    }
}

let HAS_REACHED_SEND_RESULTS = false;
let debug = {
    popin: {},
    tablePopin: {},
    infoTab: null,
    runningOrder: null,
    runningIndex: -1,
    runningElement: -1,
    currentController: null,
    currentTable: null,
    activeTab: null
};

PennEngine.debug = {
    on: true,
    currentPromise: null,
    forceResolve: ()=>{
        if (PennEngine.debug.currentPromise instanceof Function)
            PennEngine.debug.currentPromise();
    },
    addToTab: (tab,...messages)=>{
        if (!PennEngine.debug.on) return;
        let controller;
        if (!PennEngine.controllers.running)    // If in phase of creation:
            controller = PennEngine.controllers.underConstruction; // get from controller under construction
        else                                    // Else, get from the running controller (e.g. async command)
            controller = PennEngine.controllers.list[PennEngine.controllers.running.id];
        if (controller===undefined||controller===null)
            controller = {id: "NA"};
        let now = new Date();
        tab.prepend( $("<div>"+
            "["+[now.getHours(),now.getMinutes(),now.getSeconds()].join(":")+"] "+
            messages.join(';')+
            " (newTrial: "+controller.id+(controller.useLabel?'-'+controller.useLabel:'')+")"+
            "</div>"
        ).css({'border-bottom': 'dotted 1px gray', 'margin-bottom': '1px', 'padding-bottom': '1px'}) );
    },
    log: (...messages) => PennEngine.debug.addToTab(debug.logTab.log,...messages),
    warning: (...messages) => {
        if (!PennEngine.debug.on) return;
        PennEngine.debug.addToTab(debug.warningsTab.content,...messages);
        debug.warningsTab.title.css("color","orange");
        debug.warningsTab.content.find(".PennController-debug-nowarnings").css("display","none");
        if (debug.popin.titleExpand.html().charCodeAt(0)==9656) debug.popin.titleExpand.click();
        debug.warningsTab.jQuery.click();
    },
    error: (...messages) => {
        if (!PennEngine.debug.on) return;
        PennEngine.debug.addToTab(debug.errorsTab.content,...messages);
        debug.errorsTab.title.css("color","red");
        debug.errorsTab.content.find(".PennController-debug-noerrors").css("display","none");
        if (debug.popin.titleExpand.html().charCodeAt(0)==9656) debug.popin.titleExpand.click();
        debug.errorsTab.jQuery.click();
    }
};


// Creation of the debug popin
debug.popin = new PopIn(`Debug (PennController ${VERSION})`, WIDTH-10, HEIGHT-10, window.innerWidth - WIDTH, 10/*HEIGHT*/);
debug.logTab = debug.popin.newTab("Log");               // First tab: console
debug.logTab.controls = $("<div>")
    .append( $("<button>Next screen</button>").click(()=>{
        if (debug.currentController._cssPrefix=="PennController-") PennEngine.controllers.running.endTrial();
        else debug.currentController._finishedCallback();
    }) )
    .append( $("<button>Next command</button>").click(()=>PennEngine.debug.forceResolve()) )
    .css({background: "lightgray", "border-bottom": "dotted 1px black"})
    .appendTo( debug.logTab.content );
debug.logTab.log = $("<div>").appendTo( debug.logTab.content );
debug.warningsTab = debug.popin.newTab("Warnings");         // Second tab: warning
debug.warningsTab.content.prepend( $("<div>No warnings</div>").css({
    'font-style': 'italic', 'text-align': 'center', 'margin': '5px'
}).addClass("PennController-debug-nowarnings"));
debug.errorsTab = debug.popin.newTab("Errors");         // Third tab: errors
debug.errorsTab.content.prepend( $("<div>No errors found</div>").css({
    'font-style': 'italic', 'text-align': 'center', 'margin': '5px'
}).addClass("PennController-debug-noerrors"));



let highlightCurrentRow = ()=>{
    if (debug.currentTable && debug.currentTable.debug){
        debug.currentTable.debug.content.find("tr").css("background-color", "transparent");
        $(debug.currentTable.debug.content.find("tr")[debug.currentRow+1]).css("background-color", "pink");
        debug.tablePopin.titleSpan.after(jumpToRow);
        if (debug.currentTable.hasOwnProperty("group") && debug.currentTable.table[0].hasOwnProperty(debug.currentTable.group))
            jumpToRow.after(hideOtherGroups);
    }
};

let jumpToRow = $("<a title='Jump to current row'>&#9755;</a>").click(function(){
    debug.currentTable.debug.jQuery.click();
    let scroll = $(debug.currentTable.debug.content.find("tr")[debug.currentRow+1]).position().top;
    debug.currentTable.debug.content.children()[2].scrollTop += scroll;
}).css({
    display: "inline-block", 
    padding: "2px 5px", 'line-height': "1.3em",
    overflow: "hidden"
});

let onlyCurrentGroup = false;
let hideOtherGroups = $("<a title='Show/Hide rows from other groups'>&#128065;</a>").click(function(){
    if (onlyCurrentGroup)
        debug.currentTable.debug.content.find("tr").css('display','table-row');
    else {
        let group = debug.currentTable.table[debug.currentRow][debug.currentTable.group];
        let rows = debug.currentTable.debug.content.find("tr");
        for (let r = 0; r < debug.currentTable.table.length; r++)
            if (debug.currentTable.table[r][debug.currentTable.group]!=group)
                $(rows[r+1]).css("display","none");
    }
    onlyCurrentGroup = !onlyCurrentGroup;
}).css({
    display: "inline-block", 
    padding: "4px 5px 0px 5px", 'line-height': "1.3em",
    overflow: "hidden"
});

// Helper to transform a Table element into a jQuery <table> object
let toContent = table=>{
    let keys = Object.keys(table.table[0]);
    let bodyTable = $("<table>").css({display: "table", 'table-layout': "fixed", height: "100%", width: 70*(keys.length+1)});
    let headerTable = $("<table>").css({display: "table", 'table-layout': "fixed", height: "100%", width: 70*(keys.length+1)});
    let header = $("<tr>");
    header.append($("<th>").html("<em>#</em>").css({width: 70, 'overflow': "hidden"}));
    for (let c = 0; c<keys.length; c++)
        header.append($("<th>").html(keys[c]).css({width: 70, 'overflow': "hidden"}));
    headerTable.append(header);
    for (let r = 0; r<table.table.length; r++){
        let row = $("<tr>");
        row.append($("<td>").html("<em>"+Number(r+1)+".</em>").css({width: 70, 'overflow': "hidden"}));
        for (let c = 0; c<keys.length; c++)
            row.append($("<td>").html(table.table[r][keys[c]]).css({width: 70, 'overflow': "hidden"}));
        bodyTable.append(row);
    }
    let bodyDiv = $("<div>").css({height: "calc(100% - 1.5em)", overflow: "auto"})
                        .append(bodyTable);
    let ghostDiv = $("<div>").css({height: "1.5em", width: "100%"});
    let headerDiv = $("<div>").css({width: "100%", position: "absolute", left: 0, top: 0})
                        .append(headerTable);
    bodyDiv.scroll( () => headerDiv.css("margin-left", -1 * bodyDiv[0].scrollLeft) );
    return $("<div>").css({width: "100%", height: "100%", 'white-space': "nowrap", position: "relative", overflow: "hidden"})
                    .append(headerDiv).append(ghostDiv).append(bodyDiv);
};
// Shows the Tables popin
let showTables = table=>{
    if (debug.tablePopin.hasOwnProperty("container")){
        if (debug.tablePopin.container.parent().length>0)           // Table already on screen
            debug.tablePopin.tabs[table].jQuery.click();
        else
            $(document.body).append(debug.tablePopin.container);    // Re-print the table popin
    }
    else {  // Display the table popin next the debug popin
        debug.tablePopin = new PopIn("Tables", window.innerWidth-320, 190, 10, window.innerHeight-200);
        let tableNames = Object.keys(PennEngine.tables);
        for (let t = 0; t<tableNames.length; t++)
            PennEngine.tables[tableNames[t]].debug = debug.tablePopin.newTab( tableNames[t] , toContent(PennEngine.tables[tableNames[t]]) );
        debug.tablePopin.content.css("overflow","hidden");
        debug.tablePopin.tabs[table].jQuery.click();                // Click on the selected table
    }
    highlightCurrentRow();
}



const newItem = () => {
    if (debug.runningIndex<0)
        debug.runningIndex = 0;
    if (debug.runningElement<0)
        debug.runningElement = 0;
    else{
        debug.runningElement++;
        if (debug.runningElement >= debug.runningOrder[debug.runningIndex].length){
            debug.runningElement = 0;
            debug.runningIndex++;
        }
    }

    if (debug.runningOrder[debug.runningIndex][debug.runningElement].controller == "__SendResults__")
        HAS_REACHED_SEND_RESULTS = true;

    if (!PennEngine.debug.on){
        window.items = undefined;
        return;
    }
    
    refreshSequenceTab();
    updateProgressBar();
    
    jumpToRow.detach();
    hideOtherGroups.detach();
    debug.currentTable = null;
    debug.currentTableName = "<em>NA</em>";
    debug.currentRow = -1;
    debug.currentController = debug.runningOrder[debug.runningIndex][debug.runningElement].options;
    if (debug.currentController.hasOwnProperty("_PennController")){
        debug.currentTable = debug.currentController._PennController.table;
        for (let name in PennEngine.tables)
            if (PennEngine.tables[name]==debug.currentTable)
                debug.currentTableName = name;
        debug.currentRow = Number(debug.currentController._PennController.row);
        highlightCurrentRow();
    }
    let trial = debug.runningOrder[debug.runningIndex][debug.runningElement];
    debug.infoTab.content.empty();
    debug.infoTab.content
        .append($("<div><strong>Trial in sequence</strong> "+Number(debug.runningIndex+1)+" / "+debug.runningOrder.length+"</div>"))
        .append($("<div><strong>Element in trial</strong> "+Number(debug.runningElement+1)+" / "+debug.runningOrder[debug.runningIndex].length+"</div>"))
        .append($("<div><strong>Trial's label:</strong> "+trial.type+"</div>"))
        .append($("<div><strong>Trial's type (controller):</strong> "+trial.controller+"</div>"))
        .append($("<div><strong>Trial's index:</strong> "+trial.itemNumber+" / "+window.items.length+"</div>"))
        .append($("<div><strong>From table:</strong> "+debug.currentTableName+"</div>"));
    if (trial.controller=="PennController")
        $(debug.logTab.controls.children()[1]).css("display","inline-block")
    else
        $(debug.logTab.controls.children()[1]).css("display","none")
}


let dgetOld = window.dget;
window.dget = (...args) => {    // Called whenever a new item shows up
    let r = dgetOld(...args);   // displayMode,overwrite only called in finishCallback
    if (args[1] && args[1] == "displayMode" && args[2] && args[2] == "overwrite")
      newItem();
    return r;
};

const updateProgressBar = () =>{
    if (window.conf_showProgressBar) {
        let nPoints = 0, multiplier = 0;
        debug.runningOrder.forEach((item,ni)=>item.forEach((element,ne)=>{
            const count = ibex_controller_get_property(element.controller, "countsForProgressBar");
            if (count===undefined||count) {
                nPoints++;
                if (ni<debug.runningIndex||(ni==debug.runningIndex&&ne<=debug.runningElement)) multiplier++;
            }
        }));
        const barContainer = $("#bod > table div.bar-container"), bar = barContainer.find(".bar");
        const progressBarMaxWidth = nPoints * 5 < 300 ? nPoints * 5 : 300;
        const currentProgressBarWidth = multiplier * progressBarMaxWidth / nPoints;
        barContainer.css("width",progressBarMaxWidth);
        bar.css('width', Math.round(currentProgressBarWidth) + "px");
    }
}
const jumpToTrial = n => {
    if (debug.runningIndex < n){
        if (debug.currentController._cssPrefix=="PennController-") PennEngine.controllers.running.endTrial();
        else debug.currentController._finishedCallback();
        setTimeout(()=>jumpToTrial(n), 1);
    }
}
const refreshSequenceTab = ()=>{
    const list = $("<ol>");
    for (let i = 0; i < debug.runningOrder.length; i++){
        let item = debug.runningOrder[i];
        let elements = [];
        for (let e = 0; e < item.length; e++)
            elements.push(item[e].controller);
        let tableInfo = [];
        if (item[0].options.hasOwnProperty("_PennController"))
            tableInfo = [':',item[0].options._PennController.table.id,item[0].options._PennController.row+1];
        let text = item[0].type+" ("+elements.join(",")+tableInfo.join(":")+")";
        const li = $("<li>").append(text);
        if (i<=debug.runningIndex)
            li.css({color:"gray",'background-color':(i==debug.runningIndex?"pink":"transparent")});
        else
            li.append($("<button>Reach</button>").click(()=>jumpToTrial(i)));
        list.append(li);
    }
    debug.sequenceTab.content.empty().append(list);
}

let init_debug = () => {
    // If there are any tables, add a tab to the debug popin
    let tableNames = Object.keys(PennEngine.tables);
    if (tableNames.length>0){
        let tableTabContent = $("<ul>");
        for (let t = 0; t<tableNames.length; t++)
            tableTabContent.append($("<li>").html(tableNames[t]).click(()=>showTables(t)).css("cursor","pointer"));
        debug.popin.newTab("Tables", tableTabContent);
    }

    // Sequence tab
    debug.sequenceTab = debug.popin.newTab("Sequence");
    // Info tab
    debug.infoTab = debug.popin.newTab("Info");

    refreshSequenceTab();
    if (debug.activeTab)
        debug.activeTab.jQuery.click();
    else
        debug.errorsTab.jQuery.click();

    // Key to open the debugger
    $(window.document).bind("keyup keydown", function(e){
        if (e.ctrlKey && e.keyCode == 68) {
            let x = window.innerWidth - WIDTH, y = window.innerHeight - HEIGHT;
            $(window.document.body).append( debug.popin.container );
            debug.popin.x = x;
            debug.popin.y = y;
            debug.popin.container.css({top: y, left: x});
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
};

// Overriding $.ajax (first called in other_includes/main.js) to print debug as soon as possible
let oldAjax = window.$.ajax;
window.$.ajax = (...args) => {
    if (PennEngine.debug.on && args[0] && args[0].url && args[0].url.match(/\?allchunks=1$/))
        debug.popin.popIn();
    return oldAjax(...args);
};


PennEngine.Prerun(
    ()=>{

        window.onbeforeunload = function() {
            if (HAS_REACHED_SEND_RESULTS)
                return;
            return "Your results have not been sent yet. Do you really want to leave the page?";
        };

        let ran = false;    // Only run the new assert once

        PennController.version = VERSION;

        // Retrieve the list of trials
        //let oldRunShuffleSequence = window.runShuffleSequence;
        let oldAssert = window.assert;
        //window.runShuffleSequence = function(...args) {         // runShuffle... = just before call to conf_modify...
        window.assert = function (...args){
            if (ran || args[1]!="There must be some items in the running order!")
                return oldAssert.apply(this, args);             // Only run the new assert once
            ran = true;
            let oldModify = window.conf_modifyRunningOrder;     // this way we get most recent conf_modify...
            window.conf_modifyRunningOrder = function (ro){
                if (oldModify instanceof Function)
                    debug.runningOrder = oldModify.call(this, ro);
                else
                    debug.runningOrder = ro;

                PennEngine.runningOrder = {
                    active: debug.runningOrder,
                    original: [...debug.runningOrder]
                };
                const oldPush = PennEngine.runningOrder.active.push;
                let once = false;
                PennEngine.runningOrder.active.push = function(...args){
                    const r = oldPush.apply(this,args);
                    if (!once && args[0] instanceof Array && args[0][0] && args[0][0].controller == "__SendResults__"){
                        PennEngine.runningOrder.original = [...this];
                        once = true;
                    }
                    return r;
                }
                Object.defineProperty(PennEngine.runningOrder,"runningIndex",{get:()=>debug.runningIndex});

                if (PennEngine.debug.on)
                    init_debug();

                newItem();  // First item
                        
                return debug.runningOrder;
            };
            //return oldRunShuffleSequence.apply(this, args);
            return oldAssert.apply(this, args);
        }

        // if (PennEngine.debug.on)
        //     debug.popin.popIn();

    }
);

// Catch errors related to new*/get*/default*
window.onerror = function(message, uri, line) {
    if (!uri.match(/include=data$/))
        return;
    let ref = message.match(/ReferenceError: (.+) is not defined/);
    if (ref){
        if (ref[1].match(/^(new|get|default)/) && PennController.Elements[ref[1]])
            PennEngine.debug.error("Tried to use &lsquo;"+ref[1]+"&rsquo; without a prefix on line "+line+"; did you forget to use PennController.ResetPrefix?");
        else {
            let lowest = {score: 1, command: ""};
            let commands = Object.getOwnPropertyNames( PennController.Elements );
            for (let i = 0; i < commands.length; i++){
                let score = levensthein(ref[1],commands[i]) / ref[1].length;
                if (score < lowest.score){
                    lowest.score = score;
                    lowest.command = commands[i];
                }
            }
            if (lowest.score < 0.5)
                PennEngine.debug.error("Wrong command &lsquo;"+ref[1]+"&rsquo; on line "+line+". Did you mean to type &lsquo;<strong>"+lowest.command+"</strong>&rsquo;?");
            else    
                PennEngine.debug.error("Unrecognized expression &lsquo;"+ref[1]+"&rsquo; (line "+line+")");
        }
    }
    else
        PennEngine.debug.error(message);
        //console.error(message);
}

let oldGetP = window.ibex_controller_get_property;
window.ibex_controller_get_property = (cname, oname) => {
    let controllerNames = Object.getOwnPropertyNames( $.ui );

    if (controllerNames.indexOf(cname)>-1)
        return oldGetP(cname, oname);

    let lowest = {score: 1, controllerName: ""};
    for (let i = 0; i < controllerNames.length; i++){
        let score = levensthein(cname,controllerNames[i]) / cname.length;
        if (score < lowest.score){
            lowest.score = score;
            lowest.controllerName = controllerNames[i];
        }
    }

    if (lowest.score < 0.5)
        PennEngine.debug.error("Invalid controller reference: &lsquo;"+cname+"&rsquo;---Did you mean to type <strong>"+lowest.controllerName+"</strong>?");
    else    
        PennEngine.debug.error("Invalid controller reference: &lsquo;"+cname+"&rsquo;");

}
