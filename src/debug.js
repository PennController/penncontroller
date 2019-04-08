import { PennEngine } from "./engine";

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
            height: height, 
            position: "fixed", 
            'border-radius': "5px", 
            'background-color': 'floralwhite',
            'min-height': "2em",
            'min-width': "3em"
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
        this.titleSpan = $("<span>"+title+"</span>").css({
            display: "inline-block", 
            padding: "2px", 'line-height': "1.3em",
            overflow: "hidden"
        });
        this.titleBar.append(this.titleSpan).append(
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
            t.updatePosition = true;
            t.offsetX = e.clientX - t.x;
            t.offsetY = e.clientY - t.y;
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
                }),
                remove: ()=>this.jQuery.remove()
            };
            this.tabs.push(tab);
            this.tabBar.prepend(tab.jQuery);
            tab.jQuery.click();
            return tab;
        };
        this.container.append($("<div>").css({
            display: "inline-block", width: "1.3em", height: "1.3em", position: "absolute", bottom: 0, right: 0, cursor: "se-resize"
        }).mousedown(function(e){
            t.updateSize = true;
            t.offsetRight = e.clientX - (t.x + t.width);
            t.offsetBottom = e.clientY - (t.y + t.height);
            e.preventDefault();
        }));
        this.content = $("<div>").css({
            border: "solid 1px lightgray",
            'font-family': "monospace",
            'font-size': "0.9em",
            margin: '0px 5px 5px 5px',
            padding: '2px',
            height: 'calc(100% - 3em - 25px)',
            overflow: 'auto',
            'border-top': "none"
        })
        this.container.append(this.titleBar);
        this.container.append(this.tabBar);
        this.container.append(this.content);
        this.container.css({left: x, top: y});
        $(document).mousemove(function(e){
            if (t.updatePosition){
                t.x = e.clientX - t.offsetX;
                t.y = e.clientY - t.offsetY;
                t.container.css({left: t.x, top: t.y});
            }
            if (t.updateSize){
                t.width = (e.clientX - t.x) - t.offsetRight;
                t.height = (e.clientY - t.y) - t.offsetBottom;
                t.container.css({width: t.width, height: t.height});
            }
        }).mouseup(function(){ t.updatePosition = false; t.updateSize = false; });
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
    currentTable: null
};

PennEngine.debug = {
    on: false,
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
        let now = new Date();
        tab.prepend( $("<div>"+
            "["+[now.getHours(),now.getMinutes(),now.getSeconds()].join(":")+"] "+
            messages.join(';')+
            " (PennController: "+controller.id+")"+
            "</div>"
        ).css({'border-bottom': 'dotted 1px gray', 'margin-bottom': '1px', 'padding-bottom': '1px'}) );
    },
    log: (...messages) => PennEngine.debug.addToTab(debug.logTab.log,...messages),
    error: (...messages) => {
        if (!PennEngine.debug.on) return;
        PennEngine.debug.addToTab(debug.errorsTab.content,...messages);
        debug.errorsTab.title.css("color","red");
    }
};


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


let oldAddSafeBindMethodPair = window.addSafeBindMethodPair;
window.addSafeBindMethodPair = controllerType => {
    oldAddSafeBindMethodPair(controllerType);
    if (!PennEngine.debug.on){
        window.items = undefined;
        return;
    }
    if (controllerType == "__SendResults__")
        HAS_REACHED_SEND_RESULTS = true;
    if (debug.runningIndex<0)
        debug.runningIndex = 0;
    else{
        let li = $(debug.sequenceTab.content.find("li")[debug.runningIndex]);
        li.css("color","gray");
        li.find("button").attr("disabled",true);
    }
    if (debug.runningElement<0)
        debug.runningElement = 0;
    else{
        debug.runningElement++;
        if (debug.runningElement >= debug.runningOrder[debug.runningIndex].length){
            debug.runningElement = 0;
            debug.runningIndex++;
        }
    }
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
    debug.sequenceTab.content.find("li").css("background-color","transparent");
    $(debug.sequenceTab.content.find("li")[debug.runningIndex]).css("background-color","pink");
    if (trial.controller=="PennController")
        $(debug.logTab.controls.children()[1]).css("display","inline-block")
    else
        $(debug.logTab.controls.children()[1]).css("display","none")
};



// Creation of the debug popin
debug.popin = new PopIn("Debug", 290, 190, window.innerWidth - 300, window.innerHeight - 200);
debug.logTab = debug.popin.newTab("Log");               // First tab: console
debug.logTab.controls = $("<div>")
    .append( $("<button>Next screen</button>").click(()=>debug.currentController._finishedCallback()) )
    .append( $("<button>Next command</button>").click(()=>PennEngine.debug.forceResolve()) )
    .css({background: "lightgray", "border-bottom": "dotted 1px black"})
    .appendTo( debug.logTab.content );
debug.logTab.log = $("<div>").appendTo( debug.logTab.content );
debug.errorsTab = debug.popin.newTab("Errors");         // Second tab: errors

PennEngine.Prerun(
    ()=>{
        if (!PennEngine.debug.on)
            return;
        // Retrieve the list of trials
        let oldRunShuffleSequence = window.runShuffleSequence;
        window.runShuffleSequence = function(...args) {         // runShuffle... = just before call to conf_modify...
            let oldModify = window.conf_modifyRunningOrder;     // this way we get most recent conf_modify...
            window.conf_modifyRunningOrder = function (ro){
                if (oldModify instanceof Function)
                    debug.runningOrder = oldModify.call(this, ro);
                else
                    debug.runningOrder = ro;

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

                let jumpToTrial = n => {
                    if (debug.runningIndex < n){
                        debug.currentController._finishedCallback();
                        setTimeout(()=>jumpToTrial(n), 1);
                    }
                }
                let list = $("<ol>");
                for (let i = 0; i < debug.runningOrder.length; i++){
                    let item = debug.runningOrder[i];
                    let elements = [];
                    for (let e = 0; e < item.length; e++)
                        elements.push(item[e].controller);
                    let tableInfo = [];
                    if (item[0].options.hasOwnProperty("_PennController"))
                        tableInfo = [':',item[0].options._PennController.table.id,item[0].options._PennController.row+1];
                    let text = item[0].type+" ("+elements.join(",")+tableInfo.join(":")+")";
                    list.append($("<li>").append(text).append($("<button>Reach</button>").click(()=>jumpToTrial(i))));
                }
                debug.sequenceTab.content.append(list);
                        
                return debug.runningOrder;
            };
            return oldRunShuffleSequence.apply(this, args);
        }


        $(window.document).bind("keyup keydown", function(e){
            if (e.ctrlKey && e.keyCode == 68) {
                let x = window.innerWidth - 300, y = window.innerHeight - 200;
                $(window.document.body).append( debug.popin.container );
                debug.popin.x = x;
                debug.popin.y = y;
                debug.popin.container.css({top: y, left: x});
            }
        });
        

        window.onbeforeunload = function() {
            if (HAS_REACHED_SEND_RESULTS)
                return;
            return "Your results have not been sent yet. Do you really want to leave the page?";
        };

        debug.popin.popIn();

    }
);