// This module is to make it easier to create new files, remove old files,
// and update the content easier.

"use strict";

function File(name){
 	this.name = name;
  this.element = $(".file:contains(" + name + ")");   //put the element on the file. has method remove

}

File.prototype.remove = function(){
  localStorage.removeItem("file:" + this.name);
  this.element.remove();
};      //need semicolons after assigning values

File.prototype.setContent = function(file){
  localStorage["file:" + this.name] = file;
};      //need semicolons after assigning values

File.prototype.rename = function(name){
  //get content from file

  if(localStorage.hasOwnProperty("file:" + name)){
    throw new Error("Can not rename file. File with this name already exists.");
  }
  var content = this.getContent();
  this.remove();
  this.name = name;
  this.setContent(content);
};    

File.prototype.getContent = function(){   //returns the content as a string
  return localStorage["file:" + this.name];    //just returns all content as a string 
};

File.newFile = function(name, content){
  //create a new file, save to a variable
  var file = new File(name);
  //setcontent and return object
  file.setContent(content);
  File.loadFile(name);
  return file;
};

File.loadFile = function(name){
  var button, files, inserted, li, span;

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

  files = $("#file-tree>.file-listing");

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
};

module.exports = File;          //exposing class as the export

