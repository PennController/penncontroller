function maze(sentence1, sentence2){
    sentence1 = sentence1.replace(/\s+/g,' ').replace(/(^\s+|\s+$)/,'');
    sentence2 = sentence2.replace(/\s+/g,' ').replace(/(^\s+|\s+$)/,'');
    let words1 = sentence1.split(' '), words2 = sentence2.split(' ');
    let correctWords = words1.map(w=>null);
    let callbacks = words1.map(w=>null);
    if (words1.length != words2.length)
        throw Error("The two sentence must have the exact same length");
    let sequence = [
        newTimer('betweenWords', 100),
        newCanvas("2words", 200, 40)
            .settings.add(  25, 0, newText('word1', "") )
            .settings.add( 125, 0, newText('word2', "") )
            .settings.center()
            .print(),
        newSelector("words")
                .settings.add( getText('word1') , getText('word2') )
                .settings.keys(    "F"          ,   "J"             )
                .settings.disableClicks()
                .settings.log()
        ];
    for (let w in words1){
        callbacks[w] = newFunction("func"+w, ()=>correctWords[w]);
        sequence = sequence.concat([
            getText('word1').settings.text(words1[w]).settings.visible(),
            getText('word2').settings.text(words2[w]).settings.visible(),
            getSelector('words').shuffle().settings.keys('F','J').settings.enable().wait(),
            callbacks[w],
            getTimer('betweenWords').start().wait(),
            getSelector('words').unselect().settings.disable(),
            getText('word1').settings.hidden(),
            getText('word2').settings.hidden(),
        ]);
    }   
    sequence.correct = (n,word,...callback)=>{
        if (callback && n>=0 && n<callbacks.length && (words1[n]==word||words2[n]==word)) {
            correctWords[n] = word;
            callbacks[n].testNot.is(null).success(  
                getFunction("func"+n).test.is(words1[n]).success(
                    getSelector('words').test.selected( getText('word1') ).failure( ...callback )
                ).failure(
                    getSelector('words').test.selected( getText('word2') ).failure( ...callback )
                )
            );
        }
        return sequence;
    }
    return sequence;
}