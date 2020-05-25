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
export function getMimetype (signature, filename) {
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
    else{
        let r = filename.match(/\.([^.]+)$/);
        if (r){
            switch(r[1].toLowerCase()){
                case 'bmp':
                    return 'image/bmp';
                case 'png':
                    return 'image/png'; 
                case 'gif':
                    return 'image/gif'; 
                case 'webp':
                    return 'image/webp';
                case 'jpg':
                case 'jpeg':
                    return 'image/jpeg';
                case 'mp3':
                    return 'audio/mpeg';
                case 'ogg':
                case 'oga':
                    return 'audio/ogg';
                case 'midi':
                case 'mid':
                    return 'audio/midi';
                case 'wav':
                    return 'audio/wave';
                case 'webm':
                    return 'video/webm';
                case 'avi':
                    return 'video/avi';
                case 'mp4':
                    return 'video/mp4';
                case 'ogv':
                    return 'video/ogg';
                case 'mov':
                    return 'video/quicktime';
                default:
                    return '';
            }
        }
        else
            return '';
    }
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

// Parses "bottom|left|center|middle|right|top at ..."
export function parseCoordinates(x,y,element){
    let anchorX = String(x).match(/^(.+)\s+at\s+(.+)$/i);
    let anchorY = String(y).match(/^(.+)\s+at\s+(.+)$/i);
    if (anchorX && anchorX[2].match(/^\d+(\.\d+)?$/))
        anchorX[2] = String(anchorX[2]) + "px";
    if (anchorY && anchorY[2].match(/^\d+(\.\d+)?$/))
        anchorY[2] = String(anchorY[2]) + "px";
    if (anchorX){
        if (anchorX[1].match(/center|middle/i))
            x = "calc("+anchorX[2]+" - "+(element.width()/2)+"px)";
        else if (anchorX[1].match(/right/i))
            x = "calc("+anchorX[2]+" - "+element.width()+"px)";
        else
            x = anchorX[2];
    }
    if (anchorY){
        if (anchorY[1].match(/center|middle/i))
            y = "calc("+anchorY[2]+" - "+(element.height()/2)+"px)";
        else if (anchorY[1].match(/bottom/i))
            y = "calc("+anchorY[2]+" - "+element.height()+"px)";
        else
            y = anchorY[2];
    }
    return {x: x, y: y};
}

// Returns the Levensthein distance between two words
export function levensthein(s,t){
    let d = [];
    d[0] = ("a"+t).split("").map((c,n)=>n);
    for (let i = 1; i < s.length+1; i++)
        d[i] = [i,...t.split("").map(()=>0)];

    for (let j = 1; j < t.length+1; j++)
        for (let i = 1; i < s.length+1; i++){
            let substitutionCost = s.charAt(i)!=t.charAt(j);
            let deletion = d[i-1][j] + 1;
            let insertion = d[i][j-1] + 1;
            let substitution = d[i-1][j-1] + substitutionCost;
            if (deletion<insertion&&deletion<substitution)
                d[i][j] = deletion;
            else if (insertion<deletion&&insertion<substitution)
                d[i][j] = insertion;
            else
                d[i][j] = substitution;
        }
    return d[s.length][t.length];
}

let specialKeys = [
    "Unidentified",
    "Alt",
    "AltGraph",
    "CapsLock",
    "Control",
    "Fn",
    "FnLock",
    "Meta",
    "NumLock",
    "ScrollLock",
    "Shift",
    "Symbol",
    "SymbolLock",
    "Hyper",
    "Super",
    "Enter",
    "Tab",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp",
    "Backspace",
    "Clear",
    "Copy",
    "CrSel",
    "Cut",
    "Delete",
    "EraseEof",
    "ExSel",
    "Insert",
    "Paste",
    "Redo",
    "Undo",
    "Accept",
    "Again",
    "Attn",
    "Cancel",
    "ContextMenu",
    "Escape",
    "Execute",
    "Find",
    "Help",
    "Pause",
    "Play",
    "Props",
    "Select",
    "ZoomIn",
    "ZoomOut",
    "BrightnessDown",
    "BrightnessUp",
    "Eject",
    "LogOff",
    "Power",
    "PowerOff",
    "PrintScreen",
    "Hibernate",
    "Standby",
    "WakeUp",
    "AllCandidates",
    "Alphanumeric",
    "CodeInput",
    "Compose",
    "Convert",
    "Dead",
    "FinalMode",
    "GroupFirst",
    "GroupLast",
    "GroupNext",
    "GroupPrevious",
    "ModeChange",
    "NextCandidate",
    "NonConvert",
    "PreviousCandidate",
    "Process",
    "SingleCandidate",
    "HangulMode",
    "HanjaMode",
    "JunjaMode",
    "Eisu",
    "Hankaku",
    "Hiragana",
    "HiraganaKatakana",
    "KanaMode",
    "KanjiMode",
    "Katakana",
    "Romaji",
    "Zenkaku",
    "ZenkakuHankaku",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "Soft1",
    "Soft2",
    "Soft3",
    "Soft4",
    "ChannelDown",
    "ChannelUp",
    "Close",
    "MailForward",
    "MailReply",
    "MailSend",
    "MediaClose",
    "MediaFastForward",
    "MediaPause",
    "MediaPlay",
    "MediaPlayPause",
    "MediaRecord",
    "MediaRewind",
    "MediaStop",
    "MediaTrackNext",
    "MediaTrackPrevious",
    "New",
    "Open",
    "Print",
    "Save",
    "SpellCheck",
    "Key11",
    "Key12",
    "AudioBalanceLeft",
    "AudioBalanceRight",
    "AudioBassBoostDown",
    "AudioBassBoostToggle",
    "AudioBassBoostUp",
    "AudioFaderFront",
    "AudioFaderRear",
    "AudioSurroundModeNext",
    "AudioTrebleDown",
    "AudioTrebleUp",
    "AudioVolumeDown",
    "AudioVolumeUp",
    "AudioVolumeMute",
    "MicrophoneToggle",
    "MicrophoneVolumeDown",
    "MicrophoneVolumeUp",
    "MicrophoneVolumeMute",
    "SpeechCorrectionList",
    "SpeechInputToggle",
    "LaunchApplication1",
    "LaunchApplication2",
    "LaunchCalendar",
    "LaunchContacts",
    "LaunchMail",
    "LaunchMediaPlayer",
    "LaunchMusicPlayer",
    "LaunchPhone",
    "LaunchScreenSaver",
    "LaunchSpreadsheet",
    "LaunchWebBrowser",
    "LaunchWebCam",
    "LaunchWordProcessor",
    "BrowserBack",
    "BrowserFavorites",
    "BrowserForward",
    "BrowserHome",
    "BrowserRefresh",
    "BrowserSearch",
    "BrowserStop",
    "AppSwitch",
    "Call",
    "Camera",
    "CameraFocus",
    "EndCall",
    "GoBack",
    "GoHome",
    "HeadsetHook",
    "LastNumberRedial",
    "Notification",
    "MannerMode",
    "VoiceDial",
    "TV",
    "TV3DMode",
    "TVAntennaCable",
    "TVAudioDescription",
    "TVAudioDescriptionMixDown",
    "TVAudioDescriptionMixUp",
    "TVContentsMenu",
    "TVDataService",
    "TVInput",
    "TVInputComponent1",
    "TVInputComponent2",
    "TVInputComposite1",
    "TVInputComposite2",
    "TVInputHDMI1",
    "TVInputHDMI2",
    "TVInputHDMI3",
    "TVInputHDMI4",
    "TVInputVGA1",
    "TVMediaContext",
    "TVNetwork",
    "TVNumberEntry",
    "TVPower",
    "TVRadioService",
    "TVSatellite",
    "TVSatelliteBS",
    "TVSatelliteCS",
    "TVSatelliteToggle",
    "TVTerrestrialAnalog",
    "TVTerrestrialDigital",
    "TVTimer",
    "AVRInput",
    "AVRPower",
    "ColorF0Red",
    "ColorF1Green",
    "ColorF2Yellow",
    "ColorF3Blue",
    "ColorF4Grey",
    "ColorF5Brown",
    "ClosedCaptionToggle",
    "Dimmer",
    "DisplaySwap",
    "DVR",
    "Exit",
    "FavoriteClear0",
    "FavoriteClear1",
    "FavoriteClear2",
    "FavoriteClear3",
    "FavoriteRecall0",
    "FavoriteRecall1",
    "FavoriteRecall2",
    "FavoriteRecall3",
    "FavoriteStore0",
    "FavoriteStore1",
    "FavoriteStore2",
    "FavoriteStore3",
    "Guide",
    "GuideNextDay",
    "GuidePreviousDay",
    "Info",
    "InstantReplay",
    "Link",
    "ListProgram",
    "LiveContent",
    "Lock",
    "MediaApps",
    "MediaAudioTrack",
    "MediaLast",
    "MediaSkipBackward",
    "MediaSkipForward",
    "MediaStepBackward",
    "MediaStepForward",
    "MediaTopMenu",
    "NavigateIn",
    "NavigateNext",
    "NavigateOut",
    "NavigatePrevious",
    "NextFavoriteChannel",
    "NextUserProfile",
    "OnDemand",
    "Pairing",
    "PinPDown",
    "PinPMove",
    "PinPToggle",
    "PinPUp",
    "PlaySpeedDown",
    "PlaySpeedReset",
    "PlaySpeedUp",
    "RandomToggle",
    "RcLowBattery",
    "RecordSpeedNext",
    "RfBypass",
    "ScanChannelsToggle",
    "ScreenModeNext",
    "Settings",
    "SplitScreenToggle",
    "STBInput",
    "STBPower",
    "Subtitle",
    "Teletext",
    "VideoModeNext",
    "Wink",
    "ZoomToggle",
    "AudioVolumeDown",
    "AudioVolumeUp",
    "AudioVolumeMute",
    "BrowserBack",
    "BrowserForward",
    "ChannelDown",
    "ChannelUp",
    "ContextMenu",
    "Eject",
    "End",
    "Enter",
    "Home",
    "MediaFastForward",
    "MediaPlay",
    "MediaPlayPause",
    "MediaRecord",
    "MediaRewind",
    "MediaStop",
    "MediaNextTrack",
    "MediaPause",
    "MediaPreviousTrack",
    "Power"
];
let specialKeysUpper = specialKeys.map(k=>k.toUpperCase());

String.prototype.isSpecialKey = function (caseSensitive) { 
    if (caseSensitive)
        return specialKeys.indexOf(this)>-1;
    else
        return specialKeysUpper.indexOf(this.toUpperCase())>-1;
}

// Tests whether the element belongs to the document's body
jQuery.fn.printed = function(){
    let e = this.parent();
    while (e.length){
        if (e[0]==document.body)
            return true;
        e = e.parent();
    }
    return false;
}