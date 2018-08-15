import "jquery-csv";

var tables = {};            // Dictionary of named tables

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
    setItem(col) {
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
                return console.log("ERROR: no column named "+args[0]+" found in the table");
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

// Checks that table is of the right format, and return a csv-formatted one
function _checkTable(table){
    table = $.csv.toObjects(table);
    if (Object.keys(table[0]).length > 1)                               // Check that there is more than one column
        return table;
    table = $.csv.toObjects(CHUNKS_DICT[entry], {separator: "\t"});     // Didn't work with commas, so try with tab
    if (Object.keys(table[0]).length > 1)
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
    if (!Object.keys(tables).length)
        PennController.defaultTable = table;
    tables[name] = table;
}

// Returns a table from the dictionary
PennController.GetTable = function(name) {
    if (tables.hasOwnProperty(name)){
        return tables[name];
    }
    else
        return console.warn("ERROR: no table named "+name+" found.");
};

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
    function _smartTableDetection() {   // Looks for a CSV file defining a datasource in chunk_includes
        if (PennController.hasOwnProperty("defaultTable")) {        // A default table was defined
            let table = PennController.defaultTable;
            if (table instanceof Table)
                return table;
            else
                throw Error("Default table has an invalid format");
        }
        for (let entry in CHUNKS_DICT) {                            // No default table, look up CHUNKS_DICT
            if (entry.match(/\.(html?|mp3)$/i))
                continue;
            let table = _checkTable(CHUNKS_DICT[entry]);
            if (table)
                return new Table(table);
        }
        return console.warn("Could not automatically detect a table");  // If nothing worked, return
    }        
    function _getItemsFrom(table, pennfunc) {   // This is the function that actually creates the list of items
        let items = [];                                             // Build the items
        let groups = {};
        for (let row in table.table) {                              // Going through the table
            let content = pennfunc(table.table[row]);               // Create each item's content by calling func on each row
            if (!(content instanceof Array))                        // The PennController function returns an object
                content = ["PennController", content];              // which is passed along with "PennController"
            let item = ["Item-"+row];                               // Create the item itself
            for (let c in content)
                item.push(content[c]);
            if (table.label && table.table[row].hasOwnProperty(table.label))
                item[0] = table.table[row][table.label];            // Use the label column if defined
            else if (table.item && table.table[row].hasOwnProperty(table.item))
                item[0] = "Item-"+table.table[row][table.item];     // Use the item column otherwise, if defined
            // GROUP DESIGN
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
                if (!groups.hasOwnProperty(itemID)) 
                    groups[itemID] = {};                            // Add this item ID if not listed yet
                groups[itemID][groupID] = item;                     // Add the item
            }
            else 
                items.push(item);   // No group design: directly add the item
        }
        // GROUP DESIGN
        if (table.item && table.group) {
            let groupList = Object.keys(groups[Object.keys(groups)[0]]);    // Retrieve the list of groups
            for (let itemID in groups) {                                    // Go through each item in groups
                for (let groupID in groupList) {                            // Go through each group version of the item
                    if (!groups[itemID].hasOwnProperty(groupList[groupID])) // Check there' i's a version of this item for this group
                        return console.warn("Error: item "+itemID+" has no entry for group "+groupList[groupID]);
                    let item = groups[itemID][groupList[groupID]];          // Get the specific entry
                    item[0] = [item[0], itemID];                            // Add itemID to the label array as the latin-square ID
                    items.push(item);                                       // Add the item to the list of items
                }
                groupList.unshift(groupList.pop());                         // Cycle through groupList for next item, latin-square hack
            }
        }
        return items;
    }
    if (tableName instanceof Function) {                        // No table name specified, try to automatically detect
        func = tableName;
        table = _smartTableDetection();
        if (!table)
            return console.warn("Impossible to create a new table")
        table = new Table(table);
    }
    else if (typeof(tableName)=="string") {                     // Table name was specified
        if (tables.hasOwnProperty(tableName)) {                 // Check that it has been added
            table = _checkTable(tables[tableName]);
            if (table)
                table = new Table(table);
            else
                return console.warn("ERROR: table "+name+" does not have the right format.");
        }
        else                                                    // If not added, return an error
            return console.log("ERROR: no table found with name "+tableName);
    }
    else if (tableName instanceof Table)                        // Table name not specified, directly use the Table
        table = tableName;
    else
        return console.log("ERROR: bad format for FeedItems' first argument (should be a PennController table, table name or function from rows to Ibex elements)");
    if (!(window.items instanceof Array))                       // If global variable items not created yet, create it
        window.items = [];
    window.items = window.items.concat(_getItemsFrom(table, func)); // Feed table and func to _getItemsFrom, and append it to items
};