//import * as JSZip from 'jszip';
var JSZip = require("jszip");
import { getBinaryContent } from 'jszip-utils';
import { hexFromArrayBuffer, getMimetype } from './utils.js';
import { PennController } from "./controller.js";
import { PennEngine } from "./engine.js";
import { saveAs } from 'file-saver';

let _URLsToLoad = [];

PennEngine.utils.JSZip = JSZip;                                 // Pass JSZip to PennEngin.utils to make it accessible
PennEngine.utils.JSZip.getBinaryContent = getBinaryContent;     // from element type development (see, e.g., voicerecorder)
PennEngine.utils.saveAs = saveAs;                               // saveAs is also useful to provide a way to download archive

// Loads the file at each URL passed as an argument
// Files can be ZIP files, image files or audio files
PennController.PreloadZip = function () {   /* $AC$ global.PennController.PreloadZip() Silently downloads a ZIP file containing resources $AC$ */
    for (let url in arguments)
        _URLsToLoad.push(arguments[url]);
};

// Internal loading of the zip files
// Will be executed when jQuery is ready
function _preloadZip () {
    if (!_URLsToLoad.length) return;        // If no zip file to download, that's it, we're done
    var getZipFile = function(url){         // Called for each URL that was passed
        function removeURL() {              // Called to remove a URL from the array (when unzipped done, or error)
            let index = _URLsToLoad.indexOf(url);
            if (index >= 0)
                _URLsToLoad.splice(index,1);
        }
        var zip = new JSZip();
        getBinaryContent(url, function(error, data) {
            if (error) {
                removeURL();    // Problem with downloading the file: remove the URL from the array
                PennEngine.debug.error("Error downloading "+url+":", error);
                throw error;    // Throw the error
            }
            zip.loadAsync(data).then(function(){                // Load the zip object with the data stream
                PennEngine.debug.log("Download of "+url+" complete");
                var unzippedFilesSoFar = 0;                     // Number of files unzipped
                zip.forEach(function(path, file){               // Going through each zip file
                    file.async('arraybuffer').then(function(content){   // Unzip the file
                        if (!path.match(/__MACOS.+\/\.[^\/]+$/)) {                            // Excluding weird MACOS zip files
                            let filename = path.replace(/^.*?([^\/]+)$/,"$1");                // Get rid of path, keep just filename
                            let type = getMimetype( hexFromArrayBuffer(content.slice(0,28)) , filename ); // Get type using magic numbers (see utils.js)
                            if (type){                                                        // Add only type was recognized
                                let url = URL.createObjectURL(new Blob([content], {type: type}));   // The URL of the Blob
                                console.log("Found a resource named",filename,"of type",type,"with url",url);
                                var resourceFound = false;                                    // Check extent resources
                                for (let r in PennEngine.resources.list){
                                    let resource = PennEngine.resources.list[r];
                                    if (resource.name==filename && resource.status!="ready"){
                                        console.log("Applying create to a copye of",filename);
                                        resource.create.apply(                              // Create the resource's object
                                            $.extend({}, resource, {                        // using a copy of the resource found
                                                value: url,                                 // with its value set to the Blob's URL
                                                object: null,                               // No object yet
                                                resolve: function() {                       // and its resolve taking care of object
                                                    console.log("Resolving",filename,"current status",resource.status);
                                                    if (resource.status=="ready")
                                                        return;                             // Assign copy's object to original's
                                                    resource.object = this.object;
                                                    console.log("Set",filename," object to",resource.object,"calling resolve now");
                                                    resource.resolve();
                                                }
                                            })
                                        );
                                        resourceFound = true;
                                    }
                                }
                                if (!resourceFound)                     // If no resource was found:
                                    PennEngine.resources.list.push({    // add a new one to the list
                                        name: filename,
                                        value: url,                     // Use the Blob's URL
                                        controllers: [],
                                        object: null,
                                        status: "void",
                                        create: function(){ this.status="pending"; },
                                        resolve: function(){ this.status="ready"; }
                                    });
                            }
                        }
                        unzippedFilesSoFar++;                           // Keep track of progression
                        if (unzippedFilesSoFar >= Object.keys(zip.files).length)    // All files unzipped:
                            removeURL();                                            // remove the URL from the array
                    });
                });
            });
        });
    };
    
    for (let u in _URLsToLoad) {    // Fetch the zip file
        let url = _URLsToLoad[u];
        let extension = url.match(/^https?:\/\/.+\.(zip)$/i);
        if (typeof(url) != "string" || !extension) {
            PennEngine.debug.warning("Preload: entry #"+u+" is not a valid URL, ignoring it");
            continue;
        }
        else if (extension[1].toLowerCase() == "zip")
            getZipFile(url);
    }
};

PennEngine.Prerun( _preloadZip);
