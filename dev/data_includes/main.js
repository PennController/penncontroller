PennController.ResetPrefix(null) // Shorten command names (keep this line here)

Sequence(
   // "preload",
   "welcome1",
    "init" // initiating the recorder
    ,
    "welcome2",
   // sepWith("async", randomize("record")), SendResults(), "end"
   randomize("record"), "sync", SendResults(), "end"
);

PreloadZip("https://amor.cms.hu-berlin.de/~barthmat/Stimuli/audioStimuli-LEXSEM_3.zip");   // Sounds

//InitiateRecorder("https://amor.cms.hu-berlin.de/~barthmat/zufaellig.php").label("init")
InitiateRecorder("https://p2zy9gmzfg.execute-api.us-east-2.amazonaws.com/default/getPresignedURL").label("init");

//UploadRecordings("async","noblock")
UploadRecordings("sync")

newTrial("welcome1",
    newText("<p>Willkommen bei unserem Experiment! Du wirst hier laut Fragen beantworten, die Du hörst. <b>Dafür muss Dein Ton an sein, am besten benutzt Du Deine Kopfhörer.</b></p>")
        .center()
        .print()
    ,
    newText("<p>Außerdem muss Dein Micro funktionieren, damit Deine Antworten aufgenommen werden könenn. Wir werden jetzt sowohl Mikro als auch Ton testen.</p><p><b>Drücke den Testknopf und mach für 5 Sekunden eine Testaufnahme.</b></p>")
        .print()
    ,
    newText("<p>Stelle sicher, dass Dein Ton an ist und Du etwas hören kannst, indem Du auf den Testknopf drückst. </p>")
        .print()
    ,
    newText("<p>Wenn Du auf 'Soundcheck!' drückst, kannst Du für 5 Sekunden eine Testaufnahme machen, die Du danach hören kannst. Wenn Du Deine Aufnahme nicht hören kannst, überprüfe Deine Einstellungen und drücke erneut 'Soundcheck!' um eine neue Probeaufnahme zu machen.</p>")
        .print()
    ,
    newText("<p><b>Wenn der Soundcheck nicht gelingt, brich das Experiment hier ab!</b> Du kannst dafür den Browsertab schließen.</p>")
        .print()
    ,
    newButton("OK", "OK")
        .print()
        .wait()
)

newTrial("welcome2",
    newText("<p>Wenn Du auf 'Soundcheck!' klickst, kannst du für 5 Sekunden eine Probeaufnahme machen, die sofort im Anschluss abgespielt wird. Du kannst Deine Lautstärkeeinstellungen verändern und dann nochmal auf 'Soundcheck!' klicken. <b>Wenn der Soundcheck bei Dir nicht funktioniert, brich das Experiment hier ab!</b> Du kannst dafür den Browsertab schließen.</p>")
        .print()
    ,
    newButton("Soundcheck!")
        .print()
        .wait()
    ,
    newMediaRecorder("testRecorder","audio")
        .record()
    ,
    newTimer("recording", 5000)
        .start()
        .wait()
    ,
    getMediaRecorder("testRecorder")
        .stop()
        .play()
        .wait("playback")
    ,
    newText("<p><br>Konntest Du Deine Aufnahme gut hören?<br></p>")
        .center()
        .print()
    ,  
    newButton("continue", "Ja, ich konnte meine Aufnahme gut hören!")
        .center()
        .print()
        .wait()
    ,
    newText("<p><br>Please enter your Prolific ID in the box below<br></p>")
        .center()
        .print()
    ,
    newTextInput("inputID")
        .center()
        .print()
        .log()
    ,
    newButton("Next", "OK")
        .center()
        .print()
        .wait()
    ,
    newVar("ID")
        .global()
        .set(getTextInput("inputID"))
)

Template( "lexsem3materials.csv" , row =>
  newTrial( "record" ,
    newText("fixCross", "+")
        .center()
        .print()
    ,
    newTimer(1000)
        .start()
        .wait()
    ,
    getText("fixCross")
        .remove()
    ,
    newMediaRecorder("theRecorder", "audio") // This determins the file name
        .record()
    ,
    newTimer("tenSeconds", 10000)
        .callback(getMediaRecorder("theRecorder").stop())
        .start()
    ,
    newAudio("question", row.audioFile+".mp3")
        .play()
    ,
    newKey(" ")
        .callback(getButton("nextTrial").click())
    ,
    newButton("nextTrial", "OK")
        .callback(getTimer("tenSeconds").stop())
        .center()
        .print()
        .wait()
    // ,
    // getMediaRecorder("theRecorder")
    //     .stop()
  )
  .log("audioFile", row.audioFile)
)

newTrial("end",
    newText("Thank you for your participation").print()
    ,
    newButton().wait()
)
