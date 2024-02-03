import Helpers from './resumableHelpers';
import ResumableEventHandler from './resumableEventHandler';
import ResumableFile from './resumableFile';
import {ResumableChunkStatus, ResumableConfiguration} from './types/types';

/*
* MIT Licensed
*
* For all code added/modified until Sep 24, 2020
* (see original repo as original code was split up into multiple files)
* https://www.twentythree.com
* https://github.com/23/resumable.js
* Steffen Fagerström Christensen, steffen@twentythree.com
*
* For all code added/modified since Sep 24, 2020
* https://www.pointcloudtechnology.com/en/
* https://github.com/pointcloudtechnology/resumable.js
* For contact (not the sole author): Marcel Wendler, https://github.com/UniquePanda, marcel.wendler@pointcloudtechnology.com
*/

/**
 * A file chunk that contains all the data that for a single upload request
 */
export default class ResumableChunk extends ResumableEventHandler {
  private fileObj: ResumableFile;
  private fileObjSize: number;
  private fileObjType: string;
  private offset: number;
  private lastProgressCallback: Date = new Date;
  private tested: boolean = false;
  private retries: number = 0;
  private pendingRetry: boolean = false;
  private isMarkedComplete: boolean = false;
  private loaded: number = 0;
  private startByte: number;
  private endByte: number;
  private xhr: XMLHttpRequest = null;

  // Option properties
  // todo #23 (check all class properties)
  private chunkSize: number = 1024 * 1024; // 1 MB
  private fileParameterName: string = 'file';
  chunkNumberParameterName: string = 'resumableChunkNumber';
  chunkSizeParameterName: string = 'resumableChunkSize';
  currentChunkSizeParameterName: string = 'resumableCurrentChunkSize';
  totalSizeParameterName: string = 'resumableTotalSize';
  typeParameterName: string = 'resumableType';
  identifierParameterName: string = 'resumableIdentifier';
  fileCategoryParameterName: string = 'resumableFileCategory';
  fileNameParameterName: string = 'resumableFilename';
  relativePathParameterName: string = 'resumableRelativePath';
  totalChunksParameterName: string = 'resumableTotalChunks';
  throttleProgressCallbacks: number = 0.5;
  query: object = {};
  headers: object = {};
  method: string = 'multipart';
  uploadMethod: string = 'POST';
  testMethod: string = 'GET';
  parameterNamespace: string = '';
  testChunks: boolean = true;
  maxChunkRetries: number = 100;
  chunkRetryInterval?: number = undefined;
  permanentErrors: number[] = [400, 401, 403, 404, 409, 415, 500, 501];
  withCredentials: boolean = false;
  xhrTimeout: number = 0;
  chunkFormat: string = 'blob';
  setChunkTypeFromFile: boolean = false;
  target: string = '/';
  testTarget: string = '';


  constructor(fileObj: ResumableFile, offset: number, options: ResumableConfiguration) {
    super();
    this.setInstanceProperties(options);
    this.fileObj = fileObj;
    this.fileObjSize = fileObj.size;
    this.fileObjType = fileObj.file.type;
    this.offset = offset;

    // Computed properties
    this.startByte = this.offset * this.chunkSize;
    this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * this.chunkSize);
    this.xhr = null;
  }

  /**
   * Set the options provided inside the configuration object on this instance
   */
  protected setInstanceProperties(options: ResumableConfiguration): void {
    Object.assign(this, options);
  }

  /**
   * Set the header values for the current XMLHttpRequest
   */
  // todo #23
  setCustomHeaders(): void {
    if (!this.xhr) {
      return;
    }
    let customHeaders = this.headers;
    if (customHeaders instanceof Function) {
      customHeaders = customHeaders(this.fileObj, this);
    }
    for (const header in customHeaders) {
      if (!customHeaders.hasOwnProperty(header)) continue;
      this.xhr.setRequestHeader(header, customHeaders[header]);
    }
  }

  /**
   * Get query parameters for this chunk as an object, combined with custom parameters if provided
   */
  get formattedQuery(): object {
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
      [this.fileCategoryParameterName]: this.fileObj.fileCategory,
      [this.fileNameParameterName]: this.fileObj.fileName,
      [this.relativePathParameterName]: this.fileObj.relativePath,
      [this.totalChunksParameterName]: this.fileObj.chunks.length,
    };
    return {...extraData, ...customQuery};
  }

  /**
   * Determine the status for this Chunk based on different parameters of the underlying XMLHttpRequest
   */
  get status(): ResumableChunkStatus {
    if (this.pendingRetry) {
      // if pending retry then that's effectively the same as actively uploading,
      // there might just be a slight delay before the retry starts
      return ResumableChunkStatus.UPLOADING;
    } else if (this.isMarkedComplete) {
      return ResumableChunkStatus.SUCCESS;
    } else if (!this.xhr) {
      return ResumableChunkStatus.PENDING;
    } else if (this.xhr.readyState < 4) {
      // Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
      return ResumableChunkStatus.UPLOADING;
    } else if (this.xhr.status === 200 || this.xhr.status === 201) {
      // HTTP 200, 201 (created)
      return ResumableChunkStatus.SUCCESS;
    } else if (this.permanentErrors.includes(this.xhr.status) || this.retries >= this.maxChunkRetries) {
      // HTTP 400, 404, 409, 415, 500, 501 (permanent error)
      return ResumableChunkStatus.ERROR;
    } else {
      // this should never happen, but we'll reset and queue a retry
      // a likely case for this would be 503 service unavailable
      this.abort();
      return ResumableChunkStatus.PENDING;
    }
  };

  /**
   * Get the target url for the specified request type and the configured parameters of this chunk
   * @param requestType The type of the request, either 'test' or 'upload'
   */
  getTarget(requestType: string): string {
    return Helpers.getTarget(requestType, this.target, this.testTarget, this.formattedQuery, this.parameterNamespace);
  }

  /**
   * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
   */
  // todo #23
  test(): void {
    // Set up request and listen for event
    this.xhr = new XMLHttpRequest();

    var testHandler = () => {
      this.tested = true;
      var status = this.status;
      if (status === ResumableChunkStatus.SUCCESS) {
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
  abort(): void {
    if (this.xhr) this.xhr.abort();
    this.xhr = null;
  }

  /**
   *  Uploads the actual data in a POST call
   */
  send(): void {
    if (this.testChunks && !this.tested) {
      this.test();
      return;
    }

    // Set up request and listen for event
    this.xhr = new XMLHttpRequest();

    // Progress
    this.xhr.upload.addEventListener('progress', (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
      if (Date.now() - this.lastProgressCallback.getTime() > this.throttleProgressCallbacks * 1000) {
        this.fire('chunkProgress', this.message());
        this.lastProgressCallback = new Date();
      }
      this.loaded = e.loaded || 0;
    }, false);
    this.loaded = 0;
    this.pendingRetry = false;
    this.fire('chunkProgress', this.message());

    /**
     * Handles the different xhr events based on the status of this chunk
     */
    let doneHandler = () => {
      var status = this.status;
      switch (status) {
        case ResumableChunkStatus.SUCCESS:
          this.fire('chunkSuccess', this.message());
          break;
        case ResumableChunkStatus.ERROR:
          this.fire('chunkError', this.message());
          break;
        default:
          this.fire('chunkRetry', this.message());
          this.abort();
          this.retries++;
          let retryInterval = this.chunkRetryInterval;
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
          fr.onload = () => {
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

  /**
   * Return the response text of the underlying XMLHttpRequest if it exists
   */
  message(): string {
    return this.xhr ? this.xhr.responseText : '';
  };

  /**
   * Return the progress for the current chunk as a number between 0 and 1
   * @param relative Whether or not the progress should be calculated based on the size of the entire file
   */
  progress(relative: boolean = false): number {
    var factor = relative ? (this.endByte - this.startByte) / this.fileObjSize : 1;
    if (this.pendingRetry) return 0;
    if ((!this.xhr || !this.xhr.status) && !this.isMarkedComplete) factor *= .95;
    switch (this.status) {
      case ResumableChunkStatus.SUCCESS:
      case ResumableChunkStatus.ERROR:
        return factor;
      case ResumableChunkStatus.PENDING:
        return 0;
      default:
        return this.loaded / (this.endByte - this.startByte) * factor;
    }
  }

  /**
   * Mark this chunk as completed because it was already uploaded to the server.
   */
  markComplete(): void {
    this.isMarkedComplete = true;
  }
}
