/*
* MIT Licensed
* http://www.23developer.com/opensource
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@23company.com
*/

var Resumable = function(opts){
  // SUPPORTED BY BROWSER?
  // Check if these features are support by the browser:
  // - File object type
  // - Blob object type
  // - FileList object type
  // - slicing files
  this.support = (
                 (typeof(File)!=='undefined')
                 &&
                 (typeof(Blob)!=='undefined')
                 &&
                 (typeof(FileList)!=='undefined')
                 &&
                 (!!Blob.prototype.webkitSlice||!!Blob.prototype.mozSlice||Blob.prototype.slice||false)
                 );
  if(!this.support) return(false);


  // PROPERTIES
  var $ = this;
  $.files = [];
  $.defaults = {
    chunkSize:1*1024*1024,
    simultaneousUploads:3,
    fileParameterName:'file',
    query:{},
    prioritizeFirstAndLastChunk:false,
    target:'/'
  };


  // EVENTS
  // catchAll(event, ...)
  // fileSuccess(file), fileProgress(file), fileAdded(file), fileRetry(file), fileError(file, message), 
  // complete(), progress(), error(message, file), pause()
  $.events = [];
  $.on = function(event,callback){
    $.events.push(event.toLowerCase(), callback);
  };
  $.fire = function(){            
    // `arguments` is an object, not array, in FF, so:
    var args = [];
    for (var i=0; i<arguments.length; i++) args.push(arguments[i]);
    // Find event listeners, and support pseudo-event `catchAll`
    var event = args[0].toLowerCase();
    for (var i=0; i<=$.events.length; i+=2) {
      if($.events[i]==event) $.events[i+1].apply($,args.slice(1));
      if($.events[i]=='catchall') $.events[i+1].apply(null,args);
    }
    if(event=='fileError') $.fire('error', args[2], args[1]);
    if(event=='fileProgress') $.fire('progress');
  };


  // INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
  $h = {
    stopEvent: function(e){
      e.stopPropagation();
      e.preventDefault();
    },
    each: function(o,callback){
      if(typeof(o.length)!=='undefined') {
        for (var i=0; i<o.length; i++) {
          // Array or FileList
          if(callback(o[i])===false) return;
        }
      } else {
        for (i in o) {
          // Object
          if(callback(i,o[i])===false) return;
        }
      }
    }
  }

  // INTERNAL METHODS (both handy and responsible for the heavy load)
  var appendFilesFromFileList = function(fileList){            
    $h.each(fileList, function(file){
        var f = new ResumableFile($, file);
        $.files.push(f);
        $.fire('fileAdded', f);
      });
  }
    
  // INTERNAL OBJECT TYPES
  function ResumableFile(resumableObj, file){
    var $ = this;
    $.resumableObj = resumableObj;
    $.file = file;
    $.fileName = file.fileName;
    $.size = file.size;
    $.uniqueIdentifier = (Math.floor(Math.random()*9999999) + '-' + $.file.fileName).replace(/[^0-9a-zA-Z_-]/img, '');
    var _error = false;

    // Callback when something happens within the chunk
    var chunkEvent = function(event, message){
      // event can be 'progress', 'success', 'error' or 'retry'
      switch(event){
      case 'progress':
        $.resumableObj.fire('fileProgress', $);
        break;
      case 'error':
        $.abort();
        _error = true;
        $.chunks = [];
        $.resumableObj.fire('fileError', $, message);
        break;
      case 'success':
        if(_error) return;
        $.resumableObj.fire('fileProgress', $); // it's at least progress
        if($.progress()>0.9999) {
          $.resumableObj.fire('fileSuccess', $);
        }
        break;
      case 'retry':
        $.resumableObj.fire('fileRetry', $);
        break;
      }
    }

    // Main code to set up a file object with chunks, 
    // packaged to be able to handle retries if needed.
    $.chunks = [];
    $.abort = function(){
      // Stop current uploads
      $h.each($.chunks, function(c){if(c.status()=='uploading') c.abort();});
      $.resumableObj.fire('fileProgress', $);
    }
    $.retry = function(){
      $.bootstrap();
      $.resumableObj.upload();
    }
    $.bootstrap = function(){
      $.abort();
        _error = false;
      // Rebuild stack of chunks from file
      $.chunks = [];
      for (var offset=0; offset<Math.ceil($.file.size/$.resumableObj.opts.chunkSize); offset++) {
        $.chunks.push(new ResumableChunk($.resumableObj, $, offset, chunkEvent));
      }
    }
    $.progress = function(){
      if(_error) return(1);
      // Sum up progress across everything
      var ret = 0;
      var error = false;
      $h.each($.chunks, function(c){
          if(c.status()=='error') error = true;
          ret += c.progress(true); // get chunk progress relative to entire file
        });
      return(error ? 1 : ret);
    }

    // Bootstrap and return
    $.bootstrap();
    return(this);
  }

  function ResumableChunk(resumableObj, fileObj, offset, callback){
    var $ = this;
    $.resumableObj = resumableObj;
    $.fileObj = fileObj;
    $.offset = offset;
    $.callback = callback;

    // Computed properties
    $.loaded = 0;
    $.startByte = Math.min($.offset*$.resumableObj.opts.chunkSize, $.fileObj.file.size);
    $.endByte = Math.min( (($.offset+1)*$.resumableObj.opts.chunkSize)-1, $.fileObj.file.size);
    $.xhr = null;
    $.send = function(){
      // Set up request and listen for event
      $.xhr = new XMLHttpRequest();
      $.xhr.timeout = 5000; // set a fairly low threshold before server must respond, since we'll just be retrying

      // Progress
      $.xhr.upload.addEventListener("progress", function(e){
          $.callback('progress');
          $.loaded=e.loaded||0; 
        }, false);
      $.loaded = 0;
      $.callback('progress');
      // Done (either done, failed or retry)
      var doneHandler = function(e){
        var status = $.status();
        if(status=='success'||status=='error') {
          $.callback(status, $.message());
          $h.uploadNextChunk();
        } else {
          $.callback('retry', $.message());
          $.abort();
          $.send(); // TODO: Insert a retryInterval pause into this loop
        }
      };
      $.xhr.addEventListener("load", doneHandler, false);
      $.xhr.addEventListener("error", doneHandler, false);

      // Add data from the query options
      var formData = new FormData();
      $h.each($.resumableObj.opts.query, function(k,v){
          formData.append(k,v);
        });
      // Add extra data to identify chunk
      formData.append('resumableChunkNumber', $.offset+1);
      formData.append('resumableChunkSize', $.resumableObj.opts.chunkSize);
      formData.append('resumableTotalSize', $.fileObj.file.size);
      formData.append('resumableIdentifier', $.fileObj.uniqueIdentifier);
      // Append the relevant chunk and send it
      var func = ($.fileObj.file.mozSlice ? 'mozSlice' : 'webkitSlice');
      formData.append($.resumableObj.opts.fileParameterName, $.fileObj.file[func]($.startByte,$.endByte));
      $.xhr.open("POST", $.resumableObj.opts.target);
      $.xhr.send(formData);
    }
    $.abort = function(){
      // Abort and reset
      if($.xhr) $.xhr.abort();
      $.xhr = null;
    }
    $.status = function(){
      // Returns: 'pending', 'uploading', 'success', 'error'
      if(!$.xhr) {
        return('pending');
      } else if($.xhr.readyState<4) {
        // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
        return('uploading');
      } else {
        if($.xhr.status==200) {
          // HTTP 200, perfect
          return('success');
        } else if($.xhr.status==500) {
          // HTTP 500, permanent error
          return('error');
        } else {
          // this should never happen, but we'll reset and queue a retry
          $.abort();
          return('pending');
        }
      }
    }
    $.message = function(){
      return($.xhr ? $.xhr.responseText : '');
    }
    $.progress = function(relative){
      if(typeof(relative)==='undefined') relative = false;
      var factor = (relative ? ($.endByte-$.startByte)/$.fileObj.file.size : 1);
      var s = $.status();
      switch(s){
      case 'success':
      case 'error':
        return(1*factor);
      case 'pending':
        return(0*factor);
      default:
        return($.loaded/($.endByte-$.startByte)*factor);
      }
    }
    return(this);
  }

  // QUEUE
  $h.uploadNextChunk = function(){
    var found = false;

    // In some cases (such as videos) it's really handy to upload the first 
    // and last chunk of a file quickly; this let's the server check the file's 
    // metadata and determine if there's even a point in continuing.
    if ($.opts.prioritizeFirstAndLastChunk) {
      $h.each($.files, function(file){
          if(file.chunks.length && file.chunks[0].status()=='pending') {
            file.chunks[0].send();
            found = true;
            return(false);
          }
          if(file.chunks.length>1 && file.chunks[file.chunks.length-1].status()=='pending') {
            file.chunks[file.chunks.length-1].send();
            found = true;
            return(false);
          }
        });
      if(found) return(true);
    }

    // Now, simply look for the next, best thing to upload
    $h.each($.files, function(file){
        $h.each(file.chunks, function(chunk){
            if(chunk.status()=='pending') {
              chunk.send();
              found = true;
              return(false);
            }
          });
        if(found) return(false);
      });
    if(found) return(true);

    // The are no more outstanding chunks to upload, check is everything is done
    $h.each($.files, function(file){
        outstanding = false;
        $h.each(file.chunks, function(chunk){
            var status = chunk.status();
            if(status=='pending' || status=='uploading') {
              outstanding = true;
              return(false);
            }
          });
        if(outstanding) return(false);
      });
    if(!outstanding) {
      // All chunks have been uploaded, complete
      $.fire('complete');
    }
    return(false);
  }
  

  // PUBLIC METHODS FOR RESUMABLE.JS
  $.assignBrowse = function(domNodes){
    if(typeof(domNodes.length)=='undefined') domNodes = [domNodes];

    // We will create an <input> and overlay it on the domNode 
    // (crappy, but since HTML5 doesn't have a cross-browser.browse() method we haven't a choice.
    //  FF4+ allows click() for this though: https://developer.mozilla.org/en/using_files_from_web_applications)
    $h.each(domNodes, function(domNode) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('multiple', 'multiple');
        document.body.appendChild(input);
        // When new files are added, simply append them to the overall list
        input.addEventListener('change', function(e){
            appendFilesFromFileList(input.files);
          }, false);
        // Overlay and hide the input element
        input.absolutize().clonePosition(domNode); // TODO: Manage this without Prototype
        input.setStyle({opacity:0, cursor:'pointer'});
      });
  };
  $.assignDrop = function(domNodes){
    if(typeof(domNodes.length)=='undefined') domNodes = [domNodes];

    $h.each(domNodes, function(domNode) {
        domNode.addEventListener('dragover', function(e){e.preventDefault();}, false);
        domNode.addEventListener('drop', function(e){
            $h.stopEvent(e);
            appendFilesFromFileList(e.dataTransfer.files);
          }, false);
      });
  };
  $.isUploading = function(){
    var uploading = false;
    $h.each($.files, function(file){
        $h.each(file.chunks, function(chunk){
            if(chunk.status()=='uploading') {
              uploading = true;
              return(false);
            }
          });
        if(uploading) return(false);
      });
    return(uploading);
  }
  $.upload = function(){    
    // Make sure we don't start too many uploads at once 
    if($.isUploading()) return;
    // Kick off the queue
    for (var num=1; num<=$.opts.simultaneousUploads; num++) {
      $h.uploadNextChunk();
    }
  };
  $.pause = function(){
    // Resume all chunks currently being uploaded
    $h.each($.files, function(file){
        file.abort();
      });
    $.fire('pause');
  };
  $.progress = function(){
    var totalDone = 0;
    var totalSize = 0;
    // Resume all chunks currently being uploaded
    $h.each($.files, function(file){
        totalDone += file.progress()*file.size;
        totalSize += file.size;
      });
    return(totalDone/totalSize);
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
