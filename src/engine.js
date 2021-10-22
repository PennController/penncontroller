import { lazyPromiseFromArrayOfLazyPromises, guidGenerator, overToScale, parseCoordinates, printAndRefreshUntil, levensthein, upload } from "./utils";

let preRunningFunctions = [];       // Functions to be run before Ibex processes window.items
let functionsDictionary = {
    keypress: []
};

const resources = {};

// Resources can be created from PennEngine.resources.fetch or when uploading ZIP files (see zip.js)
class Resource {
    constructor(name, creator, useURLs=true){
        if (resources[name]===undefined) resources[name] = [];
        resources[name].push(this);
        const controller = PennEngine.controllers.underConstruction;
        controller.resources.push(this);      // Link resource to controller
        PennEngine.resources.list.push(this);
        // if (resources[name]===undefined) resources[name] = [];
        // resources[name].push(this);
        this.name = name;           // Identifies the resource when fetching
        this.value = name;          // Meant to be used in 'create'
        this.uris = [name];         // List of URIs from which to generate the resource
        this.creator = creator;     // Function called in 'create'
        this.object = null;         // Meant to be defined in 'resolve'
        this.status = "void";       // Can be 'void' (not created), 'pending' (still prelaoding) or 'ready' (resolved)
        this.useURLs = useURLs;
        this.created_at = 0;
        this.controller = controller;
        this.resolveCallback = [];
    }
    addURI(uri){
        if (this.uris.indexOf(uri)>=0) return;
        this.uris.push(uri);
        if (this.status=="pending")
            this.creator.call(this, uri, object=>this.resolve(object));
    }
    callCreatorOnAllURIs(){
        this.uris.forEach(uri=>{
            this.creator.call(this, uri, object=>this.resolve(object));
        });
    }
    create() {
        if (this.status!="void") return;
        this.created_at = Date.now();
        if (this.useURLs)
            PennEngine.URLs.forEach(url=>{
                if (!url.endsWith('/')) url += '/';
                this.addURI(url+this.name)
            });
        this.status = "pending";
        this.callCreatorOnAllURIs();
        // Homonyms share the same name and *are not in the same trial*
        // const homonyms = resources[this.name].filter(
        //     r=> r!=this && r.controller!=this.controller && r.controller.id!="Header" && r.controller.id!="Footer"
        // );
        // If no other resource with this name, just call creator already
        // if (homonyms.length===0)
        //     this.callCreatorOnAllURIs();
        // else{
        //     const homonymsByStatus = {void:[],pending:[],ready:[]};
        //     homonyms.forEach(r=>homonymsByStatus[r.status].push(r));
        //     if (homonymsByStatus.ready.length>0){
        //         // If there is a homonym that's ready, resolve this and all pending resources
        //         const object = homonymsByStatus.ready[0].object;
        //         homonymsByStatus.void.forEach(r=>r.resolve(object));
        //         homonymsByStatus.pending.forEach(r=>r.resolve(object));
        //         this.resolve(object);
        //     }
        //     else if (homonymsByStatus.pending.length>0)
        //         // If there are pending homonyms, resolve this resource with the first resolving homonym
        //         homonymsByStatus.pending.forEach(r=>r.resolveCallback.push( object => this.resolve(object) ));
        //     else{
        //         // If all homonyms are void, bypass their creation and call creator on this resource
        //         homonymsByStatus.void.forEach( r=> {
        //             r.status = 'pending';
        //             r.created_at = Date.now();
        //             this.resolveCallback.push( object => r.resolve(object) );
        //         });
        //         this.callCreatorOnAllURIs();
        //     }
        // }   
    }
    resolve(object) {
        if (this.status==='ready') return;
        this.object = object;
        this.status = "ready";
        PennEngine.debug.log("<div style='color: purple;'>Successfully preloaded resource "+this.name+"</div>");
        this.resolveCallback.forEach(cb => cb instanceof Function && cb.call(this, object) );
    }
}

// Basically an API for designers
export var PennEngine = {
    resources: {
        new: (name, creator, useURLs=true)=>{
            let resource;
            if (resources[name]===undefined)
                resource = new Resource(name, creator, useURLs);
            else{
                resource = resources[name][0];
                const controller = PennEngine.controllers.underConstruction;
                const header = PennEngine.controllers.header;
                const footer = PennEngine.controllers.footer;
                const need_new_resource = (
                    controller.resources.filter(r=>r.name==name).length>0 ||
                    (header&&controller.runHeader!==false&&header.resources.filter(r=>r.name==name).length>0) ||
                    (footer&&controller.runFooter!==false&&footer.resources.filter(r=>r.name==name).length>0)
                );
                if (need_new_resource || (!resource instanceof Resource))
                    resource = new Resource(name,creator,useURLs);
                    
            }
            return resource;
        },
        list: []                                   // List of resources (audios, images, videos, ...)
    }
    ,
    controllers: {
        list: [],
        running: null,
        underConstruction: null
    }
    ,
    elements: {
        list: [/*{nameEl1Ctrl1: {}, nameEl2Ctrl1: {}}, {nameEl1Ctrl2: {}, nameEl2Ctrl2: {}}*/]
    }
    ,
    events: {                                   // Event handlers
        keypress: f=> {                                // Keypress, triggered only when *new* keypress
            let toAdd = [ f , PennEngine.controllers.running||PennEngine.controllers.underConstruction ];
            functionsDictionary.keypress.push( toAdd );                 // Add the event function to the list
            if (PennEngine.controllers.running){
                let oldEndTrial = PennEngine.controllers._endTrial;
                PennEngine.controllers.running._endTrial = async function(){
                    await oldEndTrial.apply(PennEngine.controllers.running);
                    toAdd[0] = ()=>{};                                  // Clear event at end of trial
                };
            }
            else {
                let oldSequence = PennEngine.controllers.underConstruction.sequence;
                PennEngine.controllers.underConstruction.sequence = lazyPromiseFromArrayOfLazyPromises(
                    [ oldSequence , r=>{ toAdd[0]=()=>{}; r(); } ]      // Clear event at end of trial
                );
            }
        }
    }
    ,
    URLs: []
    ,
    utils: {
        guidGenerator: guidGenerator,
        parseCoordinates: parseCoordinates,
        printAndRefreshUntil: printAndRefreshUntil,
        levensthein: levensthein,
        upload: upload,
        overToScale: overToScale
    }
    ,
    tmpItems: []        //  PennController() adds {PennController: id}, PennController.Template adds {PennTemplate: [...]}
    ,
    tables: {}
    ,
    Prerun: function(func){
        preRunningFunctions.push(func);
    }
};


// Run functions before sequence of items is generated
// __SendResults__ is created right before the sequence gets generated from items
let old_ibex_controller_set_properties = window.ibex_controller_set_properties;
window.ibex_controller_set_properties = function (name, options) {

    old_ibex_controller_set_properties(name, options);

    if (name!="__SendResults__")                            // Make sure to run only upon SendResults' creation
        return;

    // Keypress events
    document.addEventListener('keydown', e=>{
        if (e.repeat)                                       // If this is a key holding, don't fire
            return;
        if (PennEngine.controllers.running)                 // Fire event: run functions
            for (let f = 0; f < functionsDictionary.keypress.length; f++)
                if ( PennEngine.controllers.running == functionsDictionary.keypress[f][1] ||
                     PennEngine.controllers.running.id == functionsDictionary.keypress[f][1]
                    )
                        functionsDictionary.keypress[f][0].apply(this, [e]);
    });

    // Pre-running functions
    for (let f in preRunningFunctions)
        if (preRunningFunctions[f] instanceof Function)
            preRunningFunctions[f].call();

}


const PARALLEL_RESOURCES = 4;
const TIMEOUT = 10*1000; // 10s

PennEngine.Prerun( async ()=> {
    const checkRunningOrder = r=>{
        if (PennEngine.runningOrder && PennEngine.runningOrder.active) r();
        else window.requestAnimationFrame(()=>checkRunningOrder(r));
    };
    await new Promise(checkRunningOrder);   // Wait until runningOrder is defined
    let remaining_resources = [];
    for (let i = 0; i < PennEngine.runningOrder.active.length; i++){
        const item = PennEngine.runningOrder.active[i];
        for (let n = 0; n < item.length; n++){
            const element = item[n];
            if (element.controller == "PennController")
                remaining_resources = [...remaining_resources, ...element.options.resources];
        }
    }
    let loading_resources = [];
    const loadResources = ()=>{
        loading_resources = loading_resources.filter(r=>
            r.status!="ready" && (r.created_at===0 || Date.now()-r.created_at > TIMEOUT)
        );
        if (remaining_resources.length>0 && loading_resources.length<PARALLEL_RESOURCES){
            let resource = remaining_resources.shift();
            while ((resource===undefined||resource.status=="ready")&&remaining_resources.length)
                resource = remaining_resources.shift();
            if (resource && resource.status!="ready") loading_resources.push(resource);
        }
        if (loading_resources.length==0) return;
        loading_resources.forEach(resource=>{
            if (!(resource instanceof Resource) || resource.status!="void") return;
            resource.create();                      // Resource is void: try to create it
        });
        window.requestAnimationFrame(loadResources);
    }
    loadResources();
});
