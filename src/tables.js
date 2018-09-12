import "jquery-csv";
import { PennController } from "./controller.js";

var tables = {};                // Dictionary of named tables
var defaultTable = {};          // A dummy object representing the default table handler

// The TABLE class contains an 2x2 Array-Object and defines Item, Group and Label
class Table {
    constructor(table) {
        if (!(table instanceof Array) || table.length < 2 || Object.keys(table[0]).length < 2)
            return console.warn("Invalid format for table when creating new table");
        this.table = table;
        for (let col in table[0]) {
            if (col.match(/^item$/i))
                this.item = col;
            if (col.match(/^group$/i))
                this.group = col;
            if (col.match(/^label$/i))
                this.label = col;
        }
    }
    setItem(col) {                                  // Obsolete since beta 0.4 (not relying on latin square)
        if (this.table[0].hasOwnProperty(col))
            this.item = col;
        else
            console.warn("Error when setting table's item column: no column found with the name "+col);
        return this;
    }
    setGroup(col) {
        if (this.table[0].hasOwnProperty(col))
            this.group = col;
        else
            console.warn("Error when setting table's item column: no column found with the name "+col);
        return this;
    }
    setLabel(col) {
        if (this.table[0].hasOwnProperty(col))
            this.label = col;
        else
            console.warn("Error when setting table's item column: no column found with the name "+col);
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
                return (new Table(returnTable)).setItem(this.item).setGroup(this.group).setLabel(this.label);
            }
            else
                return console.warn("No column named "+args[0]+" found in the table");
        }
        else if (args.length && args[0] instanceof Function){
            let returnTable = [];
            for (let row = 0; row < this.table.length; row++){
                if (args[0].call(this.table[row]))
                    returnTable.push(this.table[row]);
            }
            return (new Table(returnTable)).setItem(this.item).setGroup(this.group).setLabel(this.label);
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
    table = $.csv.toObjects(table);
    if (Object.keys(table[0]).length > 1)                   // Check that there is more than one column
        return table;
    return console.warn("Format of table is invalid");
}


// Adds a table to the dictionary
PennController.AddTable = function(name, table) {
    if (typeof(name)!="string"||typeof(table)!="string")
        return console.warn("ERROR: tables and table names should be strings");
    if (tables.hasOwnProperty(name))
        console.warn("A table named "+name+" already exists; overriding it");
    table = _checkTable(table);
    if (table)
        table = new Table(table);
    else
        return console.warn("ERROR: table "+name+" does not have the right format.");
    tables[name] = table;
}

// Returns a table from the dictionary
PennController.GetTable = function(name) {
    return new TableHandler(name);
};



let asyncFeedItems = [];                        // All FeedItems functions are executed after setup

// The main function
// PennController.FeedItems("table.csv",        // Optional, or reference to a Table object
//     (row) => PennController(                 // Or () => ["Message", {...}, "PennController", PennController(...)]
//         p(row.text)
//         ,
//         p(row.image)
//         ,
//         p.key("FJ")
//     )    
PennController.FeedItems = function (tableName, func) {

    let constantLabel;
    let handler = {
        label: function(text){
            constantLabel = text;
        }
    };

    asyncFeedItems.push(function(){                                 // The code below will be executed after setup
        let table;
        if (tableName instanceof Function) {                        // No table name specified, try to automatically detect
            func = tableName;
            let tableNames = Object.keys(tables);
            if (tableNames.length && tables[tableNames[0]] instanceof Table)
                table = tables[tableNames[0]];
            else
                return console.warn("No valid table detected");
        }
        else if (typeof(tableName)=="string") {                     // Table name was specified
            if (tables.hasOwnProperty(tableName)) {                 // Check that it has been added
                if (tables[tableName] instanceof Table)
                    table = tables[tableName];
                else
                    return console.warn("Table "+tableName+" does not have the right format.");
            }
            else                                                    // If not added, return an error
                return console.warn("No table found with name "+tableName);
        }
        else if (tableName instanceof TableHandler){                // TableHandler: retrieve Table instance
            if (!tables)
                return console.warn("No table was defined");
            else {
                if (tableName.name == defaultTable)                 // Default: take first table
                    table = tables[Object.keys(tables)[0]];
                else if (tableName.name && tables.hasOwnProperty(tableName.name))
                    table = tables[tableName.name];                 // Take table with corresponding name
                else
                    return console.warn("No table named "+tableName.name+" was found");
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
            return console.warn("Bad format for FeedItems' first argument (should be a PennController table, table name or function from rows to Ibex elements)");

        let groups = [];
        if (table.group)
            for (let row in table.table)
                if (groups.indexOf(table.table[row][table.group])<0)
                    groups.push(table.table[row][table.group]);

        for (let row in table.table) {                              // Going through the table
            if (table.group){                                       // GROUP DESIGN
                let rowGroup = table.table[row][table.group];       // The group of this row
                let counter = window.__counter_value_from_server__; // Retrieve counter value from server
                if (typeof(window.counterOverride)=="number")
                    counter = counterOverride;                      // If user defined custom counter value
                let runningGroup = groups[counter % groups.length]; // Find out the group currently running
                if (rowGroup != runningGroup)
                    continue;                                       // Ignore this row if not the right group
            }
            let content = func(table.table[row]);                   // Create each item's content by calling func on each row
            if (!(content instanceof Array))                        // The PennController function returns an object
                content = ["PennController", content];              // which is passed along with "PennController"
            let item = ["Item-"+row];                               // Create the item itself
            if (typeof(constantLabel)=="string" && constantLabel.length)
                item[0] = constantLabel;                            // Use a constant string if defined
            else if (table.label && table.table[row].hasOwnProperty(table.label))
                item[0] = table.table[row][table.label];            // Use the label column if defined
            else if (table.item && table.table[row].hasOwnProperty(table.item))
                item[0] = "Item-"+table.table[row][table.item];     // Use the item column otherwise, if defined
            for (let c in content)
                item.push(content[c]);                              // Add the elements
            
            window.items.push(item);                                // Add the item
        }
    });

    if (!window.items)
        window.items = [];                                      // Create items so it can be fed later

    return handler;
};


let loadingMessageElement;
$(document).ready(function(){
    loadingMessageElement = document.createElement("P");
    loadingMessageElement.style["text-align"] = "center";
    loadingMessageElement.innerHTML = "Loading, please wait..."; // A message in case PennController+Tables incur slow down
    loadingMessageElement.id = "FirstLoadingMessage";
    document.body.appendChild(loadingMessageElement);
});


// $.each is called on items before sequence is created
// Inject items with FeedItems then, no need to mess with latin-square designs
let oldEach = window.$.each;
window.$.each = function(a,c,e){
    if (a==window.items){                                       // $.each is called on items after setup
        for (let entry in window.CHUNKS_DICT) {                 // Convert any csv/tsv into a table
            if (entry.match(/\.(html?|mp3)$/i))
                continue;
            let table = _checkTable(window.CHUNKS_DICT[entry]); // Try to interpret it as a CSV
            if (table){                                         // Success: add it to the list and return
                table = new Table(table);
                tables[entry] = table;
            }
            else {
                table = $.csv.toObjects(window.CHUNKS_DICT[entry], {separator: "\t"});
                if (Object.keys(table[0]).length > 1){              // Try to interpret it as a TSV
                    table = new Table(table);
                    tables[entry] = table;
                }
            }
        }
        for (let i = 0; i < asyncFeedItems.length; i++)
            asyncFeedItems[i].call();                           // Run FeedItems now that CHUNK_DICT is defined
        if (loadingMessageElement)                              // Remove the loading message (but not before 500ms)
            document.body.removeChild(loadingMessageElement);
    }
    return oldEach.call(this, a, c, e);
};

Object.defineProperty(PennController, "defaultTable", {
    get: function(){
        let table = new TableHandler();
        table.name = defaultTable;
        return table;
    }
});