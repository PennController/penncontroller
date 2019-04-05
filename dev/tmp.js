var MAX_GETPROG_FAILS = 10;
var UPLOAD_PROGRESS_INTERVAL = 300;

// Used for setting up syntax highlighting for CodeMirror.
var EXTENSION_TO_HIGHLIGHT_CONFIG = {
    css: {
        parserfile: 'parsecss.js',
        stylesheet: 'csscolors.css'
    },
    js: {
        parserfile: [ 'tokenizejavascript.js', 'parsejavascript.js' ],
        stylesheet: 'jscolors.css',
        indentUnit: 4
    },
    html: {
        parserfile: [ 'parsecss.js', 'tokenizejavascript.js', 'parsejavascript.js', 'parsexml.js', 'parsehtmlmixed.js '],
        stylesheet: 'xmlcolors.css'
    },
    '': { // Default
        parserfile: 'parsedummy.js',
        stylesheet: 'plain.css'
    }
};

function show_date (date) {
    return date[0] + '-' + date[1] + '-' + date[2] + ' ' + date[3] + ':' + date[4] + ':' + date[5];
}

var generateProgressID;
(function () {
var alpha = "0123456789abcdef";
generateProgressID = function () {
    var id = '';
    for(var i=0; i < 32; i++) {
        id += alpha.charAt(Math.round(Math.random()*14));
    }
    return id;
}
})();

// For giving a message the brush off.
$.widget("ui.ok", {
    _init: function () {
        this.element.addClass("ok");

        var sp;
        this.element
            .append(" (")
            .append(sp = $("<span>").addClass("oklink").text("OK"))
            .append(")");
 
        if (this.options.click) sp.click(this.options.click);
    }
});

$.widget("ui.browseFile", {
    _init: function () {
        this.element.addClass("file").addClass(this.options.writable ? "writable" : "unwritable");

        var spinContainer;
        this.element.append(spinContainer = $("<div>").css('float', 'left'));

        var downloadLink = BASE_URI +
                           'ajax/download/' + escape(EXPERIMENT) + '/' +
                           escape(this.options.dir) + '/' +
                           escape(this.options.filename);

        var t = this;
        var download;
        var delete_;
        var upload;
        var edit;
        var ays;
        var rename;
        var rename_opts;
        var ulinfo;
        var ulmsg;
        //var fname;
        var ncols = 0; // Keep track of number of cols in first <tr> so that we can set
                       // a colspan property later (gross eh?)
        var lock = false;
        this.element.append(
            $("<table>")
                .append($("<tr>")
                        .append(++ncols && (fname = ($("<td>")
                                .append(download = $("<a>")
                                                           .addClass(this.options.writable ? "writable" : "unwritable")
                                                           .attr('target', '_blank')
                                                           .attr('href', downloadLink)
                                                           .text(this.options.filename)))))
                        .append(delete_ = ((! this.options.writable) ? null : ++ncols && $("<td>")
                                .append($("<div>")
                                        .append("&nbsp;(")
                                        .addClass("delete_file")
                                        .append($("<span>").addClass("linklike").text("delete")))))
                        .append(rename = ((! this.options.writable) ? null : ++ncols && $("<td>")
                                .append($("<div>")
                                        .addClass("rename")
                                        .append("&nbsp;|&nbsp;")
                                        .append($("<span>").addClass("linklike").text("rename")))))
                        .append(((! this.options.writable) ? null : ++ncols && $("<td>")
                                .append($("<div>")
                                        .append("&nbsp;|&nbsp;")
                                        .append(upload = $("<span>")
                                                         .addClass("linklike")
                                                         .text("upload new version")))))
                        .append(((! this.options.writable || __IS_IE6__) ? null : ++ncols && $("<td>")
                                 .append($("<div>")
                                         .append("&nbsp;|&nbsp;")
                                         .append(edit = $("<span>")
                                                         .append(
                                                             $("<span>")
                                                             .addClass("linklike")
                                                                 .text("edit"))))))
                        .append(((! this.options.writable) ? null : ++ncols && $("<td>").text(")")))
                        .attr('title', 'Modified ' + show_date(this.options.modified)))
                .append((! this.options.writable) ? null : $("<tr>")
                        .append($("<td colspan='" + ncols + "'>")
                                .append(ulinfo = $("<div>")
                                        .append(ulmsg = $("<span>"))
                                        .hide())))
        ).append(
            rename_opts = $("<div>")
                .rename({
                    name: this.options.filename,
                    cancelCallback: function () {
                        rename_opts.hide(STD_TOGGLE_SPEED, function () {
                            lock = false;
                        });
                    },
                    actionCallback: function (newname) {
                        if (newname.match(/^\s*$/) || newname == t.options.filename)
                            return;

                        spinnifyPOST(spinContainer, BASE_URI + 'ajax/rename_file/' + escape(EXPERIMENT) + '/' + escape(t.options.dir) + '/' + escape(t.options.filename), { newname: newname }, function (data) {
                            if (data.error) {
                                rename_opts.rename("showError", data.error);
                            }
                            else {
                                rename_opts.rename("hideError");
                                if (t.options.renamedCallback)
                                    t.options.renamedCallback(newname)
                            }
                        }, "json");
                    }
                })
        ).append(
            ays = $("<div>")
                .areYouSure({
                    question: "Are you sure you want to delete this file?",
                    actionText: "yes, delete it",
                    uncheckedMessage: "Check the box before clicking to confirm that you want to delete the file.",
                    cancelCallback: function () {
                        ays.hide(STD_TOGGLE_SPEED, function () {
                            lock = false;
                        });
                    },
                    actionCallback: function () {
                        spinnifyGET(spinContainer,
                            BASE_URI +
                            'ajax/delete_file/' +
                            escape(EXPERIMENT) + '/' +
                            escape(t.options.dir) + '/' +
                            escape(t.options.filename),
                            function (data) {
                                if (t.options.deletedCallback)
                                    t.options.deletedCallback();
                            }
                        );
                    }
                }).hide()
        );

        if (this.options.highlight) {
            //fname.flash();
            download.flash();
            window.location = "#highlighted";
        }

        if (delete_) {
            delete_.click(function () {
                if (lock && lock != "delete")
                    return;

                ays.toggle(STD_TOGGLE_SPEED, function () {
                    lock = lock ? false : "delete";
                });
            });
        }
        if (rename) {
            rename.click(function () {
                if (lock && lock != "rename")
                    return;

                rename_opts.toggle(STD_TOGGLE_SPEED, function () {
                    lock = lock ? false : "rename";
                });
            });
        }
        if (upload) {
            var intervalId;

            var progressId = generateProgressID();
            var ulmsglock;
            new AjaxUpload(upload, {
                hoverClass: 'hoverClass',
                action: BASE_URI + 'ajax/upload_file/' +
                        escape(EXPERIMENT) + '/' +
                        escape(t.options.dir) + '/' +
                        escape(t.options.filename) +
                        '?progress_id=' + progressId
                ,
                name: "userfile",
                autoSubmit: true,
                data: { },
                responseType: false,
                onSubmit: function (file, extension) {
                    ulmsglock = false;

                    ulmsg.removeClass("error");
                    ulmsg.text("Uploading: 0%");
                    ulinfo.show();

                    // Poll server for progress info on file upload.
                    var first = 0;
                    var nojoy = 0;
                    var lastbytes = 0;
                    intervalId = setInterval(function () {
                        if (! first++) return;
                        if (nojoy > MAX_GETPROG_FAILS) {
                            clearInterval(intervalId);
                            return;
                        }
                        cachedGetJSON(
                            BASE_URI + 'progress?progress_id=' + progressId,
                            function (data) {
                                if (! (data && ((data.received==0) || data.received) && data.size))
                                    clearInterval(intervalId);
                                else if (data.aborted) {
                                    ulmsg.addClass("error");
                                    ulmsg.text("Upload aborted.");
                                    clearInterval(intervalId);
                                }
                                else {
                                    var bytes = data.received;
                                    var size = data.size;
                                    if (bytes == lastbytes) ++nojoy;
                                    lastbytes = bytes;

                                    if (! ulmsglock) {
                                        if (size > 0)
                                             ulmsg.text("Uploading: " + parseInt(bytes*100.0 / size) + "%");
                                        if (bytes == size)
                                            clearInterval(intervalId);

                                    }
                                }
                            }
                        );
                    }, UPLOAD_PROGRESS_INTERVAL);

                    return true; // Don't cancel upload.
                },
                onComplete: function (file, response) {
                    ulmsglock = true;
                    clearInterval(intervalId);

                    if (! response.match(/^\s*$/)) {
                        ulmsg.addClass("error");
                        ulmsg.html(response).append($("<span>").ok({click: function () { ulinfo.hide(STD_TOGGLE_SPEED); }}));
                    }
                    else {
                        ulmsg.empty();
                        ulmsg.addClass("message");
                        ulmsg.append($("<span>").text("Upload complete").append($("<span>").ok({click: function () { ulinfo.hide(STD_TOGGLE_SPEED); }})));
                    }
                }
            });
        }
        if (edit) {
            edit.click(function () {
                var editor = null;

                var highlightConfig;
                var m;
                if (m = t.options.filename.match(/\.(.+)$/))
                    highlightConfig = EXTENSION_TO_HIGHLIGHT_CONFIG[m[1].toLowerCase()];
                if (!m || !highlightConfig)
                    highlightConfig = EXTENSION_TO_HIGHLIGHT_CONFIG[''];

                $("body").css('overflow', 'hidden');

                function cleanup() {
                    $("body").css('overflow', 'scroll');
                    $(this).remove();
                }
            
                var editor;
                var editdialog = $("<div>");
                var stat = $("<div>").css({display: "inline-block", margin: "5px"}).text("");
            
                function save(closeAfter) {
                    return function (callback) {
                        stat.text("saving");
                        stat.css("visibility","visible");
                        spinnifyPOST(
                            stat,
                            BASE_URI + 'ajax/upload_file/' + escape(EXPERIMENT) + '/' + escape(t.options.dir) + '/' + escape(t.options.filename),
                            { contents: editor.getValue() },
                            function () {
                                if (closeAfter) {
                                    cleanup.call(editdialog);
                                    // download.flash();
                                }
                                else {
                                    stat.text("saved").flash({
                                        type: 'message',
                                        finishedCallback: function() {
                                            stat.css("visibility","hidden");
                                        }
                                    });
                                }
                                if (callback && callback instanceof Function)
                                    callback.call();
                            },
                            null/*type*/,
                            false/*dontWait*/
                        );
                    }
                }
            
                let href = BASE_URI + $("#username")[0].innerHTML + '/' + EXPERIMENT + '/experiment.html';
                let link;
                let openLink = function(){
                    if (link && link.location && link.location.href==href)
                        return;
                    link = window.open('','_blank');
                };
            
                editdialog.dialog({
                    closeOnEscape: false,
                    modal: true,
                    position: [25, 25],
                    title: "test",
                    width: ($(window).width() - 50),
                    height: ($(window).height() - 50),
                    minWidth: 420,
                    minHeight: 450,
                    buttons: {
                        "Discard changes": cleanup,
                        "Save changes": save(false),
                        "Save and close": save(true),
                        "Save and test": function(){openLink(); save(false).call(this, ()=>{link.location=href;link.focus();}); },
                    },
                    open: function(){
                        $(this).parent().find("div.ui-dialog-buttonpane div.ui-dialog-buttonset").prepend(stat).prepend($(link));
                        stat.css("visibility","none");
                    }
                });
            
            
                spinnifyGET(editdialog, downloadLink, function (data) {
                    var editte = $("<div>").attr('id', 'editor');
                    editdialog.append(editte);
                    editor = ace.edit(editdialog[0], {
                        mode: "ace/mode/javascript",
                        selectionStyle: "text"
                    });
                    editor.session.setValue(data);
                    editor.setShowPrintMargin(false);
                    editor.setOptions({
                        enableBasicAutocompletion: true,
                        enableSnippets: true,
                        enableLiveAutocompletion: true
                    });
            
                    var ACglobalPattern = new RegExp("/[*]! ([$]AC[$] .+? [$]AC[$]) [*]/", "g");
                    var ACpattern = new RegExp("[$]AC[$] ([^.]+?)[.]([^\\s]+?) (.+?) [$]AC[$]", "g");
                    let ACcommands = [];
                    var langTools = ace.require("ace/ext/language_tools");
                    $.get(BASE_URI + 'ibexexps/' + $("#username")[0].innerHTML + '/' + EXPERIMENT + '/server.py?include=js', function(data) {
                        let AC;
                        while ((AC = ACglobalPattern.exec(data)) !== null){
                            let command;
                            while ((command = ACpattern.exec(AC[1])) !== null)
                                ACcommands.push(command);
                        }
                        var staticWordCompleter = {
                            getCompletions: function(editor, session, pos, prefix, callback) {
                                callback(null, ACcommands.map(function(command) {
                                    let value = command[2], par = value.indexOf("(");
                                    if (par>0) value = value.substring(0,par);
                                    let caption = value;
                                    if (command[1].match(/PElement/))
                                        caption = command[1].split(" ")[0] + "." + value;
                                    return {
                                        caption: caption,
                                        value: value,
                                        meta: command[1],
                                        description: command[3],
                                        command: command[2]
                                    };
                                }));
                    
                            },
                            getDocTooltip: function(item) {
                                let lang = ace.require("ace/lib/lang")
                                if (!item.docHTML) {
                                    if (item.type == "snippet")
                                        item.docHTML = [
                                            "<b>", lang.escapeHTML(item.caption), "</b>", "<hr></hr>",
                                            lang.escapeHTML(item.snippet)
                                        ].join("");
                                    else if (item.description)
                                        item.docHTML = [
                                            "<b>", lang.escapeHTML(item.meta) , "." , lang.escapeHTML(item.command), "</b>", "<hr></hr>",
                                            lang.escapeHTML(item.description)
                                        ].join("");
                                }
                            }
                        };
                        langTools.addCompleter(staticWordCompleter);
                    }, "text");
                }, "text/plain" /* "json" by default */);
            });
        }
    }
});

$.widget("ui.browseDir", {
    refresh: function (highlight) {
        this.element.empty();
        if (highlight)
            this.options.highlight = highlight;
        else this.options.highlight = [];
        this._init();
    },

    _init: function () {
        this.element.addClass("browseDir");

        if (! this.options.highlight) this.options.highlight = [];

        var spinContainer;
        this.element.append(spinContainer = $("<div>").css('float', 'left'));

        var t = this;
        spinnifyGET(spinContainer, BASE_URI + 'ajax/browse?dir=' + escape(this.options.dir) + '&experiment=' + escape(EXPERIMENT), function (data) {
            t.element.addClass("dir");

            var table;
            var upload;
            var upload_msg;
            var refresh_link;
            t.element.append(table = $("<table>")
                             .append($("<tr>")
                                     .append($("<th>")
                                             .text(t.options.dir)
                                             .append($("<span>").css('font-weight', 'normal').html("&nbsp;("))
                                             .append(upload = $("<span>")
                                                     .addClass("linklike")
                                                     .text("upload a file to this directory"))
                                             .append($("<span>").css('font-weight', 'normal').html("&nbsp;|&nbsp;"))
                                             .append(refresh_link = $("<span>")
                                                     .addClass("linklike")
                                                     .text("refresh"))
                                             .append($("<span>").css('font-weight', 'normal').text(")"))))
                             .append($("<tr>")
                                     .append($("<td>")
                                             .append(upload_msg = $("<div>").hide()))));

            refresh_link.click(function () {
                t.refresh();
            });

            var progressId = generateProgressID();
            var intervalId;
            var ulmsglock;
            new AjaxUpload(upload, {
                hoverClass: 'hoverClass',
                action: BASE_URI + 'ajax/upload_file/' +
                        escape(EXPERIMENT) + '/' +
                        escape(t.options.dir) +
	                '?progress_id=' + progressId
                ,
                name: "userfile",
                autoSubmit: true,
                data: { },
                responseType: false,
                onSubmit: function (file, extension) {
                    ulmsglock = false;

                    upload_msg.removeClass("error");
                    upload_msg.text("Uploading: 0%");
                    upload_msg.show();

                    // Poll server for progress info on file upload.
                    var first = 0;
                    var nojoy = 0;
                    var lastbytes = 0;
                    intervalId = setInterval(function () {
                        if (! first++) return;
                        if (nojoy > MAX_GETPROG_FAILS) {
                            clearInterval(intervalId);
                            return;
                        }
                        cachedGetJSON(
                            BASE_URI + 'progress?progress_id=' + progressId
                            ,
                            function (data) {
                                if (! (data && ((data.received==0) || data.received) && data.size))
                                    clearInterval(intervalId);
                                else if (data.aborted) {
                                    upload_msg.addClass("error");
                                    upload_msg.text("Upload aborted.");
                                    clearInterval(intervalId);
                                }
                                else {
                                    var bytes = data.received;
                                    var size = data.size;

                                    if (bytes == lastbytes) ++nojoy;
                                    lastbytes = bytes;

                                    if (! ulmsglock) {
                                        if (size > 0)
                                            upload_msg.text("Uploading: " + parseInt(bytes*100.0 / size) + "%");
                                        if (bytes == size)
                                            clearInterval(intervalId);
                                    }
                                }
                            }
                        );
                    }, UPLOAD_PROGRESS_INTERVAL);
                },
                onComplete: function (file, response) {
                    ulmsglock = true;
                    clearInterval(intervalId);

                    if (! response.match(/^\s*$/)) {
                        upload_msg.addClass("error");
                        upload_msg.html(response)
                            .append(" (")
                            .append($("<span>").addClass("ok").text("OK").click(function () { upload_msg.hide(STD_TOGGLE_SPEED); }))
                            .append(")");
                    }
                    else {
                        upload_msg.empty();
                        t.refresh([file]);
                    }
                }
            });

            if (data.not_present) {
                table.append($("<tr>").append($("<td>").addClass("not_present").text("This directory is not present")));
            }
            else {
                data.entries = data.entries.sort(caseInsensitiveSortingFunction);
                for (var i = 0; i < data.entries.length; ++i) {
                    if (data.entries[i][0]) continue; // Ignore dirs.

                    var filename = data.entries[i][1];
                    var size     = data.entries[i][2];
                    var modified = data.entries[i][3];
                    var writable = data.entries[i][4];

                    function rcallback() { t.refresh(); }
                    var shouldHighlight = false;
                    for (var j = 0; j < t.options.highlight.length; ++j) {
                        if (t.options.highlight[j] == filename) {
                            shouldHighlight = true;
                            break;
                        }
                    }
                    table.append($("<tr>").append($("<td>").append($("<div>").browseFile({
                        filename: filename,
                        highlight: shouldHighlight,
                        size: size,
                        dir: t.options.dir,
                        modified: modified,
                        writable: writable,
                        deletedCallback: rcallback,
                        renamedCallback: rcallback
                    }))));
                }
            }
        });
    }
});

$.widget("ui.pwmanage", {
    _init: function () {
        var t = this;
 
        function isprotectedp(username, newp) {
            return $("<p>").addClass("auth_msg")
                           .append(newp ? "A password has been set for this experiment; the username is " :
                                          "This experiment is password protected; the username is ")
                           .append($("<b>").text(username))
                           .append(".");
        }
        function isnotprotectedp () {
            return $("<p>").addClass("auth_msg").text("This experiment is not password protected.");
        }

        spinnifyGET(t.element, BASE_URI + 'ajax/get_experiment_auth_status/' + escape(EXPERIMENT), function (result) {
            if (result.username) {
                t.element.append(isprotectedp(result.username));
            }
            else {
                t.element.append(isnotprotectedp());
            }
            var pwinp;
            var submit;
            var rem;
            t.element
                .append($("<div>")
                        .addClass("pwadder")
                        .append(pwinp = $("<input type='password' size='10'>"))
                        .append(submit = $("<input type='submit' value='" + (result.username ? "Change " : "Add ") + "password'>")))
            function addPwRemover() {
                t.element
                .append($("<p>")
                        .addClass("pwremover")
                        .append(rem = $("<span>")
                                .addClass("linklike")
                                .html("&raquo; Remove password protection")));
            }
            if (result.username) addPwRemover();

            function handle(pw) {
                spinnifyPOST(t.element,
                             BASE_URI + 'ajax/password_protect_experiment/' + escape(EXPERIMENT),
                             pw ? { password: pw } : { remove: '1' },
                             function (result) {
                                 // This can't fail.
                                 pwinp.attr('value', '');
                                 if (pw) {
                                     t.element.find(".auth_msg").replaceWith(isprotectedp(result.username, true).flash({type: 'message'}));
                                     submit.attr('value', 'Change password');
                                     addPwRemover();
                                     rem.click(function () { handle(); });
                                 }
                                 else {
                                     t.element.find(".auth_msg").replaceWith(isnotprotectedp().flash({type: 'message'}));
                                     $(".pwremover").remove();
                                     submit.attr('value', 'Add password');
                                 }
                             },
                             "json");
            }
            submit.click(function () { handle(pwinp.attr('value')); });
            pwinp.keypress(function (e) { if (e.which == 13 /*return*/) { handle(pwinp.attr('value')); } });
            if (rem) rem.click(function () { handle(); });
        });
    }
});

var dirsWidgetHash = { };

function sync_git(e) {
    e.preventDefault();

    if ($("#git_url").attr('value').match(/^\s*$/))
        return;

    $("#gitstatus").empty();

    spinnifyPOST($("#gitspin"),
                 BASE_URI + 'ajax/from_git_repo',
                 { url: $("#git_url").attr('value'),
                   branch: $("#git_branch").attr('value'),
                   expname: EXPERIMENT },
                 function (result) {
                     if (result.error) {
                         var esp = $("<span>").addClass("giterror");
                         var lines = result.error.split("\n");
                         for (var i = 0; i < lines.length; ++i) {
                             var sp;
                             esp.append(sp = $("<span>").text(lines[i]));
                             if (i + 1 != lines.length) sp.append("<br/>");
                         }
                         $("#gitstatus").empty().append(
                             $("<span>").addClass("giterror")
                                        .append(esp)
                                        .hide().fadeIn("slow"));
                     }
                     else {
                         // Update the status message.
                         $("#gitstatus").empty().append(
                             $("<span>").text("Success: " + result.files_modified.length +
                                              " file" + (result.files_modified.length == 1 ? "" : "s") + " modified.")
                                        .hide().fadeIn("slow"));
                         setTimeout(function () {
                             $("#gitstatus > span").fadeOut("slow", function () { $("#gitstatus").empty(); })
                         }, 7000);

                         // Refresh all the dirs that were modified, highlighting modified files.
                         for (var i = 0; i < result.dirs_modified.length; ++i) {
                             // Find relevant files.
                             var modified = [];
                             for (var j = 0; j < result.files_modified.length; ++j) {
                                 var s = result.files_modified[j].indexOf(result.dirs_modified[i] + '/');
                                 if (s == 0) modified.push(result.files_modified[j].substr(result.dirs_modified[i].length + 1));
                             }
                             dirsWidgetHash[result.dirs_modified[i]].browseDir("refresh", modified);
                         }
                     }
                 },
                 "json", true);
}

function show_hide_git() {
    $("#git > div").toggle(STD_TOGGLE_SPEED, function () {
        if ($("#git > div").is(':visible')) {
            $("#git_url").focus();
            createCookie("gitslideopen" + $("#username")[0].innerHTML, "1", 10);
        }
        else {
            eraseCookie("gitslideopen" + $("#username")[0].innerHTML);
        }
    });
}

$(document).ready(function () {
    $("#authinfo").pwmanage();

    // We don't spinnify this, as that leads to to a surfeit of spinners on page load.
    $.getJSON(BASE_URI + 'ajax/get_dirs', function (data) {
        var sdirs = data.dirs.sort(caseInsensitiveSortingFunction);
        for (var i = 0; i < data.dirs.length; ++i) {
            var w;
            $("#files").append(w = $("<div>").browseDir({ dir: sdirs[i] }));
            dirsWidgetHash[sdirs[i]] = w;
        }
    });

    $("#gitsync").click(sync_git);
    $("#git input[type=text]").keypress(function (e) { if (e.which == 13 /*return*/) sync_git(e); });
    $("#git > span").click(show_hide_git);

    if (readCookie("gitslideopen" + $("#username")[0].innerHTML))
        $("#git > div").show();
});