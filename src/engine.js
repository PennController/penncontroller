import { lazyPromiseFromArrayOfLazyPromises, guidGenerator, overToScale, parseCoordinates, printAndRefreshUntil, levensthein, upload } from "./utils";

let preRunningFunctions = [];       // Functions to be run before Ibex processes window.items
let functionsDictionary = {
    keypress: []
};

// Resources can be created from PennEngine.resources.fetch or when uploading ZIP files (see zip.js)
class Resource {
    constructor(name, creation, useURLs){
        this.name = name;           // Identifies the resource when fetching
        this.value = name;          // Meant to be used in 'create'
        this.creator = creation;    // Function called in 'create'
        this.controllers = [];      // List of controllers using this resource
        this.object = null;         // Meant to be defined in 'create'
        this.status = "void";       // Can be 'void' (not created), 'pending' (still prelaoding) or 'ready' (resolved)
        this.useURLs = useURLs===undefined||useURLs;
        this.created_at = 0;
    }
    create() {
        this.status = "pending";
        this.created_at = Date.now();
        this.creator.call(this, ()=>this.resolve());
    }
    resolve() {
        this.status = "ready";
        PennEngine.debug.log("<div style='color: purple;'>Successfully preloaded resource "+this.name+"</div>");
    }
}

// Basically an API for designers
export var PennEngine = {
    resources: {
        list: [],                                   // List of resources (audios, images, videos, ...)
        fetch: function(name, creation, useURLs){   // Fetches an existing resource, or creates it using 'creation'
            var resource = PennEngine.resources.list.filter(    // Looking for resources with the same filename
                r => r.name==name && r.controllers.indexOf(PennEngine.controllers.underConstruction.id)<0
            );
            if (resource.length)                // If found (at least) one, use it
                resource = resource[0];
            else                                // Else, create one
                resource = new Resource(name, creation, useURLs);
            resource.controllers.push(PennEngine.controllers.underConstruction.id); // Link controller to resource
            PennEngine.controllers.underConstruction.resources.push(resource);      // Link resource to controller
            if (resource.status!="void")        // Return the resource if already created
                return resource;
            else                                // If resource not created yet, (re)set the creation method to this one
                resource.creator = creation;
            PennEngine.resources.list.push(resource);   // Add the resource to the list
            return resource;                            // Return the resource itself
        }
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
    PennEngine.runningOrder.active.forEach(item =>item.forEach(element=>{
        if (element.controller == "PennController")
            remaining_resources = [...remaining_resources, ...element.options.resources];
    }));
    let loading_resources = [];
    const loadResources = ()=>{
        loading_resources = loading_resources.filter(r=>
            r.status!="ready" || (r.created_at && Date.now()-r.created_at > TIMEOUT)
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
            if (resource.useURLs)                   // Also try adding candidate URLs (if not explicitly prevented)
                for (let url in PennEngine.URLs) 
                    resource.create.apply(
                        $.extend({}, resource, {    // We use a copy of the original resource for each candidate URL
                            value: PennEngine.URLs[url] + resource.name,
                            resolve: function(){    // If the copy gets resolved, it sets the original resource's object
                                if (resource.status!="ready"){
                                    resource.object = this.object;
                                    resource.resolve();
                                }
                            }
                        })
                    );
        });
        window.requestAnimationFrame(loadResources);
    }
    loadResources();
});
