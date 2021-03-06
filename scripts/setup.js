/*globals $, Blob, FileReader, MiniGrace, URL*/
/*globals ace, alert, confirm, document, localStorage, window*/

"use strict";

var asap, path;

asap = require("asap");
path = require("path");

$(function () {
  var MAX_VIEWS, adder, files, focused, last, template, views;

  MAX_VIEWS = 3;

  last = null;
  focused = null;

  adder = $("#add-editor");
  views = $("#views");
  template = $("#view-template");

  function indexOf(view) {
    var index = null;

    $(".view").each(function (i) {
      if (this === view[0]) {
        index = i;
        return false;
      }
    });

    if (index === null) {
      throw new Error("Did not receive a view");
    }

    return index;
  }

  function count() {
    return views.children(".view").size();
  }

  function newLine(text) {
    var p = $("<p>");
    p.text(text);
    return p;
  }

  function setDownload(download, text) {
    download.attr("href", URL.createObjectURL(new Blob([text], {
      type: "text/x-grace"
    })));
  }

  function bootEditor(view) {
    var download, editor, element, index, session;

    element = view.children(".editor");
    download = view.find(".download");
    editor = ace.edit(element[0].id);
    index = count() - 1;

    editor.on("focus", function () {
      localStorage.focused = index;
      focused = element;
      last = focused;
    });

    editor.on("blur", function () {
      focused = null;
    });

    editor.setFontSize(14);
    editor.setTheme("ace/theme/monokai");

    session = editor.getSession();
    session.setUseSoftTabs(true);
    session.setTabSize(2);
    session.setMode("ace/mode/grace");

    setDownload(download, "");

    localStorage["temp:" + index] = localStorage["temp:" + index] || "";
    localStorage["editor:" + index] =
      localStorage["editor:" + index] || "temp:" + index;

    session.on("change", function () {
      var value = session.getValue();

      setDownload(download, value);

      localStorage[localStorage["editor:" + index]] = value;

      session.clearAnnotations();

      // TODO Add annotation from compilation.
    });

    element[0].editor = editor;

    editor.focus();

    return editor;
  }

  function newView() {
    var id, size, view;

    size = count();

    if (size >= MAX_VIEWS) {
      throw new Error("Cannot build more than " + MAX_VIEWS + "views");
    }

    view = $(template.html());

    id = "editor" + size;
    localStorage["editor:" + size] =
      localStorage["editor:" + size] || "temp:" + size;

    view.children(".editor")[0].id = id;
    adder.before(view);
    bootEditor(view);

    return view;
  }

  function loadFileIn(name, editor) {
    var index, view;

    view = editor.parent();
    index = indexOf(view);

    localStorage["editor:" + index] = "file:" + name;
    localStorage.removeItem("temp:" + index);

    view.find(".file-name").text(name);
    view.find(".download").attr("download", name);

    editor[0].editor.setValue(localStorage["file:" + name]);
    editor[0].editor.clearSelection();
    editor[0].editor.moveCursorTo(0, 0);
    editor[0].editor.focus();
  }

  function loadFile(name) {
    var found = false;

    $(".view").each(function () {
      if ($(this).find(".file-name").text() === name) {
        $(this).children(".editor")[0].editor.focus();
        found = true;
      }
    });

    if (found) {
      return;
    }

    loadFileIn(name, last || $(".editor:first"));
  }

  function bootFromStorage(i) {
    var editor, file, view;

    view = newView();
    editor = view.children(".editor")[0].editor;

    file = localStorage["editor:" + i];

    if (file.substring(0, 5) === "file:") {
      view.find(".file-name").text(file.substring(5));
      view.find(".download").attr("download", file.substring(5));
    }

    editor.setValue(localStorage[file]);
    editor.clearSelection();
    editor.moveCursorTo(0, 0);
  }

  (function () {
    if (localStorage.hasOwnProperty("editor:0")) {
      var index = localStorage.focused || 0;

      bootFromStorage(0);

      if (localStorage.hasOwnProperty("editor:1")) {
        bootFromStorage(1);

        if (localStorage.hasOwnProperty("editor:2")) {
          bootFromStorage(2);
        }
      }

      $(".editor")[index].editor.focus();
    } else {
      newView();
    }
  }());

  adder.click(function () {
    newView();

    if (count() >= MAX_VIEWS) {
      adder.hide();
    }
  });

  $(document).keydown(function (event) {
    if (event.ctrlKey) {
      if (event.which === 220 && count() < MAX_VIEWS) {
        adder.click();
      } else if (event.shiftKey) {
        if (focused !== null && event.which === 8) {
          focused.parent().find(".drop-editor").click();
        }
      }
    }
  });

  function addFile(name) {
    var button, inserted, li, span;

    li = $("<li>");
    span = $("<div>");
    button = $("<div>");

    li.attr("id", "file:" + name);
    li.addClass("file");

    span.addClass("file-name");
    span.text(name);
    span.addClass("button");

    button.addClass("delete-file");
    button.addClass("button");
    button.text("⊗");

    li.append(span);
    li.append(button);

    inserted = false;

    files.children().each(function () {
      if ($(this).text() > name) {
        $(this).before(li);
        inserted = true;
        return false;
      }
    });

    if (!inserted) {
      files.append(li);
    }
  }

  (function () {
    var fileName, fold, foldTree, origWidth, sidebar, tree, unfoldTree;

    sidebar = $("#left-sidebar");
    tree = $("#file-tree");
    fold = $("#fold");

    files = $("<ul>");
    files.addClass("file-listing");

    for (fileName in localStorage) {
      if (localStorage.hasOwnProperty(fileName) &&
          fileName.substring(0, 5) === "file:") {
        addFile(fileName.substring(5));
      }
    }

    tree.append(files);

    files.on("click", ".file-name", function () {
      loadFile($(this).text());
    }).on("mouseenter", ".file", function () {
      $(this).children(".delete-file").css("display", "inline-block");
    }).on("mouseleave", ".file", function () {
      $(this).children(".delete-file").hide();
    }).on("click", ".delete-file", function () {
      var file;

      if (confirm("Are you sure you want to delete this file?")) {
        file = $(this).prev().text();

        localStorage.removeItem("file:" + file);

        $(".view").each(function () {
          if ($(this).find(".file-name").text() === file) {
            $(this).find(".drop-editor").click();
          }
        });

        $(this).parent().remove();
      }
    });

    origWidth = tree.width();

    foldTree = function () {
      fold.unbind("click", foldTree).click(unfoldTree);
      localStorage.folded = true;
      sidebar.addClass("closed");
    };

    unfoldTree = function () {
      fold.unbind("click", unfoldTree).click(foldTree);
      localStorage.removeItem("folded");
      sidebar.removeClass("closed");
    };

    fold.click(foldTree);

    $(document).keydown(function (event) {
      if (event.ctrlKey && event.shiftKey && event.which === 70) {
        fold.click();
      }
    });

    if (localStorage.folded) {
      foldTree();
    }

    asap(function () {
      $("#left-sidebar").addClass("animated");
    });
  }());

  views.on("click", ".drop-editor", function () {
    var button, children, index, size, stop;

    button = this;
    stop = false;

    views.children(".view").each(function (i) {
      var name = $(this).find(".file-name");

      if ($(this).find(".drop-editor")[0] === button) {
        if (name.text() === "" &&
            $(this).children(".editor")[0].editor.getValue() !== "") {
          if (confirm("Save before closing?")) {
            name.addClass("closing").dblclick();
            stop = true;
            return false;
          }
        }

        index = i;
        $(this).remove();
      }
    });

    if (stop) {
      return;
    }

    views.children(".view").each(function (i) {
      if (i >= index) {
        localStorage["editor:" + i] = localStorage["editor:" + (i + 1)];
      }
    });

    size = count();

    localStorage.removeItem("editor:" + size);
    localStorage.removeItem("temp:" + size);

    if (size === 0) {
      newView();
    }

    if (size < MAX_VIEWS) {
      adder.show();
    }

    children = views.children(".view");
    $(children[index] || children[index - 1])
      .children(".editor")[0].editor.focus();
  });

  views.on("dblclick", ".view-header", function () {
    var editor, input, name, view;

    view = $(this).closest(".view");
    name = $(this).children(".file-name");
    editor = $(this).next()[0].editor;

    input = $("<input>");
    input.addClass("file-input");
    input.attr("size", 1);
    input.val(path.basename(name.text(), ".grace"));

    function resize() {
      input.attr("size", input.val().length + 1);
    }

    resize();

    name.hide();
    $(this).append(input);

    function set() {
      var file, old, value;

      value = path.basename($(this).val()
        .replace(/^\s+/, "").replace(/\s+$/, ""), ".grace");

      old = path.basename(name.text(), ".grace");

      if (value !== old) {
        if (/^[\w\-]+$/.test(value)) {
          value = value + ".grace";
          file = "file:" + value;

          if (localStorage.hasOwnProperty(file)) {
            alert("That name is already taken.");
          } else {
            old = localStorage["editor:" + indexOf(view)];

            if (old.substring(0, 5) === "file:") {
              localStorage.removeItem(old);
              $(document.getElementById(old)).remove();
            }

            localStorage["editor:" + indexOf(view)] = file;
            name.text(value);
            localStorage[file] = editor.getValue();

            addFile(value);
          }
        } else if (value !== "") {
          alert("Only use letters, numbers, hyphens and underscores in a file name.");
          return;
        }
      }

      input.remove();
      name.show();

      if (name.hasClass("closing")) {
        view.find(".drop-editor").click();
      } else {
        editor.focus();
      }
    }

    input.focus().blur(set).keypress(function (event) {
      if (event.which === 13) {
        set.call(this);
      } else {
        resize();
      }
    }).keydown(resize).keyup(resize);
  });

  views.on("click", ".run", function () {
    var execute, output, value;

    execute = $(this).closest(".execute").addClass("running");
    output = execute.children(".output").text("");
    value = $(this).closest(".view").children(".editor")[0].editor.getValue();

    // TODO Run the code.
  });

  $("#upload").click(function () {
    $("#upload-input").click();
    return false;
  });

  $("#upload-input").change(function () {
    var file, reader;

    if (this.files.length > 0) {
      file = this.files[0];
      reader = new FileReader();

      reader.onload = function (event) {
        localStorage["file:" + file.name] = event.target.result;
        addFile(file.name);
      };

      reader.readAsText(file);
    }
  });
});

