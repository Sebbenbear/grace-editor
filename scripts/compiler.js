/*globals Worker, localStorage, minigrace, var_done*/

"use strict";

var queue, worker;

queue = {};
worker = new Worker("scripts/background.js");

function pump(name, key, value) {
  var i, l, q;

  q = queue[name] || [];

  for (i = 0, l = q.length; i < l; i += 1) {
    q[i][key](value);
  }

  delete queue[name];
}

function compile(name, source, callback) {
  name = name || "main";

  var callbacks = queue[name] || [];

  callbacks.push({
    onSuccess: function (output) {
      var escaped = "gracecode_" + name.replace("/", "$");

      /*jslint evil: true*/
      eval("var myframe;" + output + ";window." + escaped + "=" + escaped);
      /*jslint evil: false*/

      callback(null, output);
    },
    onFailure: callback
  });

  if (!queue.hasOwnProperty(name)) {
    worker.postMessage({
      action: "compile",
      name: name,
      source: source
    });

    queue[name] = callbacks;
  }
}

exports.compile = compile;

worker.onmessage = function (event) {
  var result = event.data;

  if (result.isSuccessful) {
    pump(result.name, "onSuccess", result.output);
  } else if (result.dependency) {
    if (queue[result.dependency]) {
      worker.postMessage({
        action: "compile",
        name: result.name,
      });
    } else if (localStorage.hasOwnProperty("file:" + result.dependency + ".grace")) {
      compile(result.dependency, localStorage["file:" + result.dependency + ".grace"]).then(function () {
        worker.postMessage({
          action: "compile",
          name: result.name,
        });
      }, function () {
        pump(result.name, "onFailure", {
          line: 1,
          column: 1,
          message: 'Waiting on module "' + result.dependency + '"'
        });
      });
    } else {
      pump(result.name, "onFailure", {
        line: 1,
        column: 1,
        message: 'Waiting on module "' + result.dependency + '"'
      });
    }
  } else {
    pump(result.name, "onFailure", result.reason);
  }
};

