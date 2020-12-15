import "jquery-csv";
import { PennController } from "./controller.js";
import { PennEngine } from "./engine.js";
import { levensthein } from "./utils.js";

PennEngine.tables = {};         // Dictionary of named tables
var defaultTable = {};          // A dummy object representing the default table handler
let groupLists = [];            // An array index all the list of groups from the different tables along with which is running

// The TABLE class contains an 2x2 Array-Object and defines Item, Group/List and Label
class Table {
    constructor(table, id) {
        if (!(table instanceof Array) || table.length < 1 || !Object.keys(table[0]).length)
            return PennEngine.debug.error("Invalid format for table when creating new table");
        this.id = id||"unnamed";
        this.table = table;
        for (let col in table[0]) {
            if (col.match(/^item$/i))
                this.item = col;
            if (col.match(/^(group|list)$/i))
                this.group = col;
            if (col.match(/^label$/i))
                this.label = col;
        }
    }
    setItem(col) {                                  // Obsolete since beta 0.4 (not relying on latin square)
        if (this.table[0].hasOwnProperty(col))
            this.item = col;
        else
            PennEngine.debug.log("Error when setting table's item column: no column found with the name "+col);
        return this;
    }
    setGroup(col) {
        if (this.table[0].hasOwnProperty(col))
            this.group = col;
        else
            PennEngine.debug.log("Error when setting table's group column: no column found with the name "+col);
        return this;
    }
    setLabel(col) {
        if (this.table[0].hasOwnProperty(col))
            this.label = col;
        else
            PennEngine.debug.log("Error when setting table's label column: no column found with the name "+col);
        return this;
    }
    filter(...args) {
        if (args.length == 2 && typeof(args[0]) == "string" && (typeof(args[1]) == "string" || args[1] instanceof RegExp)){
            if (this.table[0].hasOwnProperty(args[0])){
                let match = args[1];
                if (typeof(match)=="string")
                    match = new RegExp("^"+match+"$");
                let returnTable = [];
                for (let row = 0; row < this.table.length; row++){
                    if (this.table[row][args[0]].match(match))
                        returnTable.push(this.table[row]);
                }
                if (!returnTable.length)
                    PennEngine.debug.error("Empty table with filter:", args[0], args[1]);
                returnTable = new Table(returnTable, this.id);
                if (this.group)
                    returnTable.setGroup(this.group);
                if (this.label)
                    returnTable.setLabel(this.label);
                return returnTable;
            }
            else
                return PennEngine.debug.error("No column named \u2018"+args[0]+"\u2019 found in the table for filtering");
        }
        else if (args.length && args[0] instanceof Function){
            let returnTable = [];
            for (let row = 0; row < this.table.length; row++){
                if (args[0].call(this, this.table[row]))
                    returnTable.push(this.table[row]);
            }
            if (!returnTable.length)
                PennEngine.debug.error("Empty table after filter:", args[0]);
            return (new Table(returnTable,this.id)).setGroup(this.group).setLabel(this.label);
        }
    }
}

class TableHandler {
    constructor(name){
        this.name = name;
        this.actions = [];
    }
    setItem(col) {                                  // Obsolete since beta 0.4 (not relying on latin square)
        this.actions.push(["setItem", col]);
        return this;
    }
    setGroup(col) {
        this.actions.push(["setGroup", col]);
        return this;
    }
    setLabel(col) {
        this.actions.push(["setLabel", col]);
        return this;
    }
    filter(...args) {                               // Return a new handler so as not to contaminate original table
        let handler = new TableHandler(this.name);
        for (let a = 0; a<this.actions.length; a++)
            handler.actions.push(this.actions[a]);
        handler.actions.push(["filter", args])
        return handler;
    }
    setItemColumn(col){ 
        return this.setItem(col); 
    }
    setGroupColumn(col){ 
        return this.setGroup(col); 
    }
    setLabelColumn(col){ 
        return this.setLabel(col); 
    }
}


// Checks that the string 'table' is of the right format, and return a csv-formatted object
function _checkTable(table){
    if (table.charCodeAt(0) === 0xFEFF)
        table = table.slice(1);
    if (!table.match(/[\n\r]$/))
        table = table + '\n';                               // Last row ignored if doesn't end with linebreak
    let commaTable = [], tabTable = [];
    try {
        let tmpTable = $.csv.toArrays(table, {separator: ","});
        let columns = tmpTable[0];
        for (let r = 1; r<tmpTable.length; r++){
            let obj = {};
            columns.map((v,i)=>obj[v] = tmpTable[r][i]);
            commaTable.push(obj);
        }
    }
    catch(err){
        commaTable.push({});
    }
    try {
        let tmpTable = $.csv.toArrays(table, {separator: "\t"});
        let columns = tmpTable[0];
        for (let r = 1; r<tmpTable.length; r++){
            let obj = {};
            columns.map((v,i)=>obj[v] = tmpTable[r][i]);
            tabTable.push(obj);
        }
    }
    catch(err){
        tabTable.push({});
    }
    if (Object.keys(commaTable[0]).length > Object.keys(tabTable[0]).length)
        return commaTable;                              // Return comma-based table if more columns
    else if (Object.keys(tabTable[0]).length)           // Check that there is at least one column
        return tabTable;
    return PennEngine.debug.error("Format of table is invalid");
}


// Injects ajax requests to CSV files inside ajax request to CHUNKS_INCLUDES
let ajaxTables = [];
let oldAjax = window["$"].ajax;
window["$"].ajax = function(...args){
    if (args[0] && args[0].url && args[0].url.match(/allchunks=1$/)){
        let oldSuccess = args[0].success;
        args[0].success = d=>{
            if (ajaxTables.length==0)
                return oldSuccess(d);
            let ajaxRequests = [], success;
            for (let i = ajaxTables.length-1; i >= 0; i--){
                if (i == ajaxTables.length-1)
                    success = data => { PennController.AddTable(ajaxTables[i].name, data); oldSuccess(d); };
                else
                    success = data => { PennController.AddTable(ajaxTables[i].name, data); ajaxRequests[0](); };
                ajaxRequests.push( ()=>$.ajax({
                    url: ajaxTables[i].table,
                    cache: false,
                    dataType: 'text',
                    success: success
                }) );
            }
            ajaxRequests[0]();
        }
    }
    return oldAjax(...args);
}

// Adds a table to the dictionary
PennController.AddTable = function(name, table) {
    if (typeof(name)!="string"||typeof(table)!="string")
        return PennEngine.debug.error("Table "+name+" not added: tables and table names should be strings");
    if (PennEngine.tables.hasOwnProperty(name))
        PennEngine.debug.log("A table named "+name+" already exists; overriding it");
    if (table.match(/^http/)) {
        ajaxTables.push({name: name, table: table});
        return;
    }
    table = _checkTable(table);
    if (table)
        table = new Table(table, name);
    else
        return PennEngine.debug.error("Table "+name+" does not have the right format.");
    PennEngine.tables[name] = table;
}

// Returns a table from the dictionary
PennController.GetTable = function(name) {
    return new TableHandler(name);
};



let asyncFeedItems = [];                        // All Template functions are executed after setup

// The main function
// PennController.Template("table.csv",         // Optional, or reference to a Table object
//     (row) => PennController(                 // Or () => ["Message", {...}, "PennController", PennController(...)]
//         p(row.text)
//         ,
//         p(row.image)
//         ,
//         p.key("FJ")
//     )    
PennController.Template = function (tableName, func) {       /* $AC$ global.PennController.Template(table,penncontroller) Generates trials from a table $AC$ */
                                // FeedItems deprecated since 1.0
    if (window.items)
        for (let i in window.items)
            if (PennEngine.tmpItems.indexOf(window.items[i])<0)
                PennEngine.tmpItems.push(window.items[i]);
    let templateItems = {PennTemplate: []};
    PennEngine.tmpItems.push(templateItems);
    
    asyncFeedItems.push(function(){                                 // The code below will be executed after setup        
        let tmpItemsLength = PennEngine.tmpItems.length;            // Any PennController() in template pushes indesirably
        let table;
        if (tableName instanceof Function) {                        // No table name specified, try to automatically detect
            func = tableName;
            let tableNames = Object.keys(PennEngine.tables);
            if (tableNames.length && PennEngine.tables[tableNames[0]] instanceof Table)
                table = PennEngine.tables[tableNames[0]];
            else
                return PennEngine.debug.error("No valid table detected");
        }
        else if (typeof(tableName)=="string") {                     // Table name was specified
            if (PennEngine.tables.hasOwnProperty(tableName)) {                 // Check that it has been added
                if (PennEngine.tables[tableName] instanceof Table)
                    table = PennEngine.tables[tableName];
                else
                    return PennEngine.debug.error("Table "+tableName+" does not have the right format.");
            }
            else {                                                  // If not added, return an error
                let tableList = Object.keys(PennEngine.tables);
                let add = "";
                for (let i = 0; i < tableList.length; i++){
                    if ((levensthein(tableName,tableList[i]) / tableList[i].length) < 0.5)
                        add = " Did you mean to type &lsquo;<strong>"+tableList[i]+"</strong>&rsquo;?";
                }
                return PennEngine.debug.error("No table found with name "+tableName+"."+add);
            }
        }
        else if (tableName instanceof TableHandler){                // TableHandler: retrieve Table instance
            if (Object.keys(PennEngine.tables).length<1)
                return PennEngine.debug.error("No table was defined");
            else {
                if (tableName.name == defaultTable)                 // Default: take first table
                    table = PennEngine.tables[Object.keys(PennEngine.tables)[0]];
                else if (tableName.name && PennEngine.tables.hasOwnProperty(tableName.name))
                    table = PennEngine.tables[tableName.name];                 // Take table with corresponding name
                else {
                    let tableList = Object.keys(PennEngine.tables);
                    let add = "";
                    for (let i = 0; i < tableList.length; i++){
                        if ((levensthein(tableName.name,tableList[i]) / tableList[i].length) < 0.5)
                            add = " Did you mean to type &lsquo;</strong>"+tableList[i]+"</strong>&rsquo;?";
                    }
                    return PennEngine.debug.error("No table named "+tableName.name+" was found."+add);
                }
                for (let a = 0; a < tableName.actions.length; a++){
                    let arg = tableName.actions[a][1];
                    switch (tableName.actions[a][0]){
                        case "setItem":
                        table.setItem(arg);
                        break;
                        case "setLabel":
                        table.setLabel(arg);
                        break;
                        case "setGroup":
                        table.setGroup(arg);
                        break;
                        case "filter":
                        table = table.filter(...arg);
                        break;
                    }
                }
            }
        }
        else
            return PennEngine.debug.error("Bad format for Template's first argument (should be a PennController table, table name or function from rows to Ibex elements)");

        if (!(func instanceof Function))
            return PennEngine.debug.error("The function passed to PennController.Template is ill-defined");

        let groups = [];                                            // The different groups listed in the table
        let runningGroup;                                           // Which group will be running now
        if (table.group){
            for (let row = 0; row < table.table.length; row++)
                if (groups.indexOf(table.table[row][table.group])<0)
                    groups.push(table.table[row][table.group]);
            groups.sort();                                              // Sort the groups

            groupLists.map(g=> {                                        // Check in previous tables
                let overlap = groups.filter((v,i)=>v==g.groups[i]);     // Keep the values in both tables' groups
                if (groups.indexOf(g.runningGroup)>-1 && overlap.length==g.groups.length && overlap.length==groups.length)
                    runningGroup = g.runningGroup;                      // If the groups are the same, use the same runningGroup
            });
            if (runningGroup===undefined){
                let counter = window.__counter_value_from_server__;     // Retrieve counter value from server
                if (typeof(window.counterOverride)=="number")
                    counter = counterOverride;                          // If user defined custom counter value
                runningGroup = groups[counter % groups.length];         // Find out the group currently running
            }
            groupLists.push({                                           // Add the current groups list
                runningGroup: runningGroup,
                groups: groups
            });
        }

        let itemsToAdd = [];
        for (let row = 0; row < table.table.length; row++) {        // Going through the table
            if (table.group){                                       // GROUP DESIGN
                let rowGroup = table.table[row][table.group];       // The group of this row
                if (rowGroup != runningGroup)
                    continue;                                       // Ignore this row if not the right group
            }
            let label = undefined;                                  // The label
            let line = new Proxy(table.table[row], {                // Creating a proxy to catch column reference errors
                get: (obj, prop) => {
                    if (prop in table.table[row])
                        return obj[prop];
                    else{
                        let columns = Object.keys(table.table[row]);
                        let add = "";
                        for (let i = 0; i < columns.length; i++){
                            if ((levensthein(prop,columns[i]) / columns[i].length) < 0.5)
                                add = " Did you mean to type &lsquo;<strong>"+columns[i]+"</strong>&rsquo;?";
                        }
                        PennEngine.debug.error("No column named &lsquo;"+prop+"&rsquo; found in table "+table.id+"."+add);
                    }
                    return "";
                }
            });
            let content;
            try {
                content = func.call(null, line);                   // Create each item's content by calling func on each row
            }
            catch(err){
                window.onerror(err.name+": "+err.message, "include=data", "inside PennController.Template");
            }
            //let content = func(line);                             // Create each item's content by calling func on each row
            if (!(content instanceof Array)){                       // The PennController function returns an object (must be PennController)
                label = content.useLabel;                           // Use the (Penn)Controller's label
                content.addToItems = false;                         // Adding it right here, right now
                content = ["PennController", content];              // Pass it along with "PennController"
            }
            else if (content.length%2 && typeof(content[0])=="string"){
                label = content[0];                                 // If content is an odd array, its first member is the label
                content.splice(0,1);                                // Remove the label from content
            }
            if (!label){
                if (table.label && table.table[row].hasOwnProperty(table.label))
                    label = table.table[row][table.label];            // Use the label column if defined
                else if (table.item && table.table[row].hasOwnProperty(table.item))
                    label = "Item-"+table.table[row][table.item];     // Use the item column otherwise, if defined
                else
                    label = "Item-"+row;
            }
            let item = [label];
            for (let c in content){
                if (content[c] instanceof Object)                   // Add pointers to the table to any controller
                    content[c]._PennController = {table: table, row: row};
                item.push(content[c]);                              // Add the elements
            }
            
            itemsToAdd.push(item);
        }

        templateItems.PennTemplate = itemsToAdd;

        while (PennEngine.tmpItems.length>tmpItemsLength)          // Any PennController() in template pushes indesirably
            PennEngine.tmpItems.pop();                             // PennTemplate contains items & will add them to window.items

    });

    if (!window.items)
        window.items = [];                                      // Create items so it can be fed later

    // Handle inappropriate calls
    return {
        log: ()=>PennEngine.debug.error("Tried to call .log command on PennController.Template(); .log commands should be called on PennController()"),
        label: ()=>PennEngine.debug.error("Tried to call .label command on PennController.Template(); .label commands should be called on PennController()"),
        setOption: ()=>PennEngine.debug.error("Tried to call .setOption command on PennController.Template(); .setOption commands should be called on PennController()"),
        noHeader: ()=>PennEngine.debug.error("Tried to call .noHeader command on PennController.Template(); .noHeader commands should be called on PennController()"),
        noFooter: ()=>PennEngine.debug.error("Tried to call .noFooter command on PennController.Template(); .noFooter commands should be called on PennController()")
    };
};
PennController.FeedItems = (tableName, func) => PennController.Template(tableName, func);

let loadingMessageElement;
$(document).ready(function(){
    loadingMessageElement = document.createElement("P");
    loadingMessageElement.style["text-align"] = "center";
    loadingMessageElement.innerHTML = "Loading, please wait..."; // A message in case PennController+Tables incur slow down
    loadingMessageElement.id = "FirstLoadingMessage";
    document.body.appendChild(loadingMessageElement);
});

// Inject items with Template before sequence is generated (no need to mess with latin-square designs)
PennEngine.Prerun(()=>{
    for (let entry in window.CHUNKS_DICT) {                 // Convert any csv/tsv into a table
        if (entry.match(/\.(html?|mp3)$/i))
            continue;
        let table = _checkTable(window.CHUNKS_DICT[entry]); // Try to interpret it as a CSV
        if (table){                                         // Success: add it to the list and return
            table = new Table(table, entry);
            PennEngine.tables[entry] = table;
        }
        else {
            table = $.csv.toObjects(window.CHUNKS_DICT[entry], {separator: "\t"});
            if (Object.keys(table[0]).length > 1){              // Try to interpret it as a TSV
                table = new Table(table, entry);
                PennEngine.tables[entry] = table;
            }
        }
    }
    for (let i = 0; i < asyncFeedItems.length; i++)
        asyncFeedItems[i].call();                           // Run FeedItems now that CHUNK_DICT is defined
    if (loadingMessageElement)                              // Remove the loading message (but not before 500ms)
        document.body.removeChild(loadingMessageElement);

});

Object.defineProperty(PennController, "defaultTable", {
    get: function(){
        let table = new TableHandler();
        table.name = defaultTable;
        return table;
    }
});
