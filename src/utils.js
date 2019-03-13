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
    if (signature.match(/^00000[12]00/i))
        return 'image/x-icon';
    if (signature.match(/424D/i))
        return 'image/bmp';
    if (signature.match(/^89504E470?D0?A1A0?A/i))   // For some reason 0 is sometimes dropped...
        return 'image/png';
    if (signature.match(/^474946383[79]61/i))
        return 'image/gif';
    if (signature.match(/^52494646........574542505650/i))   // Longest = 28 bytes
        return 'image/webp';
    if (signature.match(/^FFD8FF/i))
        return 'image/jpeg';
    // AUDIO/VIDEO
    if (signature.match(/^2E736E64/i))
        return 'audio/basic';
    if (signature.match(/^464F524D........41494646/i))
        return 'audio/aiff';
    if (signature.match(/^(fff[b3a2]|494433)/i))    //  b = mpeg-1 audio, 3 = mpeg-2, a = 1protected, 2 = 2protected
        return 'audio/mpeg';
    if (signature.match(/^4F67675300/i))
        return 'application/ogg';
    if (signature.match(/^4D546864......06/i))
        return 'audio/midi';
    if (signature.match(/^52494646........41564920/i))
        return 'video/avi';
    if (signature.match(/^52494646.{4,8}57415645/i)) // Apparently sometimes less than 8 bytes in between...
        return 'audio/wave';
    if (signature.match(/^1A45DFA3/i))    // Could be sthg else than webm
        return 'video/webm';
    // OTHER
    if (signature.match(/^25504446/i))
        return 'application/pdf';
    if (signature.match(/^504B0304/i))
        return 'application/zip';
    else
        return false;
}


export function minsecStringFromMilliseconds(n){
    let s = (n / 1000) % 60, m = Math.trunc(n / 60000);
    return (m>0?m+"min":"")+(s>0?s+"s":"");
}

// From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
export function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

// Converts any PennElementCommand in 'array' into a string
export function parseElementCommands(array){
    return array.map(e=>{
        if (e instanceof Object && e.hasOwnProperty("_promises"))
            return e.type + ":" + e._element.id;
        else
            return e;
    });
}