import "./utils.js";                    // bunch of utility functions
import "./pennengine.js";               // defines PennEngine [local]
import "./penncontroller.js";           // defines PennController and calls define_ibex_controller
import "./elements.js";                 // constructor for element types [fed with PennEngine]
import "./zip.js";                      // adds the PreloadZip global command [imports jszip and jszip-utils]
import "./tables.js";                   // defines FeedItems    [imports jquery-csv]

window.PennController = PennController; // PennController is the only object to be exported front-end