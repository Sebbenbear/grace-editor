/*globals importScripts, minigrace, postMessage, var_done*/

"use strict";

var document, sources, window;

window = this;
document = {};

importScripts("minigrace.min.js");

sources = {};

minigrace.debugMode = true;
minigrace.printStackFrames = false;
minigrace.verbose = false;

this.Grace_print = function() {
  return var_done;
};

function compile(name, source) {
  var stop = false;

  minigrace.stderr_write = function (message) {
    var module;

    if (!stop && message.substring(0, 10) !== "minigrace:") {
      message = message.split("\n")[0];

      if (message.indexOf("ImportError") > -1) {
        module = message.match(/'([\w\/]+)'/);

        if (module !== null) {
          module = module[1];

          postMessage({
            name: name,
            isSuccessful: false,
            dependency: module
          });
        }
      } else {
        postMessage({
          isSuccessful: false,
          name: name,
          reason: {
            line: (message.match(/\d+/) || [1])[0],
            column: (message.match(/\((\d+)\)/) || [null, 1])[1],
            message: message.substring(message.indexOf(" ") + 1)
          }
        });
      }

      stop = true;
    }
  };

  name = name || "main";

  minigrace.modname = name;
  minigrace.mode = "js";
  minigrace.compile(source);

  if (!minigrace.compileError) {
    var escaped, output;

    escaped = "gracecode_" + name.replace("/", "$");
    output = minigrace.generated_output;

    /*jslint evil: true*/
    eval("var myframe;" + output + ";window." + escaped + "=" + escaped);
    /*jslint evil: false*/

    postMessage({
      isSuccessful: true,
      name: name,
      output: output
    });
  }
}

this.onmessage = function (event) {
  var command = event.data;

  if (command.action === "compile") {
    if (command.hasOwnProperty("source")) {
      sources[command.name] = command.source;
    }

    compile(command.name, sources[command.name]);
  }
};

