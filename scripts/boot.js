//update all the old files on each refresh of the web page.

"use strict";

$(function () {
  var File, fileName, files, name, sidebar, tree;

  File = require("./files");

  sidebar = $("#left-sidebar");   //pulls elements from the web page
  tree = $("#file-tree");         //this holds all the files

  files = $("<ul>");              //creates an unordered list
  files.addClass("file-listing"); //adds the class to it. class is just a property

  tree.append(files);   //ADD THE FILES TO THE FILE TREE ON THE LEFT

  for (fileName in localStorage) {  
    if (localStorage.hasOwnProperty(fileName) &&    //and in inheritance chain above the storage
        fileName.substring(0, 5) === "file:") {     //length of file col. makes sure everything has been prefixed correctly
      name = fileName.substring(5);
      File.loadFile(name);
    } 
  }

  files.on("click", ".file-name", function () {
    loadFile($(this).text());
  }).on("mouseenter", ".file", function () {
    $(this).children(".delete-file").css("display", "inline-block");
  }).on("mouseleave", ".file", function () {
    $(this).children(".delete-file").hide();
  }).on("click", ".delete-file", function () {
    var file;

    if (confirm("Are you sure you want to delete this file?")) {
      file = new File($(this).prev().text());
      file.remove();
      //construct a new file
      //localStorage.removeItem("file:" + file);

      $(".view").each(function () {
        if ($(this).find(".file-name").text() === file) {
          $(this).find(".drop-editor").click();
        }
      });
    }
  });
});
