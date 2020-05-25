let chunks;
(function (){
    let generated = false;
    let toGenerate = [];
    let oldRunShuffleSequence = window.runShuffleSequence;
    window.runShuffleSequence = (masterArray, ss) => {
        if (generated)
            return oldRunShuffleSequence(masterArray, ss);
        generated = true;
        for (let i = 0; i < toGenerate.length; i++){
            let current = toGenerate[i];
            let from = oldRunShuffleSequence(masterArray, seq(current.from));
            let chunks = [];
            if (current.regex instanceof RegExp) {
                let chunksFrom = {};
                from.map( v=>{
                    let chunkLabel = v[0].type.match(current.regex);
                    if (chunkLabel===null)
                        return
                    if (!chunksFrom.hasOwnProperty(chunkLabel))
                        chunksFrom[chunkLabel] = [];
                    chunksFrom[chunkLabel].push( v )
                } );
                for (let label in chunksFrom)
                    chunks.push( oldRunShuffleSequence(chunksFrom[label], current.output) );
                if (current.order)
                    chunks.sort( v=>Math.random()>=0.5 );
            }
            else
                alert("You must define a valid regular expression to group your chunks");
            current.return = chunks.flat(1);
        }
        return oldRunShuffleSequence(masterArray, ss);
    }
    function Chunks(from, output, order, regex) {
        this.args = [from];
        this.from = from;
        this.output = output;
        this.order = order;
        this.regex = regex;
        this.return = [];
        toGenerate.push(this);
        this.run = function(arrays) {
            return this.return;
        };
    }
    chunks = (from, output, regex, randomizeChunks) => new Chunks(from, output, randomizeChunks, regex);
}());