// Generated by CoffeeScript 1.10.0
(function() {
  var Resumable, ResumableChunk, ResumableFile,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.Resumable = Resumable = (function() {
    function Resumable(opt) {
      this.opt = opt;
      console.log('constructor');
      this.support = (typeof File !== "undefined" && File !== null) && (typeof Blob !== "undefined" && Blob !== null) && (typeof FileList !== "undefined" && FileList !== null) && ((Blob.prototype.webkitSlice != null) || (Blob.prototype.mozSlice != null) || (Blob.prototype.slice != null));
      this.files = [];
      this.defaults = {
        chunkSize: 1 * 1024 * 1024,
        forceChunkSize: false,
        simultaneousUploads: 3,
        fileParameterName: 'file',
        paramNames: {
          chunkNumber: 'resumableChunkNumber',
          chunkSize: 'resumableChunkSize',
          currentChunkSize: 'resumableCurrentChunkSize',
          totalSize: 'resumableTotalSize',
          type: 'resumableType',
          identifier: 'resumableIdentifier',
          fileName: 'resumableFilename',
          relativePath: 'resumableRelativePath',
          totalChunks: 'resumableTotalChunks'
        },
        throttleProgressCallbacks: 0.5,
        query: {},
        headers: {},
        preprocess: null,
        method: 'multipart',
        prioritizeFirstAndLastChunk: false,
        target: '/',
        testChunks: true,
        generateUniqueIdentifier: null,
        maxChunkRetries: void 0,
        chunkRetryInterval: void 0,
        permanentErrors: [415, 500, 501],
        maxFiles: void 0,
        maxFilesErrorCallback: function(files, errorCount) {
          var maxFiles, ref;
          maxFiles = this.getOpt('maxFiles');
          return alert('Please upload ' + maxFiles + ' file' + ((ref = maxFiles === 1) != null ? ref : {
            '': 's'
          }) + ' at a time.');
        },
        minFileSize: void 0,
        minFileSizeErrorCallback: function(file, errorCount) {
          return alert(file.fileName(+' is too small, please upload files larger than ' + this.formatSize(this.getOpt('minFileSize')) + '.'));
        },
        maxFileSize: void 0,
        maxFileSizeErrorCallback: function(file, errorCount) {
          return alert(file.fileName(+' is too large, please upload files less than ' + this.formatSize(this.getOpt('maxFileSize')) + '.'));
        }
      };
      if (this.opt == null) {
        this.opt = {};
      }
      this.events = [];
    }

    Resumable.prototype.getOpt = function(o) {
      var i, item, len, opts;
      if (o instanceof Array) {
        opts = {};
        for (i = 0, len = o.length; i < len; i++) {
          item = o[i];
          opts[item] = this.getOpt(item);
        }
        return opts;
      } else {
        if (this.opt[o] != null) {
          return this.opt[o];
        } else {
          return this.defaults[o];
        }
      }
    };

    Resumable.prototype.formatSize = function(size) {
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

    Resumable.prototype.stopEvent = function(e) {
      console.log('stopEvent');
      e.stopPropagation();
      return e.preventDefault();
    };

    Resumable.prototype.generateUniqueIdentifier = function(file) {
      var custom, relativePath, size;
      console.log('generateUniqueIdentifier');
      custom = this.getOpt('generateUniqueIdentifier');
      if (typeof custom === 'function') {
        return custom(file);
      } else {
        relativePath = file.webkitRelativePath || file.fileName || file.name;
        size = file.size;
        return size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
      }
    };

    Resumable.prototype.on = function(event, callback) {
      console.log("on: " + event);
      return this.events.push({
        event: event,
        callback: callback
      });
    };

    Resumable.prototype.fire = function() {
      var args, e, event, i, len, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      console.log("fire: " + args[0]);
      event = args[0].toLowerCase();
      ref = this.events;
      for (i = 0, len = ref.length; i < len; i++) {
        e = ref[i];
        if (e.event.toLowerCase() === event) {
          e.callback.apply(this, args.slice(1));
        }
        if (e.event.toLowerCase() === 'catchall') {
          e.callback.apply(null, args);
        }
      }
      if (event === 'fireerror') {
        this.fire('error', args[2], args[1]);
      }
      if (event === 'fileprogress') {
        return this.fire('progress');
      }
    };

    Resumable.prototype.onDrop = function(event) {
      console.log("onDrop");
      this.stopEvent(event);
      return this.appendFilesFromFileList(event.dataTransfer.files, event);
    };

    Resumable.prototype.onDragOver = function(event) {
      console.log("onDragOver");
      return event.preventDefault();
    };

    Resumable.prototype.appendFilesFromFileList = function(fileList, event) {
      var errorCount, file, files, i, len, maxFileSize, maxFileSizeErrorCallback, maxFiles, maxFilesErrorCallback, minFileSize, minFileSizeErrorCallback, ref, resumableFile;
      console.log("appendFilesFromFileList");
      errorCount = 0;
      ref = this.getOpt(['maxFiles', 'minFileSize', 'maxFileSize', 'maxFilesErrorCallback', 'minFileSizeErrorCallback', 'maxFileSizeErrorCallback']), maxFiles = ref[0], minFileSize = ref[1], maxFileSize = ref[2], maxFilesErrorCallback = ref[3], minFileSizeErrorCallback = ref[4], maxFileSizeErrorCallback = ref[5];
      if ((maxFiles != null) && maxFiles < (fileList.length + this.files.length)) {
        maxFilesErrorCallback(fileList, errorCount++);
        return false;
      }
      files = [];
      for (i = 0, len = fileList.length; i < len; i++) {
        file = fileList[i];
        file.name = file.fileName = file.name || file.fileName;
        if ((minFileSize != null) && file.size < minFileSize) {
          minFileSizeErrorCallback(file, errorCount++);
          return false;
        }
        if ((maxFileSize != null) && file.size > maxFileSize) {
          maxFilesErrorCallback(file, errorCount++);
          return false;
        }
        if (file.size > 0 && !this.getFromUniqueIdentifier(this.generateUniqueIdentifier(file))) {
          resumableFile = new ResumableFile(this, file);
          this.files.push(resumableFile);
          files.push(resumableFile);
          this.fire('fileAdded', resumableFile, event);
        }
      }
      return this.fire('fileAdded', files);
    };

    Resumable.prototype.uploadNextChunk = function() {
      var chunk, file, found, i, j, k, l, len, len1, len2, len3, len4, m, outstanding, ref, ref1, ref2, ref3, ref4, status;
      console.log("uploadNextChunk");
      found = false;
      if (this.getOpt('prioritizeFirstAndLastChunk')) {
        ref = this.files;
        for (i = 0, len = ref.length; i < len; i++) {
          file = ref[i];
          if (file.chunks.length && file.chunks[0].status() === 'pending' && file.chunks[0].preprocessState === 0) {
            file.chunks[0].send();
            found = true;
            break;
          }
          if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status() === 'pending' && file.chunks[file.chunks.length - 1].preprocessState === 0) {
            file.chunks[file.chunks.length - 1].send();
            found = true;
            break;
          }
        }
        if (found) {
          return true;
        }
      }
      ref1 = this.files;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        file = ref1[j];
        ref2 = file.chunks;
        for (k = 0, len2 = ref2.length; k < len2; k++) {
          chunk = ref2[k];
          if (chunk.status() === 'pending' && chunk.preprocessState === 0) {
            chunk.send();
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
      if (found) {
        return true;
      }
      ref3 = this.files;
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        file = ref3[l];
        outstanding = false;
        ref4 = file.chunks;
        for (m = 0, len4 = ref4.length; m < len4; m++) {
          chunk = ref4[m];
          status = chunk.status();
          if (status === 'pending' || status === 'uploading' || chunk.preprocessState === 1) {
            outstanding = true;
            break;
          }
        }
        if (outstanding) {
          break;
        }
      }
      if (!outstanding) {
        this.fire('complete');
      }
      return false;
    };

    Resumable.prototype.assignBrowse = function(domNodes, isDirectory) {
      var changeHandler, dn, i, input, len, maxFiles;
      console.log("assignBrowse");
      if (domNodes.length == null) {
        domNodes = [domNodes];
      }
      for (i = 0, len = domNodes.length; i < len; i++) {
        dn = domNodes[i];
        if (dn.tagName === 'INPUT' && dn.type === 'file') {
          input = dn;
        } else {
          input = document.createElement('input');
          input.setAttribute('type', 'file');
          dn.style.display = 'inline-block';
          dn.style.position = 'relative';
          input.style.position = 'absolute';
          input.style.top = input.style.left = input.style.bottom = input.style.right = 0;
          input.style.opacity = 0;
          input.style.cursor = 'pointer';
          dn.appendChild(input);
        }
      }
      maxFiles = this.getOpt('maxFiles');
      if ((maxFiles != null) || maxFiles !== 1) {
        input.setAttribute('multiple', 'multiple');
      } else {
        input.removeAttribute('multiple');
      }
      if (isDirectory) {
        input.setAttribute('webkitdirectory', 'webkitdirectory');
      } else {
        input.removeAttribute('webkitdirectory');
      }
      changeHandler = (function(_this) {
        return function(e) {
          _this.appendFilesFromFileList(e.target.files);
          return e.target.value = '';
        };
      })(this);
      return input.addEventListener('change', changeHandler, false);
    };

    Resumable.prototype.assignDrop = function(domNodes) {
      var dn, i, len, results;
      console.log("assignDrop");
      if (domNodes.length == null) {
        domNodes = [domNodes];
      }
      results = [];
      for (i = 0, len = domNodes.length; i < len; i++) {
        dn = domNodes[i];
        dn.addEventListener('dragover', this.onDragOver, false);
        results.push(dn.addEventListener('drop', this.onDrop, false));
      }
      return results;
    };

    Resumable.prototype.unAssignDrop = function(domNodes) {
      var dn, i, len, results;
      console.log("unAssignDrop");
      if (domNodes.length == null) {
        domNodes = [domNodes];
      }
      results = [];
      for (i = 0, len = domNodes.length; i < len; i++) {
        dn = domNodes[i];
        dn.removeEventListener('dragover', this.onDragOver);
        results.push(dn.removeEventListener('drop', this.onDrop));
      }
      return results;
    };

    Resumable.prototype.isUploading = function() {
      var chunk, file, i, j, len, len1, ref, ref1, uploading;
      uploading = false;
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        ref1 = file.chunks;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          chunk = ref1[j];
          if (chunk.status() === 'uploading') {
            uploading = true;
            break;
          }
        }
        if (uploading) {
          break;
        }
      }
      return uploading;
    };

    Resumable.prototype.upload = function() {
      var i, num, ref, results;
      console.log("upload");
      if (this.isUploading()) {
        return;
      }
      this.fire('uploadStart');
      results = [];
      for (num = i = 0, ref = this.getOpt('simultaneousUploads'); 0 <= ref ? i <= ref : i >= ref; num = 0 <= ref ? ++i : --i) {
        results.push(this.uploadNextChunk());
      }
      return results;
    };

    Resumable.prototype.pause = function() {
      var file, i, len, ref;
      console.log("pause");
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        file.abort();
      }
      return this.fire('pause');
    };

    Resumable.prototype.cancel = function() {
      var file, i, len, ref;
      console.log("cancel");
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        file.cancel();
      }
      return this.fire('cancel');
    };

    Resumable.prototype.progress = function() {
      var file, i, len, ref, totalDone, totalSize;
      console.log("progress");
      totalDone = 0;
      totalSize = 0;
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        totalDone += file.progress() * file.size;
        totalSize += file.size;
      }
      return (totalSize > 0 ? totalDone / totalSize : 0);
    };

    Resumable.prototype.addFile = function(file) {
      console.log("addFile");
      return this.appendFilesFromFileList([file]);
    };

    Resumable.prototype.removeFile = function(file) {
      var f, files, i, len, ref;
      console.log("removeFile");
      files = [];
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        f = ref[i];
        if (f !== file) {
          files.push(f);
        }
      }
      return this.files = files;
    };

    Resumable.prototype.getFromUniqueIdentifier = function(uniqueIdentifier) {
      var f, i, len, ref;
      console.log("getFromUniqueIdentifier");
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        f = ref[i];
        if (f.uniqueIdentifier === uniqueIdentifier) {
          return f;
        }
      }
      return false;
    };

    Resumable.prototype.getSize = function() {
      var file, i, len, ref, totalSize;
      console.log("getSize");
      totalSize = 0;
      ref = this.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        totalSize += file.size;
      }
      return totalSize;
    };

    return Resumable;

  })();

  window.ResumableChunk = ResumableChunk = (function() {
    function ResumableChunk(resumableObj, fileObj, offset1, callback1) {
      this.resumableObj = resumableObj;
      this.fileObj = fileObj;
      this.offset = offset1;
      this.callback = callback1;
      this.opt = {};
      this.fileObjSize = this.fileObj.size;
      this.lastProgressCallback = new Date;
      this.tested = false;
      this.retries = 0;
      this.preprocessState = 0;
      this.chunkSize = this.getOpt('chunkSize');
      this.loaded = 0;
      this.startByte = this.offset * this.chunkSize;
      this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * this.chunkSize);
      if ((this.fileObjSize - this.endByte < this.chunkSize) && (!this.getOpt('forceChunkSize'))) {
        this.endByte = this.fileObjSize;
      }
      this.xhr = null;
    }

    ResumableChunk.prototype.getOpt = function(o) {
      return this.resumableObj.getOpt(o);
    };

    ResumableChunk.prototype.pushParams = function(params, key, value) {
      return params.push([encodeURIComponent(key), encodeURIComponent(value)].join('='));
    };

    ResumableChunk.prototype.test = function() {
      var customQuery, headers, key, params, testHandler, value;
      this.xhr = new XMLHttpRequest();
      testHandler = (function(_this) {
        return function(e) {
          var status;
          _this.tested = true;
          status = _this.status();
          if (status === 'success') {
            _this.callback(status, _this.message());
            return _this.resumableObj.uploadNextChunk();
          } else {
            return _this.send();
          }
        };
      })(this);
      this.xhr.addEventListener('load', testHandler, false);
      this.xhr.addEventListener('error', testHandler, false);
      params = [];
      customQuery = this.getOpt('query');
      if (typeof customQuery === 'function') {
        customQuery = customQuery(this.fileObj, this);
      }
      if (customQuery != null) {
        for (key in customQuery) {
          value = customQuery[key];
          pushParams(key, value);
        }
      }
      this.pushParams(params, this.getOpt('paramNames.chunkNumber'), this.offset + 1);
      this.pushParams(params, this.getOpt('paramNames.chunkSize'), this.chunkSize);
      this.pushParams(params, this.getOpt('paramNames.currentChunkSize'), this.endByte - this.startByte);
      this.pushParams(params, this.getOpt('paramNames.totalSize'), this.fileObjSize);
      this.pushParams(params, this.getOpt('paramNames.identifier'), this.fileObj.uniqueIdentifier);
      this.pushParams(params, this.getOpt('paramNames.fileName'), this.fileObj.fileName);
      this.pushParams(params, this.getOpt('paramNames.relativePath'), this.fileObj.relativePath);
      this.xhr.open('GET', this.getOpt('target') + '?' + params.join('&'));
      headers = this.getOpt('headers');
      if (headers == null) {
        headers = {};
      }
      for (key in headers) {
        value = headers[key];
        this.xhr.setRequestHeader(key, value);
      }
      return this.xhr.send(null);
    };

    ResumableChunk.prototype.preprocessFinished = function() {
      this.preprocessState = 2;
      return this.send();
    };

    ResumableChunk.prototype.send = function() {
      var bytes, customQuery, data, doneHandler, func, headers, key, params, preprocess, progressHandler, query, ret, target, value;
      preprocess = this.getOpt('preprocess');
      if (typeof preprocess === 'function') {
        ret = false;
        switch (this.preprocessState) {
          case 0:
            preprocess(this);
            this.preprocessState = 1;
            ret = true;
            break;
          case 1:
            ret = true;
            break;
          case 2:
            ret = false;
        }
        if (ret) {
          return;
        }
      }
      if (this.getOpt('testChunks') && !this.tested) {
        this.test();
        return;
      }
      this.xhr = new XMLHttpRequest();
      this.loaded = 0;
      progressHandler = (function(_this) {
        return function(e) {
          if ((new Date) - _this.lastProgressCallback > _this.getOpt('throttleProgressCallbacks') * 1000) {
            _this.callback('progress');
            _this.lastProgressCallback = new Date;
          }
          return _this.loaded = e.loaded || 0;
        };
      })(this);
      this.xhr.upload.addEventListener('progress', progressHandler, false);
      this.callback('progress');
      doneHandler = (function(_this) {
        return function(e) {
          var retryInterval, status;
          status = _this.status();
          if (status === 'success' || status === 'error') {
            _this.callback(status, _this.message());
            return _this.resumableObj.uploadNextChunk();
          } else {
            _this.callback('retry', _this.message());
            _this.abort();
            _this.retries++;
            retryInterval = _this.getOpt('chunkRetryInterval');
            if (retryInterval != null) {
              return setTimeout(_this.send, retryInterval);
            }
          }
        };
      })(this);
      this.xhr.addEventListener('load', doneHandler, false);
      this.xhr.addEventListener('error', doneHandler, false);
      headers = this.getOpt('headers');
      if (headers == null) {
        headers = {};
      }
      for (key in headers) {
        value = headers[key];
        this.xhr.setRequestHeader(key, value);
      }
      if (this.fileObj.file.slice != null) {
        func = 'slice';
      } else if (this.fileObj.file.mozSlice != null) {
        func = 'mozSlice';
      } else if (this.fileObj.file.webkitSlice != null) {
        func = 'webkitSlice';
      } else {
        func = 'slice';
      }
      bytes = this.fileObj.file[func](this.startByte, this.endByte);
      data = null;
      target = this.getOpt('target');
      query = {};
      query[this.getOpt('paramNames.chunkNumber')] = this.offset + 1;
      query[this.getOpt('paramNames.chunkSize')] = this.getOpt('chunkSize');
      query[this.getOpt('paramNames.currentChunkSize')] = this.endByte - this.startByte;
      query[this.getOpt('paramNames.totalSize')] = this.fileObjSize;
      query[this.getOpt('paramNames.identifier')] = this.fileObj.uniqueIdentifier;
      query[this.getOpt('paramNames.filename')] = this.fileObj.fileName;
      query[this.getOpt('paramNames.relativePath')] = this.fileObj.relativePath;
      customQuery = this.getOpt('query');
      if (typeof customQuery === 'function') {
        customQuery = customQuery(this.fileObj, this);
      }
      if (customQuery == null) {
        customQuery = {};
      }
      for (key in customQuery) {
        value = customQuery[key];
        pushParams(query, key, value);
      }
      if (this.getOpt('method') === 'octet') {
        data = bytes;
        params = [];
        for (key in query) {
          value = query[key];
          this.pushParams(params, key, value);
        }
        target += '?' + params.join('&');
      } else {
        data = new FormData();
        for (key in query) {
          value = query[key];
          data.append(key, value);
        }
        data.append(this.getOpt('paramNames.file'), bytes);
      }
      this.xhr.open('POST', target);
      return this.xhr.send(data);
    };

    ResumableChunk.prototype.abort = function() {
      if (this.xhr != null) {
        this.xhr.abort();
      }
      return this.xhr = null;
    };

    ResumableChunk.prototype.status = function() {
      var maxChunkRetries, permanentErrors, ref;
      permanentErrors = this.getOpt('permanentErrors');
      maxChunkRetries = this.getOpt('maxChunkRetries');
      if (permanentErrors == null) {
        permanentErrors = {};
      }
      if (maxChunkRetries == null) {
        maxChunkRetries = 0;
      }
      if (this.xhr == null) {
        return 'pending';
      } else if (this.xhr.readyState < 4) {
        return 'uploading';
      } else if (this.xhr.status === 200) {
        return 'success';
      } else if ((ref = this.xhr.status, indexOf.call(permanentErrors, ref) >= 0) || (this.retries >= maxChunkRetries)) {
        return 'error';
      } else {
        this.abort();
        return 'pending';
      }
    };

    ResumableChunk.prototype.message = function() {
      return (this.xhr != null ? this.xhr.responseText : '');
    };

    ResumableChunk.prototype.progress = function(relative) {
      var factor;
      factor = (relative != null ? (this.endByte - this.startByte) / this.fileObjSize : 1);
      switch (this.status()) {
        case 'success':
        case 'error':
          return 1 * factor;
        case 'pending':
          return 0 * factor;
        default:
          return this.loaded / (this.endByte - this.startByte) * factor;
      }
    };

    return ResumableChunk;

  })();

  window.ResumableFile = ResumableFile = (function() {
    function ResumableFile(resumableObj, file1) {
      this.resumableObj = resumableObj;
      this.file = file1;
      this.opt = {};
      this._prevProgress = 0;
      this.fileName = this.file.fileName || this.file.name;
      this.size = this.file.size;
      this.relativePath = this.file.webkitRelativePath || this.fileName;
      this.uniqueIdentifier = this.resumableObj.generateUniqueIdentifier(this.file);
      this._error = false;
      this.chunks = [];
      this.bootstrap();
    }

    ResumableFile.prototype.getOpt = function(o) {
      return this.resumableObj.getOpt(o);
    };

    ResumableFile.prototype.chunkEvent = function(event, message) {
      switch (event) {
        case "progress":
          return this.resumableObj.fire('fileProgress', this);
        case "error":
          this.abort();
          this._error = true;
          this.chunks = [];
          return this.resumableObj.fire('fileError', this, message);
        case "success":
          if (!this._error) {
            this.resumableObj.fire('fileProgress', this);
            if (this.progress() === 1) {
              return this.resumableObj.fire('fileSuccess', this, message);
            }
          }
          break;
        case "retry":
          return this.resumableObj.fire('fileRetry', this);
      }
    };

    ResumableFile.prototype.abort = function() {
      var c, i, len, ref;
      ref = this.chunks;
      for (i = 0, len = ref.length; i < len; i++) {
        c = ref[i];
        if (c.status() === 'uploading') {
          c.abort();
        }
      }
      return this.resumableObj.fire('fileProgress', this);
    };

    ResumableFile.prototype.cancel = function() {
      var _chunks, c, i, len;
      _chunks = this.chunks;
      this.chunks = [];
      for (i = 0, len = _chunks.length; i < len; i++) {
        c = _chunks[i];
        if (c.status() === 'uploading') {
          c.abort();
          this.resumableObj.uploadNextChunk();
        }
      }
      this.resumableObj.removeFile(this);
      return this.resumableObj.fire('fileProgress', this);
    };

    ResumableFile.prototype.retry = function() {
      this.bootstrap();
      return this.resumableObj.upload();
    };

    ResumableFile.prototype.bootstrap = function() {
      var i, max, offset, ref, results, round;
      this.abort();
      this._error = false;
      this.chunks = [];
      this._prevProgress = 0;
      if (this.getOpt('forceChunkSize') != null) {
        round = Math.ceil;
      } else {
        round = Math.floor;
      }
      offset = 0;
      max = Math.max(round(this.file.size / this.getOpt('chunkSize')), 1);
      results = [];
      for (offset = i = 0, ref = max - 1; 0 <= ref ? i <= ref : i >= ref; offset = 0 <= ref ? ++i : --i) {
        results.push(this.chunks.push(new ResumableChunk(this.resumableObj, this, offset, this.chunkEvent)));
      }
      return results;
    };

    ResumableFile.prototype.progress = function() {
      var c, error, i, len, ref, ret;
      if (this._error) {
        return 1.;
      }
      ret = 0;
      error = false;
      ref = this.chunks;
      for (i = 0, len = ref.length; i < len; i++) {
        c = ref[i];
        error = c.status() === 'error';
        ret += c.progress(true);
      }
      ret = (error || error > 0.99 ? 1 : ret);
      ret = Math.max(this._prevProgress, ret);
      this._prevProgress = ret;
      return ret;
    };

    return ResumableFile;

  })();

}).call(this);

//# sourceMappingURL=resumable.js.map
