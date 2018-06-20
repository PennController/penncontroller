//import {_loadjQueryCSV} from "./jQueryCSV.js";
import "jquery-csv";

// Dictionary of named tables
var tables = {};

// The TABLE class contains an 2x2 Array-Object and defines Item, Group and Label
class Table {
    constructor(table) {
        if (!(table instanceof Array) || table.length < 2 || Object.keys(table[0]).length < 2)
            return Abort;
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
    setItem(col) {
        if (!this.table[0].hasOwnProperty(col)) {
            console.log("Error when setting table's item column: no column found with the name "+col);
            return Abort;
        }
        this.item = col;
    }
    setGroup(col) {
        if (!this.table[0].hasOwnProperty(col)) {
            console.log("Error when setting table's item column: no column found with the name "+col);
            return Abort;
        }
        this.group = col;
    }
    setLabel(col) {
        if (!this.table[0].hasOwnProperty(col)) {
            console.log("Error when setting table's item column: no column found with the name "+col);
            return Abort;
        }
        this.label = col;
    }
    filter(...args) {
        if (args.length == 2 && typeof(args[0]) == "string" && typeof(args[1]) == "string"){
            if (this.table[0].hasOwnProperty(args[0])){
                let returnTable = [];
                for (let row = 0; row < this.table.length; row++){
                    if (this.table[row][args[0]]==args[1])
                        returnTable.push(this.table[row]);
                }
                return new Table(returnTable);
            }
            else
                return console.log("ERROR: no column named "+args[0]+" found in the table");
        }
        else if (args.length && args[0] instanceof Function){
            let returnTable = [];
            for (let row = 0; row < this.table.length; row++){
                if (args[0].call(this.table[row]))
                    returnTable.push(this.table[row]);
            }
            return new Table(returnTable);
        }

    }
}

// Checks that table is of the right format, and return a csv-formatted one
function _checkTable(table){
    table = $.csv.toObjects(table);
    // Checking that there is more than one column
    if (Object.keys(table[0]).length > 1)
        return table;
    // If it didn't work with comma as the default separator, try with tab
    table = $.csv.toObjects(CHUNKS_DICT[entry], {separator: "\t"});
    if (Object.keys(table[0]).length > 1)
        return table;
    return null;
}


// Adds a table to the dictionary
PennController.AddTable = function(name, table) {
    if (typeof(name)!="string"||typeof(table)!="string")
        return console.log("ERROR: tables and table names should be strings");
    if (!Object.keys(tables).length)
        PennController.defaultTable = table;
    tables[name] = table;
}

// Returns a table from the dictionary
PennController.GetTable = function(name) {
    if (tables.hasOwnProperty(name)){
        let table = _checkTable(tables[name]);
        if (table)
            return new Table(table);
        else{
            console.log("ERROR: table "+name+" does not have the right format.");
            return Abort;
        }
    }
    else {
        console.log("ERROR: no table named "+name+" found.");
        return Abort;
    }
}

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
    let table;
    // Looks for a CSV file defining a datasource in chunk_includes
    function _smartTableDetection() {
        // A default table was defined
        if (PennController.hasOwnProperty("defaultTable")) {
            let table = _checkTable(PennController.defaultTable);
            if (table)
                return table;
        }
        // No default table, look up CHUNKS_DICT
        for (let entry in CHUNKS_DICT) {
            if (entry.match(/\.(html?|mp3)$/i))
                continue;
            let table = _checkTable(CHUNKS_DICT[entry]);
            if (table)
                return table;
        }
        // If nothing worked, return Abort
        return Abort;
    }        
    // This is the function that actually creates the list of items
    function _getItemsFrom(table, pennfunc) {
        // Building the items
        let items = [];
        let groups = {};
        // Going through the table
        for (let row in table.table) {
            // Creating each item's content by calling func on each row
            let content = pennfunc(table.table[row]);
            // The PennController function returns an object to be passed along with "PennController"
            if (!(content instanceof Array))
                content = ["PennController", content];
            // Creating the item itself
            let item = ["Item-"+row];
            for (let c in content)
                item.push(content[c]);
            // If a label column was defined
            if (table.label && table.table[row].hasOwnProperty(table.label))
                item[0] = table.table[row][table.label];
            // Else, if an item column was defined
            else if (table.item && table.table[row].hasOwnProperty(table.item))
                item[0] = "Item-"+table.table[row][table.item];
            // Else
            // If group design
            if (table.item && table.group) {
                //  groups = {
                //      item1: {
                //          group1: [ "Name", "Controller", Options, ... ],  
                //          group2: [ "Name", "Controller", Options, ... ]
                //      },
                //      item2: {
                //          group1: [ "Name", "Controller", Options, ... ],  
                //          group2: [ "Name", "Controller", Options, ... ]
                //      },
                //      ...
                //  }
                let itemID = table.table[row][table.item], groupID = table.table[row][table.group];
                // If this item is not listed yet, add it
                if (!groups.hasOwnProperty(itemID)) groups[itemID] = {};
                // Adding the item
                groups[itemID][groupID] = item;
            }
            // No group: directly add the item
            else items.push(item);
        }
        // If group design
        if (table.item && table.group) {
            // Retrieve the list of groups
            let groupList = Object.keys(groups[Object.keys(groups)[0]]);
            // Go through each item in groups
            for (let itemID in groups) {
                // Go through each group version of the item
                for (let groupID in groupList) {
                    // Make sure there is a version of this item for this group
                    if (!groups[itemID].hasOwnProperty(groupList[groupID])) {
                        console.log("Error: item "+itemID+" has no entry for group "+groupList[groupID]);
                        return Abort;
                    }
                    // Get the specific entry
                    let item = groups[itemID][groupList[groupID]];
                    // Rename the label to add 'itemID' as the latin-square ID
                    item[0] = [item[0], itemID];
                    // Add it to the final items
                    items.push(item);
                }
                // Cycle through groupList for next item, ensuring latin-square hack
                groupList.unshift(groupList.pop());
            }
        }
        return items;
    }
    // No table name specified, try to automatically detect
    if (tableName instanceof Function) {
        func = tableName;
        table = _smartTableDetection();
        if (table == Abort)
            return Abort;
        table = new Table(table);
    }
    // Table name was specified
    else if (typeof(tableName)=="string") {
        // Check that it has been added
        if (tables.hasOwnProperty(tableName)) {
            table = _checkTable(tables[tableName]);
            if (table)
                return new Table(table);
            else{
                console.log("ERROR: table "+name+" does not have the right format.");
                return Abort;
            }   
        }
        // If not, return an error
        else
            return console.log("ERROR: no table found with name "+tableName);
    }
    // Else, directly use the Table, if not, problem
    else if (tableName instanceof Table)
        table = tableName;
    else
        return console.log("ERROR: bad format for FeedItems' first argument (should be a PennController table, table name or function from rows to Ibex elements)");
    // If 'items' not created yet, create it
    if (!(window.items instanceof Array))
        window.items = [];
    // Feed table and func to _getItemsFrom, and append it to items
    window.items = window.items.concat(_getItemsFrom(table, func));
};