import * as JSZip from 'jszip';
import { getBinaryContent } from 'jszip-utils';

// List of URLs to ZIP files
export var _URLsToLoad = [];
//
// Determines whether looking in zip files in priority
export var _zipPriority = true;
//
// Dictionary of Blob's for unzipped resources
export var _unzippedResources = {};
//
// The list of functions to call when all the files have been unzipped
export var _zipCallbacks = [];


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
                for (let f in _zipCallbacks) {
                    if (_zipCallbacks[f] instanceof Function)
                        _zipCallbacks[f].call();
                }
            }
        }
        var zip = new JSZip();
        getBinaryContent(url, function(error, data) {
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

// Start to download the zip files as soon as the document is ready
$(document).ready(function(){
    // Preload any zip file
    _preloadZip();
});