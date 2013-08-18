/*
 * MIT Licensed
 * @link http://www.23developer.com/opensource
 * @link http://github.com/23/resumable.js
 * @author Steffen Tiedemann Christensen, steffen@23company.com
 * @version 2.0.0
 */

/**
 * Resumable is a library providing multiple simultaneous, stable and
 * resumable uploads via the HTML5 File API.
 * @param {{
   * chunkSize: number,
   * forceChunkSize: boolean,
   * simultaneousUploads: number,
   * fileParameterName: string,
   * throttleProgressCallbacks: number,
   * query: {},
   * headers: {},
   * preprocess: null,
   * method: string,
   * prioritizeFirstAndLastChunk: boolean,
   * target: string, testChunks: boolean,
   * generateUniqueIdentifier: null,
   * maxChunkRetries: undefined,
   * chunkRetryInterval: undefined,
   * permanentErrors: Array,
   * maxFiles: undefined,
   * maxFilesErrorCallback: Function,
   * minFileSize: number,
   * minFileSizeErrorCallback: Function,
   * maxFileSize: undefined,
   * maxFileSizeErrorCallback: Function,
   * fileType: Array,
   * fileTypeErrorCallback: Function
   * }} opts options
 * @constructor
 */
function Resumable(opts) {
  "use strict";

  /**
   * Library version
   * @name Resumable.version
   * @type {string}
   */
  this.version = '2.0.0';

  /**
   * Supported by browser?
   * @name Resumable.support
   * @type {boolean}
   */
  this.support = (
    typeof File !== 'undefined'
    && typeof Blob !== 'undefined'
    && typeof FileList !== 'undefined'
    && (
      !!Blob.prototype.slice
      || !!Blob.prototype.webkitSlice
      || !!Blob.prototype.mozSlice
      || false
    ) // slicing files support
  );

  if (!this.support) {
    return ;
  }

  /**
   * Alias of Resumable
   * @type {Resumable}
   */
  var $ = this;

  /**
   * List of ResumableFile objects
   * @name Resumable.files
   * @type {Array}
   */
  $.files = [];

  /**
   * Default options for resumable.js
   * @name Resumable.defaults
   * @type {{
   * chunkSize: number,
   * forceChunkSize: boolean,
   * simultaneousUploads: number,
   * fileParameterName: string,
   * throttleProgressCallbacks: number,
   * query: {},
   * headers: {},
   * preprocess: null,
   * method: string,
   * prioritizeFirstAndLastChunk: boolean,
   * target: string, testChunks: boolean,
   * generateUniqueIdentifier: null,
   * maxChunkRetries: undefined,
   * chunkRetryInterval: undefined,
   * permanentErrors: Array,
   * maxFiles: undefined,
   * maxFilesErrorCallback: Function,
   * minFileSize: number,
   * minFileSizeErrorCallback: Function,
   * maxFileSize: undefined,
   * maxFileSizeErrorCallback: Function,
   * fileType: Array,
   * fileTypeErrorCallback: Function
   * }}
   */
  $.defaults = {
    chunkSize: 1024 * 1024,
    forceChunkSize: false,
    simultaneousUploads: 3,
    fileParameterName: 'file',
    throttleProgressCallbacks: 0.5,
    query: {},
    headers: {},
    preprocess: null,
    method: 'multipart',
    prioritizeFirstAndLastChunk: false,
    target: '/',
    testChunks: true,
    generateUniqueIdentifier: null,
    maxChunkRetries: undefined,
    chunkRetryInterval: undefined,
    permanentErrors: [415, 500, 501],
    maxFiles: undefined,
    maxFilesErrorCallback: function (files, errorCount) {
      var maxFiles = $.opts.maxFiles;
      alert('Please upload ' + maxFiles +
        ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
    },
    minFileSize: 1,
    minFileSizeErrorCallback: function (file, errorCount) {
      alert(file.name + ' is too small, please upload files larger than ' +
        $h.formatSize($.opts.minFileSize) + '.');
    },
    maxFileSize: undefined,
    maxFileSizeErrorCallback: function (file, errorCount) {
      alert(file.name + ' is too large, please upload files less than ' +
        $h.formatSize($.opts.maxFileSize) + '.');
    },
    fileType: [],
    fileTypeErrorCallback: function (file, errorCount) {
      alert(file.name + ' has type not allowed, ' +
        'please upload files of type ' + $.opts.fileType + '.');
    }
  };

  /**
   * Current options
   * @name Resumable.opts
   * @type {Object}
   */
  $.opts = {};

  /**
   * List of events:
   *  even indexes stand for event names
   *  odd indexes stands for event callbacks
   * @name Resumable.events
   * @type {Array}
   */
  $.events = [];

  /**
   * Private helper functions
   */
  var $h = {};

  /**
   * Extends the destination object `dst` by copying all of the properties from
   * the `src` object(s) to `dst`. You can specify multiple `src` objects.
   * @function
   * @name $h.extend
   * @param {Object} dst Destination object.
   * @param {...Object} src Source object(s).
   * @returns {Object} Reference to `dst`.
   */
  $h.extend = function (dst) {
    $h.each(arguments, function(obj) {
      if (obj !== dst) {
        $h.each(obj, function(key, value){
          dst[key] = value;
        });
      }
    });
    return dst;
  };

  /**
   * Iterate each element of an object
   * @function
   * @name $h.each
   * @param {Array|Object} o object or an array to iterate
   * @param {Function} callback for array firs argument stands for a value,
   *  for object first arguments stands for a key and second for a value.
   */
  $h.each = function (o, callback) {
    if (typeof(o.length) !== 'undefined') {
      // Array
      for (var i = 0; i < o.length; i++) {
        if (callback(o[i]) === false) {
          return;
        }
      }
    } else {
      for (i in o) {
        // Object
        if (o.hasOwnProperty(i) && callback(i, o[i]) === false) {
          return;
        }
      }
    }
  };

  /**
   * Generate unique identifier for a file
   * @function
   * @name $h.generateUniqueIdentifier
   * @param {ResumableFile} file
   * @returns {string}
   */
  $h.generateUniqueIdentifier = function (file) {
    var custom = $.opts.generateUniqueIdentifier;
    if (typeof custom === 'function') {
      return custom(file);
    }
    // Some confusion in different versions of Firefox
    var relativePath = file.webkitRelativePath || file.fileName || file.name;
    var size = file.size;
    return size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
  };

  /**
   * Check if array contains value
   * @function
   * @name $h.contains
   * @param array
   * @param test
   * @returns {boolean}
   */
  $h.contains = function (array, test) {
    var result = false;
    $h.each(array, function (value) {
      if (value == test) {
        result = true;
        return false;
      }
      return true;
    });
    return result;
  };

  /**
   * Formats size to human readable format
   * @function
   * @name $h.formatSize
   * @param size
   * @returns {string}
   */
  $h.formatSize = function (size) {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1024 * 1024) {
      return (size / 1024.0).toFixed(0) + ' KB';
    } else if (size < 1024 * 1024 * 1024) {
      return (size / 1024.0 / 1024.0).toFixed(1) + ' MB';
    } else {
      return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB';
    }
  };

  /**
   * Get target option with query params
   * @function
   * @name $h.getTarget
   * @param params
   * @returns {string}
   */
  $h.getTarget = function(params){
    var target = $.opts.target;
    if(target.indexOf('?') < 0) {
      target += '?';
    } else {
      target += '&';
    }
    return target + params.join('&');
  };

  /**
   * On drop event
   * @function
   * @param {MouseEvent} event
   */
  var onDrop = function (event) {
    event.stopPropagation();
    event.preventDefault();
    appendFilesFromFileList(event.dataTransfer.files, event);
  };

  /**
   * On drag over event
   * @function
   * @param {MouseEvent}
   */
  var onDragOver = function (e) {
    e.preventDefault();
  };

  /**
   * Append files from file list object
   * @function
   * @param {FileList} fileList
   * @param {Event} [event] event is optional
   */
  var appendFilesFromFileList = function (fileList, event) {
    // check for uploading too many files
    var errorCount = 0;
    if (typeof($.opts.maxFiles) !== 'undefined'
      && $.opts.maxFiles < (fileList.length + $.files.length)) {
      // if single-file upload, file is already added,
      // and trying to add 1 new file, simply replace the already-added file
      if ($.opts.maxFiles === 1 && $.files.length === 1 && fileList.length === 1) {
        $.removeFile($.files[0]);
      } else {
        $.opts.maxFilesErrorCallback(fileList, errorCount++);
        return ;
      }
    }
    var files = [];
    $h.each(fileList, function (file) {
      if ($.opts.fileType.length > 0
        && !$h.contains($.opts.fileType, file.type.split('/')[1])) {
        $.opts.fileTypeErrorCallback(file, errorCount++);
        return false;
      }
      if (typeof($.opts.minFileSize) !== 'undefined' && file.size < $.opts.minFileSize) {
        $.opts.minFileSizeErrorCallback(file, errorCount++);
        return false;
      }
      if (typeof($.opts.maxFileSize) !== 'undefined' && file.size > $.opts.maxFileSize) {
        $.opts.maxFileSizeErrorCallback(file, errorCount++);
        return false;
      }
      // directories have size == 0
      if (!$.getFromUniqueIdentifier($h.generateUniqueIdentifier(file))) {
        var f = new ResumableFile($, file);
        $.files.push(f);
        files.push(f);
        $.fire('fileAdded', f, event);
      }
    });
    $.fire('filesAdded', files);
  };

  /**
   * ResumableFile class
   * @param {Resumable} resumableObj
   * @param {File} file
   * @constructor
   */
  function ResumableFile(resumableObj, file) {
    /**
     * Alias for this
     * @type {ResumableFile}
     */
    var $ = this;

    /**
     * Reference to parent Resumable instance
     * @name ResumableFile.resumableObj
     * @type {Resumable}
     */
    $.resumableObj = resumableObj;

    /**
     * Reference to file
     * @name ResumableFile.file
     * @type {File}
     */
    $.file = file;

    /**
     * File name. Some confusion in different versions of Firefox
     * @name ResumableFile.name
     * @type {string}
     */
    $.name = file.fileName || file.name;

    /**
     * File size
     * @name ResumableFile.size
     * @type {number}
     */
    $.size = file.size;

    /**
     * Relative file path
     * @name ResumableFile.relativePath
     * @type {string}
     */
    $.relativePath = file.webkitRelativePath || $.name;

    /**
     * File unique identifier
     * @name ResumableFile.uniqueIdentifier
     * @type {string}
     */
    $.uniqueIdentifier = $h.generateUniqueIdentifier(file);

    /**
     * List of chunks
     * @name ResumableFile.chunks
     * @type {Array.<ResumableChunk>}
     */
    $.chunks = [];

    /**
     * Holds previous progress
     * @type {number}
     * @private
     */
    $._prevProgress = 0;

    var _error = false;

    /**
     * Callback when something happens within the chunk
     * @function
     * @param {string} event can be 'progress', 'success', 'error' or 'retry'
     * @param {string} message
     */
    var chunkEvent = function (event, message) {
      switch (event) {
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
          if (_error) return;
          $.resumableObj.fire('fileProgress', $); // it's at least progress
          if ($.isComplete()) {
            $.resumableObj.fire('fileSuccess', $, message);
          }
          break;
        case 'retry':
          $.resumableObj.fire('fileRetry', $);
          break;
      }
    };

    /**
     * Abort current upload
     * @name ResumableFile.abort
     * @function
     */
    $.abort = function () {
      $h.each($.chunks, function (c) {
        if (c.status() == 'uploading') {
          c.abort();
        }
      });
      $.resumableObj.fire('fileProgress', $);
    };

    /**
     * Cancel current upload and remove from a list
     * @name ResumableFile.cancel
     * @function
     */
    $.cancel = function () {
      // Reset this file to be void
      var _chunks = $.chunks;
      $.chunks = [];
      // Stop current uploads
      $h.each(_chunks, function (c) {
        if (c.status() == 'uploading') {
          c.abort();
          $.resumableObj.uploadNextChunk();
        }
      });
      $.resumableObj.removeFile($);
      $.resumableObj.fire('fileProgress', $);
    };

    /**
     * Retry aborted file upload
     * @name ResumableFile.retry
     * @function
     */
    $.retry = function () {
      $.bootstrap();
      $.resumableObj.upload();
    };

    /**
     * Clear current chunks and slice file again
     * @name ResumableFile.bootstrap
     * @function
     */
    $.bootstrap = function () {
      $.abort();
      _error = false;
      // Rebuild stack of chunks from file
      $.chunks = [];
      $._prevProgress = 0;
      var round = $.resumableObj.opts.forceChunkSize ? Math.ceil : Math.floor;
      var chunks = Math.max(
        round($.file.size / $.resumableObj.opts.chunkSize), 1
      );
      for (var offset = 0; offset < chunks; offset++) {
        $.chunks.push(
          new ResumableChunk($.resumableObj, $, offset, chunkEvent)
        );
      }
    };

    /**
     * Get current upload progress status
     * @name ResumableFile.progress
     * @function
     * @returns {float} from 0 to 1
     */
    $.progress = function () {
      if (_error) {
        return 1;
      }
      // Sum up progress across everything
      var ret = 0;
      var error = false;
      $h.each($.chunks, function (c) {
        if (c.status() == 'error') {
          error = true;
        }
        ret += c.progress(true); // get chunk progress relative to entire file
      });
      ret = (error ? 1 : (ret > 0.999 ? 1 : ret));
      // We don't want to lose percentages when an upload is paused
      ret = Math.max($._prevProgress, ret);
      $._prevProgress = ret;
      return ret;
    };

    /**
     * Indicates if file is being uploaded at the moment
     * @name ResumableFile.isUploading
     * @function
     * @returns {boolean}
     */
    $.isUploading = function () {
      var uploading = false;
      $h.each($.chunks, function (chunk) {
        if (chunk.status() == 'uploading') {
          uploading = true;
          return false;
        }
      });
      return uploading;
    };

    /**
     * Indicates if file is has finished uploading and received a response
     * @name ResumableFile.isComplete
     * @function
     * @returns {boolean}
     */
    $.isComplete = function () {
      var outstanding = false;
      $h.each($.chunks, function (chunk) {
        var status = chunk.status();
        if (status == 'pending'
            || status == 'uploading'
            || chunk.preprocessState === 1) {
          outstanding = true;
          return false;
        }
      });
      return !outstanding;
    };


    $.bootstrap();
  }

  /**
   * Class for storing a single chunk
   * @param {Resumable} resumableObj
   * @param {ResumableFile} fileObj
   * @param {number} offset
   * @param {Function} callback
   * @constructor
   */
  function ResumableChunk(resumableObj, fileObj, offset, callback) {
    /**
     * Alias for this
     * @type {ResumableChunk}
     */
    var $ = this;

    /**
     * Reference to parent resumable object
     * @name ResumableChunk.resumableObj
     * @type {Resumable}
     */
    $.resumableObj = resumableObj;

    /**
     * Reference to parent ResumableFile object
     * @name ResumableChunk.fileObj
     * @type {ResumableFile}
     */
    $.fileObj = fileObj;

    /**
     * File size
     * @name ResumableChunk.fileObjSize
     * @type {number}
     */
    $.fileObjSize = fileObj.size;

    /**
     * File offset
     * @name ResumableChunk.offset
     * @type {number}
     */
    $.offset = offset;

    /**
     * A callback function to report chunk progress
     * @name ResumableChunk.callback
     * @type {Function}
     */
    $.callback = callback;

    /**
     * Date then progress was called last time
     * @name ResumableChunk.lastProgressCallback
     * @type {number}
     */
    $.lastProgressCallback = Date.now(); // Support from IE 9

    /**
     * Indicates if chunk existence was checked on the server
     * @name ResumableChunk.tested
     * @type {boolean}
     */
    $.tested = false;

    /**
     * Number of retries performed
     * @name ResumableChunk.retries
     * @type {number}
     */
    $.retries = 0;

    /**
     * Pending retry
     * @name ResumableChunk.pendingRetry
     * @type {boolean}
     */
    $.pendingRetry = false;

    /**
     * Preprocess state
     * @name ResumableChunk.preprocessState
     * @type {number} 0 = unprocessed, 1 = processing, 2 = finished
     */
    $.preprocessState = 0;

    /**
     * Bytes transferred
     * @name ResumableChunk.loaded
     * @type {number}
     */
    $.loaded = 0;

    /**
     * Size of a chunk
     * @type {number}
     */
    var chunkSize = $.resumableObj.opts.chunkSize;

    /**
     * Chunk start byte in a file
     * @name ResumableChunk.startByte
     * @type {number}
     */
    $.startByte = $.offset * chunkSize;

    /**
     * Chunk end byte in a file
     * @name ResumableChunk.endByte
     * @type {number}
     */
    $.endByte = Math.min($.fileObjSize, ($.offset + 1) * chunkSize);

    /**
     * XMLHttpRequest
     * @name ResumableChunk.xhr
     * @type {XMLHttpRequest}
     */
    $.xhr = null;

    if ($.fileObjSize - $.endByte < chunkSize
        && !$.resumableObj.opts.forceChunkSize) {
      // The last chunk will be bigger than the chunk size,
      // but less than 2*chunkSize
      $.endByte = $.fileObjSize;
    }

    /**
     * Get params for a request
     * @function
     * @name ResumableChunk.getParams
     */
    $.getParams = function () {
      return {
        resumableChunkNumber: $.offset + 1,
        resumableChunkSize: $.resumableObj.opts.chunkSize,
        resumableCurrentChunkSize: $.endByte - $.startByte,
        resumableTotalSize: $.fileObjSize,
        resumableIdentifier: $.fileObj.uniqueIdentifier,
        resumableFilename: $.fileObj.name,
        resumableRelativePath: $.fileObj.relativePath,
        resumableTotalChunks: $.fileObj.chunks.length
      };
    };

    /**
     * Makes a GET request without any data to see if the chunk has already
     * been uploaded in a previous session
     * @function
     * @name ResumableChunk.test
     */
    $.test = function () {
      // Set up request and listen for event
      $.xhr = new XMLHttpRequest();

      var testHandler = function (e) {
        $.tested = true;
        var status = $.status();
        if (status == 'success') {
          $.callback(status, $.message());
          $.resumableObj.uploadNextChunk();
        } else {
          $.send();
        }
      };
      $.xhr.addEventListener("load", testHandler, false);
      $.xhr.addEventListener("error", testHandler, false);

      // Add data from the query options
      var params = [];
      var query = $.resumableObj.opts.query;
      if (typeof query == "function") {
        query = query($.fileObj, $);
      }
      query = $h.extend({}, $.getParams(), query);
      $h.each(query, function (k, v) {
        params.push([encodeURIComponent(k), encodeURIComponent(v)].join('='));
      });

      // Append the relevant chunk and send it
      $.xhr.open("GET", $h.getTarget(params));

      // Add data from header options
      $h.each($.resumableObj.opts.headers, function (k, v) {
        $.xhr.setRequestHeader(k, v);
      });
      $.xhr.send(null);
    };

    /**
     * Finish preprocess state
     * @function
     * @name ResumableChunk.preprocessFinished
     */
    $.preprocessFinished = function () {
      $.preprocessState = 2;
      $.send();
    };

    /**
     * Uploads the actual data in a POST call
     * @function
     * @name ResumableChunk.send
     */
    $.send = function () {
      var preprocess = $.resumableObj.opts.preprocess;
      if (typeof preprocess === 'function') {
        switch ($.preprocessState) {
          case 0:
            preprocess($);
            $.preprocessState = 1;
            return;
          case 1:
            return;
          case 2:
            break;
        }
      }
      if ($.resumableObj.opts.testChunks && !$.tested) {
        $.test();
        return;
      }

      // Set up request and listen for event
      $.xhr = new XMLHttpRequest();

      // Progress
      $.xhr.upload.addEventListener("progress", function (e) {
        if (Date.now() - $.lastProgressCallback >
            $.resumableObj.opts.throttleProgressCallbacks * 1000) {
          $.callback('progress');
          $.lastProgressCallback = Date.now();
        }
        $.loaded = e.loaded || 0;
      }, false);
      $.loaded = 0;
      $.pendingRetry = false;
      $.callback('progress');

      // Done (either done, failed or retry)
      var doneHandler = function (e) {
        var status = $.status();
        if (status == 'success' || status == 'error') {
          $.callback(status, $.message());
          $.resumableObj.uploadNextChunk();
        } else {
          $.callback('retry', $.message());
          $.abort();
          $.retries++;
          var retryInterval =  $.resumableObj.opts.chunkRetryInterval;
          if (retryInterval !== undefined) {
            $.pendingRetry = true;
            setTimeout($.send, retryInterval);
          } else {
            $.send();
          }
        }
      };
      $.xhr.addEventListener("load", doneHandler, false);
      $.xhr.addEventListener("error", doneHandler, false);

      // Mix in custom data
      var customQuery = $.resumableObj.opts.query;
      if (typeof customQuery == "function") {
        customQuery = customQuery($.fileObj, $);
      }
      var query = $h.extend({}, $.getParams(), customQuery);

      var func = ($.fileObj.file.slice ? 'slice' :
          ($.fileObj.file.mozSlice ? 'mozSlice' :
          ($.fileObj.file.webkitSlice ? 'webkitSlice' :
            'slice')));
      var bytes = $.fileObj.file[func]($.startByte, $.endByte);
      var data = null;
      var target = $.resumableObj.opts.target;

      if ($.resumableObj.opts.method === 'octet') {
        // Add data from the query options
        data = bytes;
        var params = [];
        $h.each(query, function (k, v) {
          params.push([encodeURIComponent(k), encodeURIComponent(v)].join('='));
        });
        target = $h.getTarget(params);
      } else {
        // Add data from the query options
        data = new FormData();
        $h.each(query, function (k, v) {
          data.append(k, v);
        });
        data.append($.resumableObj.opts.fileParameterName, bytes);
      }

      $.xhr.open('POST', target);
      // Add data from header options
      $h.each($.resumableObj.opts.headers, function (k, v) {
        $.xhr.setRequestHeader(k, v);
      });
      $.xhr.send(data);
    };

    /**
     * Abort current xhr request
     * @function
     * @name ResumableChunk.abort
     */
    $.abort = function () {
      // Abort and reset
      if ($.xhr) {
        $.xhr.abort();
      }
      $.xhr = null;
    };

    /**
     * Retrieve current chunk upload status
     * @function
     * @name ResumableChunk.status
     * @returns {string} 'pending', 'uploading', 'success', 'error'
     */
    $.status = function () {
      if ($.pendingRetry) {
        // if pending retry then that's effectively the same as actively uploading,
        // there might just be a slight delay before the retry starts
        return 'uploading';
      } else if (!$.xhr) {
        return 'pending';
      } else if ($.xhr.readyState < 4) {
        // Status is really 'OPENED', 'HEADERS_RECEIVED'
        // or 'LOADING' - meaning that stuff is happening
        return 'uploading';
      } else {
        if ($.xhr.status == 200) {
          // HTTP 200, perfect
          return 'success';
        } else if ($h.contains($.resumableObj.opts.permanentErrors, $.xhr.status)
            || $.retries >= $.resumableObj.opts.maxChunkRetries) {
          // HTTP 415/500/501, permanent error
          return 'error';
        } else {
          // this should never happen, but we'll reset and queue a retry
          // a likely case for this would be 503 service unavailable
          $.abort();
          return 'pending';
        }
      }
    };

    /**
     * Get response from xhr request
     * @function
     * @name ResumableChunk.message
     * @returns {String}
     */
    $.message = function () {
      return $.xhr ? $.xhr.responseText : '';
    };

    /**
     * Get upload progress
     * @function
     * @name ResumableChunk.progress
     * @param {boolean} relative
     * @returns {float}
     */
    $.progress = function (relative) {
      if (typeof(relative) === 'undefined') {
        relative = false;
      }
      var factor = (relative ? ($.endByte - $.startByte) / $.fileObjSize : 1);
      if ($.pendingRetry) {
        return 0;
      }
      var s = $.status();
      switch (s) {
        case 'success':
        case 'error':
          return factor;
        case 'pending':
          return 0;
        default:
          return $.loaded / ($.endByte - $.startByte) * factor;
      }
    };
  }

  //
  // Public api begin
  //

  /**
   * Set a callback for an event, possible events:
   * fileSuccess(file), fileProgress(file), fileAdded(file, event),
   * fileRetry(file), fileError(file, message), complete(),
   * progress(), error(message, file), pause()
   * @name Resumable.on
   * @function
   * @param {string} event
   * @param {Function} callback
   */
  $.on = function (event, callback) {
    $.events.push(event.toLowerCase(), callback);
  };

  /**
   * Fire an event
   * @name Resumable.fire
   * @function
   * @param {string} event event name
   * @param [...] arguments fo a callback
   */
  $.fire = function () {
    // `arguments` is an object, not array, in FF, so:
    var args = [];
    var i;
    for (i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    // Find event listeners, and support pseudo-event `catchAll`
    var event = args[0].toLowerCase();
    for (i = 0; i <= $.events.length; i += 2) {
      if ($.events[i] == event) {
        $.events[i + 1].apply($, args.slice(1));
      }
      if ($.events[i] == 'catchall') {
        $.events[i + 1].apply(null, args);
      }
    }
    if (event == 'fileerror') {
      $.fire('error', args[2], args[1]);
    }
    if (event == 'fileprogress') {
      $.fire('progress');
    }
  };

  /**
   * Upload next chunk from the queue
   * @function
   * @name Resumable.uploadNextChunk
   * @returns {boolean}
   * @private
   */
  $.uploadNextChunk = function () {
    var found = false;

    // In some cases (such as videos) it's really handy to upload the first
    // and last chunk of a file quickly; this let's the server check the file's
    // metadata and determine if there's even a point in continuing.
    if ($.opts.prioritizeFirstAndLastChunk) {
      $h.each($.files, function (file) {
        if (file.chunks.length && file.chunks[0].status() == 'pending'
            && file.chunks[0].preprocessState === 0) {
          file.chunks[0].send();
          found = true;
          return false;
        }
        if (file.chunks.length > 1
            && file.chunks[file.chunks.length - 1].status() == 'pending'
            && file.chunks[0].preprocessState === 0) {
          file.chunks[file.chunks.length - 1].send();
          found = true;
          return false;
        }
      });
      if (found) {
        return true;
      }
    }

    // Now, simply look for the next, best thing to upload
    $h.each($.files, function (file) {
      $h.each(file.chunks, function (chunk) {
        if (chunk.status() == 'pending' && chunk.preprocessState === 0) {
          chunk.send();
          found = true;
          return false;
        }
      });
      if (found) {
        return false;
      }
    });
    if (found) {
      return true;
    }

    // The are no more outstanding chunks to upload, check is everything is done
    var outstanding = false;
    $h.each($.files, function (file) {
      if (!file.isComplete()) {
        outstanding = true;
        return false;
      }
    });
    if (!outstanding) {
      // All chunks have been uploaded, complete
      $.fire('complete');
    }
    return false;
  };


  /**
   * Assign a browse action to one or more DOM nodes.
   * @function
   * @name Resumable.assignBrowse
   * @param {Element|Array.<Element>} domNodes
   * @param {boolean} isDirectory Pass in true to allow directories to
   * be selected (Chrome only).
   */
  $.assignBrowse = function (domNodes, isDirectory) {
    if (typeof domNodes.length == 'undefined') domNodes = [domNodes];

    // We will create an <input> and overlay it on the domNode
    // (crappy, but since HTML5 doesn't have a cross-browser.browse() method
    // we haven't a choice. FF4+ allows click() for this though:
    // https://developer.mozilla.org/en/using_files_from_web_applications)
    $h.each(domNodes, function (domNode) {
      var input;
      if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
        input = domNode;
      } else {
        input = document.createElement('input');
        input.setAttribute('type', 'file');
        // Place <input /> with the dom node an position the input to fill the
        // entire space
        domNode.style.display = 'inline-block';
        domNode.style.position = 'relative';
        input.style.position = 'absolute';
        input.style.top = input.style.left = 0;
        input.style.bottom = input.style.right = 0;
        input.style.opacity = 0;
        input.style.cursor = 'pointer';
        domNode.appendChild(input);
      }
      var maxFiles = $.opts.maxFiles;
      if (typeof(maxFiles) === 'undefined' || maxFiles != 1) {
        input.setAttribute('multiple', 'multiple');
      } else {
        input.removeAttribute('multiple');
      }
      if (isDirectory) {
        input.setAttribute('webkitdirectory', 'webkitdirectory');
      } else {
        input.removeAttribute('webkitdirectory');
      }
      // When new files are added, simply append them to the overall list
      input.addEventListener('change', function (e) {
        appendFilesFromFileList(e.target.files);
        e.target.value = '';
      }, false);
    });
  };

  /**
   * Assign one or more DOM nodes as a drop target.
   * @function
   * @name Resumable.assignDrop
   * @param {Element|Array.<Element>} domNodes
   */
  $.assignDrop = function (domNodes) {
    if (typeof domNodes.length == 'undefined') {
      domNodes = [domNodes];
    }
    $h.each(domNodes, function (domNode) {
      domNode.addEventListener('dragover', onDragOver, false);
      domNode.addEventListener('drop', onDrop, false);
    });
  };

  /**
   * Un-assign drop event from DOM nodes
   * @function
   * @name Resumable.unAssignDrop
   * @param domNodes
   */
  $.unAssignDrop = function (domNodes) {
    if (typeof domNodes.length == 'undefined') {
      domNodes = [domNodes];
    }
    $h.each(domNodes, function (domNode) {
      domNode.removeEventListener('dragover', onDragOver);
      domNode.removeEventListener('drop', onDrop);
    });
  };

  /**
   * Returns a boolean indicating whether or not the instance is currently
   * uploading anything.
   * @function
   * @name Resumable.isUploading
   * @returns {boolean}
   */
  $.isUploading = function () {
    var uploading = false;
    $h.each($.files, function (file) {
      if (file.isUploading()) {
        uploading = true;
        return false;
      }
    });
    return uploading;
  };

  /**
   * Start or resume uploading.
   * @function
   * @name Resumable.upload
   */
  $.upload = function () {
    // Make sure we don't start too many uploads at once
    if ($.isUploading()) {
      return;
    }
    // Kick off the queue
    $.fire('uploadStart');
    for (var num = 1; num <= $.opts.simultaneousUploads; num++) {
      $.uploadNextChunk();
    }
  };

  /**
   * Pause uploading.
   * @function
   * @name Resumable.pause
   */
  $.pause = function () {
    // Resume all chunks currently being uploaded
    $h.each($.files, function (file) {
      file.abort();
    });
    $.fire('pause');
  };

  /**
   * Cancel upload of all ResumableFile objects and remove them from the list.
   * @function
   * @name Resumable.cancel
   */
  $.cancel = function () {
    for (var i = $.files.length - 1; i >= 0; i--) {
      $.files[i].cancel();
    }
    $.fire('cancel');
  };

  /**
   * Returns a float between 0 and 1 indicating the current upload progress
   * of all files.
   * @function
   * @name Resumable.progress
   * @returns {float}
   */
  $.progress = function () {
    var totalDone = 0;
    var totalSize = 0;
    // Resume all chunks currently being uploaded
    $h.each($.files, function (file) {
      totalDone += file.progress() * file.size;
      totalSize += file.size;
    });
    return totalSize > 0 ? totalDone / totalSize : 0;
  };

  /**
   * Add a HTML5 File object to the list of files.
   * @function
   * @name Resumable.addFile
   * @param {File} file
   */
  $.addFile = function (file) {
    appendFilesFromFileList([file]);
  };

  /**
   * Cancel upload of a specific ResumableFile object from the list.
   * @function
   * @name Resumable.removeFile
   * @param {ResumableFile} file
   */
  $.removeFile = function (file) {
    for (var i = $.files.length - 1; i >= 0; i--) {
      if ($.files[i] === file) {
        $.files.splice(i, 1);
      }
    }
  };

  /**
   * Look up a ResumableFile object by its unique identifier.
   * @function
   * @name Resumable.getFromUniqueIdentifier
   * @param {string} uniqueIdentifier
   * @returns {boolean|ResumableFile} false if file was not found
   */
  $.getFromUniqueIdentifier = function (uniqueIdentifier) {
    var ret = false;
    $h.each($.files, function (f) {
      if (f.uniqueIdentifier == uniqueIdentifier) {
        ret = f;
      }
    });
    return ret;
  };

  /**
   * Returns the total size of all files in bytes.
   * @function
   * @name Resumable.getSize
   * @returns {number}
   */
  $.getSize = function () {
    var totalSize = 0;
    $h.each($.files, function (file) {
      totalSize += file.size;
    });
    return totalSize;
  };

  $.opts = $h.extend({}, $.defaults, opts || {});
}

// Node.js-style export for Node and Component
if (typeof module != 'undefined') {
  module.exports = Resumable;
}
