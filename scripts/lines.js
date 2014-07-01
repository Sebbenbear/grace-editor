/*globals $*/

"use strict";

function newLine(text) {
  var p = $("<p>");
  p.text(text);
  return p;
}

exports.newLine = newLine;

function newError(text) {
  var line = newLine(text);
  line.addClass("error");
  return line;
}

exports.newError = newError;

function newTrace(text) {
  var line = newLine(text);
  line.addClass("trace");
  return line;
}

exports.newTrace = newTrace;

