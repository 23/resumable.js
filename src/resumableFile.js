// INTERNAL OBJECT TYPES
import ResumableChunk from './resumableChunk.js';
import Helpers from './resumableHelpers.js';
import ResumableEventHandler from './resumableEventHandler.js';

export default class ResumableFile extends ResumableEventHandler {
  constructor(file, uniqueIdentifier, options) {
    super();
    this.opts = options;
    this.setOptions(options);
    this._prevProgress = 0;
    this.file = file;
    this.fileName = Helpers.getFileNameFromFile(file);
    this.size = file.size;
    this.relativePath = file.relativePath || file.webkitRelativePath || this.fileName;
    this.uniqueIdentifier = uniqueIdentifier;
    this._pause = false;
    this._error = uniqueIdentifier !== undefined;
    this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

    // Main code to set up a file object with chunks,
    // packaged to be able to handle retries if needed.
    /**
     * @type {ResumableChunk[]}
     */
    this.chunks = [];

    // Bootstrap and return
    this.fire('chunkingStart', this);
    this.bootstrap();
    return this;
  }

  get pause() {
    return this._pause;
  }

  set pause(pause) {
    if (pause === undefined) {
      this._pause = !this._pause;
    } else {
      this._pause = pause;
    }
  }

  /**
   * @param {{forceChunkSize: boolean, preprocessFile: null}} options
   */
  setOptions(options) {
    // Options
    ({
      chunkSize: this.chunkSize = 1 * 1024 * 1024, // 1 MB
      forceChunkSize: this.forceChunkSize = false,
      preprocessFile: this.preprocessFile = null,
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
    if (abortCount > 0) this.fire('fileProgress', this);
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
      if (!firedRetry) this.fire('fileRetry');
      firedRetry = true;
    });
  }

  bootstrap() {
    const progressHandler = (message) => this.fire('fileProgress', this, message);
    const retryHandler = () =>  this.fire('fileRetry', this);
    const successHandler = (message) => {
      if (this._error) return;
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
    }

    this.abort();
    this._error = false;
    // Rebuild stack of chunks from file
    this.chunks = [];
    this._prevProgress = 0;
    const round = this.forceChunkSize ? Math.ceil : Math.floor;
    const maxOffset = Math.max(round(this.file.size / this.chunkSize), 1);
    for (var offset = 0; offset < maxOffset; offset++) {
      const chunk = new ResumableChunk(this, offset, this.opts);
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
    if (this._error) return 1;
    // Sum up progress across everything
    var ret = 0;
    var error = false;
    for (const chunk of this.chunks) {
      if (chunk.status === 'chunkError') error = true;
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
    if (this.preprocessState === 1) {
      return false;
    }
    return !this.chunks.some((chunk) =>
      chunk.status === 'chunkPending' || chunk.status === 'chunkUploading' || chunk.preprocessState === 1);
  }

  preprocessFinished() {
    this.preprocessState = 2;
    this.upload();
  }

  upload() {
    if (this.pause) {
      return false;
    }
    if (typeof this.preprocessFile === 'function') {
      switch (this.preprocessState) {
        case 0:
          this.preprocessState = 1;
          this.preprocessFile(this);
          return true;
        case 1:
          return true;
        case 2:
          break;
      }
    }
    for (const chunk of this.chunks) {
      if (chunk.status === 'chunkPending' && chunk.preprocessState !== 1) {
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
      this.chunks[num].markComplete = true;
    }
  }
}
