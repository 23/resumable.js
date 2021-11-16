import Helpers from './resumableHelpers.js';
import ResumableEventHandler from './resumableEventHandler.js';

export default class ResumableChunk extends ResumableEventHandler {
  constructor(fileObj, offset, options) {
    super(fileObj);
    this.setOptions(options);
    this.fileObj = fileObj;
    this.fileObjSize = fileObj.size;
    this.fileObjType = fileObj.file.type;
    this.offset = offset;
    this.lastProgressCallback = (new Date);
    this.tested = false;
    this.retries = 0;
    this.pendingRetry = false;
    this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished
    this.markComplete = false;

    // Computed properties
    this.loaded = 0;
    this.startByte = this.offset * this.chunkSize;
    this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * this.chunkSize);
    if (this.fileObjSize - this.endByte < this.chunkSize && !this.forceChunkSize) {
      // The last chunk will be bigger than the chunk size, but less than 2*chunkSize
      this.endByte = this.fileObjSize;
    }
    this.xhr = null;
  }

  get formattedQuery() {
    var customQuery = this.query;
    if (typeof customQuery == 'function') customQuery = customQuery(this.fileObj, this);

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
    return {...extraData, ...customQuery};
  }

  /**
   * @returns 'chunkPending' | 'chunkUploading' | 'chunkSuccess'  | 'chunkError'
   */
  get status() {
    if (this.pendingRetry) {
      // if pending retry then that's effectively the same as actively uploading,
      // there might just be a slight delay before the retry starts
      return 'chunkUploading';
    } else if (this.markComplete) {
      return 'chunkSuccess';
    } else if (!this.xhr) {
      return 'chunkPending';
    } else if (this.xhr.readyState < 4) {
      // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
      return 'chunkUploading';
    } else if (this.xhr.status === 200 || this.xhr.status === 201) {
      // HTTP 200, 201 (created)
      return 'chunkSuccess';
    } else if (this.permanentErrors.includes(this.xhr.status) || this.retries >= this.maxChunkRetries) {
      // HTTP 400, 404, 409, 415, 500, 501 (permanent error)
      return 'chunkError';
    } else {
      // this should never happen, but we'll reset and queue a retry
      // a likely case for this would be 503 service unavailable
      this.abort();
      return 'chunkPending';
    }
  };

  /**
   * @param {{
   * permanentErrors: number[],
   * chunkRetryInterval: undefined,
   * chunkFormat: string,
   * chunkNumberParameterName: string,
   * uploadMethod: string,
   * typeParameterName: string,
   * preprocess: null,
   * maxChunkRetries: number,
   * setChunkTypeFromFile: boolean,
   * xhrTimeout: number,
   * fileNameParameterName: string,
   * parameterNamespace: string,
   * relativePathParameterName: string,
   * chunkSizeParameterName: string,
   * testChunks: boolean,
   * throttleProgressCallbacks: number,
   * totalChunksParameterName: string,
   * headers: {},
   * chunkSize: number,
   * method: string,
   * query: {},
   * testTarget: null,
   * fileParameterName: string,
   * target: string,
   * withCredentials: boolean,
   * testMethod: string,
   * identifierParameterName: string,
   * currentChunkSizeParameterName: string,
   * totalSizeParameterName: string}} options
   */
  setOptions(options) {
    // Options
    ({
      chunkSize: this.chunkSize = 1 * 1024 * 1024, // 1 MB
      forceChunkSize: this.forceChunkSize = false,
      fileParameterName: this.fileParameterName = 'file',
      chunkNumberParameterName: this.chunkNumberParameterName = 'resumableChunkNumber',
      chunkSizeParameterName: this.chunkSizeParameterName = 'resumableChunkSize',
      currentChunkSizeParameterName: this.currentChunkSizeParameterName = 'resumableCurrentChunkSize',
      totalSizeParameterName: this.totalSizeParameterName = 'resumableTotalSize',
      typeParameterName: this.typeParameterName = 'resumableType',
      identifierParameterName: this.identifierParameterName = 'resumableIdentifier',
      fileNameParameterName: this.fileNameParameterName = 'resumableFilename',
      relativePathParameterName: this.relativePathParameterName = 'resumableRelativePath',
      totalChunksParameterName: this.totalChunksParameterName = 'resumableTotalChunks',
      throttleProgressCallbacks: this.throttleProgressCallbacks = 0.5,
      query: this.query = {},
      headers: this.headers = {},
      preprocess: this.preprocess = null,
      method: this.method = 'multipart',
      uploadMethod: this.uploadMethod = 'POST',
      testMethod: this.testMethod = 'GET',
      parameterNamespace: this.parameterNamespace = '',
      testChunks: this.testChunks = true,
      maxChunkRetries: this.maxChunkRetries = 100,
      chunkRetryInterval: this.chunkRetryInterval = undefined,
      permanentErrors: this.permanentErrors = [400, 401, 403, 404, 409, 415, 500, 501],
      withCredentials: this.withCredentials = false,
      xhrTimeout: this.xhrTimeout = 0,
      chunkFormat: this.chunkFormat = 'blob',
      setChunkTypeFromFile: this.setChunkTypeFromFile = false,
      target: this.target = '/',
      testTarget: this.testTarget = null,
    } = options);
  }

  setCustomHeaders() {
    if (!this.xhr) {
      return;
    }
    let customHeaders = this.headers;
    if (typeof customHeaders === 'function') {
      customHeaders = customHeaders(this.fileObj, this);
    }
    for (const header in customHeaders) {
      if (!customHeaders.hasOwnProperty(header)) continue;
      this.xhr.setRequestHeader(header, customHeaders[header]);
    }
  }

  getTarget(requestType) {
    return Helpers.getTarget(requestType, this.target, this.testTarget, this.formattedQuery,
      this.parameterNamespace);
  }

  preprocessFinished() {
    this.preprocessState = 2;
    this.send();
  };

  /**
   * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
   */
  test() {
    // Set up request and listen for event
    this.xhr = new XMLHttpRequest();

    var testHandler = () => {
      this.tested = true;
      var status = this.status;
      if (status === 'success') {
        this.fire('chunkSuccess', this.message());
      } else {
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
    if (this.xhr) this.xhr.abort();
    this.xhr = null;
  }

  /**
   *  Uploads the actual data in a POST call
   */
  send() {
    if (typeof this.preprocess === 'function') {
      switch (this.preprocessState) {
        case 0:
          this.preprocessState = 1;
          this.preprocess(this);
          return;
        case 1:
          return;
        case 2:
          break;
      }
    }
    if (this.testChunks && !this.tested) {
      this.test();
      return;
    }

    // Set up request and listen for event
    this.xhr = new XMLHttpRequest();

    // Progress
    this.xhr.upload.addEventListener('progress', (e) => {
      if ((new Date) - this.lastProgressCallback > this.throttleProgressCallbacks * 1000) {
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
          var retryInterval = this.chunkRetryInterval;
          if (retryInterval !== undefined) {
            this.pendingRetry = true;
            setTimeout(this.send, retryInterval);
          } else {
            this.send();
          }
          break;
      }
    };
    this.xhr.addEventListener('load', doneHandler, false);
    this.xhr.addEventListener('error', doneHandler, false);
    this.xhr.addEventListener('timeout', doneHandler, false);

    // Set up the basic query data from Resumable
    let bytes = this.fileObj.file.slice(this.startByte, this.endByte,
      this.setChunkTypeFromFile ? this.fileObj.file.type : '');
    let data = null;
    let parameterNamespace = this.parameterNamespace;
    // Add data from the query options
    if (this.method === 'octet') {
      data = bytes;
    } else {
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
          fr.onload = function(e) {
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
  };

  progress(relative = false) {
    var factor = relative ? (this.endByte - this.startByte) / this.fileObjSize : 1;
    if (this.pendingRetry) return 0;
    if ((!this.xhr || !this.xhr.status) && !this.markComplete) factor *= .95;
    switch (this.status) {
      case 'chunkSuccess':
      case 'chunkError':
        return factor;
      case 'chunkPending':
        return 0;
      default:
        return this.loaded / (this.endByte - this.startByte) * factor;
    }
  }
}
