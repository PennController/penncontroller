// Resources can be created from PennEngine.resources.fetch or when uploading ZIP files (see zip.js)
class Resource {
    constructor(name, creation){
        this.name = name;           // Identifies the resource when fetching
        this.value = name;          // Meant to be used in 'create'
        this.creator = creation;    // Function called in 'create'
        this.controllers = [];      // List of controllers using this resource
        this.object = null;         // Meant to be defined in 'create'
        this.status = "void";       // Can be 'void' (not created), 'pending' (still prelaoding) or 'ready' (resolved)
    }
    create() {
        this.status = "pending";
        this.creator.apply(this, [()=>this.resolve()]);
    }
    resolve() {
        this.status = "ready";
    }
}


// Basically an API for designers
export var PennEngine = {
    resources: {
        list: [],                                   // List of resources (audios, images, videos, ...)
        fetch: function(name, creation, useURLs){   // Fetches an existing resource, or creates it using 'creation'
            useURLs = useURLs==undefined|useURLs==true;
            var resource = PennEngine.resources.list.filter(    // Looking for resources with the same filename
                r => r.name==name && r.controllers.indexOf(PennEngine.controllers.underConstruction.id)<0
            );
            if (resource.length)                // If found (at least) one, use it
                resource = resource[0];
            else                                // Else, create one
                resource = new Resource(name, creation);
            resource.controllers.push(PennEngine.controllers.underConstruction.id); // Link controller to resource
            PennEngine.controllers.underConstruction.resources.push(resource);      // Link resource to controller
            if (resource.status!="void")        // Return the resource if already created
                return resource;
            else                                // If resource not created yet, (re)set the creation method to this one
                resource.creator = creation;
            resource.create();                  // Resource is void: try to create it
            if (useURLs)                        // Also try adding candidate URLs (if not explicitly prevented)
                for (let url in PennEngine.URLs) 
                    resource.create.apply(
                        $.extend({}, resource, {    // We use a copy of the original resource for each candidate URL
                            value: PennEngine.URLs[url] + name,
                            resolve: function(){    // If the copy gets resolved, it sets the original resource's object
                                if (resource.status!="ready"){
                                    resource.object = this.object;
                                    resource.resolve();
                                }
                            }
                        })
                    );
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
    URLs: []
    ,
    utils: {}
};