let newPrefix = (p,o) => {
    let descriptors = Object.getOwnPropertyDescriptors(o);
    for (let d in descriptors){
        let descriptor = descriptors[d];
        if (descriptor.value instanceof Function)
            p[d] = descriptor.value;                   // new/get
        else if (descriptor.get instanceof Function)
            Object.defineProperty(p, d, descriptor);   // default
    }
};

// This allows the users to call the instruction methods as global functions
window.PennController.ResetPrefix = function(prefixName) { /* $AC$ global.PennController.ResetPrefix(prefix) Resets the prefix for the new* and get* commands; pass null to make them global $AC$ */
    if (typeof(prefixName)=="string"){
        if (window[prefixName])
            throw "ERROR: prefix string already used for another JS object";
        window[prefixName] = {};                // Create an object
        var prefix = window[prefixName];        // Point to the object
    }
    else
        var prefix = window;                    // If no (valid) prefix name, drop any prefix (object = window)
    newPrefix(prefix,window.PennController.Elements);
    newPrefix(prefix,window.PennController);
};