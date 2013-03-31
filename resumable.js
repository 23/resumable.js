/*
* MIT Licensed
* http://www.23developer.com/opensource
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@23company.com
*/

var Resumable = function(opts){
  if ( !(this instanceof Resumable ) ) {
    return new Resumable( opts );
  }
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
    forceChunkSize:false,
    simultaneousUploads:3,
    fileParameterName:'file',
    throttleProgressCallbacks:0.5,
    query:{},
    headers:{},
    preprocess:null,
    method:'multipart',
    prioritizeFirstAndLastChunk:false,
    target:'/',
    testChunks:true,
    generateUniqueIdentifier:null,
    maxChunkRetries:undefined,
    chunkRetryInterval:undefined,
    permanentErrors:[415, 500, 501],
    maxFiles:undefined,
    maxFilesErrorCallback:function (files, errorCount) {
      var maxFiles = $.getOpt('maxFiles');
      alert('Please upload ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
    },
    minFileSize:undefined,
    minFileSizeErrorCallback:function(file, errorCount) {
      alert(file.fileName +' is too small, please upload files larger than ' + $h.formatSize($.getOpt('minFileSize')) + '.');
    },
    maxFileSize:undefined,
    maxFileSizeErrorCallback:function(file, errorCount) {
      alert(file.fileName +' is too large, please upload files less than ' + $h.formatSize($.getOpt('maxFileSize')) + '.');
    }
  };
  $.opts = opts||{};
  $.getOpt = function(o) {
    var $this = this;
    // Get multiple option if passed an array
    if(o instanceof Array) {
      var options = {};
      $h.each(o, function(option){
        options[option] = $this.getOpt(option);
      });
      return options;
    }
    // Otherwise, just return a simple option
    if ($this instanceof ResumableChunk) {
      if (typeof $this.opts[o] !== 'undefined') { return $this.opts[o]; }
      else { $this = $this.fileObj; }
    }
    if ($this instanceof ResumableFile) {
      if (typeof $this.opts[o] !== 'undefined') { return $this.opts[o]; }
      else { $this = $this.resumableObj; }
    }
    if ($this instanceof Resumable) {
      if (typeof $this.opts[o] !== 'undefined') { return $this.opts[o]; }
      else { return $this.defaults[o]; }
    }
  };

  // EVENTS
  // catchAll(event, ...)
  // fileSuccess(file), fileProgress(file), fileAdded(file, event), fileRetry(file), fileError(file, message),
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
    if(event=='fileerror') $.fire('error', args[2], args[1]);
    if(event=='fileprogress') $.fire('progress');
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
    },
    generateUniqueIdentifier:function(file){
      var custom = $.getOpt('generateUniqueIdentifier');
      if(typeof custom === 'function') {
        return custom(file);
      }
      var relativePath = file.webkitRelativePath||file.fileName||file.name; // Some confusion in different versions of Firefox
      var size = file.size;
      return(size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
    },
    contains:function(array,test) {
      var result = false;

      $h.each(array, function(value) {
          if (value == test) {
            result = true;
            return false;
          }
          return true;
      });

      return result;
    },
    formatSize:function(size){
      if(size<1024) {
        return size + ' bytes';
      } else if(size<1024*1024) {
        return (size/1024.0).toFixed(0) + ' KB';
      } else if(size<1024*1024*1024) {
        return (size/1024.0/1024.0).toFixed(1) + ' MB';
      } else {
        return (size/1024.0/1024.0/1024.0).toFixed(1) + ' GB';
      }
    }
  };

  var onDrop = function(event){
    $h.stopEvent(event);
    appendFilesFromFileList(event.dataTransfer.files, event);
  };
  var onDragOver = function(e) {
    e.preventDefault();
  };

  // INTERNAL METHODS (both handy and responsible for the heavy load)
  var appendFilesFromFileList = function(fileList, event){
    // check for uploading too many files
    var errorCount = 0;
    var o = $.getOpt(['maxFiles', 'minFileSize', 'maxFileSize', 'maxFilesErrorCallback', 'minFileSizeErrorCallback', 'maxFileSizeErrorCallback']);
    if (typeof(o.maxFiles)!=='undefined' && o.maxFiles<(fileList.length+$.files.length)) {
      o.maxFilesErrorCallback(fileList, errorCount++);
      return false;
    }
    var files = [];
    $h.each(fileList, function(file){
        file.name = file.fileName = file.fileName||file.name; // consistency across browsers for the error message
        if (typeof(o.minFileSize)!=='undefined' && file.size<o.minFileSize) {
            o.minFileSizeErrorCallback(file, errorCount++);
            return false;
        }
        if (typeof(o.maxFileSize)!=='undefined' && file.size>o.maxFileSize) {
            o.maxFileSizeErrorCallback(file, errorCount++);
            return false;
        }

        // directories have size == 0
        if (file.size > 0 && !$.getFromUniqueIdentifier($h.generateUniqueIdentifier(file))) {
          var f = new ResumableFile($, file);
          $.files.push(f);
          files.push(f);
          $.fire('fileAdded', f, event);
        }
      });
    $.fire('filesAdded', files);
  };

  // INTERNAL OBJECT TYPES
  function ResumableFile(resumableObj, file){
    var $ = this;
    $.opts = {};
    $.getOpt = resumableObj.getOpt;
    $._prevProgress = 0;
    $.resumableObj = resumableObj;
    $.file = file;
    $.fileName = file.fileName||file.name; // Some confusion in different versions of Firefox
    $.size = file.size;
    $.relativePath = file.webkitRelativePath || $.fileName;
    $.uniqueIdentifier = $h.generateUniqueIdentifier(file);
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
        if($.progress()==1) {
          $.resumableObj.fire('fileSuccess', $, message);
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
      $h.each($.chunks, function(c){
          if(c.status()=='uploading') c.abort();
        });
      $.resumableObj.fire('fileProgress', $);
    }
    $.cancel = function(){
      // Reset this file to be void
      var _chunks = $.chunks;
      $.chunks = [];
      // Stop current uploads
      $h.each(_chunks, function(c){
          if(c.status()=='uploading')  {
            c.abort();
            $.resumableObj.uploadNextChunk();
          }
        });
      $.resumableObj.removeFile($);
      $.resumableObj.fire('fileProgress', $);
    },
    $.retry = function(){
      $.bootstrap();
      $.resumableObj.upload();
    }
    $.bootstrap = function(){
      $.abort();
        _error = false;
      // Rebuild stack of chunks from file
      $.chunks = [];
      $._prevProgress = 0;
      var round = $.getOpt('forceChunkSize') ? Math.ceil : Math.floor;
      for (var offset=0; offset<Math.max(round($.file.size/$.getOpt('chunkSize')),1); offset++) {
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
      ret = (error ? 1 : (ret>0.999 ? 1 : ret))
      ret = Math.max($._prevProgress, ret); // We don't want to lose percentages when an upload is paused
      $._prevProgress = ret;
      return(ret);
    }

    // Bootstrap and return
    $.bootstrap();
    return(this);
  }

  function ResumableChunk(resumableObj, fileObj, offset, callback){
    var $ = this;
    $.opts = {};
    $.getOpt = resumableObj.getOpt;
    $.resumableObj = resumableObj;
    $.fileObj = fileObj;
    $.fileObjSize = fileObj.size;
    $.offset = offset;
    $.callback = callback;
    $.lastProgressCallback = (new Date);
    $.tested = false;
    $.retries = 0;
    $.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

    // Computed properties
    var chunkSize = $.getOpt('chunkSize');
    $.loaded = 0;
    $.startByte = $.offset*chunkSize;
    $.endByte = Math.min($.fileObjSize, ($.offset+1)*chunkSize);
    if ($.fileObjSize-$.endByte < chunkSize && !$.getOpt('forceChunkSize')) {
      // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
      $.endByte = $.fileObjSize;
    }
    $.xhr = null;

    // test() makes a GET request without any data to see if the chunk has already been uploaded in a previous session
    $.test = function(){
      // Set up request and listen for event
      $.xhr = new XMLHttpRequest();

      var testHandler = function(e){
        $.tested = true;
        var status = $.status();
        if(status=='success') {
          $.callback(status, $.message());
          $.resumableObj.uploadNextChunk();
        } else {
          $.send();
        }
      }
      $.xhr.addEventListener("load", testHandler, false);
      $.xhr.addEventListener("error", testHandler, false);

      // Add data from the query options
      var url = ""
      var params = [];
      var customQuery = $.getOpt('query'); 
      if(typeof customQuery == "function") customQuery = customQuery($.fileObj, $);
      $h.each(customQuery, function(k,v){
          params.push([encodeURIComponent(k), encodeURIComponent(v)].join('='));
        });
      // Add extra data to identify chunk
      params.push(['resumableChunkNumber', encodeURIComponent($.offset+1)].join('='));
      params.push(['resumableChunkSize', encodeURIComponent($.getOpt('chunkSize'))].join('='));
      params.push(['resumableCurrentChunkSize', encodeURIComponent($.endByte - $.startByte)].join('='));
      params.push(['resumableTotalSize', encodeURIComponent($.fileObjSize)].join('='));
      params.push(['resumableIdentifier', encodeURIComponent($.fileObj.uniqueIdentifier)].join('='));
      params.push(['resumableFilename', encodeURIComponent($.fileObj.fileName)].join('='));
      params.push(['resumableRelativePath', encodeURIComponent($.fileObj.relativePath)].join('='));
      // Append the relevant chunk and send it
      $.xhr.open("GET", $.getOpt('target') + '?' + params.join('&'));
      // Add data from header options
      $h.each($.getOpt('headers'), function(k,v) {
        $.xhr.setRequestHeader(k, v);
      });
      $.xhr.send(null);
    }

    $.preprocessFinished = function(){
      $.preprocessState = 2;
      $.send();
    }

    // send() uploads the actual data in a POST call
    $.send = function(){
      var preprocess = $.getOpt('preprocess');
      if(typeof preprocess === 'function') {
        switch($.preprocessState) {
          case 0: preprocess($); $.preprocessState = 1; return;
          case 1: return;
          case 2: break;
        }
      }
      if($.getOpt('testChunks') && !$.tested) {
        $.test();
        return;
      }

      // Set up request and listen for event
      $.xhr = new XMLHttpRequest();

      // Progress
      $.xhr.upload.addEventListener("progress", function(e){
          if( (new Date) - $.lastProgressCallback > $.getOpt('throttleProgressCallbacks') * 1000 ) {
            $.callback('progress');
            $.lastProgressCallback = (new Date);
          }
          $.loaded=e.loaded||0;
        }, false);
      $.loaded = 0;
      $.callback('progress');

      // Done (either done, failed or retry)
      var doneHandler = function(e){
        var status = $.status();
        if(status=='success'||status=='error') {
          $.callback(status, $.message());
          $.resumableObj.uploadNextChunk();
        } else {
          $.callback('retry', $.message());
          $.abort();
          $.retries++;
          var retryInterval = $.getOpt('chunkRetryInterval');
          if(retryInterval !== undefined) {
              setTimeout($.send, retryInterval);
          } else {
            $.send();
          }
        }
      };
      $.xhr.addEventListener("load", doneHandler, false);
      $.xhr.addEventListener("error", doneHandler, false);

      // Set up the basic query data from Resumable
      var query = {
        resumableChunkNumber: $.offset+1,
        resumableChunkSize: $.getOpt('chunkSize'),
        resumableCurrentChunkSize: $.endByte - $.startByte,
        resumableTotalSize: $.fileObjSize,
        resumableIdentifier: $.fileObj.uniqueIdentifier,
        resumableFilename: $.fileObj.fileName,
        resumableRelativePath: $.fileObj.relativePath
      }
      // Mix in custom data
      var customQuery = $.getOpt('query');
      if(typeof customQuery == "function") customQuery = customQuery($.fileObj, $);
      $h.each(customQuery, function(k,v){
        query[k] = v;
      });

      // Add data from header options
      $h.each($.getOpt('headers'), function(k,v) {
        $.xhr.setRequestHeader(k, v);
      });

      var func   = ($.fileObj.file.slice ? 'slice' : ($.fileObj.file.mozSlice ? 'mozSlice' : ($.fileObj.file.webkitSlice ? 'webkitSlice' : 'slice'))),
          bytes  = $.fileObj.file[func]($.startByte,$.endByte), 
          data   = null,
          target = $.getOpt('target');
 
      if ($.getOpt('method') === 'octet') {
        // Add data from the query options
        data = bytes;
        var params = [];
        $h.each(query, function(k,v){
          params.push([encodeURIComponent(k), encodeURIComponent(v)].join('='));
        });
        target += '?' + params.join('&');
      } else {
        // Add data from the query options
        data = new FormData();
        $h.each(query, function(k,v){
          data.append(k,v);
        });
        data.append($.getOpt('fileParameterName'), bytes);
      }
     
      $.xhr.open('POST', target); 
      $.xhr.send(data);
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
        } else if($h.contains($.getOpt('permanentErrors'), $.xhr.status) || $.retries >= $.getOpt('maxChunkRetries')) {
          // HTTP 415/500/501, permanent error
          return('error');
        } else {
          // this should never happen, but we'll reset and queue a retry
          // a likely case for this would be 503 service unavailable
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
      var factor = (relative ? ($.endByte-$.startByte)/$.fileObjSize : 1);
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
  $.uploadNextChunk = function(){
    var found = false;

    // In some cases (such as videos) it's really handy to upload the first
    // and last chunk of a file quickly; this let's the server check the file's
    // metadata and determine if there's even a point in continuing.
    if ($.getOpt('prioritizeFirstAndLastChunk')) {
      $h.each($.files, function(file){
          if(file.chunks.length && file.chunks[0].status()=='pending' && file.chunks[0].preprocessState === 0) {
            file.chunks[0].send();
            found = true;
            return(false);
          }
          if(file.chunks.length>1 && file.chunks[file.chunks.length-1].status()=='pending' && file.chunks[0].preprocessState === 0) {
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
            if(chunk.status()=='pending' && chunk.preprocessState === 0) {
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
            if(status=='pending' || status=='uploading' || chunk.preprocessState === 1) {
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
  };


  // PUBLIC METHODS FOR RESUMABLE.JS
  $.assignBrowse = function(domNodes, isDirectory){
    if(typeof(domNodes.length)=='undefined') domNodes = [domNodes];

    // We will create an <input> and overlay it on the domNode
    // (crappy, but since HTML5 doesn't have a cross-browser.browse() method we haven't a choice.
    //  FF4+ allows click() for this though: https://developer.mozilla.org/en/using_files_from_web_applications)
    $h.each(domNodes, function(domNode) {
        var input;
        if(domNode.tagName==='INPUT' && domNode.type==='file'){
            input = domNode;
        } else {
            input = document.createElement('input');
            input.setAttribute('type', 'file');
            // Place <input /> with the dom node an position the input to fill the entire space
            domNode.style.display = 'inline-block';
            domNode.style.position = 'relative';
            input.style.position = 'absolute';
            input.style.top = input.style.left = input.style.bottom = input.style.right = 0;
            input.style.opacity = 0;
            input.style.cursor = 'pointer';
            domNode.appendChild(input);
        }
        var maxFiles = $.getOpt('maxFiles');
        if (typeof(maxFiles)==='undefined'||maxFiles!=1){
          input.setAttribute('multiple', 'multiple');
        } else {
          input.removeAttribute('multiple');
        }
        if(isDirectory){
          input.setAttribute('webkitdirectory', 'webkitdirectory');
        } else {
          input.removeAttribute('webkitdirectory');
        }
        // When new files are added, simply append them to the overall list
        input.addEventListener('change', function(e){
            appendFilesFromFileList(e.target.files);
            e.target.value = '';
        }, false);
    });
  };
  $.assignDrop = function(domNodes){
    if(typeof(domNodes.length)=='undefined') domNodes = [domNodes];

    $h.each(domNodes, function(domNode) {
        domNode.addEventListener('dragover', onDragOver, false);
        domNode.addEventListener('drop', onDrop, false);
      });
  };
  $.unAssignDrop = function(domNodes) {
    if (typeof(domNodes.length) == 'undefined') domNodes = [domNodes];

    $h.each(domNodes, function(domNode) {
        domNode.removeEventListener('dragover', onDragOver);
        domNode.removeEventListener('drop', onDrop);
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
    $.fire('uploadStart');
    for (var num=1; num<=$.getOpt('simultaneousUploads'); num++) {
      $.uploadNextChunk();
    }
  };
  $.pause = function(){
    // Resume all chunks currently being uploaded
    $h.each($.files, function(file){
        file.abort();
      });
    $.fire('pause');
  };
  $.cancel = function(){
    $h.each($.files, function(file){
        file.cancel();
      });
    $.fire('cancel');
  };
  $.progress = function(){
    var totalDone = 0;
    var totalSize = 0;
    // Resume all chunks currently being uploaded
    $h.each($.files, function(file){
        totalDone += file.progress()*file.size;
        totalSize += file.size;
      });
    return(totalSize>0 ? totalDone/totalSize : 0);
  };
  $.addFile = function(file){
    appendFilesFromFileList([file]);
  };
  $.removeFile = function(file){
    var files = [];
    $h.each($.files, function(f,i){
        if(f!==file) files.push(f);
      });
    $.files = files;
  };
  $.getFromUniqueIdentifier = function(uniqueIdentifier){
    var ret = false;
    $h.each($.files, function(f){
        if(f.uniqueIdentifier==uniqueIdentifier) ret = f;
      });
    return(ret);
  };
  $.getSize = function(){
    var totalSize = 0;
    $h.each($.files, function(file){
        totalSize += file.size;
      });
    return(totalSize);
  };

  return(this);
}
