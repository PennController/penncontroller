import { PennEngine } from "./engine.js";
import { Controller } from './controller.js';

// Process PennEngine.tmpItems immediately before Ibex processes window.items
//
//      example_data.js:
//          PennController( ... );
//          PennController( ... );
//          PennController.Template( . => PennController( ... ) );
//          PennController.Template( . => ["Message", {}, "PennController", PennController( ... )] );
//          var items = [ ["consent", "Form", {}] , ["send", "__SendResults__", {}] ];
//
//      produces:
//          PennEngine.tmpItems = [
//              PennController(),
//              PennController(),
//              {PennTemplate: [ a = PennController(), b = PennController() ]},
//              {PennTemplate: [ [label, "Message", {}, "PennController", c = PennController()] ]},
//              ["consent", "Form", {}],
//              ["send", "__SendResults__", {}]
//              a,
//              b,
//              c
//          ]
PennEngine.Prerun(()=>{
    
    let includedControllers = [];

    // Converts any PennController() into a [label, "PennController", controller] item (if not already included)
    function convertItem (item) {
        if (item instanceof Controller)
            if (includedControllers.indexOf(item)<0 && item.addToItems)
                return [item.useLabel||"unlabeled", "PennController", item];
            else                                        // Return only if not already included (mind duplicates) and addToItems==true
                return null;                            // Null if already included
        return item;                                    // Non-PennController item: return as is
    }

    if (window.items instanceof Array)                  // PennController() pushes PennEngine.tmpItems even from within window.items
        for (let a = 0; a < window.items.length; a++)   // If in window.items, then PennController() was called within it
            if (window.items[a] instanceof Array && window.items[a].length>2)   // Sanity check
                for (let c = 2; c < window.items[a].length; c += 2)
                    includedControllers.push(window.items[a][c]); // Add every controller (even non-PennController) / parameter object

    let tmpItems = [];                                  // Local copy: pushed with every item in order 

    for (let i = 0; i < PennEngine.tmpItems.length; i++){ // Go through the array
        let item = PennEngine.tmpItems[i];
        let itemsToAdd = [];                            // Yet another tmp array, probed to fill includedControllers

        if (item instanceof Object && item.hasOwnProperty("PennTemplate"))
            for (let t = 0; t < item.PennTemplate.length; t++)  // If template, add items from within
                itemsToAdd.push( convertItem(item.PennTemplate[t]) );
        else
            itemsToAdd.push( convertItem(item) );      // Add item after conversion (if need be)

        for (let a = 0; a < itemsToAdd.length; a++)    // Preventing addition of duplicates, just in case
            if (itemsToAdd[a] instanceof Array && itemsToAdd[a].length>2)   // Sanity check
                for (let c = 2; c < itemsToAdd[a].length; c += 2)
                    includedControllers.push(itemsToAdd[a][c]);

        tmpItems = tmpItems.concat(itemsToAdd);
    }

    if (window.items instanceof Array)
        for (let i = 0; i < window.items.length; i++)  // Add remaining items defined after PennController/PennTemplate's
            if (tmpItems.indexOf(window.items[i])<0)
                tmpItems.push(window.items[i]);

    // Replace global items variable (and filter 'null' controllers)
    window.items = tmpItems.filter(e=>(e instanceof Array && e.length > 2));

    if (!window.shuffleSequence)                            // Run in order defined if nothing specified
        window.conf_shuffleSequence = window.seq(window.anyType);

});