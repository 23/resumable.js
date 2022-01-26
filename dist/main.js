(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("resumablejs", [], factory);
	else if(typeof exports === 'object')
		exports["resumablejs"] = factory();
	else
		root["resumablejs"] = factory();
})(this, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
var ResumableHelpers = /** @class */ (function () {
    function ResumableHelpers() {
    }
    /**
     * Stop the propagation and default behavior of the given event `e`.
     */
    ResumableHelpers.stopEvent = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };
    /**
     *
     * @param file The file whose filename should be retrieved
     */
    ResumableHelpers.getFileNameFromFile = function (file) {
        return /*file.fileName ||*/ file.name;
    };
    /**
     * Generate a unique identifier for the given file based on its size, filename and relative path.
     * @param {File} file The file for which the identifier should be generated
     * @returns {string} The unique identifier for the given file object
     */
    ResumableHelpers.generateUniqueIdentifier = function (file) {
        var relativePath = file.webkitRelativePath || /*file.relativePath ||*/ this.getFileNameFromFile(file);
        var size = file.size;
        return (size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
    };
    /**
     * Flatten the given array and all contained subarrays.
     * Credit: {@link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_flattendeep}
     */
    ResumableHelpers.flattenDeep = function (array) {
        var _this = this;
        return Array.isArray(array)
            ? array.reduce(function (a, b) { return a.concat(_this.flattenDeep(b)); }, [])
            : [array];
    };
    /**
     * Filter the given array based on the predicate inside `callback`
     * and executes `errorCallback` for duplicate elements.
     */
    ResumableHelpers.uniqBy = function (array, callback, errorCallback) {
        var seen = new Set();
        return array.filter(function (item) {
            var k = callback(item);
            if (seen.has(k)) {
                errorCallback(item);
                return false;
            }
            else {
                seen.add(k);
                return true;
            }
        });
    };
    /**
     * Format the size given in Bytes in a human readable format.
     */
    ResumableHelpers.formatSize = function (size) {
        if (size < 1024) {
            return size + ' bytes';
        }
        if (size < 1024 * 1024) {
            return (size / 1024.0).toFixed(0) + ' KB';
        }
        if (size < 1024 * 1024 * 1024) {
            return (size / 1024.0 / 1024.0).toFixed(1) + ' MB';
        }
        return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB';
    };
    /**
     * Get the target url for the specified request type and params
     */
    ResumableHelpers.getTarget = function (requestType, sendTarget, testTarget, params, parameterNamespace) {
        if (parameterNamespace === void 0) { parameterNamespace = ''; }
        var target = sendTarget;
        if (requestType === 'test' && testTarget) {
            target = testTarget === '/' ? sendTarget : testTarget;
        }
        var separator = target.indexOf('?') < 0 ? '?' : '&';
        var joinedParams = Object.entries(params).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [
                encodeURIComponent(parameterNamespace + key),
                encodeURIComponent(value),
            ].join('=');
        }).join('&');
        if (joinedParams)
            target = target + separator + joinedParams;
        return target;
    };
    return ResumableHelpers;
}());
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ResumableHelpers);


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _resumableChunk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _resumableHelpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var _resumableEventHandler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



/**
 * A single file object that should be uploaded in multiple chunks
 */
var ResumableFile = /** @class */ (function (_super) {
    __extends(ResumableFile, _super);
    function ResumableFile(file, uniqueIdentifier, options) {
        var _this = _super.call(this) || this;
        _this._prevProgress = 0;
        _this.isPaused = false;
        _this.chunks = [];
        _this.chunkSize = 1024 * 1024; // 1 MB
        _this.forceChunkSize = false;
        _this.opts = options;
        _this.setInstanceProperties(options);
        _this.file = file;
        _this.fileName = _resumableHelpers__WEBPACK_IMPORTED_MODULE_1__.default.getFileNameFromFile(file);
        _this.size = file.size;
        _this.relativePath = /*file.relativePath ||*/ file.webkitRelativePath || _this.fileName;
        _this.uniqueIdentifier = uniqueIdentifier;
        _this._error = uniqueIdentifier !== undefined;
        // Bootstrap file
        _this.fire('chunkingStart', _this);
        _this.bootstrap();
        return _this;
    }
    /**
     * Set the options provided inside the configuration object on this instance
     */
    ResumableFile.prototype.setInstanceProperties = function (options) {
        Object.assign(this, options);
    };
    /**
     * Stop current uploads for this file
     */
    ResumableFile.prototype.abort = function () {
        var abortCount = 0;
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            if (chunk.status === "chunkUploading" /* UPLOADING */) {
                chunk.abort();
                abortCount++;
            }
        }
        if (abortCount > 0)
            this.fire('fileProgress', this);
    };
    /**
     * Cancel uploading this file and remove it from the file list
     */
    ResumableFile.prototype.cancel = function () {
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            if (chunk.status === "chunkUploading" /* UPLOADING */) {
                chunk.abort();
                this.fire('chunkCancel', chunk);
            }
        }
        // Reset this file to be void
        this.chunks = [];
        this.fire('fileCancel', this);
        this.fire('fileProgress', this);
    };
    /**
     * Retry uploading this file
     */
    ResumableFile.prototype.retry = function () {
        var _this = this;
        this.bootstrap();
        var firedRetry = false;
        this.on('chunkingComplete', function () {
            if (!firedRetry)
                _this.fire('fileRetry');
            firedRetry = true;
        });
    };
    /**
     * Prepare this file for a new upload, by dividing it into multiple chunks
     */
    ResumableFile.prototype.bootstrap = function () {
        var _this = this;
        var progressHandler = function (message) { return _this.fire('fileProgress', _this, message); };
        var retryHandler = function () { return _this.fire('fileRetry', _this); };
        var successHandler = function (message) {
            if (_this._error)
                return;
            _this.fire('chunkSuccess');
            _this.fire('fileProgress', _this, message); // it's at least progress
            if (_this.isComplete) {
                _this.fire('fileSuccess', _this, message);
            }
        };
        var errorHandler = function (message) {
            _this.fire('chunkError', message);
            _this.abort();
            _this._error = true;
            _this.chunks = [];
            _this.fire('fileError', _this, message);
        };
        this.abort();
        this._error = false;
        // Rebuild stack of chunks from file
        this.chunks = [];
        this._prevProgress = 0;
        var round = this.forceChunkSize ? Math.ceil : Math.floor;
        var maxOffset = Math.max(round(this.file.size / this.chunkSize), 1);
        for (var offset = 0; offset < maxOffset; offset++) {
            var chunk = new _resumableChunk__WEBPACK_IMPORTED_MODULE_0__.default(this, offset, this.opts);
            chunk.on('chunkProgress', progressHandler);
            chunk.on('chunkError', errorHandler);
            chunk.on('chunkSuccess', successHandler);
            chunk.on('chunkRetry', retryHandler);
            this.chunks.push(chunk);
            this.fire('chunkingProgress', this, offset / maxOffset);
        }
        this.fire('chunkingComplete', this);
    };
    /**
     * Get the progress for uploading this file based on the progress of the individual file chunks
     */
    ResumableFile.prototype.progress = function () {
        if (this._error)
            return 1;
        // Sum up progress across everything
        var ret = 0;
        var error = false;
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            if (chunk.status === "chunkError" /* ERROR */)
                error = true;
            ret += chunk.progress(true); // get chunk progress relative to entire file
        }
        ret = error ? 1 : (ret > 0.99999 ? 1 : ret);
        ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused
        this._prevProgress = ret;
        return ret;
    };
    Object.defineProperty(ResumableFile.prototype, "isUploading", {
        /**
         * Check whether at least one of this file's chunks is currently uploading
         */
        get: function () {
            return this.chunks.some(function (chunk) { return chunk.status === "chunkUploading" /* UPLOADING */; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ResumableFile.prototype, "isComplete", {
        /**
         * Check whether all of this file's chunks completed their upload requests and whether it should be
         * treated as completed.
         */
        get: function () {
            return !this.chunks.some(function (chunk) {
                return chunk.status === "chunkPending" /* PENDING */ || chunk.status === "chunkUploading" /* UPLOADING */;
            });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Initiate the upload of a new chunk for this file. This function returns whether a new upload was started or not.
     */
    ResumableFile.prototype.upload = function () {
        if (this.isPaused) {
            return false;
        }
        for (var _i = 0, _a = this.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            if (chunk.status === "chunkPending" /* PENDING */) {
                chunk.send();
                return true;
            }
        }
        return false;
    };
    /**
     * Mark a given number of chunks as already uploaded to the server.
     * @param chunkNumber The index until which all chunks should be marked as completed
     */
    ResumableFile.prototype.markChunksCompleted = function (chunkNumber) {
        if (!this.chunks || this.chunks.length <= chunkNumber) {
            return;
        }
        for (var num = 0; num < chunkNumber; num++) {
            this.chunks[num].markComplete();
        }
    };
    return ResumableFile;
}(_resumableEventHandler__WEBPACK_IMPORTED_MODULE_2__.default));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ResumableFile);


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _resumableEventHandler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};


/**
 * A file chunk that contains all the data that for a single upload request
 */
var ResumableChunk = /** @class */ (function (_super) {
    __extends(ResumableChunk, _super);
    function ResumableChunk(fileObj, offset, options) {
        var _this = _super.call(this) || this;
        _this.lastProgressCallback = new Date;
        _this.tested = false;
        _this.retries = 0;
        _this.pendingRetry = false;
        _this.isMarkedComplete = false;
        _this.loaded = 0;
        _this.xhr = null;
        // Option properties
        _this.chunkSize = 1024 * 1024; // 1 MB
        _this.forceChunkSize = false;
        _this.fileParameterName = 'file';
        _this.chunkNumberParameterName = 'resumableChunkNumber';
        _this.chunkSizeParameterName = 'resumableChunkSize';
        _this.currentChunkSizeParameterName = 'resumableCurrentChunkSize';
        _this.totalSizeParameterName = 'resumableTotalSize';
        _this.typeParameterName = 'resumableType';
        _this.identifierParameterName = 'resumableIdentifier';
        _this.fileNameParameterName = 'resumableFilename';
        _this.relativePathParameterName = 'resumableRelativePath';
        _this.totalChunksParameterName = 'resumableTotalChunks';
        _this.throttleProgressCallbacks = 0.5;
        _this.query = {};
        _this.headers = {};
        _this.method = 'multipart';
        _this.uploadMethod = 'POST';
        _this.testMethod = 'GET';
        _this.parameterNamespace = '';
        _this.testChunks = true;
        _this.maxChunkRetries = 100;
        _this.chunkRetryInterval = undefined;
        _this.permanentErrors = [400, 401, 403, 404, 409, 415, 500, 501];
        _this.withCredentials = false;
        _this.xhrTimeout = 0;
        _this.chunkFormat = 'blob';
        _this.setChunkTypeFromFile = false;
        _this.target = '/';
        _this.testTarget = '';
        _this.setInstanceProperties(options);
        _this.fileObj = fileObj;
        _this.fileObjSize = fileObj.size;
        _this.fileObjType = fileObj.file.type;
        _this.offset = offset;
        // Computed properties
        _this.startByte = _this.offset * _this.chunkSize;
        _this.endByte = Math.min(_this.fileObjSize, (_this.offset + 1) * _this.chunkSize);
        if (_this.fileObjSize - _this.endByte < _this.chunkSize && !_this.forceChunkSize) {
            // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
            _this.endByte = _this.fileObjSize;
        }
        _this.xhr = null;
        return _this;
    }
    /**
     * Set the options provided inside the configuration object on this instance
     */
    ResumableChunk.prototype.setInstanceProperties = function (options) {
        Object.assign(this, options);
    };
    /**
     * Set the header values for the current XMLHttpRequest
     */
    ResumableChunk.prototype.setCustomHeaders = function () {
        if (!this.xhr) {
            return;
        }
        var customHeaders = this.headers;
        if (customHeaders instanceof Function) {
            customHeaders = customHeaders(this.fileObj, this);
        }
        for (var header in customHeaders) {
            if (!customHeaders.hasOwnProperty(header))
                continue;
            this.xhr.setRequestHeader(header, customHeaders[header]);
        }
    };
    Object.defineProperty(ResumableChunk.prototype, "formattedQuery", {
        /**
         * Get query parameters for this chunk as an object, combined with custom parameters if provided
         */
        get: function () {
            var _a;
            var customQuery = this.query;
            if (typeof customQuery == 'function')
                customQuery = customQuery(this.fileObj, this);
            // Add extra data to identify chunk
            var extraData = (_a = {},
                // define key/value pairs for additional parameters
                _a[this.chunkNumberParameterName] = this.offset + 1,
                _a[this.chunkSizeParameterName] = this.chunkSize,
                _a[this.currentChunkSizeParameterName] = this.endByte - this.startByte,
                _a[this.totalSizeParameterName] = this.fileObjSize,
                _a[this.typeParameterName] = this.fileObjType,
                _a[this.identifierParameterName] = this.fileObj.uniqueIdentifier,
                _a[this.fileNameParameterName] = this.fileObj.fileName,
                _a[this.relativePathParameterName] = this.fileObj.relativePath,
                _a[this.totalChunksParameterName] = this.fileObj.chunks.length,
                _a);
            return __assign(__assign({}, extraData), customQuery);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ResumableChunk.prototype, "status", {
        /**
         * Determine the status for this Chunk based on different parameters of the underlying XMLHttpRequest
         */
        get: function () {
            if (this.pendingRetry) {
                // if pending retry then that's effectively the same as actively uploading,
                // there might just be a slight delay before the retry starts
                return "chunkUploading" /* UPLOADING */;
            }
            else if (this.isMarkedComplete) {
                return "chunkSuccess" /* SUCCESS */;
            }
            else if (!this.xhr) {
                return "chunkPending" /* PENDING */;
            }
            else if (this.xhr.readyState < 4) {
                // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
                return "chunkUploading" /* UPLOADING */;
            }
            else if (this.xhr.status === 200 || this.xhr.status === 201) {
                // HTTP 200, 201 (created)
                return "chunkSuccess" /* SUCCESS */;
            }
            else if (this.permanentErrors.includes(this.xhr.status) || this.retries >= this.maxChunkRetries) {
                // HTTP 400, 404, 409, 415, 500, 501 (permanent error)
                return "chunkError" /* ERROR */;
            }
            else {
                // this should never happen, but we'll reset and queue a retry
                // a likely case for this would be 503 service unavailable
                this.abort();
                return "chunkPending" /* PENDING */;
            }
        },
        enumerable: false,
        configurable: true
    });
    ;
    /**
     * Get the target url for the specified request type and the configured parameters of this chunk
     * @param requestType The type of the request, either 'test' or 'upload'
     */
    ResumableChunk.prototype.getTarget = function (requestType) {
        return _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.getTarget(requestType, this.target, this.testTarget, this.formattedQuery, this.parameterNamespace);
    };
    /**
     * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
     */
    ResumableChunk.prototype.test = function () {
        var _this = this;
        // Set up request and listen for event
        this.xhr = new XMLHttpRequest();
        var testHandler = function () {
            _this.tested = true;
            var status = _this.status;
            if (status === "chunkSuccess" /* SUCCESS */) {
                _this.fire('chunkSuccess', _this.message());
            }
            else {
                _this.send();
            }
        };
        this.xhr.addEventListener('load', testHandler, false);
        this.xhr.addEventListener('error', testHandler, false);
        this.xhr.addEventListener('timeout', testHandler, false);
        // Append the relevant chunk and send it
        this.xhr.open(this.testMethod, this.getTarget('test'));
        this.xhr.timeout = this.xhrTimeout;
        this.xhr.withCredentials = this.withCredentials;
        // Add data from header options
        this.setCustomHeaders();
        this.xhr.send(null);
    };
    /**
     * Abort and reset a request
     */
    ResumableChunk.prototype.abort = function () {
        if (this.xhr)
            this.xhr.abort();
        this.xhr = null;
    };
    /**
     *  Uploads the actual data in a POST call
     */
    ResumableChunk.prototype.send = function () {
        var _this = this;
        if (this.testChunks && !this.tested) {
            this.test();
            return;
        }
        // Set up request and listen for event
        this.xhr = new XMLHttpRequest();
        // Progress
        this.xhr.upload.addEventListener('progress', function (e) {
            if (Date.now() - _this.lastProgressCallback.getTime() > _this.throttleProgressCallbacks * 1000) {
                _this.fire('chunkProgress');
                _this.lastProgressCallback = new Date();
            }
            _this.loaded = e.loaded || 0;
        }, false);
        this.loaded = 0;
        this.pendingRetry = false;
        this.fire('chunkProgress');
        /**
         * Handles the different xhr registeredEventHandlers based on the status of this chunk
         */
        var doneHandler = function () {
            var status = _this.status;
            switch (status) {
                case "chunkSuccess" /* SUCCESS */:
                case "chunkError" /* ERROR */:
                    _this.fire(status, _this.message());
                    break;
                default:
                    _this.fire('chunkRetry', _this.message());
                    _this.abort();
                    _this.retries++;
                    var retryInterval = _this.chunkRetryInterval;
                    if (retryInterval !== undefined) {
                        _this.pendingRetry = true;
                        setTimeout(_this.send, retryInterval);
                    }
                    else {
                        _this.send();
                    }
                    break;
            }
        };
        this.xhr.addEventListener('load', doneHandler, false);
        this.xhr.addEventListener('error', doneHandler, false);
        this.xhr.addEventListener('timeout', doneHandler, false);
        // Set up the basic query data from Resumable
        var bytes = this.fileObj.file.slice(this.startByte, this.endByte, this.setChunkTypeFromFile ? this.fileObj.file.type : '');
        var data = null;
        var parameterNamespace = this.parameterNamespace;
        // Add data from the query options
        if (this.method === 'octet') {
            data = bytes;
        }
        else {
            data = new FormData();
            for (var queryKey in this.formattedQuery) {
                data.append(parameterNamespace + queryKey, this.formattedQuery[queryKey]);
            }
            switch (this.chunkFormat) {
                case 'blob':
                    data.append(parameterNamespace + this.fileParameterName, bytes, this.fileObj.fileName);
                    break;
                case 'base64':
                    var fr = new FileReader();
                    fr.onload = function () {
                        data.append(parameterNamespace + _this.fileParameterName, fr.result);
                        _this.xhr.send(data);
                    };
                    fr.readAsDataURL(bytes);
                    break;
            }
        }
        var target = this.getTarget('upload');
        this.xhr.open(this.uploadMethod, target);
        if (this.method === 'octet') {
            this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        }
        this.xhr.timeout = this.xhrTimeout;
        this.xhr.withCredentials = this.withCredentials;
        // Add data from header options
        this.setCustomHeaders();
        if (this.chunkFormat === 'blob') {
            this.xhr.send(data);
        }
    };
    /**
     * Return the response text of the underlying XMLHttpRequest if it exists
     */
    ResumableChunk.prototype.message = function () {
        return this.xhr ? this.xhr.responseText : '';
    };
    ;
    /**
     * Return the progress for the current chunk as a number between 0 and 1
     * @param relative Whether or not the progress should be calculated based on the size of the entire file
     */
    ResumableChunk.prototype.progress = function (relative) {
        if (relative === void 0) { relative = false; }
        var factor = relative ? (this.endByte - this.startByte) / this.fileObjSize : 1;
        if (this.pendingRetry)
            return 0;
        if ((!this.xhr || !this.xhr.status) && !this.isMarkedComplete)
            factor *= .95;
        switch (this.status) {
            case "chunkSuccess" /* SUCCESS */:
            case "chunkError" /* ERROR */:
                return factor;
            case "chunkPending" /* PENDING */:
                return 0;
            default:
                return this.loaded / (this.endByte - this.startByte) * factor;
        }
    };
    /**
     * Mark this chunk as completed because it was already uploaded to the server.
     */
    ResumableChunk.prototype.markComplete = function () {
        this.isMarkedComplete = true;
    };
    return ResumableChunk;
}(_resumableEventHandler__WEBPACK_IMPORTED_MODULE_1__.default));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ResumableChunk);


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * The underlying base class for ResumableJS. This class is responsible for registering and executing
 * events and listeners.
 */
var ResumableEventHandler = /** @class */ (function () {
    /**
     * Construct a new event handler instance.
     */
    function ResumableEventHandler() {
        this.registeredEventHandlers = {};
    }
    /**
     * Register a new callback for the given event.
     */
    ResumableEventHandler.prototype.on = function (event, callback) {
        event = event.toLowerCase();
        if (!this.registeredEventHandlers.hasOwnProperty(event)) {
            this.registeredEventHandlers[event] = [];
        }
        this.registeredEventHandlers[event].push(callback);
    };
    /**
     * Fire the event listeners for the given event with the given arguments as well as the wildcard event '*'
     */
    ResumableEventHandler.prototype.fire = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        event = event.toLowerCase();
        this.executeEventCallback.apply(this, __spreadArray([event], args, false));
        this.executeEventCallback.apply(this, __spreadArray(['*', event], args, false));
    };
    /**
     * Execute all callbacks for the given event with the provided arguments. This function is only used internally
     * to call all callbacks registered to a given event individually.
     */
    ResumableEventHandler.prototype.executeEventCallback = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.registeredEventHandlers.hasOwnProperty(event))
            return;
        this.registeredEventHandlers[event].forEach(function (callback) { return callback.apply(void 0, args); });
    };
    return ResumableEventHandler;
}());
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ResumableEventHandler);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Resumable": () => (/* binding */ Resumable)
/* harmony export */ });
/* harmony import */ var _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _resumableFile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _resumableEventHandler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};



/*
* MIT Licensed
* http://www.twentythree.com/
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@twentythree.com
*/
/**
 * An instance of a resumable upload handler that contains one or multiple files which should be uploaded in chunks.
 */
var Resumable = /** @class */ (function (_super) {
    __extends(Resumable, _super);
    function Resumable(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.files = [];
        _this.validators = {};
        // Configuration Options
        _this.clearInput = true;
        _this.dragOverClass = 'dragover';
        _this.fileTypes = [];
        _this.fileTypeErrorCallback = function (file) {
            alert("".concat(file.fileName || file.name, " has an unsupported file type, please upload files of type ").concat(_this.fileTypes, "."));
        };
        _this._generateUniqueIdentifier = null;
        _this.maxFileSizeErrorCallback = function (file) {
            alert(file.fileName || file.name + ' is too large, please upload files less than ' +
                _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.formatSize(_this.maxFileSize) + '.');
        };
        _this.maxFilesErrorCallback = function (files) {
            var maxFiles = _this.maxFiles;
            alert('Please upload no more than ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
        };
        _this.minFileSize = 1;
        _this.minFileSizeErrorCallback = function (file) {
            alert(file.fileName || file.name + ' is too small, please upload files larger than ' +
                _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.formatSize(_this.minFileSize) + '.');
        };
        _this.prioritizeFirstAndLastChunk = false;
        _this.fileValidationErrorCallback = function (file) { };
        _this.simultaneousUploads = 3;
        _this.setInstanceProperties(options);
        _this.opts = options;
        _this.checkSupport();
        return _this;
    }
    /**
     * Check whether the current browser supports the essential functions for the package to work.
     * The method checks if these features are supported:
     * - File object type
     * - Blob object type
     * - FileList object type
     * - slicing files
     */
    Resumable.prototype.checkSupport = function () {
        this.support =
            File !== undefined &&
                Blob !== undefined &&
                FileList !== undefined &&
                !!Blob.prototype.slice;
        if (!this.support) {
            throw new Error('Not supported by Browser');
        }
    };
    /**
     * Assign the attributes of this instance via destructuring of the options object.
     */
    Resumable.prototype.setInstanceProperties = function (options) {
        Object.assign(this, options);
        // For good behaviour we do some initial sanitizing. Remove spaces and dots and lowercase all
        this.fileTypes = this.fileTypes.map(function (type) { return type.replace(/[\s.]/g, '').toLowerCase(); });
    };
    /**
     * Transforms a single fileEntry or DirectoryEntry item into a list of File objects
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     */
    Resumable.prototype.mapItemToFile = function (item, path) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(item instanceof FileSystemFileEntry)) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve, reject) { return item.file(resolve, reject); })];
                    case 1:
                        file = _a.sent();
                        file.relativePath = path + file.name;
                        return [2 /*return*/, [file]];
                    case 2:
                        if (!(item instanceof FileSystemDirectoryEntry)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processDirectory(item, path + item.name + '/')];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        if (item instanceof File) {
                            return [2 /*return*/, [item]];
                        }
                        _a.label = 5;
                    case 5:
                        console.warn('Item mapping did not return a file object. This might be due to an unknown file type.');
                        return [2 /*return*/, []];
                }
            });
        });
    };
    /**
     * Transforms a single DataTransfer item into a File object. This may include either extracting the given file or
     * all files inside the provided directory.
     * @param item item to upload, may be file or directory entry
     * @param path current file path
     */
    Resumable.prototype.mapDragItemToFile = function (item, path) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = item.webkitGetAsEntry();
                        if (!(entry instanceof FileSystemDirectoryEntry)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processDirectory(entry, path + entry.name + '/')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        file = item.getAsFile();
                        if (file instanceof File) {
                            file.relativePath = path + file.name;
                            return [2 /*return*/, [file]];
                        }
                        console.warn('Item mapping did not return a file object. This might be due to an unknown file type.');
                        return [2 /*return*/, []];
                }
            });
        });
    };
    /**
     * Recursively traverse a directory and collect files to upload
     */
    Resumable.prototype.processDirectory = function (directory, path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var dirReader = directory.createReader();
            var allEntries = [];
            var readEntries = function () {
                dirReader.readEntries(function (entries) { return __awaiter(_this, void 0, void 0, function () {
                    var _a;
                    var _this = this;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                // Read the files batch-wise (in chrome e.g. 100 at a time)
                                if (entries.length) {
                                    allEntries = allEntries.concat(entries);
                                    return [2 /*return*/, readEntries()];
                                }
                                // After collecting all files, map all fileEntries to File objects
                                allEntries = allEntries.map(function (entry) {
                                    return _this.mapItemToFile(entry, path);
                                });
                                // Wait until all files are collected.
                                _a = resolve;
                                return [4 /*yield*/, Promise.all(allEntries)];
                            case 1:
                                // Wait until all files are collected.
                                _a.apply(void 0, [_b.sent()]);
                                return [2 /*return*/];
                        }
                    });
                }); }, reject);
            };
            readEntries();
        });
    };
    /**
     * Handle the event when a new file was provided via drag-and-drop
     */
    Resumable.prototype.onDrop = function (e) {
        return __awaiter(this, void 0, void 0, function () {
            var items, promises, files, _a, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        e.currentTarget.classList.remove(this.dragOverClass);
                        _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.stopEvent(e);
                        items = [];
                        //handle dropped things as items if we can (this lets us deal with folders nicer in some cases)
                        if (e.dataTransfer && e.dataTransfer.items) {
                            items = Array.from(e.dataTransfer.items);
                        }
                        //else handle them as files
                        else if (e.dataTransfer && e.dataTransfer.files) {
                            items = Array.from(e.dataTransfer.files);
                        }
                        if (!items.length) {
                            return [2 /*return*/]; // nothing to do
                        }
                        this.fire('fileProcessingBegin', items);
                        promises = items.map(function (item) { return _this.mapDragItemToFile(item, ''); });
                        _b = (_a = _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default).flattenDeep;
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        files = _b.apply(_a, [_c.sent()]);
                        if (files.length) {
                            // at least one file found
                            this.appendFilesFromFileList(files, e);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle the event when a drag-and-drop item leaves the area of assigned drag-and-drop area
     */
    Resumable.prototype.onDragLeave = function (e) {
        e.currentTarget.classList.remove(this.dragOverClass);
    };
    /**
     * Handle the event when a drag-and-drop item enters the area of assigned drag-and-drop area
     */
    Resumable.prototype.onDragOverEnter = function (e) {
        e.preventDefault();
        var dt = e.dataTransfer;
        if (dt.types.includes('Files')) { // only for file drop
            e.stopPropagation();
            dt.dropEffect = 'copy';
            dt.effectAllowed = 'copy';
            e.currentTarget.classList.add(this.dragOverClass);
        }
        else { // not work on IE/Edge....
            dt.dropEffect = 'none';
            dt.effectAllowed = 'none';
        }
    };
    ;
    /**
     * Validate and clean a list of files. This includes the removal of duplicates, a check whether the file type is
     * allowed and custom validation functions defined per file type.
     * @param {ExtendedFile[]} files A list of File instances that were previously extended with a uniqueIdentifier
     */
    Resumable.prototype.validateFiles = function (files) {
        return __awaiter(this, void 0, void 0, function () {
            var uniqueFiles, validationPromises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uniqueFiles = _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.uniqBy(files, function (file) { return file.uniqueIdentifier; }, function (file) { return _this.fire('fileProcessingFailed', file, 'duplicate'); });
                        validationPromises = uniqueFiles.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var fileType, fileExtension, fileTypeFound, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        // Remove files that were already added based on their unique identifiers
                                        if (this.files.some(function (addedFile) { return addedFile.uniqueIdentifier === file.uniqueIdentifier; })) {
                                            this.fire('fileProcessingFailed', file, 'duplicate');
                                            return [2 /*return*/, false];
                                        }
                                        fileType = file.type.toLowerCase();
                                        fileExtension = file.name.split('.').pop().toLowerCase();
                                        if (this.fileTypes.length > 0) {
                                            fileTypeFound = this.fileTypes.some(function (type) {
                                                // Check whether the extension inside the filename is an allowed file type
                                                return fileExtension === type ||
                                                    // If MIME type, check for wildcard or if extension matches the file's tile type
                                                    type.includes('/') && (type.includes('*') &&
                                                        fileType.substring(0, type.indexOf('*')) === type.substring(0, type.indexOf('*')) ||
                                                        fileType === type);
                                            });
                                            if (!fileTypeFound) {
                                                this.fire('fileProcessingFailed', file, 'fileType');
                                                this.fileTypeErrorCallback(file);
                                                return [2 /*return*/, false];
                                            }
                                        }
                                        // Validate the file size against minimum and maximum allowed sizes
                                        if (this.minFileSize !== undefined && file.size < this.minFileSize) {
                                            this.fire('fileProcessingFailed', file, 'minFileSize');
                                            this.minFileSizeErrorCallback(file);
                                            return [2 /*return*/, false];
                                        }
                                        if (this.maxFileSize !== undefined && file.size > this.maxFileSize) {
                                            this.fire('fileProcessingFailed', file, 'maxFileSize');
                                            this.maxFileSizeErrorCallback(file);
                                            return [2 /*return*/, false];
                                        }
                                        _a = fileExtension in this.validators;
                                        if (!_a) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.validators[fileExtension](file)];
                                    case 1:
                                        _a = !(_b.sent());
                                        _b.label = 2;
                                    case 2:
                                        // Apply a custom validator based on the file extension
                                        if (_a) {
                                            this.fire('fileProcessingFailed', file, 'validation');
                                            this.fileValidationErrorCallback(file);
                                            return [2 /*return*/, false];
                                        }
                                        return [2 /*return*/, true];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(validationPromises)];
                    case 1:
                        results = _a.sent();
                        // Only include files that passed their validation tests
                        return [2 /*return*/, files.filter(function (_v, index) { return results[index]; })];
                }
            });
        });
    };
    /**
     * Add an array of files to this instance's file list by creating new ResumableFiles. This includes a validation and
     * deduplication of the provided array.
     * @param fileList An array containing File objects
     * @param event The event with which the fileList was provided
     */
    Resumable.prototype.appendFilesFromFileList = function (fileList, event) {
        return __awaiter(this, void 0, void 0, function () {
            var filesWithUniqueIdentifiers, validatedFiles, skippedFiles, _i, validatedFiles_1, file, f;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // check for uploading too many files
                        if (this.maxFiles !== undefined && this.maxFiles < fileList.length + this.files.length) {
                            // if single-file upload, file is already added, and trying to add 1 new file, simply replace the already-added file
                            if (this.maxFiles === 1 && this.files.length === 1 && fileList.length === 1) {
                                this.removeFile(this.files[0]);
                            }
                            else {
                                this.fire('fileProcessingFailed', undefined, 'maxFiles');
                                this.maxFilesErrorCallback(fileList);
                                return [2 /*return*/, false];
                            }
                        }
                        return [4 /*yield*/, Promise.all(fileList.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = file;
                                            return [4 /*yield*/, this.generateUniqueIdentifier(file, event)];
                                        case 1:
                                            _a.uniqueIdentifier = _b.sent();
                                            return [2 /*return*/, file];
                                    }
                                });
                            }); }))];
                    case 1:
                        filesWithUniqueIdentifiers = _a.sent();
                        return [4 /*yield*/, this.validateFiles(filesWithUniqueIdentifiers)];
                    case 2:
                        validatedFiles = _a.sent();
                        skippedFiles = filesWithUniqueIdentifiers.filter(function (file) { return !validatedFiles.includes(file); });
                        for (_i = 0, validatedFiles_1 = validatedFiles; _i < validatedFiles_1.length; _i++) {
                            file = validatedFiles_1[_i];
                            f = new _resumableFile__WEBPACK_IMPORTED_MODULE_1__.default(file, file.uniqueIdentifier, this.opts);
                            f.on('chunkSuccess', function () { return _this.handleChunkSuccess(); });
                            f.on('chunkError', function () { return _this.handleChunkError(); });
                            f.on('chunkCancel', function () { return _this.handleChunkCancel(); });
                            f.on('fileProgress', function () { return _this.handleFileProgress(); });
                            f.on('fileError', function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return _this.handleFileError(args);
                            });
                            f.on('fileSuccess', function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return _this.handleFileSuccess(args);
                            });
                            f.on('fileCancel', function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                return _this.handleFileCancel(args);
                            });
                            f.on('fileRetry', function () { return _this.handleFileRetry(); });
                            this.files.push(f);
                            this.fire('fileAdded', f, event);
                        }
                        // all files processed, trigger event
                        if (!validatedFiles.length && !skippedFiles.length) {
                            // no succeeded files, just skip
                            return [2 /*return*/];
                        }
                        this.fire('filesAdded', validatedFiles, skippedFiles);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a new unique identifier for a given file either with a default helper function or with a custom
     * generator function.
     * @param file The file as an HTML 5 File object
     * @param event The event with which the file was provided originally
     */
    Resumable.prototype.generateUniqueIdentifier = function (file, event) {
        return typeof this._generateUniqueIdentifier === 'function' ?
            this._generateUniqueIdentifier(file, event) : _resumableHelpers__WEBPACK_IMPORTED_MODULE_0__.default.generateUniqueIdentifier(file);
    };
    /**
     * Queue a new chunk to be uploaded that is currently awaiting upload.
     */
    Resumable.prototype.uploadNextChunk = function () {
        // In some cases (such as videos) it's really handy to upload the first
        // and last chunk of a file quickly; this lets the server check the file's
        // metadata and determine if there's even a point in continuing.
        if (this.prioritizeFirstAndLastChunk) {
            for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
                var file = _a[_i];
                if (file.chunks.length && file.chunks[0].status === "chunkPending" /* PENDING */) {
                    file.chunks[0].send();
                    return;
                }
                if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status === "chunkPending" /* PENDING */) {
                    file.chunks[file.chunks.length - 1].send();
                    return;
                }
            }
        }
        // Now, simply look for the next best thing to upload
        for (var _b = 0, _c = this.files; _b < _c.length; _b++) {
            var file = _c[_b];
            if (file.upload())
                return;
        }
    };
    /**
     *  PUBLIC METHODS FOR RESUMABLE.JS
     *  This section only includes methods that should be callable from external packages.
     */
    /**
     * Assign a browse action to one or more DOM nodes. Pass in true to allow directories to be selected (Chrome only).
     */
    Resumable.prototype.assignBrowse = function (domNodes, isDirectory) {
        var _this = this;
        if (isDirectory === void 0) { isDirectory = false; }
        if (domNodes instanceof HTMLInputElement)
            domNodes = [domNodes];
        var _loop_1 = function (domNode) {
            var input;
            if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
                input = domNode;
            }
            else {
                input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.style.display = 'none';
                domNode.addEventListener('click', function () {
                    input.style.opacity = 0;
                    input.style.display = 'block';
                    input.focus();
                    input.click();
                    input.style.display = 'none';
                }, false);
                domNode.appendChild(input);
            }
            if (this_1.maxFiles !== 1) {
                input.setAttribute('multiple', 'multiple');
            }
            else {
                input.removeAttribute('multiple');
            }
            if (isDirectory) {
                input.setAttribute('webkitdirectory', 'webkitdirectory');
            }
            else {
                input.removeAttribute('webkitdirectory');
            }
            if (this_1.fileTypes.length >= 1) {
                input.setAttribute('accept', this_1.fileTypes.map(function (type) {
                    type = type.replace(/\s/g, '').toLowerCase();
                    if (type.match(/^[^.][^/]+$/)) {
                        type = '.' + type;
                    }
                    return type;
                }).join(','));
            }
            else {
                input.removeAttribute('accept');
            }
            // When new files are added, simply append them to the overall list
            input.addEventListener('change', function (e) {
                var eventTarget = e.target;
                _this.fire('fileProcessingBegin', eventTarget.files);
                _this.appendFilesFromFileList(Array.from(eventTarget.files), e);
                if (_this.clearInput) {
                    eventTarget.value = '';
                }
            }, false);
        };
        var this_1 = this;
        for (var _i = 0, domNodes_1 = domNodes; _i < domNodes_1.length; _i++) {
            var domNode = domNodes_1[_i];
            _loop_1(domNode);
        }
    };
    /**
     * Assign one or more DOM nodes as a drop target.
     */
    Resumable.prototype.assignDrop = function (domNodes) {
        if (domNodes instanceof HTMLElement)
            domNodes = [domNodes];
        for (var _i = 0, domNodes_2 = domNodes; _i < domNodes_2.length; _i++) {
            var domNode = domNodes_2[_i];
            domNode.addEventListener('dragover', this.onDragOverEnter.bind(this), false);
            domNode.addEventListener('dragenter', this.onDragOverEnter.bind(this), false);
            domNode.addEventListener('dragleave', this.onDragLeave.bind(this), false);
            domNode.addEventListener('drop', this.onDrop.bind(this), false);
        }
    };
    /**
     * Remove one or more DOM nodes as a drop target.
     */
    Resumable.prototype.unAssignDrop = function (domNodes) {
        if (domNodes instanceof HTMLElement)
            domNodes = [domNodes];
        for (var _i = 0, domNodes_3 = domNodes; _i < domNodes_3.length; _i++) {
            var domNode = domNodes_3[_i];
            domNode.removeEventListener('dragover', this.onDragOverEnter.bind(this));
            domNode.removeEventListener('dragenter', this.onDragOverEnter.bind(this));
            domNode.removeEventListener('dragleave', this.onDragLeave.bind(this));
            domNode.removeEventListener('drop', this.onDrop.bind(this));
        }
    };
    Object.defineProperty(Resumable.prototype, "isUploading", {
        /**
         * Check whether any files are currently uploading
         */
        get: function () {
            return this.files.some(function (file) { return file.isUploading; });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Start or resume the upload of the provided files by initiating the upload of the first chunk
     */
    Resumable.prototype.upload = function () {
        // Make sure we don't start too many uploads at once
        if (this.isUploading)
            return;
        // Kick off the queue
        this.fire('uploadStart');
        for (var num = 1; num <= this.simultaneousUploads; num++) {
            this.uploadNextChunk();
        }
    };
    /**
     * Pause the upload
     */
    Resumable.prototype.pause = function () {
        // Resume all chunks currently being uploaded
        for (var _i = 0, _a = this.files; _i < _a.length; _i++) {
            var file = _a[_i];
            file.abort();
        }
        this.fire('pause');
    };
    ;
    /**
     * Cancel uploading and reset all files to their initial states
     */
    Resumable.prototype.cancel = function () {
        this.fire('beforeCancel');
        for (var i = this.files.length - 1; i >= 0; i--) {
            this.files[i].cancel();
        }
        this.fire('cancel');
    };
    ;
    /**
     * Return the progress of the current upload as a float between 0 and 1
     */
    Resumable.prototype.progress = function () {
        var totalDone = this.files.reduce(function (accumulator, file) { return accumulator + file.size * file.progress(); }, 0);
        var totalSize = this.getSize();
        return totalSize > 0 ? totalDone / totalSize : 0;
    };
    ;
    /**
     * Add a HTML5 File object to the list of files.
     */
    Resumable.prototype.addFile = function (file, event) {
        this.appendFilesFromFileList([file], event);
    };
    ;
    /**
     * Add a list of HTML5 File objects to the list of files.
     */
    Resumable.prototype.addFiles = function (files, event) {
        this.appendFilesFromFileList(files, event);
    };
    ;
    /**
     * Add a validator function for the given file type. This can e.g. be used to read the file and validate
     * checksums based on certain properties.
     * @param fileType The file extension for the given validator
     * @param validator A callback function that should be called when validating files with the given type
     */
    Resumable.prototype.addFileValidator = function (fileType, validator) {
        if (fileType in this.validators) {
            console.warn("Overwriting validator for file type: ".concat(fileType));
        }
        this.validators[fileType] = validator;
    };
    /**
     * Cancel the upload of a specific ResumableFile object and remove it from the file list.
     */
    Resumable.prototype.removeFile = function (file) {
        for (var i = this.files.length - 1; i >= 0; i--) {
            if (this.files[i] === file) {
                this.files.splice(i, 1);
                break;
            }
        }
    };
    ;
    /**
     * Retrieve a ResumableFile object from the file list by its unique identifier.
     */
    Resumable.prototype.getFromUniqueIdentifier = function (uniqueIdentifier) {
        return this.files.find(function (file) { return file.uniqueIdentifier === uniqueIdentifier; });
    };
    ;
    /**
     * Get the combined size of all files for the upload
     */
    Resumable.prototype.getSize = function () {
        return this.files.reduce(function (accumulator, file) { return accumulator + file.size; }, 0);
    };
    /**
     * Call the event handler when a file is dropped on the drag-and-drop area
     */
    Resumable.prototype.handleDropEvent = function (e) {
        this.onDrop(e);
    };
    /**
     * Call the event handler when the provided input element changes (i.e. receives one or multiple files.
     */
    Resumable.prototype.handleChangeEvent = function (e) {
        this.appendFilesFromFileList(Array.from(e.target.files), e);
        e.target.value = '';
    };
    /**
     * Check whether the upload is completed, i.e. if all files were uploaded successfully.
     */
    Resumable.prototype.checkUploadComplete = function () {
        var uploadCompleted = this.files.every(function (file) { return file.isComplete; });
        if (uploadCompleted) {
            // All chunks have been uploaded, complete
            this.fire('complete');
        }
    };
    /**
     * Event Handlers: This section should only include methods that are used to
     * handle events coming from the files or chunks.
     */
    /**
     * The event handler when a chunk was uploaded successfully
     */
    Resumable.prototype.handleChunkSuccess = function () {
        this.uploadNextChunk();
    };
    /**
     * The event handler when a chunk was uploaded successfully
     */
    Resumable.prototype.handleChunkError = function () {
        this.uploadNextChunk();
    };
    /**
     * The event handler when an error occurred during the upload of a chunk
     */
    Resumable.prototype.handleChunkCancel = function () {
        this.uploadNextChunk();
    };
    /**
     * The event handler when an error occurred during the upload of a file
     */
    Resumable.prototype.handleFileError = function (args) {
        this.fire('error', args[1], args[0]);
    };
    /**
     * The event handler when all chunks from a file were uploaded successfully
     */
    Resumable.prototype.handleFileSuccess = function (args) {
        this.fire.apply(this, __spreadArray(['fileSuccess'], args, false));
        this.checkUploadComplete();
    };
    /**
     * The event handler when a file progress event was received
     */
    Resumable.prototype.handleFileProgress = function () {
        this.fire('progress');
    };
    /**
     * The event handler when the upload of a file was canceled
     */
    Resumable.prototype.handleFileCancel = function (args) {
        this.removeFile(args[0]);
    };
    /**
     * The event handler, when the retry of a file was initiated
     */
    Resumable.prototype.handleFileRetry = function () {
        this.upload();
    };
    return Resumable;
}(_resumableEventHandler__WEBPACK_IMPORTED_MODULE_2__.default));


})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=main.js.map