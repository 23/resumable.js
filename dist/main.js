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
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
class ResumableHelpers {
    /**
     * Stop the propagation and default behavior of the given event `e`.
     */
    static stopEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    /**
     *
     * @param file The file whose filename should be retrieved
     */
    static getFileNameFromFile(file) {
        return /*file.fileName ||*/ file.name;
    }
    /**
     * Generate a unique identifier for the given file based on its size, filename and relative path.
     * @param {File} file The file for which the identifier should be generated
     * @returns {string} The unique identifier for the given file object
     */
    static generateUniqueIdentifier(file) {
        var relativePath = file.webkitRelativePath || /*file.relativePath ||*/ this.getFileNameFromFile(file);
        var size = file.size;
        return (size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
    }
    /**
     * Flatten the given array and all contained subarrays.
     * Credit: {@link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_flattendeep}
     */
    static flattenDeep(array) {
        return Array.isArray(array)
            ? array.reduce((a, b) => a.concat(this.flattenDeep(b)), [])
            : [array];
    }
    /**
     * Filter the given array based on the predicate inside `callback`
     * and executes `errorCallback` for duplicate elements.
     */
    static uniqBy(array, callback, errorCallback) {
        let seen = new Set();
        return array.filter((item) => {
            let k = callback(item);
            if (seen.has(k)) {
                errorCallback(item);
                return false;
            }
            else {
                seen.add(k);
                return true;
            }
        });
    }
    /**
     * Format the size given in Bytes in a human readable format.
     */
    static formatSize(size) {
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
    }
    /**
     * Get the target url for the specified request type and params
     */
    static getTarget(requestType, sendTarget, testTarget, params, parameterNamespace = '') {
        let target = sendTarget;
        if (requestType === 'test' && testTarget) {
            target = testTarget === '/' ? sendTarget : testTarget;
        }
        let separator = target.indexOf('?') < 0 ? '?' : '&';
        let joinedParams = Object.entries(params).map(([key, value]) => [
            encodeURIComponent(parameterNamespace + key),
            encodeURIComponent(value),
        ].join('=')).join('&');
        if (joinedParams)
            target = target + separator + joinedParams;
        return target;
    }
}
exports.default = ResumableHelpers;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
// INTERNAL OBJECT TYPES
const resumableChunk_1 = __webpack_require__(3);
const resumableHelpers_1 = __webpack_require__(1);
const resumableEventHandler_1 = __webpack_require__(4);
class ResumableFile extends resumableEventHandler_1.default {
    constructor(file, uniqueIdentifier, options) {
        super();
        this._prevProgress = 0;
        this.isPaused = false;
        this.chunks = [];
        this.chunkSize = 1024 * 1024; // 1 MB
        this.forceChunkSize = false;
        this.opts = options;
        this.setInstanceProperties(options);
        this.file = file;
        this.fileName = resumableHelpers_1.default.getFileNameFromFile(file);
        this.size = file.size;
        this.relativePath = /*file.relativePath ||*/ file.webkitRelativePath || this.fileName;
        this.uniqueIdentifier = uniqueIdentifier;
        this._error = uniqueIdentifier !== undefined;
        // Bootstrap file
        this.fire('chunkingStart', this);
        this.bootstrap();
    }
    get pause() {
        return this.isPaused;
    }
    set pause(pause) {
        if (pause === undefined) {
            this.isPaused = !this.isPaused;
        }
        else {
            this.isPaused = pause;
        }
    }
    setInstanceProperties(options) {
        // Options
        ({
            chunkSize: this.chunkSize,
            forceChunkSize: this.forceChunkSize,
        } = options);
    }
    /**
     * Stop current uploads
     */
    abort() {
        let abortCount = 0;
        for (const chunk of this.chunks) {
            if (chunk.status === 'chunkUploading') {
                chunk.abort();
                abortCount++;
            }
        }
        if (abortCount > 0)
            this.fire('fileProgress', this);
    }
    /**
     * Cancel uploading this file and remove it from the file list
     */
    cancel() {
        for (const chunk of this.chunks) {
            if (chunk.status === 'chunkUploading') {
                chunk.abort();
                this.fire('chunkCancel', chunk);
            }
        }
        // Reset this file to be void
        this.chunks = [];
        this.fire('fileCancel', this);
        this.fire('fileProgress', this);
    }
    retry() {
        this.bootstrap();
        let firedRetry = false;
        this.on('chunkingComplete', () => {
            if (!firedRetry)
                this.fire('fileRetry');
            firedRetry = true;
        });
    }
    bootstrap() {
        const progressHandler = (message) => this.fire('fileProgress', this, message);
        const retryHandler = () => this.fire('fileRetry', this);
        const successHandler = (message) => {
            if (this._error)
                return;
            this.fire('chunkSuccess');
            this.fire('fileProgress', this, message); // it's at least progress
            if (this.isComplete()) {
                this.fire('fileSuccess', this, message);
            }
        };
        const errorHandler = (message) => {
            this.fire('chunkError', message);
            this.abort();
            this._error = true;
            this.chunks = [];
            this.fire('fileError', this, message);
        };
        this.abort();
        this._error = false;
        // Rebuild stack of chunks from file
        this.chunks = [];
        this._prevProgress = 0;
        const round = this.forceChunkSize ? Math.ceil : Math.floor;
        const maxOffset = Math.max(round(this.file.size / this.chunkSize), 1);
        for (var offset = 0; offset < maxOffset; offset++) {
            const chunk = new resumableChunk_1.default(this, offset, this.opts);
            chunk.on('chunkProgress', progressHandler);
            chunk.on('chunkError', errorHandler);
            chunk.on('chunkSuccess', successHandler);
            chunk.on('chunkRetry', retryHandler);
            this.chunks.push(chunk);
            this.fire('chunkingProgress', this, offset / maxOffset);
        }
        this.fire('chunkingComplete', this);
    }
    progress() {
        if (this._error)
            return 1;
        // Sum up progress across everything
        var ret = 0;
        var error = false;
        for (const chunk of this.chunks) {
            if (chunk.status === 'chunkError')
                error = true;
            ret += chunk.progress(true); // get chunk progress relative to entire file
        }
        ret = error ? 1 : (ret > 0.99999 ? 1 : ret);
        ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused
        this._prevProgress = ret;
        return ret;
    }
    isUploading() {
        return this.chunks.some((chunk) => chunk.status === 'chunkUploading');
    }
    isComplete() {
        return !this.chunks.some((chunk) => chunk.status === 'chunkPending' || chunk.status === 'chunkUploading');
    }
    upload() {
        if (this.pause) {
            return false;
        }
        for (const chunk of this.chunks) {
            if (chunk.status === 'chunkPending') {
                chunk.send();
                return true;
            }
        }
        return false;
    }
    markChunksCompleted(chunkNumber) {
        if (!this.chunks || this.chunks.length <= chunkNumber) {
            return;
        }
        for (var num = 0; num < chunkNumber; num++) {
            this.chunks[num].markComplete();
        }
    }
}
exports.default = ResumableFile;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const resumableHelpers_1 = __webpack_require__(1);
const resumableEventHandler_1 = __webpack_require__(4);
class ResumableChunk extends resumableEventHandler_1.default {
    constructor(fileObj, offset, options) {
        super();
        this.lastProgressCallback = new Date;
        this.tested = false;
        this.retries = 0;
        this.pendingRetry = false;
        this.isMarkedComplete = false;
        this.loaded = 0;
        this.xhr = null;
        // Option properties
        this.chunkSize = 1024 * 1024; // 1 MB
        this.forceChunkSize = false;
        this.fileParameterName = 'file';
        this.chunkNumberParameterName = 'resumableChunkNumber';
        this.chunkSizeParameterName = 'resumableChunkSize';
        this.currentChunkSizeParameterName = 'resumableCurrentChunkSize';
        this.totalSizeParameterName = 'resumableTotalSize';
        this.typeParameterName = 'resumableType';
        this.identifierParameterName = 'resumableIdentifier';
        this.fileNameParameterName = 'resumableFilename';
        this.relativePathParameterName = 'resumableRelativePath';
        this.totalChunksParameterName = 'resumableTotalChunks';
        this.throttleProgressCallbacks = 0.5;
        this.query = {};
        this.headers = {};
        this.method = 'multipart';
        this.uploadMethod = 'POST';
        this.testMethod = 'GET';
        this.parameterNamespace = '';
        this.testChunks = true;
        this.maxChunkRetries = 100;
        this.chunkRetryInterval = undefined;
        this.permanentErrors = [400, 401, 403, 404, 409, 415, 500, 501];
        this.withCredentials = false;
        this.xhrTimeout = 0;
        this.chunkFormat = 'blob';
        this.setChunkTypeFromFile = false;
        this.target = '/';
        this.testTarget = '';
        this.setInstanceProperties(options);
        this.fileObj = fileObj;
        this.fileObjSize = fileObj.size;
        this.fileObjType = fileObj.file.type;
        this.offset = offset;
        // Computed properties
        this.startByte = this.offset * this.chunkSize;
        this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * this.chunkSize);
        if (this.fileObjSize - this.endByte < this.chunkSize && !this.forceChunkSize) {
            // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
            this.endByte = this.fileObjSize;
        }
        this.xhr = null;
    }
    setInstanceProperties(options) {
        // Options
        Object.apply(this, options);
        ({
            chunkSize: this.chunkSize,
            forceChunkSize: this.forceChunkSize,
            fileParameterName: this.fileParameterName,
            chunkNumberParameterName: this.chunkNumberParameterName,
            chunkSizeParameterName: this.chunkSizeParameterName,
            currentChunkSizeParameterName: this.currentChunkSizeParameterName,
            totalSizeParameterName: this.totalSizeParameterName,
            typeParameterName: this.typeParameterName,
            identifierParameterName: this.identifierParameterName,
            fileNameParameterName: this.fileNameParameterName,
            relativePathParameterName: this.relativePathParameterName,
            totalChunksParameterName: this.totalChunksParameterName,
            throttleProgressCallbacks: this.throttleProgressCallbacks,
            query: this.query,
            headers: this.headers,
            method: this.method,
            uploadMethod: this.uploadMethod,
            testMethod: this.testMethod,
            parameterNamespace: this.parameterNamespace,
            testChunks: this.testChunks,
            maxChunkRetries: this.maxChunkRetries,
            chunkRetryInterval: this.chunkRetryInterval,
            permanentErrors: this.permanentErrors,
            withCredentials: this.withCredentials,
            xhrTimeout: this.xhrTimeout,
            chunkFormat: this.chunkFormat,
            setChunkTypeFromFile: this.setChunkTypeFromFile,
            target: this.target,
            testTarget: this.testTarget,
        } = options);
    }
    setCustomHeaders() {
        if (!this.xhr) {
            return;
        }
        let customHeaders = this.headers;
        if (customHeaders instanceof Function) {
            customHeaders = customHeaders(this.fileObj, this);
        }
        for (const header in customHeaders) {
            if (!customHeaders.hasOwnProperty(header))
                continue;
            this.xhr.setRequestHeader(header, customHeaders[header]);
        }
    }
    get formattedQuery() {
        var customQuery = this.query;
        if (typeof customQuery == 'function')
            customQuery = customQuery(this.fileObj, this);
        // Add extra data to identify chunk
        const extraData = {
            // define key/value pairs for additional parameters
            [this.chunkNumberParameterName]: this.offset + 1,
            [this.chunkSizeParameterName]: this.chunkSize,
            [this.currentChunkSizeParameterName]: this.endByte - this.startByte,
            [this.totalSizeParameterName]: this.fileObjSize,
            [this.typeParameterName]: this.fileObjType,
            [this.identifierParameterName]: this.fileObj.uniqueIdentifier,
            [this.fileNameParameterName]: this.fileObj.fileName,
            [this.relativePathParameterName]: this.fileObj.relativePath,
            [this.totalChunksParameterName]: this.fileObj.chunks.length,
        };
        return { ...extraData, ...customQuery };
    }
    get status() {
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
    }
    ;
    getTarget(requestType) {
        return resumableHelpers_1.default.getTarget(requestType, this.target, this.testTarget, this.formattedQuery, this.parameterNamespace);
    }
    /**
     * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
     */
    test() {
        // Set up request and listen for event
        this.xhr = new XMLHttpRequest();
        var testHandler = () => {
            this.tested = true;
            var status = this.status;
            if (status === 'chunkSuccess') {
                this.fire('chunkSuccess', this.message());
            }
            else {
                this.send();
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
    }
    /**
     * Abort and reset a request
     */
    abort() {
        if (this.xhr)
            this.xhr.abort();
        this.xhr = null;
    }
    /**
     *  Uploads the actual data in a POST call
     */
    send() {
        if (this.testChunks && !this.tested) {
            this.test();
            return;
        }
        // Set up request and listen for event
        this.xhr = new XMLHttpRequest();
        // Progress
        this.xhr.upload.addEventListener('progress', (e) => {
            if (Date.now() - this.lastProgressCallback.getTime() > this.throttleProgressCallbacks * 1000) {
                this.fire('chunkProgress');
                this.lastProgressCallback = (new Date);
            }
            this.loaded = e.loaded || 0;
        }, false);
        this.loaded = 0;
        this.pendingRetry = false;
        this.fire('chunkProgress');
        /**
         * Handles the different xhr registeredEventHandlers based on the status of this chunk
         */
        let doneHandler = () => {
            var status = this.status;
            switch (status) {
                case 'chunkSuccess':
                case 'chunkError':
                    this.fire(status, this.message());
                    break;
                default:
                    this.fire('chunkRetry', this.message());
                    this.abort();
                    this.retries++;
                    let retryInterval = this.chunkRetryInterval;
                    if (retryInterval !== undefined) {
                        this.pendingRetry = true;
                        setTimeout(this.send, retryInterval);
                    }
                    else {
                        this.send();
                    }
                    break;
            }
        };
        this.xhr.addEventListener('load', doneHandler, false);
        this.xhr.addEventListener('error', doneHandler, false);
        this.xhr.addEventListener('timeout', doneHandler, false);
        // Set up the basic query data from Resumable
        let bytes = this.fileObj.file.slice(this.startByte, this.endByte, this.setChunkTypeFromFile ? this.fileObj.file.type : '');
        let data = null;
        let parameterNamespace = this.parameterNamespace;
        // Add data from the query options
        if (this.method === 'octet') {
            data = bytes;
        }
        else {
            data = new FormData();
            for (const queryKey in this.formattedQuery) {
                data.append(parameterNamespace + queryKey, this.formattedQuery[queryKey]);
            }
            switch (this.chunkFormat) {
                case 'blob':
                    data.append(parameterNamespace + this.fileParameterName, bytes, this.fileObj.fileName);
                    break;
                case 'base64':
                    var fr = new FileReader();
                    fr.onload = (e) => {
                        data.append(parameterNamespace + this.fileParameterName, fr.result);
                        this.xhr.send(data);
                    };
                    fr.readAsDataURL(bytes);
                    break;
            }
        }
        let target = this.getTarget('upload');
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
    }
    message() {
        return this.xhr ? this.xhr.responseText : '';
    }
    ;
    progress(relative = false) {
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
    }
    markComplete() {
        this.isMarkedComplete = true;
    }
}
exports.default = ResumableChunk;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class ResumableEventHandler {
    /**
     * Construct a new event handler instance.
     */
    constructor() {
        this.registeredEventHandlers = {};
    }
    /**
     * Register a new callback for the given event.
     * @param event
     * @param callback
     */
    on(event, callback) {
        event = event.toLowerCase();
        if (!this.registeredEventHandlers.hasOwnProperty(event)) {
            this.registeredEventHandlers[event] = [];
        }
        this.registeredEventHandlers[event].push(callback);
    }
    /**
     * Fire the event listeners for the given event with the given arguments.
     * @param event
     * @param args
     */
    fire(event, ...args) {
        // Find event listeners, and support wildcard-event `*` to catch all
        event = event.toLowerCase();
        this.executeEventCallback(event, ...args);
        this.executeEventCallback('*', event, ...args);
    }
    /**
     * Execute all callbacks for the given event with the provided arguments. This function is only used internally
     * to call the callbacks individually.
     * @param event
     * @param args
     * @private
     */
    executeEventCallback(event, ...args) {
        if (!this.registeredEventHandlers.hasOwnProperty(event))
            return;
        this.registeredEventHandlers[event].forEach((callback) => callback(...args));
    }
}
exports.default = ResumableEventHandler;


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
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Resumable = void 0;
const resumableHelpers_1 = __webpack_require__(1);
const resumableFile_1 = __webpack_require__(2);
const resumableEventHandler_1 = __webpack_require__(4);
/*
* MIT Licensed
* http://www.23developer.com/opensource
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@23company.com
*/
class Resumable extends resumableEventHandler_1.default {
    constructor(options) {
        super();
        this.files = [];
        this.validators = {};
        // Configuration Options
        this.clearInput = true;
        this.dragOverClass = 'dragover';
        this.fileTypes = [];
        this.fileTypeErrorCallback = (file) => {
            alert(`${file.fileName || file.name} has an unsupported file type, please upload files of type ${this.fileTypes}.`);
        };
        this._generateUniqueIdentifier = null;
        this.maxFileSizeErrorCallback = (file) => {
            alert(file.fileName || file.name + ' is too large, please upload files less than ' +
                resumableHelpers_1.default.formatSize(this.maxFileSize) + '.');
        };
        this.maxFilesErrorCallback = (files) => {
            var maxFiles = this.maxFiles;
            alert('Please upload no more than ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
        };
        this.minFileSize = 1;
        this.minFileSizeErrorCallback = (file) => {
            alert(file.fileName || file.name + ' is too small, please upload files larger than ' +
                resumableHelpers_1.default.formatSize(this.minFileSize) + '.');
        };
        this.prioritizeFirstAndLastChunk = false;
        this.fileValidationErrorCallback = (file) => { };
        this.simultaneousUploads = 3;
        this.setInstanceProperties(options);
        this.opts = options;
        this.checkSupport();
    }
    get version() {
        return 1.0;
    }
    checkSupport() {
        // SUPPORTED BY BROWSER?
        // Check if these features are supported by the browser:
        // - File object type
        // - Blob object type
        // - FileList object type
        // - slicing files
        this.support =
            File !== undefined &&
                Blob !== undefined &&
                FileList !== undefined &&
                !!Blob.prototype.slice;
        if (!this.support) {
            throw new Error('Not supported by Browser');
        }
    }
    /**
     * Assign the attributes of this instance via destructuring of the options object.
     */
    setInstanceProperties(options) {
        ({
            clearInput: this.clearInput,
            dragOverClass: this.dragOverClass,
            fileTypes: this.fileTypes,
            fileTypeErrorCallback: this.fileTypeErrorCallback,
            generateUniqueIdentifier: this._generateUniqueIdentifier,
            maxFileSize: this.maxFileSize,
            maxFileSizeErrorCallback: this.maxFileSizeErrorCallback,
            maxFiles: this.maxFiles,
            maxFilesErrorCallback: this.maxFilesErrorCallback,
            minFileSize: this.minFileSize,
            minFileSizeErrorCallback: this.minFileSizeErrorCallback,
            prioritizeFirstAndLastChunk: this.prioritizeFirstAndLastChunk,
            fileValidationErrorCallback: this.fileValidationErrorCallback,
            simultaneousUploads: this.simultaneousUploads,
        } = options);
        // For good behaviour we do some initial sanitizing. Remove spaces and dots and lowercase all
        this.fileTypes = this.fileTypes.map((type) => type.replace(/[\s.]/g, '').toLowerCase());
    }
    /**
     * Transforms a single fileEntry item into a File Object
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     */
    async mapItemToFile(item, path) {
        if (item instanceof FileSystemFileEntry) {
            // file entry provided
            const file = await new Promise((resolve, reject) => item.file(resolve, reject));
            file.relativePath = path + file.name;
            return [file];
        }
        else if (item instanceof FileSystemDirectoryEntry) {
            return await this.processDirectory(item, path + item.name + '/');
        }
        else if (item instanceof File) {
            return [item];
        }
        console.warn('Item mapping did not return a file object. This might be due to an unknown file type.');
        return [];
    }
    async mapDragItemToFile(item, path) {
        let entry = item.webkitGetAsEntry();
        if (entry instanceof FileSystemDirectoryEntry) {
            return await this.processDirectory(entry, path + entry.name + '/');
        }
        let file = item.getAsFile();
        if (file instanceof File) {
            file.relativePath = path + file.name;
            return [file];
        }
        console.warn('Item mapping did not return a file object. This might be due to an unknown file type.');
        return [];
    }
    /**
     * recursively traverse directory and collect files to upload
     * @param  {Object}   directory directory to process
     * @param  {string}   path      current path
     */
    processDirectory(directory, path) {
        return new Promise((resolve, reject) => {
            const dirReader = directory.createReader();
            let allEntries = [];
            const readEntries = () => {
                dirReader.readEntries(async (entries) => {
                    // Read the files batch-wise (in chrome e.g. 100 at a time)
                    if (entries.length) {
                        allEntries = allEntries.concat(entries);
                        return readEntries();
                    }
                    // After collecting all files, map all fileEntries to File objects
                    allEntries = allEntries.map((entry) => {
                        return this.mapItemToFile(entry, path);
                    });
                    // Wait until all files are collected.
                    resolve(await Promise.all(allEntries));
                }, reject);
            };
            readEntries();
        });
    }
    async onDrop(e) {
        e.currentTarget.classList.remove(this.dragOverClass);
        resumableHelpers_1.default.stopEvent(e);
        let items = [];
        //handle dropped things as items if we can (this lets us deal with folders nicer in some cases)
        if (e.dataTransfer && e.dataTransfer.items) {
            items = Array.from(e.dataTransfer.items);
        }
        //else handle them as files
        else if (e.dataTransfer && e.dataTransfer.files) {
            items = Array.from(e.dataTransfer.files);
        }
        if (!items.length) {
            return; // nothing to do
        }
        this.fire('fileProcessingBegin', items);
        let promises = items.map((item) => this.mapDragItemToFile(item, ''));
        let files = resumableHelpers_1.default.flattenDeep(await Promise.all(promises));
        if (files.length) {
            // at least one file found
            this.appendFilesFromFileList(files, e);
        }
    }
    onDragLeave(e) {
        e.currentTarget.classList.remove(this.dragOverClass);
    }
    onDragOverEnter(e) {
        e.preventDefault();
        let dt = e.dataTransfer;
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
    }
    ;
    /**
     * Validate and clean a list of files. This includes the removal of duplicates, a check whether the file type is
     * allowed and custom validation functions defined per file type.
     * @param {File[]} files
     */
    async validateFiles(files) {
        // Remove files that are duplicated in the original array, based on their unique identifiers
        let uniqueFiles = resumableHelpers_1.default.uniqBy(files, (file) => file.uniqueIdentifier, (file) => this.fire('fileProcessingFailed', file, 'duplicate'));
        let validationPromises = uniqueFiles.map(async (file) => {
            // Remove files that were already added based on their unique identifiers
            if (this.files.some((addedFile) => addedFile.uniqueIdentifier === file.uniqueIdentifier)) {
                this.fire('fileProcessingFailed', file, 'duplicate');
                return false;
            }
            let fileType = file.type.toLowerCase(); // e.g video/mp4
            let fileExtension = file.name.split('.').pop().toLowerCase();
            if (this.fileTypes.length > 0) {
                const fileTypeFound = this.fileTypes.some((type) => {
                    // Check whether the extension inside the filename is an allowed file type
                    return fileExtension === type ||
                        // If MIME type, check for wildcard or if extension matches the file's tile type
                        type.includes('/') && (type.includes('*') &&
                            fileType.substr(0, type.indexOf('*')) === type.substr(0, type.indexOf('*')) ||
                            fileType === type);
                });
                if (!fileTypeFound) {
                    this.fire('fileProcessingFailed', file, 'fileType');
                    this.fileTypeErrorCallback(file);
                    return false;
                }
            }
            // Validate the file size against minimum and maximum allowed sizes
            if (this.minFileSize !== undefined && file.size < this.minFileSize) {
                this.fire('fileProcessingFailed', file, 'minFileSize');
                this.minFileSizeErrorCallback(file);
                return false;
            }
            if (this.maxFileSize !== undefined && file.size > this.maxFileSize) {
                this.fire('fileProcessingFailed', file, 'maxFileSize');
                this.maxFileSizeErrorCallback(file);
                return false;
            }
            // Apply a custom validator based on the file extension
            if (fileExtension in this.validators && !await this.validators[fileExtension](file)) {
                this.fire('fileProcessingFailed', file, 'validation');
                this.fileValidationErrorCallback(file);
                return false;
            }
            return true;
        });
        const results = await Promise.all(validationPromises);
        // Only include files that passed their validation tests
        return files.filter((_v, index) => results[index]);
    }
    async appendFilesFromFileList(fileListObject, event) {
        const fileList = Array.from(fileListObject);
        // check for uploading too many files
        if (this.maxFiles !== undefined && this.maxFiles < fileList.length + this.files.length) {
            // if single-file upload, file is already added, and trying to add 1 new file, simply replace the already-added file
            if (this.maxFiles === 1 && this.files.length === 1 && fileList.length === 1) {
                this.removeFile(this.files[0]);
            }
            else {
                this.fire('fileProcessingFailed', undefined, 'maxFiles');
                this.maxFilesErrorCallback(fileList);
                return false;
            }
        }
        // Add the unique identifier for every new file.
        // Since this might return a promise, we have to wait until it completed.
        const filesWithUniqueIdentifiers = await Promise.all(fileList.map(async (file) => {
            file.uniqueIdentifier = await this.generateUniqueIdentifier(file, event);
            return file;
        }));
        // Validate the files and remove duplicates
        const validatedFiles = await this.validateFiles(filesWithUniqueIdentifiers);
        let skippedFiles = filesWithUniqueIdentifiers.filter((file) => !validatedFiles.includes(file));
        for (const file of validatedFiles) {
            let f = new resumableFile_1.default(file, file.uniqueIdentifier, this.opts);
            f.on('chunkSuccess', () => this.handleChunkSuccess());
            f.on('chunkError', () => this.handleChunkError());
            f.on('chunkCancel', () => this.handleChunkCancel());
            f.on('fileProgress', () => this.handleFileProgress());
            f.on('fileError', (...args) => this.handleFileError(args));
            f.on('fileSuccess', (...args) => this.handleFileSuccess(args));
            f.on('fileCancel', (...args) => this.handleFileCancel(args));
            f.on('fileRetry', () => this.handleFileRetry());
            this.files.push(f);
            this.fire('fileAdded', f, event);
        }
        // all files processed, trigger event
        if (!validatedFiles.length && !skippedFiles.length) {
            // no succeeded files, just skip
            return;
        }
        this.fire('filesAdded', validatedFiles, skippedFiles);
    }
    // QUEUE
    uploadNextChunk() {
        // In some cases (such as videos) it's really handy to upload the first
        // and last chunk of a file quickly; this lets the server check the file's
        // metadata and determine if there's even a point in continuing.
        if (this.prioritizeFirstAndLastChunk) {
            for (const file of this.files) {
                if (file.chunks.length && file.chunks[0].status === 'chunkPending') {
                    file.chunks[0].send();
                    return;
                }
                if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status === 'chunkPending') {
                    file.chunks[file.chunks.length - 1].send();
                    return;
                }
            }
        }
        // Now, simply look for the next, best thing to upload
        for (const file of this.files) {
            if (file.upload())
                return;
        }
    }
    // PUBLIC METHODS FOR RESUMABLE.JS
    assignBrowse(domNodes, isDirectory = false) {
        if (domNodes.length === undefined)
            domNodes = [domNodes];
        for (const domNode of domNodes) {
            let input;
            if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
                input = domNode;
            }
            else {
                input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.style.display = 'none';
                domNode.addEventListener('click', () => {
                    input.style.opacity = 0;
                    input.style.display = 'block';
                    input.focus();
                    input.click();
                    input.style.display = 'none';
                }, false);
                domNode.appendChild(input);
            }
            if (this.maxFiles !== 1) {
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
            if (this.fileTypes.length >= 1) {
                input.setAttribute('accept', this.fileTypes.map((type) => {
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
            input.addEventListener('change', (e) => {
                const eventTarget = e.target;
                this.fire('fileProcessingBegin', eventTarget.files);
                this.appendFilesFromFileList(Array.from(eventTarget.files), e);
                if (this.clearInput) {
                    eventTarget.value = '';
                }
            }, false);
        }
    }
    assignDrop(domNodes) {
        if (domNodes instanceof HTMLElement)
            domNodes = [domNodes];
        for (const domNode of domNodes) {
            domNode.addEventListener('dragover', this.onDragOverEnter.bind(this), false);
            domNode.addEventListener('dragenter', this.onDragOverEnter.bind(this), false);
            domNode.addEventListener('dragleave', this.onDragLeave.bind(this), false);
            domNode.addEventListener('drop', this.onDrop.bind(this), false);
        }
    }
    unAssignDrop(domNodes) {
        if (domNodes instanceof HTMLElement)
            domNodes = [domNodes];
        for (const domNode of domNodes) {
            domNode.removeEventListener('dragover', this.onDragOverEnter.bind(this));
            domNode.removeEventListener('dragenter', this.onDragOverEnter.bind(this));
            domNode.removeEventListener('dragleave', this.onDragLeave.bind(this));
            domNode.removeEventListener('drop', this.onDrop.bind(this));
        }
    }
    isUploading() {
        return this.files.some((file) => file.isUploading());
    }
    upload() {
        // Make sure we don't start too many uploads at once
        if (this.isUploading())
            return;
        // Kick off the queue
        this.fire('uploadStart');
        for (let num = 1; num <= this.simultaneousUploads; num++) {
            this.uploadNextChunk();
        }
    }
    pause() {
        // Resume all chunks currently being uploaded
        for (const file of this.files) {
            file.abort();
        }
        this.fire('pause');
    }
    ;
    cancel() {
        this.fire('beforeCancel');
        for (let i = this.files.length - 1; i >= 0; i--) {
            this.files[i].cancel();
        }
        this.fire('cancel');
    }
    ;
    progress() {
        let totalDone = this.files.reduce((accumulator, file) => accumulator + file.size * file.progress(), 0);
        let totalSize = this.getSize();
        return totalSize > 0 ? totalDone / totalSize : 0;
    }
    ;
    addFile(file, event) {
        this.appendFilesFromFileList([file], event);
    }
    ;
    addFiles(files, event) {
        this.appendFilesFromFileList(files, event);
    }
    ;
    addFileValidator(fileType, validator) {
        if (fileType in this.validators) {
            console.warn(`Overwriting validator for file type: ${fileType}`);
        }
        this.validators[fileType] = validator;
    }
    removeFile(file) {
        for (let i = this.files.length - 1; i >= 0; i--) {
            if (this.files[i] === file) {
                this.files.splice(i, 1);
                break;
            }
        }
    }
    ;
    generateUniqueIdentifier(file, event) {
        return typeof this._generateUniqueIdentifier === 'function' ?
            this._generateUniqueIdentifier(file, event) : resumableHelpers_1.default.generateUniqueIdentifier(file);
    }
    getFromUniqueIdentifier(uniqueIdentifier) {
        return this.files.find((file) => file.uniqueIdentifier === uniqueIdentifier);
    }
    ;
    getSize() {
        return this.files.reduce((accumulator, file) => accumulator + file.size, 0);
    }
    handleDropEvent(e) {
        this.onDrop(e);
    }
    handleChangeEvent(e) {
        this.appendFilesFromFileList(Array.from(e.target.files), e);
        e.target.value = '';
    }
    checkUploadComplete() {
        // The are no more outstanding chunks to upload, check if everything is done
        let uploadCompleted = this.files.every((file) => file.isComplete());
        if (uploadCompleted) {
            // All chunks have been uploaded, complete
            this.fire('complete');
        }
    }
    /**
     * Event Handlers: This section should only include methods that are used to
     * handle events coming from the files or chunks.
     */
    handleChunkSuccess() {
        this.uploadNextChunk();
    }
    handleChunkError() {
        this.uploadNextChunk();
    }
    handleChunkCancel() {
        this.uploadNextChunk();
    }
    handleFileError(args) {
        this.fire('error', args[1], args[0]);
    }
    handleFileSuccess(args) {
        this.fire('fileSuccess', ...args);
        this.checkUploadComplete();
    }
    handleFileProgress() {
        this.fire('progress');
    }
    handleFileCancel(args) {
        this.removeFile(args[0]);
    }
    handleFileRetry() {
        this.upload();
    }
}
exports.Resumable = Resumable;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=main.js.map