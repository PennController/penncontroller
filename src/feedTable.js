//import {_loadjQueryCSV} from "./jQueryCSV.js";
import "jquery-csv";

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
PennController.FeedItems = function (param1, param2) {
    // Looks for a CSV file defining a datasource in chunk_includes
    function _smartTableDetection() {
        function _checkTable(table){
            // Load the jQuery-CSV plugin
            // if (!$.csv)
            //     _loadjQueryCSV();
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
    // No table specified, try to automatically detect
    if (param1 instanceof Function && param2 == undefined) {
        let table = _smartTableDetection();
        if (table == Abort)
            return Abort;
        table = new Table(table);
        if (!(window.items instanceof Array))
            window.items = [];
        window.items = window.items.concat(_getItemsFrom(table, param1));
        //return _getItemsFrom(table, param1);
    }
    else {
        if (typeof(param1) == "string")
            return Abort;
        // else if (param1 instanceof PennController.Table)
    }
};