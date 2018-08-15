// Returns a polyvalent function s.t.
//   - it stores any function given as its argument
//   - it executes, in order, all the stored functions with the list of passed arguments (as long as it is not a singleton function)
export function newBag(t) {
    let functions = [];
    return (...func) => {
        if (func.length==1 && func[0] instanceof Function)
            functions.push(func[0]);
        else {
            for (let f in functions)
                functions[f].apply(t, func);
        }
    };
}

// Returns a lazy Promise that will be fulfilled only after executing a sequence lazy Promises
export function lazyPromiseFromArrayOfLazyPromises(arrayOfLazyPromises) {
    return () => new Promise(async function (resolve){
        for (let p in arrayOfLazyPromises){
            if (arrayOfLazyPromises[p] instanceof Function)
                var value = await arrayOfLazyPromises[p]();
        }
        // Resolve with the last value
        resolve(value);
    });
}

export function hexFromArrayBuffer (array) {
    const uint = new Uint8Array(array);
    let bytes = [];
    uint.forEach((byte) => {
        bytes.push(byte.toString(16));
    })
    return bytes.join('').toUpperCase();
}

// See https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
// See https://en.wikipedia.org/wiki/List_of_file_signatures
export function getMimetype (signature) {
    // IMAGE
    if (signature.match(/^00000[12]00/))
        return 'image/x-icon';
    if (signature.match(/424D/))
        return 'image/bmp';
    if (signature.match(/^89504E470D0A1A0A/))
        return 'image/png';
    if (signature.match(/^474946383[79]61/))
        return 'image/gif';
    if (signature.match(/^52494646........574542505650/))   // Longest = 28 bytes
        return 'image/webp';
    if (signature.match(/^FFD8FF/))
        return 'image/jpeg';
    // AUDIO/VIDEO
    if (signature.match(/^2E736E64/))
        return 'audio/basic';
    if (signature.match(/^464F524D........41494646/))
        return 'audio/aiff';
    if (signature.match(/^(fffb|494433)/))
        return 'audio/mpeg';
    if (signature.match(/^4F67675300/))
        return 'application/ogg';
    if (signature.match(/^4D546864......06/))
        return 'audio/midi';
    if (signature.match(/^52494646........41564920/))
        return 'video/avi';
    if (signature.match(/^52494646......(..)?57415645/))    // Apparently sometimes only 6 bytes in between...
        return 'audio/wave';
    if (signature.match(/^1A45DFA3/))    // Could be sthg else than webm
        return 'video/webm';
    // OTHER
    if (signature.match(/^25504446/))
        return 'application/pdf';
    if (signature.match(/^504B0304/))
        return 'application/zip';
    else
        return false;
}


export function minsecStringFromMilliseconds(n){
    let s = (n / 1000) % 60, m = Math.trunc(n / 60000);
    return (m>0?m+"min":"")+(s>0?s+"s":"");
}