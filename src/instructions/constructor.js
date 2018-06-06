// Rethink ACTIONS/SETTINGS/TESTS

const SETTINGS = "settings";
const TEST = "test";


function newBag(t) {
    let functions = [];
    return (func) => {
        if (func instanceof Function)
            functions.push(func);
        else {
            for (let f in functions)
                functions[f].call(t, func);
        }
    };
}



class PennElement {
    constructor(id){
        this.id = id;
    }

    _newInstruction() {
        let instruction = { _promises: [() => new Promise(resolve => resolve())] };
        instruction._runPromises = async function(){ 
            for (let p in instruction._promises)
                await instruction._promises[p]();
        };
        for (let m in this.methods) {
            if (this.methods[m] instanceof Function)
                instruction[m] = (...rest) => instruction._promises.push( () => this.methods[m].apply(this, rest) );
            else if (m == SETTINGS || m == TEST) {
                instruction[m] = {};
                for (let m1 in this.methods[m]) {
                    if (this.methods[m][m1] instanceof Function)
                        instruction[m][m1] = (...rest) => instruction._promises.push( () => this.methods[m].apply(this, rest) );
                }
            }
        }
        return instruction;
    }
}


PennController._addElement = function(element) {

    // Check that name is a string of alphas
    // Making sure the first character is lowercase
    let name = element.name.substr(0,1).toLowerCase() + element.name.substring(1,element.name.length);


    PennController["new"+name] = function(id){
        let element = new PennElement(id);
        return element._newInstruction();
    }
    
    PennController["get"+name] = function(id){
        let element = _localInstructions[Ctrlr.running.id][id];
        return element._newInstruction();
    }
    

}



PennController._addElement({
    name: "Audio",
    _init: function(api){

        class Audio extends api.Element {

            constructor(arg) {

                super(arg);
        
                this._playing = false;
                this._donePlaying = false;
        
                // Inner methods
                this.ends = newBag(this);
                this.ends(/* save... */);
        
                this.plays = newBag(this);
        
                // Creation of element
                this.element = new Audio();
                this.element.onplaythrough = () => this.ends();
                this.element.onplay = () => this.plays();
        
                // Public methods, settings, tests
                this.methods = {

                    // Actions
                    wait: (what) => new Promise(resolve => {
                        switch (what){
                            case "play":
                                if (this._playing)
                                    resolve();
                                else
                                    this.plays(resolve());
                                break;
                            default:
                                if (!this._playing && this._donePlaying)
                                    resolve();
                                else
                                    this.ends(resolve());
                                break;
                        }
                    })
                    ,
                    play: (arg) => new Promise(resolve => {
                        this.element.play().then( resolve() );
                    })
                    ,
                    // Settings
                    settings: {
                        logEvents: (what) => new Promise(resolve => {
                            switch(what){
                                case "play":
                                    this.plays(/* save */);
                                    break;
                                case "end":
                                    this.ends(/* save */);
                                    break;
                                default:
                                    this.plays(/* save */);
                                    this.ends(/* save */);
                                resolve();
                            }
                        })
                    }
        
                }
            }

        }

        // End of Init

    }
})
