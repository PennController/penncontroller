/* This software is licensed under a BSD license; see the LICENSE file for details. */

// - Version alpha 0.4
// - Last Update:  2018, April 25
// - Changes in 0.4:
//      + Revised the preloading method
//      + Replaced all .save with .record
//      + Added the FeedItems command
// - Changes in 0.3:
//      + Added the Canvas instruction
//      + Added the Instruction.id method

// The only object available to the users
var PennController;

// The Youtube API needs global access this function
var onYouTubeIframeAPIReady;

// Making sure items is declared/accessible
var items;

// Everything else is encapsulated
(function(){


    //  =========================================
    //
    //      PENNCONTROLLER OBJECT
    //
    //  =========================================

    // Returns an object with the instructions passed as arguments
    // The object will be given to the actual controller
    PennController = function() {
        let id = _listOfControllers.length, sequence = arguments;
        // Add the controller under construction to the list
        _controller.id = id;
        _controller.sequence = sequence;
        _listOfControllers.push(_controller);
        // Resetting _controller for next one
        _controller = {};
        // ID is _instructions' length minus 2: we just pushed for NEXT controller
        return {instructions: sequence, id: id};
    };

    // General settings
    PennController.Configure = function(parameters){
        for (parameter in parameters){
            if (parameter.indexOf["PreloadResources","Configure"] < 0) // Don't override built-in functions/parameters
                PennController[parameter] = parameters[parameter];
        }
        /*
            baseURL: "http://.../",
            ImageURL: "http://.../",
            AudioURL: "http://.../",
            ...
        */
    };

    PennController.AddHost = function() {
        if (!PennController.hasOwnProperty("hosts"))
            PennController.hosts = [];
        for (let a = 0; a < arguments.length; a++) {
            if (typeof(arguments[a])=="string" && arguments[a].match(/^http:\/\//i))
                PennController.hosts.push(arguments[a]);
            else
                console.log("Warning: host #"+a+" is not a valid URL.", arguments[a]);
        }
    }


    //  =========================================
    //
    //      GENERAL INTERNAL VARIABLES
    //
    //  =========================================

    // Dummy object, ABORT keyword
    // used in the instructions' EXTEND method to abort chain of execution
    var Abort = new Object;


    // CONTROLLERS
    //
    // The current controller (upon execution)
    var _ctrlr = null;

    // The current controller (under construction)
    var _controller = {};

    // The list of controller created with PennController
    var _listOfControllers = [];

    // INSTRUCTIONS
    //
    // The instructions of each controller
    var _localInstructions = [{}];

    // PRELOADING
    //
    // All the resources that require preloading
    var _instructionsToPreload = [];

    // All the image and audio files
    var _preloadedFiles = {};
    //      ZIP
    // List of URLs to ZIP files
    var _URLsToLoad = [];
    //
    // Dictionary of Blob's for unzipped resources
    var _unzippedResources = {};
    //
    // Determines whether looking in zip files in priority
    var _zipPriority = true;
    //
    // The list of functions to call when all the files have been unzipped
    var _zipCallbacks = [];

    // How long the preloader should wait before ignoring failure to preload (ms)
    var _timeoutPreload = 120000;

    // The message that should be displayed while preloading
    var _waitWhilePreloadingMessage = "Please wait while the resources are preloading. This process may take up to 2 minutes.";

    // Whether all audio instructions should automatically preload
    var _autoPreloadAudio = true;
    
    // Whether all audio instructions should automatically preload
    var _autoPreloadImages = true;

    // Whether all video instructions should automatically preload
    var _autoPreloadVideos = true;

    // Whether ALL resources should be preloaded at once and asap
    var _globalPreload = true;

    // Youtube videos to load
    var _youtubeVideos = {};

    // The elements being appended
    var _elementsToAppend = [];

    // The instructions of each controller
    var _pennControllerResources = {};

    // Making sure that MutationObserver is defined across browsers
    const MutationObserver =
        window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    //  =========================================
    //
    //      GENERAL INTERNAL FUNCTIONS
    //
    //  =========================================

    // Adds an element to another element
    // If the other element is the main document, add a div first
    function _addElementTo(element, to, callback) {
        if (to == null)
            to = _ctrlr.element;
        if (!(element instanceof jQuery) || !(to instanceof jQuery))
            return Abort;
        // If adding directly to the controller, embed in a DIV
        if (to == _ctrlr.element)
            element = $("<div>").append(element);
        // From https://stackoverflow.com/questions/38588741/having-a-reference-to-an-element-how-to-detect-once-it-appended-to-the-document
        if (callback instanceof Function && MutationObserver) {
            let observer = new MutationObserver((mutations) => {
                if (mutations[0].addedNodes.length === 0)
                    return;
                if (Array.prototype.indexOf.call(mutations[0].addedNodes, element[0]) === -1)
                    return;
                observer.disconnect();
                callback();
            });

            observer.observe(to[0], {
                childList: true
            });
        }
        to.append(element);
    }


    //  ========================================= 
    //
    //      FEED ITEMS
    //
    //  =========================================

    // The jQuery-CSV mini plugin
    // Under MIT License
    // https://github.com/evanplaice/jquery-csv
    function _loadjQueryCSV() {
        RegExp.escape=function(r){return r.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")},function(){"use strict";var r;(r="undefined"!=typeof jQuery&&jQuery?jQuery:{}).csv={defaults:{separator:",",delimiter:'"',headers:!0},hooks:{castToScalar:function(r,e){if(isNaN(r))return r;if(/\./.test(r))return parseFloat(r);var a=parseInt(r);return isNaN(a)?null:a}},parsers:{parse:function(r,e){var a=e.separator,t=e.delimiter;e.state.rowNum||(e.state.rowNum=1),e.state.colNum||(e.state.colNum=1);var s=[],o=[],n=0,i="",l=!1;function c(){if(n=0,i="",e.start&&e.state.rowNum<e.start)return o=[],e.state.rowNum++,void(e.state.colNum=1);if(void 0===e.onParseEntry)s.push(o);else{var r=e.onParseEntry(o,e.state);!1!==r&&s.push(r)}o=[],e.end&&e.state.rowNum>=e.end&&(l=!0),e.state.rowNum++,e.state.colNum=1}function u(){if(void 0===e.onParseValue)o.push(i);else{var r=e.onParseValue(i,e.state);!1!==r&&o.push(r)}i="",n=0,e.state.colNum++}var f=RegExp.escape(a),d=RegExp.escape(t),m=/(D|S|\r\n|\n|\r|[^DS\r\n]+)/,p=m.source;return p=(p=p.replace(/S/g,f)).replace(/D/g,d),m=new RegExp(p,"gm"),r.replace(m,function(r){if(!l)switch(n){case 0:if(r===a){i+="",u();break}if(r===t){n=1;break}if(/^(\r\n|\n|\r)$/.test(r)){u(),c();break}i+=r,n=3;break;case 1:if(r===t){n=2;break}i+=r,n=1;break;case 2:if(r===t){i+=r,n=1;break}if(r===a){u();break}if(/^(\r\n|\n|\r)$/.test(r)){u(),c();break}throw new Error("CSVDataError: Illegal State [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");case 3:if(r===a){u();break}if(/^(\r\n|\n|\r)$/.test(r)){u(),c();break}if(r===t)throw new Error("CSVDataError: Illegal Quote [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]")}}),0!==o.length&&(u(),c()),s},splitLines:function(e,a){if(e){var t=(a=a||{}).separator||r.csv.defaults.separator,s=a.delimiter||r.csv.defaults.delimiter;a.state=a.state||{},a.state.rowNum||(a.state.rowNum=1);var o=[],n=0,i="",l=!1,c=RegExp.escape(t),u=RegExp.escape(s),f=/(D|S|\n|\r|[^DS\r\n]+)/,d=f.source;return d=(d=d.replace(/S/g,c)).replace(/D/g,u),f=new RegExp(d,"gm"),e.replace(f,function(r){if(!l)switch(n){case 0:if(r===t){i+=r,n=0;break}if(r===s){i+=r,n=1;break}if("\n"===r){m();break}if(/^\r$/.test(r))break;i+=r,n=3;break;case 1:if(r===s){i+=r,n=2;break}i+=r,n=1;break;case 2:var e=i.substr(i.length-1);if(r===s&&e===s){i+=r,n=1;break}if(r===t){i+=r,n=0;break}if("\n"===r){m();break}if("\r"===r)break;throw new Error("CSVDataError: Illegal state [Row:"+a.state.rowNum+"]");case 3:if(r===t){i+=r,n=0;break}if("\n"===r){m();break}if("\r"===r)break;if(r===s)throw new Error("CSVDataError: Illegal quote [Row:"+a.state.rowNum+"]");throw new Error("CSVDataError: Illegal state [Row:"+a.state.rowNum+"]");default:throw new Error("CSVDataError: Unknown state [Row:"+a.state.rowNum+"]")}}),""!==i&&m(),o}function m(){if(n=0,a.start&&a.state.rowNum<a.start)return i="",void a.state.rowNum++;if(void 0===a.onParseEntry)o.push(i);else{var r=a.onParseEntry(i,a.state);!1!==r&&o.push(r)}i="",a.end&&a.state.rowNum>=a.end&&(l=!0),a.state.rowNum++}},parseEntry:function(r,e){var a=e.separator,t=e.delimiter;e.state.rowNum||(e.state.rowNum=1),e.state.colNum||(e.state.colNum=1);var s=[],o=0,n="";function i(){if(void 0===e.onParseValue)s.push(n);else{var r=e.onParseValue(n,e.state);!1!==r&&s.push(r)}n="",o=0,e.state.colNum++}if(!e.match){var l=RegExp.escape(a),c=RegExp.escape(t),u=/(D|S|\n|\r|[^DS\r\n]+)/.source;u=(u=u.replace(/S/g,l)).replace(/D/g,c),e.match=new RegExp(u,"gm")}return r.replace(e.match,function(r){switch(o){case 0:if(r===a){n+="",i();break}if(r===t){o=1;break}if("\n"===r||"\r"===r)break;n+=r,o=3;break;case 1:if(r===t){o=2;break}n+=r,o=1;break;case 2:if(r===t){n+=r,o=1;break}if(r===a){i();break}if("\n"===r||"\r"===r)break;throw new Error("CSVDataError: Illegal State [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");case 3:if(r===a){i();break}if("\n"===r||"\r"===r)break;if(r===t)throw new Error("CSVDataError: Illegal Quote [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");throw new Error("CSVDataError: Illegal Data [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]");default:throw new Error("CSVDataError: Unknown State [Row:"+e.state.rowNum+"][Col:"+e.state.colNum+"]")}}),i(),s}},helpers:{collectPropertyNames:function(r){var e=[],a=[],t=[];for(e in r)for(a in r[e])r[e].hasOwnProperty(a)&&t.indexOf(a)<0&&"function"!=typeof r[e][a]&&t.push(a);return t}},toArray:function(e,a,t){a=void 0!==a?a:{};var s={};s.callback=void 0!==t&&"function"==typeof t&&t,s.separator="separator"in a?a.separator:r.csv.defaults.separator,s.delimiter="delimiter"in a?a.delimiter:r.csv.defaults.delimiter;var o=void 0!==a.state?a.state:{};a={delimiter:s.delimiter,separator:s.separator,onParseEntry:a.onParseEntry,onParseValue:a.onParseValue,state:o};var n=r.csv.parsers.parseEntry(e,a);if(!s.callback)return n;s.callback("",n)},toArrays:function(e,a,t){a=void 0!==a?a:{};var s={};s.callback=void 0!==t&&"function"==typeof t&&t,s.separator="separator"in a?a.separator:r.csv.defaults.separator,s.delimiter="delimiter"in a?a.delimiter:r.csv.defaults.delimiter;var o;if(void 0!==(a={delimiter:s.delimiter,separator:s.separator,onPreParse:a.onPreParse,onParseEntry:a.onParseEntry,onParseValue:a.onParseValue,onPostParse:a.onPostParse,start:a.start,end:a.end,state:{rowNum:1,colNum:1}}).onPreParse&&a.onPreParse(e,a.state),o=r.csv.parsers.parse(e,a),void 0!==a.onPostParse&&a.onPostParse(o,a.state),!s.callback)return o;s.callback("",o)},toObjects:function(e,a,t){a=void 0!==a?a:{};var s={};s.callback=void 0!==t&&"function"==typeof t&&t,s.separator="separator"in a?a.separator:r.csv.defaults.separator,s.delimiter="delimiter"in a?a.delimiter:r.csv.defaults.delimiter,s.headers="headers"in a?a.headers:r.csv.defaults.headers,a.start="start"in a?a.start:1,s.headers&&a.start++,a.end&&s.headers&&a.end++;var o,n=[];a={delimiter:s.delimiter,separator:s.separator,onPreParse:a.onPreParse,onParseEntry:a.onParseEntry,onParseValue:a.onParseValue,onPostParse:a.onPostParse,start:a.start,end:a.end,state:{rowNum:1,colNum:1},match:!1,transform:a.transform};var i={delimiter:s.delimiter,separator:s.separator,start:1,end:1,state:{rowNum:1,colNum:1}};void 0!==a.onPreParse&&a.onPreParse(e,a.state);var l=r.csv.parsers.splitLines(e,i),c=r.csv.toArray(l[0],a);o=r.csv.parsers.splitLines(e,a),a.state.colNum=1,a.state.rowNum=c?2:1;for(var u=0,f=o.length;u<f;u++){for(var d=r.csv.toArray(o[u],a),m={},p=0;p<c.length;p++)m[c[p]]=d[p];void 0!==a.transform?n.push(a.transform.call(void 0,m)):n.push(m),a.state.rowNum++}if(void 0!==a.onPostParse&&a.onPostParse(n,a.state),!s.callback)return n;s.callback("",n)},fromArrays:function(e,a,t){a=void 0!==a?a:{};var s={};s.callback=void 0!==t&&"function"==typeof t&&t,s.separator="separator"in a?a.separator:r.csv.defaults.separator,s.delimiter="delimiter"in a?a.delimiter:r.csv.defaults.delimiter;var o,n,i,l,c="";for(i=0;i<e.length;i++){for(o=e[i],n=[],l=0;l<o.length;l++){var u=void 0===o[l]||null===o[l]?"":o[l].toString();u.indexOf(s.delimiter)>-1&&(u=u.replace(new RegExp(s.delimiter,"g"),s.delimiter+s.delimiter));var f="\n|\r|S|D";f=(f=f.replace("S",s.separator)).replace("D",s.delimiter),u.search(f)>-1&&(u=s.delimiter+u+s.delimiter),n.push(u)}c+=n.join(s.separator)+"\r\n"}if(!s.callback)return c;s.callback("",c)},fromObjects:function(e,a,t){a=void 0!==a?a:{};var s={};if(s.callback=void 0!==t&&"function"==typeof t&&t,s.separator="separator"in a?a.separator:r.csv.defaults.separator,s.delimiter="delimiter"in a?a.delimiter:r.csv.defaults.delimiter,s.headers="headers"in a?a.headers:r.csv.defaults.headers,s.sortOrder="sortOrder"in a?a.sortOrder:"declare",s.manualOrder="manualOrder"in a?a.manualOrder:[],s.transform=a.transform,"string"==typeof s.manualOrder&&(s.manualOrder=r.csv.toArray(s.manualOrder,s)),void 0!==s.transform){var o,n=e;for(e=[],o=0;o<n.length;o++)e.push(s.transform.call(void 0,n[o]))}var i=r.csv.helpers.collectPropertyNames(e);if("alpha"===s.sortOrder&&i.sort(),s.manualOrder.length>0){var l=[].concat(s.manualOrder);for(u=0;u<i.length;u++)l.indexOf(i[u])<0&&l.push(i[u]);i=l}var c,u,f,d,m=[];for(s.headers&&m.push(i),c=0;c<e.length;c++){for(f=[],u=0;u<i.length;u++)(d=i[u])in e[c]&&"function"!=typeof e[c][d]?f.push(e[c][d]):f.push("");m.push(f)}return r.csv.fromArrays(m,a,s.callback)}},r.csvEntry2Array=r.csv.toArray,r.csv2Array=r.csv.toArrays,r.csv2Dictionary=r.csv.toObjects,"undefined"!=typeof module&&module.exports&&(module.exports=r.csv)}.call(this);
    }

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
                if (!$.csv)
                    _loadjQueryCSV();
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
            for (row in table.table) {
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
            if (!(items instanceof Array))
                items = [];
            items = items.concat(_getItemsFrom(table, param1));
            //return _getItemsFrom(table, param1);
        }
        else {
            if (typeof(param1) == "string")
                return Abort;
            // else if (param1 instanceof PennController.Table)
        }
    };

    //  =========================================
    //
    //      PRELOADER ENGINE
    //
    //  =========================================

    // Returns only the items that will be run (see latin-squared designs)
    // called by _checkPreload (but could be useful for other tricks)
    function _filteredItems(items) {
        let filteredItems = [];
        let latinSquared = {};
        // Going through the items
        for (let i in items) {
            let item = items[i];
            // If item is not latin-squared, add it to filteredItems
            if (!(item[0] instanceof Array))
                filteredItems.push(item);
            // If it is latin-squared, add it to latinSquared under its key
            else if (item[0].length > 1) {
                let key = item[0][1];
                if (!latinSquared.hasOwnProperty(key))
                    latinSquared[key] = [];
                latinSquared[key].push(item);
            }
        }
        let counter;
        if (typeof(counterOverride) != "undefined")
            counter = counterOverride;
        else
            counter = __counter_value_from_server__;
        // Now go through the latin-squared items
        for (let l = 0; l < Object.keys(latinSquared).length; l++) {
            let itemsInGroup = latinSquared[ Object.keys(latinSquared)[l] ];
            let localCounter = ((counter % itemsInGroup.length) + l) % itemsInGroup.length;
            filteredItems.push(itemsInGroup[localCounter]);
        }
        return filteredItems;
    };

    // Feeds the passed controller so as to wait for the resources of the matching items to be preloaded
    // called by the controller (see define_ibex_controller below)
    function _checkPreload(controller) {
        // ====     BUILD LIST OF RESOURCES     ====
        //
        let instructions = [];

        // Build the list of label predicates (see IBEX shuffle.js)
        let labelPredicates = [];
        // If label predicates are passed, go through them
        if (controller.options.preload.hasOwnProperty(0)) {
            for (let c in controller.options.preload) {
                let predicate = controller.options.preload[c];
                if (typeof(predicate) == "number")
                    continue;
                // Convert any string into a predicate (see IBEX's shuffle.js)
                if (typeof(predicate) == "string")
                    predicate = (s) => s == controller.options.preload[c];
                labelPredicates.push(predicate);
            }
        }
        // No predicate passed: all labels are in
        else
            labelPredicates = [anyType];
        // Get the list of items that will be run (exclude items not target by latin-squared designs)
        let filteredItems = _filteredItems(items);
        // Go through the list of items
        for (let i in filteredItems) {
            let item = filteredItems[i];
            // Get the label of the item
            let label = item[0];
            // If the item is latin-squared (ie., label is an array) label is actually label's first element
            if (label instanceof Array)
                label = item[0][0];
            // Go through the label predicates
            let match = false;
            for (l in labelPredicates) {
                // If the label satisfies a predicate, then will add its instructions to the list
                if (labelPredicates[l](label)) {
                    match = true;
                    break;
                }
            }
            // If no match was found, go to the next item
            if (!match)
                continue;
            // Check whether there are PennController elements in the item
            let previousIsPennController = false;
            for (let el in item) {
                // First element is label [+ latin-square]
                if (el == 0)
                    continue;
                let element = item[el];
                // If the previous element was the string "PennController"
                if (previousIsPennController) {
                    // Reset for next elements
                    previousIsPennController = false;
                    // Making sure the current element is indeed a penncontroller
                    if (element instanceof Object && element.hasOwnProperty("id")) {
                        // Add the PennController's resources
                        instructions = instructions.concat(_listOfControllers[element.id].preloadingInstructions);
                    }
                }
                // If the current element is the string "PennController," note it down
                if (el > 0 && element == "PennController")
                    previousIsPennController = true;
            }
        }
        // ====     CREATE CONTROLLER'S CONTENT (AND TIMER)     ====
        //        
        // Add the preloading message
        let wait = $("<div id='waitWhilePreloading'>").append(_waitWhilePreloadingMessage);
        controller.element.append( wait );
        // Go through the instructions to preload
        for (let i in instructions) {
            let instruction = instructions[i];
            if (instruction && _instructionsToPreload.indexOf(instruction)>=0) {
                if (!controller.toPreload)
                    controller.toPreload = [];
                // Add the instruction only if not already listed
                if (controller.toPreload.indexOf(instruction) < 0) {
                    controller.toPreload.push(instruction);
                    // Extend _setResource (called when preload is done)
                    instruction._setResource = instruction.extend("_setResource", function(){
                        // Remove the entry (set index here, as it may have changed by the time callback is called)
                        let index = controller.toPreload.indexOf(instruction);
                        if (index >= 0)
                            controller.toPreload.splice(index, 1);
                        // If no more file to preload, finish
                        if (controller.toPreload.length <= 0 && jQuery.contains(document, wait[0])) {
                            wait.remove();
                            controller.finishedCallback();
                        }
                    });
                }
            }
        }
        // If all resources already preloaded anyway, proceed
        if ((!controller.toPreload || controller.toPreload.length <= 0) && jQuery.contains(document, wait[0])) {
            wait.remove();
            controller.finishedCallback();
        }
        // Else, make sure to set a timeout
        else {
            setTimeout(function(){
                // Abort if wait no longer displayed (ie., preloading's done)
                if (!jQuery.contains(document, wait[0]))
                    return Abort;
                wait.remove();
                controller.finishedCallback();
            }, controller.options.timeout);
        }
        return Abort;
    };

    // Creates a CheckPreload item, to be used in an item definition in place of PennController
    // see define_ibex_controller for how it contributes to calling _checkPreload
    PennController.CheckPreload = function () {
        // If CheckPreload was called, then override _globalPreload
        _globalPreload = false;
        let timeout = arguments[Object.keys(arguments).length-1];
        if (typeof(timeout) != "number" || timeout <= 0)
            timeout = _timeoutPreload
        // Return the object below; the controller will know how to deal with it (see define_ibex_controller below)
        return {preload: arguments, timeout: timeout, countsForProgressBar: false};
    };

    // Settings for auto preloading
    PennController.AutoPreload = function (parameter) {
        if (parameter == "images") {
            _autoPreloadVideos = false;
            _autoPreloadAudio = false;
            _autoPreloadImages = true;
        }
        else if (parameter == "audio") {
            _autoPreloadAudio = true;
            _autoPreloadImages = false;
            _autoPreloadVideos = false;
        }
        else if (parameters == "video") {
            _autoPreloadVideos = true;
            _autoPreloadAudio = false;
            _autoPreloadImages = false;
        }
        else if (typeof(parameter) == "object") {
            if (parameter.hasOwnProperty("images"))
                _autoPreloadImages = parameter.images;
            if (parameter.hasOwnProperty("audio"))
                _autoPreloadAudio = parameter.audio;
            if (parameter.hasOwnProperty("videos"))
                _autoPreloadVideos = parameter.videos;
        }
        else {
            _autoPreloadAudio = true;
            _autoPreloadImages = true;
            _autoPreloadVideos = true;
        }
    };

    // Loads the file at each URL passed as an argument
    // Files can be ZIP files, image files or audio files
    PennController.PreloadZip = function () {
        for (let url in arguments)
            _URLsToLoad.push(arguments[url]);
    };

    // Internal loading of the zip files
    // Will be executed when jQuery is ready
    function _preloadZip () {
        // If no zip file to download, that's it, we're done
        if (!_URLsToLoad.length) return;
        // Called for each URL that was passed
        var getZipFile = function(url){
            // Called to remove a URL from the array (when unzipped done, or error)
            function removeURL() {
                let index = _URLsToLoad.indexOf(url);
                if (index >= 0)
                    _URLsToLoad.splice(index,1);
                // If all the ZIP archives have been unzipped, call the callbacks
                if (_URLsToLoad.length<=0) {
                    console.log(_unzippedResources);
                    for (f in _zipCallbacks) {
                        if (_zipCallbacks[f] instanceof Function)
                            _zipCallbacks[f].call();
                    }
                }
            }
            var zip = new JSZip();
            JSZipUtils.getBinaryContent(url, function(error, data) {
            if (error) {
                // Problem with downloading the file: remove the URL from the array
                removeURL();
                // Throw the error
                throw error;
            }
            // Loading the zip object with the data stream
            zip.loadAsync(data).then(function(){
                console.log("Download of "+url+" complete");
                // Number of files unzipped
                var unzippedFilesSoFar = 0;
                // Going through each zip file
                zip.forEach(function(path, file){
                    // Unzipping the file, and counting how far we got
                    file.async('arraybuffer').then(function(content){
                        // Excluding weird MACOS zip files
                        if (!path.match(/__MACOS.+\/\.[^\/]+$/)) {
                            // Getting rid of path, keeping just filename
                            let filename = path.replace(/^.*?([^\/]+)$/,"$1");
                            // Type will determine the type of Blob and HTML tag
                            let type = "";
                            // AUDIO
                            if (filename.match(/\.(wav|mp3|ogg)$/i))
                                type = "audio/"+filename.replace(/^.+\.([^.]+)$/,"$1").replace(/mp3/i,"mpeg").toLowerCase();
                            // IMAGE
                            else if (filename.match(/\.(png|jpe?g|gif)$/i))
                                type = "image/"+filename.replace(/^.+\.([^.]+)$/,"$1").replace(/jpg/i,"jpeg").toLowerCase();
                            // Add blob only if type was recognized (ie. type != "")
                            if (type.length > 0)
                                // Create the BLOB object
                                _unzippedResources[filename] = {blob: new Blob([content], {type: type}), type: type};
                                // SRC attribute points to the dynamic Blob object
                            //let attr = {src: URL.createObjectURL(blob), type: type};
                        }
                        unzippedFilesSoFar++;
                        // All files unzipped: remove the URL from the array
                        if (unzippedFilesSoFar >= Object.keys(zip.files).length)
                            removeURL();
                    });
                });
            });
          });
        };
        
        // Fetch the zip file
        for (let u in _URLsToLoad) {
            let url = _URLsToLoad[u];
            let extension = url.match(/^https?:\/\/.+\.(zip)$/i);
            if (typeof(url) != "string" || !extension) {
                console.log("Warning (Preload): entry #"+u+" is not a valid URL, ignoring it");
                continue;
            }
            else if (extension[1].toLowerCase() == "zip")
                getZipFile(url);
        }
    };

    // Load the Youtube API (see https://developers.google.com/youtube/iframe_api_reference)
    // Will be executed when jQuery is ready
    function _loadYTAPI () {
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        var player;
        onYouTubeIframeAPIReady = function(){
            for (y in _youtubeVideos) {
                _youtubeVideos[y].call();
            }
        }
    };

    // Start to download the zip files as soon as the document is ready
    $(document).ready(function(){
        // Preload any zip file
        _preloadZip();
        // Load the YT API
        _loadYTAPI();
    });

    //  =========================================
    //
    //      INSTRUCTION CLASSES
    //
    //  =========================================

    // General Instruction class
    class Instruction {

        constructor(content, type) {
            this.type = type;
            this.content = content;
            this.hasBeenRun = false;
            this.isDone = false;
            this.parentElement = null;          // To be set by caller
            this.element = null;
            this.origin = this;
            this.itvlWhen = null;               // Used in WHEN
            this.resource = null;
            // J provides with copies of the element's methods/attributes that return instructions/conditional functions
            this.j = {}
            //console.log("Created instruction of type "+type+" with "+this.content);
            // Add instruction to the current controller
            if (!_controller.hasOwnProperty("instructions"))
                _controller.instructions = [];
            _controller.instructions.push(this);
        }

        // Method to set the jQuery element
        // Feeds the J attribute
        setElement(element) {
            // Set the element
            this.element = element;
            let ti = this;
            // And feed J with copies of methods/attributes
            for (let property in this.origin.element) {
                // If method, function that calls the element's method and returns an instruction (done immediately)
                if (typeof(ti.origin.element[property]) == "function") {
                    ti.j[property] = function() {
                        ti.origin.element[property].apply(ti.origin.element, arguments);
                        return ti.newMeta(function(){ 
                            this.done();
                        });
                    };
                }
                // If attribute, function that returns that attribute
                else
                    ti.j[property] = function() { return ti.origin.element[property]; }
            }
        }

        // Adds a file to preloading
        _addToPreload() {
            // If the resource has already been set, preloading is already done
            if (this.origin.resource)
                return Abort;
            if (_instructionsToPreload.indexOf(this.origin)<0)
                _instructionsToPreload.push(this.origin);
            // And add the file to the current controller
            if (!_controller.hasOwnProperty("preloadingInstructions"))
                _controller.preloadingInstructions = [];
            if (_controller.preloadingInstructions.indexOf(this.origin)<0)
                _controller.preloadingInstructions.push(this.origin);
        }

        // Method to set the resource
        // Can be AUDIO or IMAGE
        _setResource(resource) {
            // If resource already set, throw a warning and abort
            if (this.origin.resource) {
                console.log("Warning: trying to replace resource for "+this.origin.content+"; several host copies of the same file? Ignoring new resource.");
                return Abort;
            }
            // Remove the instruction('s origin) from the list
            let idx = _instructionsToPreload.indexOf(this.origin);
            if (idx >= 0)
                _instructionsToPreload.splice(idx, 1);
            // Set the resource
            this.origin.resource = resource;
        }

        // Method to fetch a resource
        // Used by AudioInstr, ImageInstr, VideoInstr (YTInstr deals differently)
        fetchResource(resource, type) {
            let ti = this;

            // If resource already set, stop here
            if (this.origin.resource)
                return Abort;

            // Priority to zipped resources: wait for everything to be unzipped first
            if (_zipPriority && _URLsToLoad.length>0 && !resource.match(/^http/i)) {
                _zipCallbacks.push(function() {
                    ti.fetchResource(resource, type);
                });
                return;
            }
            let element;
            let src;
            let event = "load";
            // If resource is part of unzipped resources
            if (_unzippedResources.hasOwnProperty(resource)) {
                type = _unzippedResources[resource].type;
                src = URL.createObjectURL(_unzippedResources[resource].blob);
                // Firefox won't reach readyState 4 with blob audios (but doesn't matter since file is local)
                if (type.match(/audio/))
                    event = "canplay";
            }
            // Try to load the file at the given URL
            else if (resource.match(/^http/i)) {
                let extension = resource.match(/\.([^.]+)$/);
                // Resource should have an extension
                if (!type && !extension) {
                    console.log("Error: extension of resource "+file+" not recognized");
                    return Abort;
                }
                // Getting the extension itself rather than the whole match
                extension = extension[1];
                // AUDIO FILE
                if (type == "audio" || extension.match(/mp3|ogg|wav/i)) {
                    type = "audio/"+extension.toLowerCase().replace("mp3","mpeg").toLowerCase();
                    src = resource;
                    event = "canplaythrough";
                }
                // IMAGE
                else if (type == "image" || extension.match(/gif|png|jpe?g/i)) {
                    type = "image/"+extension.replace(/jpg/i,"jpeg").toLowerCase();
                    src = resource;
                }
                // VIDEO
                else if (type == "video" || extension.match(/mp4|ogg|webm/i)) {
                    // TO DO
                }
            }
            // Else, call fetchResource with each host URL (if any)
            else if (PennController.hosts.length) {
                // Trying to fetch the image from the host url(s)
                for (let h in PennController.hosts) {
                    if (typeof(PennController.hosts[h]) != "string" || !PennController.hosts[h].match(/^http/i))
                        continue;
                    ti.fetchResource(PennController.hosts[h]+resource, type);
                }
            }

            // If Audio
            if (type.match(/audio/)) {
                // Add SOURCE inside AUDIO, and add 'preload=auto'
                element = $("<audio>").append($("<source>").attr({src: src, type: type}))
                                      .css("display", "none")
                                      .attr({preload: "auto"});
                // If the file was so fast to load that it can already play
                if (element.get(0).readyState > (4 - (event=="canplay")))
                    ti._setResource(element);
                // Otherwise, bind a CANPLAYTHROUGH event
                else 
                    element.one(event, function(){
                        // Once can play THROUGH, remove instruction from to preload
                        ti._setResource(element);
                    });
            }
            // If image, add it directly (no need to preload)
            else if (type.match(/image/)) {
                element = $("<img>").attr({src: src, type: type});
                element.bind(event, function() {
                    // Set resource
                    ti.origin._setResource(element);
                }).bind("error", function() {
                    console.log("Warning: could not find image "+resource);
                });
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        // Run once the instruction has taken effect
        done() {
            if (this.isDone || !this.hasBeenRun)
                return Abort;
            // Cannot be done if has a previous instruction that is not done yet
            if (this.previousInstruction instanceof Instruction && !this.previousInstruction.isDone)
                return Abort;
            // If instruction was called with WHEN clear any timeout
            if (this.itvlWhen)
                clearInterval(this.itvlWhen);
            this.isDone = true;
        }

        // Run by previous element (by default)
        run() {
            if (this.hasBeenRun)
                return Abort;
            // Cannot be run if has a previous instruction that is not done yet
            if (this.previousInstruction instanceof Instruction && !this.previousInstruction.isDone)
                return Abort;
            this.hasBeenRun = true;
        }


        // ========================================
        // INTERNAL METHODS
        // ========================================

        // Returns a new function executing the one passed as argument after THIS one (chain can be aborted)
        extend(method, code) {
            let ti = this, m = ti[method];
            return function(){
                if (m.apply(ti,arguments) == Abort)
                    return Abort;
                return code.apply(ti,arguments);
            }
        }

        // Sets when a WHEN instruction is done
        // By default: upon click if clickable, timer otherwise
        _whenToInsist(tryToValidate) {
            let ti = this;
            if (this.origin.clickable)
                this.origin.element.click(tryToValidate);
            else
                this.itvlWhen = setInterval(tryToValidate, 10);                    
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction that runs ifFailure if conditionalFunction is not met
        // Done when source is done and conditionalFunction is met
        when(conditionalFunction, ifFailure) {
            return this.newMeta(function(){ 
                // Instruction immediately done if condition met
                if (conditionalFunction())
                    this.done();
                // Else, run ifFailure and find way to validate later
                else {
                    // If ifFailure is an instruction, run it
                    if (ifFailure instanceof Instruction) {
                        ifFailure.parentElement = _ctrlr.element;
                        ifFailure.run();
                    }
                    // If ifFailure is a function, execute it
                    else if (ifFailure instanceof Function)
                        ifFailure();
                    // Try to insist
                    let ti = this;
                    this._whenToInsist(function(){
                        if (!ti.isDone && conditionalFunction()) 
                            ti.done();
                    });
                }
            });
        }

        // Converts into a META instruction
        newMeta(callback, before) {
            // Maybe newMeta shouldn't pass on the source's content?
            //let source = this, instr = new this.origin.constructor(this.content);
            let source = this, instr = new this.origin.constructor(Abort);
            // This will be called after source is run (actual running of this instruction)
            instr.sourceCallback = function(){
                // Cannot be run if sources not done yet
                let currentInstruction = this;
                while (currentInstruction.source) {
                    if (!currentInstruction.source.isDone)
                        return Abort;
                    currentInstruction = currentInstruction.source;
                }
                instr.hasBeenRun = true;
                if (typeof callback == "function")
                    callback.apply(instr, arguments);
            };
            instr.before = function(){
                if (typeof before == "function")
                    before.apply(instr, arguments);
            };
            // Rewrite any specific DONE method
            instr.done = function(){ 
                if (Instruction.prototype.done.apply(instr) == Abort)
                    return Abort;
                // Cannot be done if sources not done yet
                let currentInstruction = this;
                while (currentInstruction.source) {
                    if (!currentInstruction.source.isDone)
                        return Abort;
                    currentInstruction = currentInstruction.source;
                }
            };
            // Rewrite any specific RUN method
            instr.run = function(){
                if (Instruction.prototype.run.apply(instr) == Abort)
                    return Abort;
                // Should not be considered run yet (only so in callback)
                instr.hasBeenRun = false;
                instr.before();
                if (!source.hasBeenRun){
                    source.done = source.extend("done", function(){ instr.sourceCallback(); });
                    source.run();
                }
                else {
                    instr.sourceCallback();
                }
            };
            // All other methods are left unaffected
            instr.type = "meta";
            instr.source = source;
            instr.setElement(source.element);
            instr.origin = source.origin;
            instr.toPreload = source.toPreload;
            return instr;
        }

        // Returns an instruction to remove the element (if any)
        // Done immediately
        remove() {
            return this.newMeta(function(){
                if (this.origin.element instanceof jQuery) {
                    this.origin.element.detach();
                }
                this.done();
            });
        }

        // Returns an instruction to move the origin's element
        // Done immediately
        move(where, options) {
            return this.newMeta(function(){
                if (where instanceof Instruction) {
                    let origin = where.origin.element;
                    while (where instanceof ComplexInstr && !origin.is("table"))
                        origin = origin.parent();
                    if (options == "before")
                        origin.before(this.origin.element);
                    else
                        origin.after(this.origin.element);
                }
                this.done();
            });
        }

        // Returns an instruction to resize the image to W,H
        // Done immediately
        resize(w,h) {
            return this.newMeta(function(){
                this.origin.element.css({width: w, height: h});
                this.done();
            });
        }

        // Returns an instruction to center the element inside its parent
        // Done immediately
        center() {
            return this.newMeta(function(){
                this.origin.element.parent().css("text-align","center");
                this.origin.element.css("text-align","center");
                this.origin.element.css("margin","auto");
                this.done();
            });
        }

        // Returns an instruction to shift X & Y's offsets
        // Done immediately
        shift(x, y) {
            return this.newMeta(function(){
                if (this.origin.element.css("position").match(/static|relative/)) {
                    this.origin.element.css("position", "relative");
                    this.origin.element.css({left: x, top: y});
                }
                else if (this.origin.element.css("position") == "absolute") {
                    this.origin.element.css({
                        left: this.origin.element.css("left")+x,
                        top: this.origin.element.css("top")+y
                    });
                }
                this.done();
            });
        }

        // Returns an instruction to dynamically change css
        // Done immediately
        css() {
            let arg = arguments;
            return this.newMeta(function(){
                this.origin.element.css.apply(this.origin.element, arg);
                this.done();
            });
        }

        // Returns an instruction to hide the origin's element
        // Done immediately
        hide(shouldHide) {
            if (typeof(shouldHide)=="undefined")
                shouldHide = true;
            return this.newMeta(function(){
                if (shouldHide)
                    this.origin.element.css("visibility","hidden");
                else
                    this.origin.element.css("visibility","visible");
                this.done();
            });
        }

        // Returns an instruction to wait for a click on the element
        // Done upon click on the origin's element
        click(callback) {
            return this.newMeta(function(){
                this.origin.clickable = true;
                this.origin.element.addClass(_ctrlr.cssPrefix + "clickable");
                let ti = this;
                this.origin.element.click(function(){
                    if (callback instanceof Instruction) {
                        callback.parentElement = _ctrlr.element;
                        callback.run();
                    }
                    else if (callback instanceof Function)
                        callback.apply(_ctrlr.variables);
                    ti.done();
                });
            });
        }

        // Returns an instruction to assign an id to the instruction
        // Done immediately
        id(name) {
            _localInstructions[_localInstructions.length-1][name] = this.origin;
            this.origin._id = name;
            return this.newMeta(function(){ this.done(); });
        }
    }


    // Adds a SPAN to the parent element
    // Done immediately
    class TextInstr extends Instruction {
        constructor(text) {
            super(text, "text");
            if (text != Abort) {
                this.setElement($("<span>").html(text));
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            _addElementTo(this.element, this.parentElement);
            this.done();
        }

        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Changes the content
        // Done immediately
        text(text) {
            return this.newMeta(function(){
                this.origin.content = text;
                this.origin.element.html(text);
                this.done();
            })
        }
    }


    // Adds an AUDIO to the parent element
    // Done immediately
    class AudioInstr extends Instruction {
        constructor(file) {
            super(file, "audio");
            if (file != Abort) {
                if (!file.match(/\.(ogg|wav|mp3)$/i)) {
                    console.log("Error: "+file+" is not a valid audio file.");
                    return Abort;
                }
                // Autoplay by default
                this.autoPlay = true;
                // Do not show controls by default
                this.controls = false;
                // Will be set to true when playback ends
                this.ended = false;
                // A record of the different events (play, pause, stop, seek)
                this.eventsRecord = [];
                // Whether to save plays
                this.savePlays = false;
                // Whether to save pauses
                this.savePauses = false;
                // Whether to save ends
                this.saveEnds = false;
                // Whether to save seeks
                this.saveSeeks = false;
                // Set element to SPAN (will append audio later)
                this.setElement($("<span>"));
                // Calling addToPreload immediately if settings say so 
                if (_autoPreloadAudio)
                    this.origin._addToPreload();
                // Fetch the file
                this.origin.fetchResource(file, "audio");
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            if (this.audio) {
                // Binding the whenEnded method (upon running because otherwise potential problems with other items' instructions)
                let ti = this;
                this.origin.audio.bind('ended', function(){ ti._whenEnded(); });
                // If audio not entirely preloaded yet, send an error signal
                if (this.audio.readyState < 4 && _instructionsToPreload.indexOf(this.origin)>=0)
                    _ctrlr.save("ERROR_PRELOADING_AUDIO", this.content, Date.now(), "Audio was not fully loaded");
                // Show controls
                if (this.controls) {
                    this.audio.attr('controls',true);
                    this.audio.css("display", "inherit");
                }
                // Hide audio element
                else
                    this.audio.css('display','none');
                // Adding it to the element
                this.element.append(this.audio);
                // Adding the element to the document
                _addElementTo(this.element, this.parentElement);
                // Autoplay
                if (this.autoPlay)
                    this.audio[0].play();
            }
            this.done();
        }

        // Set the AUDIO element
        _setResource(audio) {
            // Abort if origin's audio's already set
            if (this.origin.audio)
                return Abort;
            if (super._setResource(audio)==Abort)
                return Abort;
            let ti = this.origin;
            this.origin.audio = audio;
            // Record the different events
            audio.bind("play", function(){
                // Sometimes it takes time before the audio steam actually starts playing
                let actualPlay = setInterval(function() { 
                    // Check PAUSED and CURRENTIME every millisecond: then it's time to record!
                    if (!audio[0].paused && audio[0].currentTime) {
                        ti.eventsRecord.push(["play", Date.now(), audio[0].currentTime]);
                        clearInterval(actualPlay);
                    }
                }, 1);
            }).bind("ended", function(){
                ti.eventsRecord.push(["end", Date.now(), audio[0].currentTime]);
            }).bind("pause", function(){
                ti.eventsRecord.push(["pause", Date.now(), audio[0].currentTime]);
            }).bind("seeked", function(){
                ti.eventsRecord.push(["seek", Date.now(), audio[0].currentTime]);
            });
            if (this.origin.hasBeenRun) {
                this.origin.hasBeenRun = false;
                this.origin.run();
            }
        }

        // Called when the audio ends
        _whenEnded() {
            this.origin.ended = true;
        }

        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to show the audio (and its controls)
        // Done immediately
        show(doShow) {
            if (typeof(doShow) == "undefined")
                doShow = true;
            return this.newMeta(function(){ 
                this.origin.controls = doShow;
                this.done();
            });
        }

        // Returns an instruction that users should click to start playing the audio
        // Done immediately
        clickToStart() {
            return this.newMeta(function(){ 
                // Making sure the controls are visible
                if (!this.origin.controls)
                    this.origin.controls = true;
                this.origin.auto = false;
                this.done();
            });
        }
        
        // Returns an instruction to wait
        // Done when origin's element has been played
        wait() {
            // If sound's already completely played back, done immediately
            if (this.origin.ended)
                return this.newMeta(function(){ this.done(); });
            // Else, done when origin's played back
            let instr = this.newMeta();
            this.origin._whenEnded = this.origin.extend("_whenEnded", function(){
                instr.done();
            })
            return instr;
        }

        // Returns an instruction to SAVE the parameters
        // Done immediately
        record(parameters) {
            let o = this.origin, 
                saveFct = function(event) {
                    if (event == "play") {
                        if (o.savePlays)
                            return Abort;
                        o.savePlays = true;
                    }
                    else if (event == "pause") {
                        if (o.savePauses)
                            return Abort;
                        o.savePauses = true;
                    }
                    else if (event == "end") {
                        if (o.saveEnds)
                            return Abort;
                        o.saveEnds = true;
                    }
                    else if (event == "seek") {
                        if (o.saveSeeks)
                            return Abort;
                        o.saveSeeks = true;
                    }
                    else
                        return Abort;
                    // Adding it to done, because _ctrlr is not defined upon creation of instruction
                    o.done = o.extend("done", function(){
                        _ctrlr.callbackBeforeFinish(function(){
                            for (let r in o.eventsRecord) {
                                let record = o.eventsRecord[r];
                                if (record[0] == event)
                                    _ctrlr.save(o.content, record[0], record[1], record[2]);
                            }
                        });
                    });
                };
            // Argument is a string
            if (arguments.length == 1 && typeof(parameters) == "string")
                saveFct(parameters);
            // Multiple arguments
            else if (arguments.length > 1) {
                for (let a = 0; a < arguments.length; a++)
                    saveFct(arguments[a]);
            }
            // No argument (or unintelligible argument): save everything
            else {
                saveFct("play");
                saveFct("pause");
                saveFct("end");
                saveFct("seek");
            }
            return this.newMeta(function(){ this.done(); });
        }

        preload() {
            this.origin._addToPreload();
            return this.newMeta(function(){ this.done(); });
        }
    }


    // Adds an IMG to the parent element        (to be replaced with image module)    
    // Done immediately
    class ImageInstr extends Instruction {
        constructor(image, width, height) {
            super(image, "image");
            if (image != Abort) {
                let div = $("<div>").css("display", "inline-block");
                if (typeof(width) == "number" && typeof(height) == "number")
                    div.css({width: width, height: height});
                // A span to which the image will be appended upon running
                this.setElement(div);
                // This gets its value in _setResource
                this.image = null;
                // Calling addToPreload immediately if settings say so 
                if (_autoPreloadImages)
                    this.origin._addToPreload();
                this.origin.fetchResource(image, "image");
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            //this.element.append(this.image);
            _addElementTo(this.element, this.parentElement);
            this.done();
        }

        _setResource(image) {
            if (this.origin.image)
                return Abort;
            if (super._setResource(image)==Abort)
                return Abort;
            this.origin.image = image.clone();
            this.origin.element.append(this.origin.image);
            this.origin.image.css({width: "100%", height: "100%", display: "inherit"});
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to move the image to X,Y
        // Done immediately
        move(x,y) {
            return this.newMeta(function(){
                this.origin.element.css({left: x, top: y, position: 'absolute'});
                this.done();
            });
        }

        // Returns an instruction that the image should be preloaded
        // Done immediately
        preload() {
            this.origin._addToPreload();
            return this.newMeta(function(){ this.done(); });
        }
    }


    // Binds a keypress event to the document
    // Done upon keypress
    class KeyInstr extends Instruction {
        constructor(keys, caseSensitive) {
            super(keys, "key");
            if (keys != Abort) {
                this.setElement($("<key>"));
                this.keys = [];
                // Can pass a number (useful for special keys such as shift)
                if (typeof(keys) == "number")
                    this.keys.push(keys);
                // Or a string of characters
                else if (typeof(keys) == "string") {
                    for (let k in keys) {
                        // If case sensitive, add the exact charcode
                        if (caseSensitive)
                            this.keys.push(keys.charCodeAt(k));
                        // If not, add both lower- and upper-case charcodes
                        else {
                            let upperKeys = keys.toUpperCase(),
                                lowerKeys = keys.toLowerCase();
                            this.keys.push(lowerKeys.charCodeAt(k));
                            this.keys.push(upperKeys.charCodeAt(k));
                        }
                    }
                }
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        // Adds key press event
        run() {
            if (super.run() == Abort)
                return Abort;
            let ti = this;
            _ctrlr.safeBind($(document),"keydown",function(e){
                if (ti.keys.length==0 || ti.keys.indexOf(e.keyCode)>=0)
                    ti._pressed(e.keyCode);
            });
        }

        // Validate WHEN in origin's PRESSED
        _whenToInsist(tryToValidate) {
            this.origin._pressed = this.origin.extend("_pressed", tryToValidate);
        }

        // Called when the right (or any if unspecified) key is pressed
        _pressed(key) {
            if (!this.isDone) {
                this.origin.key = String.fromCharCode(key);
                this.origin.time = Date.now();
                this.origin.done();
            }
        }

        // ========================================
        // CONDITIONAL FUNCTIONS
        // ========================================

        // Returns a function to true if the key pressed matches
        // false otherwise
        pressed(keys) {
            let ti = this.origin;
            return function(){
                let key = ti.key;
                if (!key)
                    return false;
                else if (typeof(keys) == "string")
                    return RegExp(key,'i').test(keys);
                else if (typeof(keys) == "number")
                    return keys == key.charCodeAt(0);
                else
                    return key.charCodeAt(0);
            };
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to save the key that was pressed
        // Done immediately
        record(comment) {
            return this.newMeta(function(){
                let ti = this;
                _ctrlr.callbackBeforeFinish(function(){ 
                    _ctrlr.save('keypress', ti.origin.key, ti.origin.time, comment);
                });
                this.done();
            });
        }
    }


    // Runs all instructions passed as arguments
    // Done when all instructions are done (by default, but see the VALIDATION method)
    class ComplexInstr extends Instruction {
        constructor(instructions) {
            super(instructions, "complex");
            if (instructions != Abort) {
                this.table = $("<table>").addClass("PennController-Complex");
                // The instructions still to be done (initial state: all of them)
                this.toBeDone = [];
                this.setElement(this.table);
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            let ti = this;
            // Go through each instruction and add/run them if needed
            let tr = $("<tr>");
            for (let i in this.content) {
                let instruction = ti.content[i],
                    td = $("<td>");
                if (!(instruction instanceof Instruction))
                    continue;
                // If instruction already run, do nothing with it
                if (instruction.hasBeenRun)
                    continue;
                // If not run, add it to instructions to listen to
                ti.toBeDone.push(instruction);                
                // Assign each instruction to the proper parent
                function addParentElement(instr) {
                    // If complex itself, add directly to the table
                    if (instr instanceof ComplexInstr)
                        instr.parentElement = ti.table;
                    // Else, add to the current TD
                    else
                        instr.parentElement = td;
                    // If instruction has sources, navigate
                    if (instr.type == "meta" && !instr.source.parentElement)
                        addParentElement(instr.source);
                }
                // Initiate parent assigment
                addParentElement(instruction);
                // If complex instruction, should start a new TR
                if (instruction instanceof ComplexInstr) {
                    // Add current TR to the table if it contains children
                    if (tr.children().length)
                        ti.table.append(tr);
                    tr = $("<tr>");
                }
                // If not complex, simply add current TD to current TR
                else
                    tr.append(td);
                // Inform ComplexInstr (call EXECUTED) when the instruction is done
                instruction.done = instruction.extend("done", function(){ ti._executed(instruction); });
                // Run the instruction
                instruction.run();
            }
            // If current TR has children, make sure to add it to table
            if (tr.children().length)
                ti.table.append(tr);

            // If adding Complex to a TABLE, add each of its TR to its parent table
            if (this.parentElement && this.parentElement.is("table")) {
                this.table.find("tr").each(function(){
                    _addElementTo($(this), ti.parentElement);
                });
            }
            // Else, add the table to parent element
            else {
                if (this.element.is("table"))
                    _addElementTo(this.element, this.parentElement);
                else
                    _addElementTo($("<table>").append(this.element), this.parentElement);
            }
            // If every instruction is already done, this one's done too
            if (this.toBeDone.length < 1)
                this.done();
        }

        // Called when an instruction is done
        _executed(instruction) {
            let index = this.toBeDone.indexOf(instruction);
            if (index >= 0)
                this.toBeDone.splice(index, 1);
            // If there is no instruction left to be done, call done if element already added
            if (this.toBeDone.length < 1 && $.contains(document.body, this.element[0]))
                this.done();
        }

        // Overriding newMeta, as original's content poses problems
        newMeta(callback) {
            let ct = this.origin.content;
            this.origin.content = null;
            let rtn = super.newMeta(callback);
            this.origin.content = ct;
            return rtn;
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction setting the validation method
        // Done when all OR any OR specific instruction(s) done
        validation(which) {
            let instr = this.newMeta();
            this.origin._executed = this.origin.extend("_executed", function(instruction){
                // If 'any,' instruction is done as soon as one instruction is done
                if (which == "any")
                    instr.done();
                // If WHICH is an index, the complex instruction is done only when the index'th instruction is done
                else if (typeof(which) == "number" && which in this.origin.content) {
                    if (instr.origin.content[which] == instruction)
                            instr.done();
                }
                // If WHICH points to one of the instructions, complex is done when that instruction is done
                else if (which instanceof Instruction && which == instruction)
                    instr.done();
                // Otherwise, all instructions have to be done before this one's done (= origin's conditions)
                else {
                    if (instr.origin.isDone)
                        instr.done();
                }
            });
            return instr;
        }
    }


    // Adds a radio scale to the parent element
    // Done immediately
    class RadioInstr extends Instruction {
        constructor(label, length) {
            super({label: label, length: length}, "radio");
            if (label != Abort) {
                this.label = label;
                this.length = length;
                this.values = [];
                this.times = [];
                this.setElement($("<span>"));
                for (let i = 0; i < length; i++) {
                    let ti = this, input = $("<input type='radio'>").attr({name: label, value: i})
                    input.click(function(){
                        ti._clicked($(this).attr("value"));
                    });
                    ti.element.append(input);
                }
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            _addElementTo(this.element, this.parentElement);
            this.done();
        }

        // Validate WHEN in origin's CLICKED
        _whenToInsist(tryToValidate) {
            this._clicked = this.extend("_clicked", tryToValidate);
        }

        // Called upon any click on an input
        _clicked(value) {
            this.values.push(value);
            this.times.push(Date.now());
        }

        
        // ========================================
        // METHODS RETURNING CONDITIONAL FUNCTIONS
        // ========================================

        // Returns a function giving selected value/TRUE/TRUE value iff existent/= VALUES/among VALUES
        selected(values) {
            let o = this.origin;
            return function(){
                let lastvalue = o.values[o.values.length-1];
                if (typeof(values) == "undefined")
                    return lastvalue;
                else if (typeof(values) == "number" || typeof(values) == "string")
                    return (lastvalue == values);
                else if (values instanceof Array)
                    return (values.indexOf(lastvalue) >= 0 || values.indexOf(parseInt(lastvalue)) >= 0);
            };
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to wait for a click (on (a) specific value(s))
        // Done upon click meeting the specified conditions (if any)
        wait(values) {
            let instr = this.newMeta(), ti = this;
            this.origin._clicked = this.origin.extend("_clicked", function(value){
                if (typeof values == "number") {
                    if (value == values)
                        instr.done();
                }
                else if (values instanceof Array) {
                    if (values.indexOf(value) >= 0)
                        instr.done();
                }
                else
                    instr.done();
            });
            return instr;
        }

        // Returns an instruction to save the parameters
        // Done immediately
        record(parameters, comment) {
            let o = this.origin;
            return this.newMeta(function(){ 
                // Tell controller to save value(s) before calling finishedCallback
                _ctrlr.callbackBeforeFinish(function(){
                    // If the value to be saved in only the final value (default)
                    if (typeof(parameters) != "string" || parameters == "last")
                        // Store a function to save the value at the end of the trial
                        _ctrlr.save(o.label, o.values[o.values.length-1], o.times[o.times.length-1], comment);
                    else {
                        // If only saving first selected value, call _ctrlr.SAVE on first click
                        if (parameters == "first" && o.values.length == 1)
                            _ctrlr.save(o.label, o.values[0], o.times[0], comment);
                        // If all values are to be saved, call _ctrlr.SAVE on every click
                        else if (parameters == "all") {
                            for (let n in o.values)
                                _ctrlr.save(o.label, o.values[n], o.times[n], comment);
                        }
                    }
                });
                this.done();
            });
        }
    }


    // Adds a timer
    // Done immediately
    class TimerInstr extends Instruction {
        constructor(delay, callback) {
            super(delay, "timer");
            if (delay != Abort){
                this.delay = delay;
                this.setElement($("<timer>"));
                this.step = 10;
                this.callback = callback;
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            this.left = this.delay;
            let ti = this;
            /*this.timer = setInterval(function(){
                ti.left -= ti.step;
                if (ti.left <= 0){
                    clearInterval(ti.timer);
                    ti.left = 0;
                    ti._elapsed();
                }
            }, this.step);*/
            this.timer = setTimeout(function(){ ti._elapsed(); }, this.delay);
            _ctrlr.timers.push(this.timer);
            this.done();
        }

        // Called when timer has elapsed
        _elapsed() {
            if (this.callback instanceof Function)
                this.callback();
            else if (this.callback instanceof Instruction) {
                this.callback.parentElement = _ctrlr.element;
                this.callback.run();
            }
        }

        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction that prematurely stops the timer
        // Done immediately
        stop(done) {
            let ti = this, instr = this.newMeta(function() { ti.done });
            instr.run = function(){ 
                clearInterval(ti.origin.timer);
                // If DONE is true, the (origin) timer instruction is considered done upon stopping
                if (done)
                    ti.origin.done();
            }
            return instr;
        }

        // Returns an instruction after setting the origin's step
        // Done immediately
        step(value) {
            // (Re)set the step
            this.origin.step = value;
            // Return the instruction itself
            return this.newMeta(function(){ this.done(); });
        }

        // Returns an instruction to sait until the timer has elapsed
        // Done when the timer has elapsed
        wait(callback) {
            return this.newMeta(function(){
                let ti = this;
                this.origin._elapsed = this.origin.extend("_elapsed", function(){ 
                    if (callback instanceof Instruction && !callback.hasBeenRun)
                        callback.run()
                    ti.done();
                });
            });
        }
    }


    // Executes a function
    // Done immediately
    class FunctionInstr extends Instruction {
        constructor(func) {
            super(func, "function");
            if (func != Abort) {
                this.setElement($("<function>"));
                this.func = func;
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================
        run() {
            if (super.run() == Abort)
                return Abort;
            this.func.apply(_ctrlr.variables);
            this.done();
        }
    }


    // Adds something to the list of what is to be saved
    // Done immediately
    class SaveInstr extends Instruction {
        constructor(parameters) {
            super(parameters, "save");
            if (parameters != Abort) {
                this.setElement($("<save>"));
                this.parameter = parameters[0];
                this.value = parameters[1];
                this.comment = parameters[2];
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================
        run() {
            if (super.run() == Abort)
                return Abort;
            _ctrlr.save(this.parameter, this.value, Date.now(), this.comment);
            this.done();
        }
    }


    // Detaches any preceding DOM element
    // Done immediately
    class ClearInstr extends Instruction {
        constructor() {
            super("clear", "clear");
        }

        run() {
            super.run();
            this.hasBeenRun = true;
            $(".PennController-PennController div").detach();
            this.done();
        }
    }


    // Groups instruction's elements in a 'select' form
    // Done immediately (+WAIT method: upon selection)
    class SelectorInstr extends Instruction {
        constructor(arg) {
            super(arg, "selector");
            if (arg != Abort) {
                this.instructions = arg;
                this.shuffledInstructions = arg;
                this.enabled = true;
                this.canClick = true;
                this.keyList = [];
                this.shuffledKeyList = [];
                this.selectedElement = null;
                this.selectedInstruction = null;
                this.callbackFunction = null;
                this.setElement($("<div>").addClass("PennController-Selector"));
                this.selections = [];
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            let ti = this;
            // Go through each instruction
            for (let i in this.instructions) {
                let instruction = this.instructions[i];
                if (instruction instanceof Instruction) {
                    // If instruction's origin has not been run, then selector creates it: should be its parent
                    if (!instruction.origin.hasBeenRun)
                        instruction.origin.parentElement = this.element;
                    // If instruction's not been run yet, run it
                    if (!instruction.hasBeenRun)
                        instruction.run();
                    // Bind clicks
                    instruction.origin.element.bind("click", function(){
                        if (!ti.canClick)
                            return;
                        // SELECT is a method that returns an instruction
                        ti._select(instruction);
                    });
                }
                else {
                    console.log("Warning: selector's entry #"+i+" is not a proper instruction.");
                }
            }
            // Binding a keydown event
            _ctrlr.safeBind($(document), "keydown", function(e){
                // Triggering only if keys were specified
                if (!ti.keyList.length)
                    return Abort;
                for (let k in ti.shuffledKeyList){
                    if ((typeof(ti.shuffledKeyList[k])=="number" && ti.shuffledKeyList[k] == e.keyCode) ||
                        (ti.shuffledKeyList[k] instanceof Array && ti.shuffledKeyList[k].indexOf(e.keyCode)>=0))
                        ti._select(ti.shuffledInstructions[k]);
                }
            });
            // Add the div to the parent element
            _addElementTo(this.element, this.parentElement);
            // Done immediately
            this.done();
        }

        // Selects an instruction
        _select(instruction) {
            if (!this.enabled)
                return Abort;
            let ti = this.origin;
            // Select an instruction
            if (instruction instanceof Instruction) {
                ti.selectedElement = instruction.origin.element;
                ti.selectedInstruction = instruction.origin;
                // Add the 'selected' class to the element
                instruction.origin.element.addClass("PennController-selected");
                // Go through the other instructions' elements and remove the class
                for (let i in ti.instructions) {
                    // If this is the selected instruction, inform to be able to save later
                    if (ti.instructions[i].origin == instruction.origin) {
                        // If the instruction has an ID, save it
                        if (instruction.origin._id)
                            ti.selections.push([instruction.origin._id, Date.now()]);
                        // Else, save its index in the list
                        else
                            ti.selections.push([i, Date.now()]);
                    }
                    // If not the selected instruction, make sure it's not tagged as selected
                    else if (ti.instructions[i].origin.element != instruction.element)
                        ti.instructions[i].origin.element.removeClass("PennController-selected");
                }
                if (ti.callbackFunction instanceof Function)
                    ti.callbackFunction(instruction);
            }
        }

        // ========================================
        // CONDITIONAL FUNCTIONS
        // ========================================

        // Returns a conditional function as whether a (specific) instrution is selected
        selected(instruction) {
            let o = this.origin, arg = arguments;
            return function(){
                // If more than one instruction
                if (arg.hasOwnProperty("1")) {
                    for (a in arg) {
                        if (arg[a] instanceof Instruction && arg[a].origin == o.selectedInstruction)
                            return true;
                    }
                    return false;
                }
                else if (instruction instanceof Instruction) {
                    return (instruction.origin == o.selectedInstruction);
                }
                else
                    return o.selectedInstruction;
            }
        }

        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to select an instruction
        // Done immediately
        select(instruction) {
            return this.newMeta(function(){
                this.origin._select(instruction);
                this.done();
            });
        }

        // Returns an instruction that sets whether selector is clickable
        // Done immediately
        clickable(canClick) {
            return this.newMeta(function(){ 
                this.origin.canClick = canClick;
                this.done();
            });
        }

        // Returns an instruction to execute callback upon selection
        // Done immediately
        callback(instrOrFunc) {
            return this.newMeta(function(){
                this.origin._select = this.origin.extend("_select", function(){
                    if (instrOrFunc instanceof Instruction)
                        instrOrFunc.run();
                    else if (instrOrFunc instanceof Function)
                        instrOrFunc.apply(_ctrlr.variables, [this.origin.selectedInstruction]);
                });
                this.done();
            });
        }


        // Returns an instruction that associates instructions with keys
        // Done immediately
        keys() {
            let keys = arguments;
            return this.newMeta(function(){
                if (keys.hasOwnProperty("0")) {
                    if (typeof(keys[0]) == "string") {
                        let caseSensitive = keys.hasOwnProperty("1");
                        for (let i = 0; i < keys[0].length; i++){
                            if (this.origin.instructions.hasOwnProperty(i)){
                                if (caseSensitive)
                                    this.origin.keyList.push(keys[0].charCodeAt(i));
                                else
                                    this.origin.keyList.push([keys[0].toUpperCase().charCodeAt(i),
                                                              keys[0].toLowerCase().charCodeAt(i)]);
                            }
                        }
                    }
                    if (typeof(keys[0]) == "number") {
                        for (let k in keys) {
                            if (keys[k]<0)
                                console.log("Warning: invalid key code for selector instruction #"+k+", not attaching keys to it.");
                            else
                                this.origin.keyList.push(keys[k]);
                        }
                    }
                }
                this.origin.shuffledKeyList = this.origin.keyList;
                this.done();
            });
        }

        // Returns an instruction to shuffle the presentation of the instructions
        // Done immediately
        // NOTE: if KEYS is called before, keys are shuffled, if called after, they are not
        shuffle(arg) {
            let ti = this.origin;
            return this.newMeta(function(){
                let instructionIndices = [];
                // If no argument, just add every instruction's index
                if (typeof(arg)=="undefined") {
                    for (let i in ti.instructions)
                        instructionIndices.push(i);
                }
                // Else, first feed instructionIndices
                else {
                    // Go through each argument
                    for (let i in arguments) {
                        let instruction = arguments[i];
                        // NUMBER: check there is an instruction at index
                        if (typeof(instruction)=="number" && 
                            ti.instructions.hasOwnProperty(instruction) &&
                            instructionIndices.indexOf(instruction)<0)
                                instructionIndices.push(instruction);
                        // INSTRUCTION: check that instruction is contained
                        else if (instruction instanceof Instruction) {
                            for (let i2 in this.origin.instructions) {
                                if (ti.instructions[i2].origin==instruction.origin && instructionIndices.indexOf(i2)<0)
                                    instructionIndices.push(i2);
                            }
                        }
                    }
                }
                let unshuffled = [].concat(instructionIndices);
                // Now, shuffle the indices
                fisherYates(instructionIndices);
                // Reset the lists
                ti.shuffledInstructions = $.extend({}, ti.instructions);
                ti.shuffledKeyList = [].concat(ti.keyList);
                // Go through each index now
                for (let i in instructionIndices) {
                    let oldIndex = unshuffled[i],
                        newIndex = instructionIndices[i], 
                        origin = ti.instructions[newIndex].origin;
                    ti.shuffledInstructions[oldIndex] = ti.instructions[newIndex];
                    if (oldIndex < ti.keyList.length)
                        ti.shuffledKeyList[oldIndex] = ti.keyList[newIndex];
                    // Add a SHUFFLE tag with the proper index before each instruction
                    let shuf = $("<shuffle>").attr("id", oldIndex).css({
                        position: ti.instructions[newIndex].origin.element.css("position"),
                        left: ti.instructions[newIndex].origin.element.css("left"),
                        top: ti.instructions[newIndex].origin.element.css("top")
                    });
                    origin.element.before(shuf);
                } 
                // Go through each shuffle tag
                $("shuffle").each(function(){
                    let index = $(this).attr('id');
                    // Add the element of the INDEX-th instruction there
                    $(this).after(ti.instructions[index].origin.element);
                    // And update relevant CSS
                    ti.instructions[index].origin.element.css({
                        position: $(this).css("position"),
                        left: $(this).css("left"),
                        top: $(this).css("top")
                    });
                })
                // And now remove every SHUFFLE tag
                $("shuffle").remove();
                this.done();
            });
        }

        // Returns an instruction to disable the selector right after first selection
        // Done immediately
        once() {
            let ti = this.origin;
            ti._select = ti.extend("_select", function(){ ti.enabled = false; });
            return this.newMeta(function(){
                this.done();
            });
        }

        // Returns an instruction to enable/disable the selector
        // Done immediately
        enable(active) {
            if (typeof(active)=="undefined")
                active = true;
            return this.newMeta(function(){
                this.origin.enabled = active;
                this.done();
            });
        }

        // Returns an instruction to save the selection(s)
        // Done immediately
        record(parameters) {
            return this.newMeta(function(){
                let o = this.origin;
                _ctrlr.callbackBeforeFinish(function(){ 
                    if (!o.selections.length)
                        return Abort;
                    if (typeof(parameters) == "string") {
                        if (parameters == "first")
                            _ctrlr.save("selection", o.selections[0][0], o.selections[0][1], "NULL");
                        else if (parameters == "last")
                            _ctrlr.save("selection", o.selections[o.selections.length-1][0], o.selections[o.selections.length-1][1], "NULL");
                        else {
                            for (let s in o.selections)
                                _ctrlr.save("selection", o.selections[s][0], o.selections[s][1], "NULL");
                        }
                    }
                    else {
                        for (let s in o.selections)
                                _ctrlr.save("selection", o.selections[s][0], o.selections[s][1], "NULL");
                    }
                });
                this.done();
            });
        }

        // Returns an instruction to wait for something to be selected
        // Done upon selection
        wait() {
            return this.newMeta(function(){ 
                let ti = this;
                if (this.origin.selected().call())
                    this.done();
                else
                    this.origin._select = this.origin.extend("_select", function(){ ti.done(); });
            });
        }
    }


    // Conditionally runs one or another instruction
    // Done when executed instruction is done
    class IfInstr extends Instruction {
        constructor(condition, success, failure) {
            super(arguments, "if");
            if (condition != Abort) {
                this.setElement($("<div>").addClass("PennController-Condition"));
                this.condition = condition;
                this.success = success;
                this.failure = failure;
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            if (!this.success instanceof Instruction)
                return Abort;
            if (!this.condition instanceof Function)
                return Abort;
            let ti = this;
            if (this.condition()) {
                //this.success.origin.parentElement = this.element;
                this.success.done = this.success.extend("done", function(){ ti.done(); });
                this.success.run();
            }
            else if (this.failure instanceof Instruction) {
                //this.failure.origin.parentElement = this.element;
                this.failure.done = this.failure.extend("done", function(){ ti.done(); });
                this.failure.run();
            }
            else {
                this.done();
            }
        }
    }


    // Adds a Youtube video
    // Done immediately
    class YTInstr extends Instruction {
        constructor(code) {
            super(code, "youtube");
            if (code != Abort){
                let ti = this;
                // This function creates a player through the YT API
                let createPlayer = function() {
                    ti.origin.player = new YT.Player(code, {
                        videoId: code,
                        events: {
                            'onReady': function(event){ ti.origin._ready(event); },
                            'onStateChange': function(event){ 
                                if (event.data == YT.PlayerState.ENDED) ti.origin._ended(event);
                                else if (event.data == YT.PlayerState.BUFFERING) ti.origin._buffering(event);
                                else if (event.data == YT.PlayerState.PLAYING) ti.origin._playing(event);
                                else if (event.data == YT.PlayerState.CUED) ti.origin._canPlay(event);
                                else if (event.data == YT.PlayerState.PAUSED) ti.origin._paused(event);
                            }
                        }
                    });
                };
                // IFRAME
                // Not loaded at first
                this.iframeLoaded = false;
                // Creating the iframe element (TODO: check preloaded files, no need to recreate each time)
                this.iframe = $("<iframe>");
                this.iframe.attr({src: "https://www.youtube-nocookie.com/embed/"+code+"?enablejsapi=1", id: code, frameborder: 0})
                           .bind("load", function(){ ti.origin.iframeLoaded = true; }); // Signal loading
                // Add the frame to html (invisible)
                $("html").append(this.iframe.css({display: "none", position: "absolute"}));
                // The instruction's element is a DIV, because iframe needs to be global (appending it would RECREATE it)
                this.setElement($("<div>"));
                // If the player has not already been created
                if (!_youtubeVideos.hasOwnProperty(code)) {
                    // Add a player to be created when the YT API is ready (see above in PRELOADER ENGINE)
                    _youtubeVideos[code] = function(){
                        // If the iframe is not ready yet, wait before creating the player
                        if (!ti.origin.iframeLoaded)
                            ti.origin.iframe.bind("load", createPlayer);
                        // If it is ready, create the player already
                        else
                            createPlayer();
                    };
                }
                // Visual information
                this.visual = {
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0
                };
                // Autoplay by default
                this.autoPlay = true;
                // Asynchronous commands: need to keep track
                this.commandsQueue = [];
                // Not played yet
                this.hasPlayed = false;
                // Calling addToPreload immediately if settings say so 
                if (_autoPreloadVideos)
                    this.origin._addToPreload();
            }
        }

        // ========================================
        // PRIVATE & INTRINSIC METHODS
        // ========================================
        run() {
            if (super.run() == Abort)
                return Abort;
            let ti = this.origin;
            // Bind any mutation to the div element to the iframe
            let observer = new MutationObserver(function(mutations) {
                // Check that the element is in the DOM and visible
                if ($.contains(document.body, ti.element[0]) && ti.element[0].offsetParent) {
                    let w = ti.element.width(), h = ti.element.height();
                    if (w != ti.visual.width || h != ti.visual.height) {
                        ti.iframe.css({width: w, height: h, display: "block"});
                        ti.visual.width = w;
                        ti.visual.height = h;
                    }
                    let o = ti.element.offset(), x = o.left, y = o.top;
                    if (x != ti.visual.left || y != ti.visual.top) {
                        ti.iframe.css({left: x, top: y, display: "block"});
                        ti.visual.left = x;
                        ti.visual.top = y;
                    }

                }
            });
            // Listen to any modification that might affect the display of the div
            observer.observe(document.body, { childList : true, attributes : true, subtree : true });
            // Add the div element to the document (any mutation is listened)
            _addElementTo(this.element, this.parentElement);
            // If player exists, start playback
            if (ti.origin.player && ti.origin.autoPlay)
                ti._play();
            // Stop playing the video when the trial is over
            _ctrlr.callbackBeforeFinish(function(){
                ti._forcePause();
            });
        }

        // Force playing because playVideo sometimes simply has no effect at all
        _forcePlay() {
            let ti = this.origin, i = 0, ivl = setInterval(function(){
                if (ti.player.getPlayerState() == YT.PlayerState.PLAYING || i >= 5000)
                    clearInterval(ivl);
                else
                    ti.player.playVideo();
                i++;
            }, 1);
        }

        // Force pause because pauseVideo sometimes simply has no effect at all
        _forcePause() {
            let ti = this.origin, i = 0, ivl = setInterval(function(){
                if (ti.player.getPlayerState() == YT.PlayerState.PAUSED || ti.player.getPlayerState() == YT.PlayerState.ENDED || i >= 5000)
                    clearInterval(ivl);
                else
                    ti.player.pauseVideo();
                i++;
            }, 1);
        }

        _play() {
            if (!this.origin.player)
                return;
            this.origin.commandsQueue.push("play");
            // Force playing because it sometimes simply has no effect at all
            this._forcePlay();
        }

        _pause() {
            if (!this.origin.player)
                return;
            this.origin.commandsQueue.push("pause");
            this._forcePause();
        }

        _paused(event) {
            // If the currently pending command is PAUSE, remove it
            if (this.origin.commandsQueue.indexOf("pause") == 0)
                this.origin.commandsQueue.splice(0, 1);
            // If the next pending command is PLAY, play the video
            if (this.origin.commandsQueue.length > 0 && this.origin.commandsQueue[0] == "play")
                this._forcePlay();
        }

        _playing(event) {
            // If the currently pending command is PLAY, remove it
            if (this.origin.commandsQueue.indexOf("play") == 0)
                this.origin.commandsQueue.splice(0, 1);
            // If the next pending command is PAUSE, pause the video
            if (this.origin.commandsQueue.length > 0 && this.origin.commandsQueue[0] == "pause")
                this.origin.player.pauseVideo();

            // If not loaded yet, change that: it's now playing
            if (!this.origin.loaded) {
                this.origin.loaded = true;
                // Signal that it can play
                if (this.origin.buffering && !this.origin.canPlay)
                    this.origin._canPlay(event);
            }
            // Signal it's no longer buffering
            if (this.origin.buffering)
                this.origin.buffering = false;
            // If origin has been run but is not done yet, change that
            if (this.origin.hasBeenRun && !this.origin.isDone)
                this.origin.done();
        }

        _buffering(event) {
            // Signal it's buffering
            if (!this.origin.buffering)
                this.origin.buffering = true;
        }

        // Triggered when the video has first started playing
        _canPlay(event) {
            if (!this.origin.canPlay) {
                this.origin.canPlay = true;
                // Listing the YT video as preloaded
                this.origin._setResource(this.iframe);
                // If video not played yet, play it
                if (this.hasBeenRun && event.target.getPlayerState() != YT.PlayerState.PLAYING)
                    this._play();
                // If video already playing but not run yet, pause
                else if (!this.hasBeenRun && event.target.getPlayerState() == YT.PlayerState.PLAYING)
                    this._pause();
            }

        }

        _ended(event) {
            this.hasPlayed = true;
        }

        _ready(event) {
            // Starting to play, to start buffering
            this._play();            
        }

        // ========================================
        // METHODS THAT RETURN NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to wait for the end of the video
        // Done when the video has been entirely played
        wait() {
            if (this.origin.hasPlayed)
                return this.newMeta(function(){ this.done(); });
            let instr = this.newMeta();
            this.origin._ended = this.origin.extend("_ended", function(){ instr.done(); });
            return instr;
        }

        // Returns an instruction to pause the video
        // Done immediately
        pause() {
            return this.newMeta(function(){
                this._pause();
                this.done();
            });
        }

        // Returns an instruction to play the video
        // Done immediately
        play() {
            return this.newMeta(function(){
                this._play();
                this.done();
            });
        }

        // Returns an instruction to preload the video
        // Done immediately
        preload() {
            this.origin._addToPreload();
            return this.newMeta(function(){ this.done(); });
        }
    }


    // Adds a Canvas where you can place multiple instructions
    // Done immediately
    class CanvasInstr extends Instruction {
        constructor(w,h) {
            super({width: w, height: h}, "canvas");
            if (w != Abort) {
                if (typeof(w) != "number" || typeof(h) != "number" || w < 0 || h < 0)
                    return Abort;
                let element = $("<div>").css({width: w, height: h, position: "relative"}).addClass("PennController-Canvas");
                this.setElement(element);
                this.objects = [];
            }
        }

        // ========================================
        // PRIVATE AND INSTRINSIC METHODS
        // ========================================

        run() {
            if (super.run() == Abort)
                return Abort;
            for (let o in this.objects) {
                let object = this.objects[o],
                    origin = object[0];
                if (!(origin instanceof Instruction)) {
                    console.log("Warning: element #"+o+" of canvas is not a proper instruction; ignoring it.");
                    continue;
                }
                // If instruction has not been run yet, run it
                if (!origin.hasBeenRun) {
                    origin.run();
                    origin.done = origin.extend("done", function(){
                        origin.element.css({position: "absolute", left: object[1], top: object[2], "z-index": object[3]});
                    });
                }
            }
            _addElementTo(this.element, this.parentElement);
            this.done();
        }

        // Adds an object onto the canvas at (X,Y) on the Z-index level
        _addObject(instruction, x, y, z) {
            if (typeof(x) != "number" || typeof(y) != "number")
                return Abort;
            if (!(instruction instanceof Instruction))
                return Abort;
            let origin = instruction.origin;
            let alreadyIn = false;
            for (let o in this.origin.objects) {
                let object = this.origin.objects[o];
                // If instruction already contained, update the parameters
                if (object[0] == origin) {
                    object[1] = x;
                    object[2] = y;
                    if (typeof(z) == "number")
                        object[3] = z;
                    alreadyIn = true;
                }
            }
            // If instruction is newly added, just push OBJECTS
            if (!alreadyIn)
                this.origin.objects.push([origin, x, y, (typeof(z)=="number" ? z : this.origin.objects.length)]);
            // Redefined parentElement in any case
            origin.parentElement = this.origin.element;
            // If instruction has already been run and is already done, re-append its element
            if (instruction.hasBeenRun && instruction.isDone) {
                origin.element.appendTo(this.origin.element);
                origin.element.css({position: "absolute", left: x, top: y, "z-index": z});
            }
            // If instruction has not been run yet, but if CANVAS has been run: run instruction
            else if (this.origin.hasBeenRun) {
                origin.done = origin.extend("done", function(){
                    origin.element.css({position: "absolute", left: x, top: y, "z-index": z});
                });
                instruction.run();
            }
        }


        // ========================================
        // METHODS RETURNING NEW INSTRUCTIONS
        // ========================================

        // Returns an instruction to add/update an instruction on the canvas at (X,Y)
        // Done immediately
        put(instruction, x, y, z) {
            return this.newMeta(function(){
                this.origin._addObject(instruction, x, y, z);
                this.done();
            });
        }
    }

    // Adds an instruction to end the trial prematurely
    // Done immediately
    class EndInstr extends Instruction {
        constructor() {
            super("end", "end");
        }
        run() {
            super.run();
            this.hasBeenRun = true;
            this.done = true;
            _ctrlr.end();
        }
    }


    /*class ScreenInstr extend Instruction {
        constructor(command) {
            super(command, "screen");
        }

        run() {
            if (command == "hold")
                _ctrlr.hold = true;
            else if (command == "release") {
                _ctrlr.hold = false;
                if (!_elementsToAppend.length)
                    _ctrlr.release();
            }
        }
    }*/

    //  =========================================
    //
    //      PENNCONTROLLER INSTRUCTION METHODS
    //
    //  =========================================

    // Returns an instruction in function of the argument(s) type
    PennController.instruction = function(arg) {
        // Create a new instruction
        switch (typeof(arg)) {
            case "string":
                // If there's an instrution referenced as ARG while EXECUTING a controller
                if (_ctrlr && _localInstructions[_ctrlr.id].hasOwnProperty(arg))
                    return _localInstructions[_ctrlr.id][arg];
                // If there's an instrution referenced as ARG while CREATING a controller
                else if (!_ctrlr && _localInstructions[_localInstructions.length-1].hasOwnProperty(arg))
                    return _localInstructions[_localInstructions.length-1][arg];
                // Else, just create an instruction
                else if (arg.match(/\.(png|jpe?g|bmp|gif)$/i))    
                    return new ImageInstr(arg);             // Create an image instruction
                else if (arg.match(/\.(wav|ogg|mp3)$/i))
                    return new AudioInstr(arg);             // Create an audio instruction
                else 
                    return new TextInstr(arg);              // Create a text instruction
            break;
            case "number":
                return new TimerInstr(arg);                 // Create a timer instruction
            break;
            case "function":
                return new FunctionInstr(arg);              // Create a function instruction
            break;
            case "object":
                return new ComplexInstr(arguments);         // Create a complex instruction
            break;
        }
    };

    // Specific methods
    PennController.instruction.text = function(text){ return new TextInstr(text); };
    PennController.instruction.image = function(image, width, height){ return new ImageInstr(image, width, height); };
    PennController.instruction.audio = function(audio){ return new AudioInstr(audio); };
    PennController.instruction.yt = function(code){ return new YTInstr(code); };
    PennController.instruction.key = function(keys){ return new KeyInstr(keys); };
    PennController.instruction.save = function(){ return new SaveInstr(arguments); };
    // PennController.instruction.tooltip = function(text){ return new TooltipInstr(text); }; // To be implemented
    // PennController.instruction.waitUntil = function(condition){ return new WaitInstr(condition); }; // TBI?
    PennController.instruction.if = function(condition, success, failure){ return new IfInstr(condition, success, failure); };
    PennController.instruction.timer = function(delay, callback){ return new TimerInstr(delay, callback); };
    PennController.instruction.radioButtons = function(label, length){ return new RadioInstr(label, length); };
    PennController.instruction.clear = function(){ return new ClearInstr(); };
    PennController.instruction.selector = function(){ return new SelectorInstr(arguments); };
    PennController.instruction.canvas = function(width, height){ return new CanvasInstr(width, height); };
    PennController.instruction.end = function(){ return new EndInstr(); };


    //  =========================================
    //
    //      THE CONTROLLER ITSELF
    //
    //  =========================================
    
    define_ibex_controller({
      name: "PennController",
      jqueryWidget: {    
        _init: function () {

            var _t = this;

            _t.cssPrefix = _t.options._cssPrefix;
            _t.utils = _t.options._utils;
            _t.finishedCallback = _t.options._finishedCallback;

            //  =======================================
            //      EXCEPTIONAL CASE: PRELOADER
            //  =======================================
            if (_t.options.hasOwnProperty("preload"))
                return _checkPreload(_t);

            _t.instructions = _t.options.instructions;
            _t.id = _t.options.id;

            _t.toSave = [];
            _t.toRunBeforeFinish = [];

            _t.timers = [];

            //  =======================================
            //      INTERNAL FUNCTIONS
            //  =======================================

            // Adds a parameter/line to the list of things to save
            _t.save = function(parameter, value, time, comment){
                _t.toSave.push([
                        ["Parameter", parameter],
                        ["Value", value],
                        ["Time", time],
                        ["Comment", comment ? comment : "NULL"]
                    ]);
            };

            // Adds a function to be executed before finishedCallBack
            _t.callbackBeforeFinish = function(func) {
                _t.toRunBeforeFinish.push(func);
            };

            // Called when controller ends
            // Runs finishedCallback
            _t.end = function() {
                for (f in _t.toRunBeforeFinish){
                    _t.toRunBeforeFinish[f]();
                }
                // Re-appending preloaded resources to the HTML node
                for (let f in _preloadedFiles) {
                    if (!_preloadedFiles[f].parent().is("html")) {
                        _preloadedFiles[f].css("display","none");
                        _preloadedFiles[f].appendTo($("html"));
                    }
                }
                // Hide all iframes
                $("iframe").css("display","none");
                // Stop playing all audios
                $("audio").each(function(){ 
                    this.pause();
                    this.currentTime = 0;
                });
                // End all timers
                for (let t in this.timers) {
                    clearInterval(this.timers[t]);
                    clearTimeout(this.timers[t]);
                }
                // Save time
                _t.save("Page", "End", Date.now(), "NULL");
                // Next trial
                _t.finishedCallback(_t.toSave);
            };

            // #########################
            // PRELOADING PART 1
            //
            // Adds an instruction that must be preloaded before the sequence starts
            _t.addToPreload = function(instruction) {
                // Add the resource if defined and only if not already preloaded
                if (instruction && _instructionsToPreload.indexOf(instruction)>=0) {
                    if (!_t.toPreload)
                        _t.toPreload = [];
                    // Add the resource only if not already listed (several instructions may share the same origin)
                    if (_t.toPreload.indexOf(instruction) < 0) {
                        _t.toPreload.push(instruction);
                        // Extend _setResource (called after preloading)
                        instruction._setResource = instruction.extend("_setResource", function(){
                            // Remove the entry (set index here, as it may have changed by the time callback is called)
                            let index = _t.toPreload.indexOf(instruction);
                            if (index >= 0)
                                _t.toPreload.splice(index, 1);
                            // If no more file to preload, run
                            if (_t.toPreload.length <= 0) {
                                $("#waitWhilePreloading").remove();
                                _t.save("Preload", "Complete", Date.now(), "NULL");
                                if (!_t.instructions[0].hasBeenRun)
                                    _t.instructions[0].run();
                            }
                        });
                    }
                }
            }
            // Check if the instruction requires a preloaded resource
            if (!_globalPreload && _listOfControllers[this.id].hasOwnProperty("preloadingInstructions")) {
                // Go through each resource that next's origin has to preload
                for (let i in _listOfControllers[this.id].preloadingInstructions)
                    // Add resource
                    _t.addToPreload(_listOfControllers[this.id].preloadingInstructions[i]);
            }
            // 
            // END OF PRELOADING PART 1
            // #########################


            // Make it so that each instruction runs next one
            let previous;
            for (let i in _t.instructions) {
                let next = _t.instructions[i];
                // If not an instruction, continue
                if (!(next instanceof Instruction))
                    continue;
                // Give a parent element
                next.parentElement = _t.element;
                // Run next instruction when previous is done
                if (previous instanceof Instruction) {
                    previous.done = previous.extend("done", function(){ next.run(); });
                    // Inform of previous instruction
                    next.previousInstruction = previous;
                }
                previous = next;
            }
            // Now previous is the last instruction
            previous.done = previous.extend("done", function(){ _t.end(); });

            // Record running of first instruction
            _t.instructions[0].run = _t.instructions[0].extend("run", function(){ 
                _t.save("Page", "RunFirstInstruction", Date.now(), "NULL");
            });

            // Inform that the current controller is this one
            _ctrlr = _t;

            // Create local variables (see FuncInstr)
            _ctrlr.variables = {};


            // #########################
            // PRELOADING PART 2
            //
            // If ALL resources should be preloaded at once (and if there are resources to preload to start with)
            if (_globalPreload && _instructionsToPreload.length) {
                // Add each of them
                for (let i in _instructionsToPreload)
                    _t.addToPreload(i);
            }
            // If anything to preload
            if (_t.toPreload) {
                // Save preloading time
                _t.save("Preload", "Start", Date.now(), "NULL");
                // Add a preloading message
                _t.element.append($("<div id='waitWhilePreloading'>").html(_waitWhilePreloadingMessage));
                // Adding a timeout in case preloading fails
                setTimeout(function(){
                    // Abort if first instruction has been run in the meantime (e.g. preloading's done)
                    if (_t.instructions[0].hasBeenRun)
                        return Abort;
                    $("#waitWhilePreloading").remove();
                    _t.save("Preload", "Timeout", Date.now(), "NULL");
                    if (!_t.instructions[0].hasBeenRun)
                        _t.instructions[0].run();
                }, _timeoutPreload);
            }
            //
            // END OF PRELOADING PART 2
            // #########################
            // Else, run the first instruction already!
            else
                _t.instructions[0].run();

            // Save time of creation
            _t.save("Page", "Creation", Date.now(), "NULL");

        }
      },

      properties: {
        obligatory: [],
        countsForProgressBar: true,
        htmlDescription: null
      }
    });
    // END OF IBEX CONTROLLER

})();
// END OF ENCAPSULATION