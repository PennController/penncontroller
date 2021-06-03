// HTML element
/* $AC$ PennController.newHtml(name,file) Creates a new Html element $AC$ */
/* $AC$ PennController.getHtml(name) Retrieves an existing Html element $AC$ */
window.PennController._AddElementType("Html", function(PennEngine) {

    // Imported from Form.js
    function alertOrAddError(name, error) {
        var ae = $("label.error[for=__ALL_FIELDS__]");
        if (ae.length > 0) {
            ae.addClass("Form-error-text").text(error);
            return;
        }
        var e = $("label.error[for=" + escape(name) + "]");
        if (e.length > 0)
            e.addClass("Form-error-text").text(error);
        else 
            alert(error);
    }

    // Tests whether the form has been completely filled (imported and adapted from Form.js)
    function isComplete(){
        var dom = this.jQueryElement[0];

        var inps = $(dom).find("input[type=text]");
        var tas = $(dom).find("textarea");
        for (var i = 0; i < tas.length; ++i) { inps.push(tas[i]); }

        for (var i = 0; i < inps.length; ++i) {
            var inp = $(inps[i]);

            if (inp.hasClass("obligatory") && ((! inp.attr('value')) || inp.attr('value').match(/^\s*$/)))
                return false;
        }

        var checks = $(dom).find("input[type=checkbox]");
        for (var i = 0; i < checks.length; ++i) {
            var check = $(checks[i]);

            // Checkboxes with the 'obligatory' class must be checked.
            if (!check.attr('checked') && check.hasClass('obligatory'))
                return false;
        }

        var rads = $(dom).find("input[type=radio]");
        // Sort by name.
        var rgs = { };
        for (var i = 0; i < rads.length; ++i) {
            var rad = $(rads[i]);
            if (rad.attr('name')) {
                if (! rgs[rad.attr('name')])
                    rgs[rad.attr('name')] = [];
                rgs[rad.attr('name')].push(rad);
            }
        }
        for (var k in rgs) {
            // Check if it's oblig.
            var oblig = false;
            var oneIsSelected = false;
            for (var i = 0; i < rgs[k].length; ++i) {
                if (rgs[k][i].hasClass('obligatory')) oblig = true;
                if (rgs[k][i].attr('checked'))
                    oneIsSelected = true;
            }
            
            if (oblig && (!oneIsSelected))
                return false;
        }
        
        return true;
    }

    this.immediate = function(id, html){
        if (html===undefined){
            html = id;
            if (id===undefined||typeof(id)!="string"||id.length==0)
                id = "Html";
            this.id = id;
        }
        this.html = html;
    };

    this.uponCreation = function(resolve){
        if (CHUNKS_DICT.hasOwnProperty(this.html))      // Check CHUNKS_DICT upon creation of element
            this.jQueryElement = $("<div>").html(htmlCodeToDOM({include: this.html}));
        else
            this.jQueryElement = $("<div>").append(this.html);
        this.log = false;
        this.checkboxWarningMessage = "You must check the %name% checkbox to continue.";
        this.inputWarningMessage = "The \u2018%name%\u2019 field is obligatory.";
        this.radioWarningMessage = "You must select an option for \u2018%name%\u2019.";
        resolve();
    };

    this.end = function(){
        if (!this.log)
            return;
        // Imported from Form.js (and adapted)
        var dom = this.jQueryElement[0];

        var inps = $(dom).find("input[type=text]");
        var tas = $(dom).find("textarea");
        for (var i = 0; i < tas.length; ++i) { inps.push(tas[i]); }

        for (var i = 0; i < inps.length; ++i) {
            var inp = $(inps[i]);

            PennEngine.controllers.running.save(
                this.type,
                this.id,
                csv_url_encode(inp.attr('name')),
                csv_url_encode(inp.attr('value')),
                Date.now(),
                "text input"
            );
        }

        var checks = $(dom).find("input[type=checkbox]");
        for (var i = 0; i < checks.length; ++i) {
            var check = $(checks[i]);

            PennEngine.controllers.running.save(
                this.type,
                this.id,
                check.attr('name'),
                check.attr('checked') ? "checked" : "unchecked", 
                Date.now(), 
                "checkbox"
            );
        }

        var rads = $(dom).find("input[type=radio]");
        // Sort by name.
        var rgs = { };
        for (var i = 0; i < rads.length; ++i) {
            var rad = $(rads[i]);
            if (rad.attr('name')) {
                if (! rgs[rad.attr('name')])
                    rgs[rad.attr('name')] = [];
                rgs[rad.attr('name')].push(rad);
            }
        }
        for (var k in rgs) {
            // Check if it's oblig.
            var oneIsSelected = false;
            var oneThatWasSelected;
            for (var i = 0; i < rgs[k].length; ++i) {
                if (rgs[k][i].attr('checked')) {
                    oneIsSelected = true;
                    oneThatWasSelected = i;
                }
            }
            if (oneIsSelected)
                PennEngine.controllers.running.save(
                    this.type,
                    this.id,
                    rgs[k][0].attr('name'),
                    rgs[k][oneThatWasSelected].attr('value'), 
                    Date.now(), 
                    "radio button"
                );
        }
    };

    this.value = function(){                                    // Value is whether it's complete
        return isComplete.apply(this);
    };

    this.actions = {
        warn: function(resolve){    /* $AC$ Html PElement.warn() Displays warning messages if some obligatory fields were not filled $AC$ */
            var dom = this.jQueryElement[0];

            var inps = $(dom).find("input[type=text]");
            var tas = $(dom).find("textarea");
            for (var i = 0; i < tas.length; ++i) { inps.push(tas[i]); }

            for (var i = 0; i < inps.length; ++i) {
                var inp = $(inps[i]);

                if (inp.hasClass("obligatory") && ((! inp.attr('value')) || inp.attr('value').match(/^\s*$/)))
                    alertOrAddError(inp.attr('name'), this.inputWarningMessage.replace(/%name%/gi,inp.attr('name')));
            }

            var checks = $(dom).find("input[type=checkbox]");
            for (var i = 0; i < checks.length; ++i) {
                var check = $(checks[i]);

                // Checkboxes with the 'obligatory' class must be checked.
                if (! check.attr('checked') && check.hasClass('obligatory'))
                    alertOrAddError(check.attr('name'), this.checkboxWarningMessage.replace(/%name%/gi,check.attr('name')));
            }

            var rads = $(dom).find("input[type=radio]");
            // Sort by name.
            var rgs = { };
            for (var i = 0; i < rads.length; ++i) {
                var rad = $(rads[i]);
                if (rad.attr('name')) {
                    if (! rgs[rad.attr('name')])
                        rgs[rad.attr('name')] = [];
                    rgs[rad.attr('name')].push(rad);
                }
            }
            for (var k in rgs) {
                // Check if it's oblig.
                var oblig = false;
                var oneIsSelected = false;
                for (var i = 0; i < rgs[k].length; ++i) {
                    if (rgs[k][i].hasClass('obligatory')) oblig = true;
                    if (rgs[k][i].attr('checked'))
                        oneIsSelected = true;
                }
                
                if (oblig && (! oneIsSelected))
                    alertOrAddError(rgs[k][0].attr('name'), this.radioWarningMessage.replace(/%name%/gi,rgs[k][0].attr('name')));
            }
            resolve();
        }
    };

    this.settings = {
        checkboxWarning: function(resolve, message){    /* $AC$ Html PElement.checkboxWarning(message) Defines the warning message displayed when an obligatory checkbox group is not checked $AC$ */
            this.checkboxWarningMessage = message;
            resolve();
        },
        inputWarning: function(resolve,message){    /* $AC$ Html PElement.inputWarning(message) Defines the warning message displayed when an obligatory input is not filled $AC$ */
            this.inputWarningMessage = message;
            resolve();
        },
        log: function(resolve){    /* $AC$ Html PElement.log() Logs the values of the fields from the Html in the results file $AC$ */
            this.log = true;
            resolve();
        },
        radioWarning: function(resolve, message){    /* $AC$ Html PElement.radioWarning(message) Defines the warning message displayed when an radio button group input is not selected $AC$ */
            this.radioWarningMessage = message;
            resolve();
        }
    };

    this.test = {
        complete: function(){    /* $AC$ Html PElement.test.complete() Checks that all the obligatory fields have been filled $AC$ */
            return isComplete.apply(this);
        }
    }

});
