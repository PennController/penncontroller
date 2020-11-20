**PennController** is a library for Ibex distributed under a BSD License 2.0. 

More info at: https://www.pcibex.net/

# Directories

 * *src* contains the source code
 * *dev* contains a test Ibex project 
 * *dist* contains the latest development compilation
 * *releases* contains the publicly available releases of **PennController**

# Code structure (/src)

## Compilation of components

The files `index_core.js` and `index_full.js` orderly list the different components that are compiled.

The file `index_core.js` includes no file from the `/elements` subfolder, whereas `index_full.js` includes most of them

## Non-element components

These files are executed in this order in both `index_core.js` and `index_full.js`:

* **utils.js**: bunch of utility functions

* **engine.js**: defines the Resource class and the PennEngine object, 

* **debug.js**: defines the debug popup and methods to interact with it

* **controller.js**: defines the Controller class (newTrial returns), 
the PennController object with its global methods, and calls `define_ibex_controller`
to define the extend native-Ibex's list of controllers with the PennController type

* **elements.js**: defines the PennElement and PennElementCommand classes. 
Adds the `_AddElementType` and `_AddStandardCommands` methods to the `PennController` object.
Also defines the sepcial commands (`end`, `clear`, `fullscreen`) and the `newElement` and `getElement` commands

* **zip.js**: implements `PennController.PreloadZip`

* **tables.js**: defines `PennController.Template` and detects and parses CSV files present in chunk_includes

* **resetprefix.js**: defines `PennController.ResetPrefix`

* **items.js**: adds a callback function through `PennEngine.Prerun` to convert PennController elements into native-Ibex items

## Definition of a PennController element

> `PennController._AddElementType( string name , function constructor )`

PennController elements are created using the global command `PennController._AddElementType`. All the script files in `src/elements` use it. Once called, that function creates the corresponding `newElement` and `getElement` methods, along with the list of associated element commands.

`_AddElementType` take two arguments. The first argument is a string representing the element type's name, which will stand in place of `Element` in the `newElement` and `getElement` methods created. The second argument is a constructor one-argument function, described below.

### Constructor function

```javascript
function (PennEngine) {
  this.immediate = function(id, ...){
    // called when newElement is executed, before any trial runs
  };
  this.uponCreation = function(resolve){
      // called upon runtime, when the element is initiated for the trial
      resolve();
  };
  this.value = function(){
      return // value
  };
  this.end = function(){
      // called at the end of the trial
  };
  this.actions = {
      action1: function(resolve, ...){
        // ...
        resolve();
      },
      action2: function(resolve, ...){
        // ...
        resolve();
      }
  };
  this.test = {
      test1: function(...){
        // ...
        return true||false;
      },
      test2: function(...){
        // ...
        return true||false;
      }
  };
}
```
The `PennEngine` argument will be instantiated with the object defined in `engine.js`, exposing several helpful objects, such as:
 * `PennEngine.controllers`, with its `underConstruction` and `running` attributes respectively pointing to the trial being created (use it in `this.immediate`) and to the trial being run (use it everywhere else)
 * `PennEngine.debug` and its `log` and `error` methods to send message to the Debug popin
 * `PennEngine.resources` used for the Image and Youtube elements for example
 * `PennEngine.events` that exposes a `keypress` callback scoping over the current trial only
 * `PennEngine.Prerun` which calls back functions just before the native-Ibex `items` variable is parsed/instantiated
 * `PennEngine.utils` which exposes most function defined in `src/utils.js`

Immediately inside the constructor function, `this` refers to the _type_ of PennElement, which expects a definition of 6 methods as illustrated above: `immediate`, `uponCreation`, `value`, `end`, `actions` and `test` (older versions of PennController would also define `settings`, which is now deprecated). Inside those methods, `this` refers to the specific element created with `newElement`. The section below describes that object.

### Element object

This describes elements of the class `PennElement`, defined in `src/elements.js`, which you can access as `this` in the 6 methods listed in the last paragraph of the preceding section.

```javascript
this = {
  id: "string",
  type: "string",
  jQueryContainer: $(),
  jQueryElement: $(),
  jQueryBefore: $(),
  jQueryAfter: $()
}
```

When the standard command `print` is run (defined in `src/elements.js`) it will add this to the page: 
```javascript
jQueryContainer
  .append(jQueryBefore)
  .append(jQueryElement)
  .append(jQueryAfter)
```
