var Resumable = function(opts){
  // SUPPORTED BY BROWSER?
  // Check if these features are support by the browser:
  // - File object type
  // - Blob object type
  // - FileList object type
  // - slicing files
  var support = (
                 (typeof(File)!=='undefined')
                 &&
                 (typeof(Blob)!=='undefined')
                 &&
                 (typeof(FileList)!=='undefined')
                 &&
                 (!!Blob.prototype.webkitSlice||!!Blob.prototype.mozSlice||Blob.prototype.slice||false)
                 );
  if(!support) throw('The current browser does not support HTML5 File API and Resumable.js');


  // PROPERTIES
  var ptp = $;
  var $ = this;
  $.files = [];
  $.defaults = {
    resumeInterval:10,
    fileParameterName:'file',
    query:{}
  };


  // EVENTS
  // catchAll(event, ...)
  // fileComplete(file), fileResume(file), fileProgress(file), fileAdded(file), fileError(file, error, message), 
  // complete(), progress(), resume(), error(error, message)
  $.events = [];
  $.on = function(event,callback){
    $.events.push(event.toLowerCase(), callback);
  };
  $.fire = function(){            
    // `arguments` is an object, not array, in ff, so:
    var args = [];
    for (var i=0; i<arguments.length; i++) args.push(arguments[i]);
    // Find event listeners, and support pseudo-event `catchAll`
    var event = args[0].toLowerCase();
    for (var i=0; i<=$.events.length; i+=2) {
      if($.events[i]==event) $.events[i+1].apply($,args.slice(1));
      if($.events[i]=='catchall') $.events[i+1].apply(null,args);
    }
  };


  // INTERNAL HELPER METHODS
  $h = {
    appendFilesFromFileList: function(fileList){            
      $h.each(fileList, function(file){
          $.files.push(file);
          $.fire('fileAdded', file);
        });
    },
    stopEvent: function(e){
      e.stopPropagation();
      e.preventDefault();
    },
    each: function(o,callback){
      if(!!o.length) {
        for (var i=0; i<o.length; i++) callback(o[i]); // Array or FileList
      } else {
        for (i in o) callback(i,o[i]); // Object
      }
    }
  }


  // PUBLICH METHODS FOR RESUMABLE.JS
  $.assignBrowse = function(domNode){
    // We will create an <input> and overlay it on the domNode 
    // (crappy, but since HTML5 doesn't have a cross-browser.browse() method we haven't a choice.
    //  FF4+ allows click() for this though: https://developer.mozilla.org/en/using_files_from_web_applications)
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('multiple', 'multiple');
    document.body.appendChild(input);
    // When new files are added, simply append them to the overall list
    input.addEventListener('change', function(e){
        $h.appendFilesFromFileList(input.files);
      }, false);
    // TODO: Overlay and hide the input element
  };
  $.assignDrop = function(domNode){
    domNode.addEventListener('dragover', function(e){e.preventDefault();}, false);
    domNode.addEventListener('drop', function(e){
        $h.stopEvent(e);
        $h.appendFilesFromFileList(e.dataTransfer.files);
      }, false);
  };
  $.upload = function(){
  };
  $.pause = function(){
  };
        

  // FINALIZE AND RETURN OBJECT
  // Mix in defaults
  $.opts = opts||{};
  $h.each($.defaults, function(key,value){
      if(typeof($.opts[key])==='undefined') $.opts[key] = value;
    });
  // Return the object
  return(this);
}
