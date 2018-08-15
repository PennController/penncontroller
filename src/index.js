import "./utils.js";                    // bunch of utility functions
import "./pennengine.js";               // defines PennEngine [local]
import "./penncontroller.js";           // defines PennController and calls define_ibex_controller
import "./elements.js";                 // constructor for element types [fed with PennEngine]
import "./zip.js";                      // adds the PreloadZip global command [imports jszip and jszip-utils]
import "./tables.js";                   // defines FeedItems    [imports jquery-csv]

window.PennController = PennController; // PennController is the only object to be exported front-end

// import "./elements/PennElement_audio.js";
// import "./elements/PennElement_button.js";
// import "./elements/PennElement_canvas.js";
// import "./elements/PennElement_function.js";
// import "./elements/PennElement_html.js";
// import "./elements/PennElement_image.js";
// import "./elements/PennElement_key.js";
// import "./elements/PennElement_scale.js";
// import "./elements/PennElement_selector.js";
// import "./elements/PennElement_text.js";
// import "./elements/PennElement_textinput.js";
// import "./elements/PennElement_timer.js";
// import "./elements/PennElement_tooltip.js";
// import "./elements/PennElement_var.js";
// import "./elements/PennElement_voicerecorder.js";
// import "./elements/PennElement_youtube.js";