// INTERNAL OBJECT TYPES
import ResumableChunk from './resumableChunk.js';
import Helpers from './resumableHelpers.js';
import ResumableEventHandler from './resumableEventHandler.js';

export default class ResumableFile extends ResumableEventHandler {
  constructor(resumableObj, file, uniqueIdentifier, options) {
    super(resumableObj);
    this.opts = options;
    this.setOptions(options);
    this._prevProgress = 0;
    this.resumableObj = resumableObj;
    this.file = file;
    this.fileName = file.fileName || file.name; // Some confusion in different versions of Firefox
    this.size = file.size;
    this.relativePath = file.relativePath || file.webkitRelativePath || this.fileName;
    this.uniqueIdentifier = uniqueIdentifier;
    this._pause = false;
    this._error = uniqueIdentifier !== undefined;
    this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

    // Default Options
    this.preprocessFile = null;

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

  // Callback when something happens within the chunk
  chunkEvent(event, message) {
    // event can be 'progress', 'success', 'error' or 'retry'
    switch (event) {
      case 'progress':
        this.fire('fileProgress', this, message);
        break;
      case 'error':
        this.abort();
        this._error = true;
        this.chunks = [];
        this.fire('fileError', this, message);
        break;
      case 'success':
        if (this._error) return;
        this.fire('fileProgress', this, message); // it's at least progress
        if (this.isComplete()) {
          this.fire('fileSuccess', this, message);
        }
        break;
      case 'retry':
        this.fire('fileRetry', this);
        break;
    }
  };

  abort() {
    // Stop current uploads
    let abortCount = 0;
    for (const chunk of this.chunks) {
      if (chunk.status === 'uploading') {
        chunk.abort();
        abortCount++;
      }
    }
    if (abortCount > 0) this.fire('fileProgress', this);
  }

  cancel() {
    // Stop current uploads
    for (const chunk of this.chunks) {
      if (chunk.status === 'uploading') {
        chunk.abort();
        this.resumableObj.uploadNextChunk();
      }
    }
    // Reset this file to be void
    this.chunks = [];
    this.resumableObj.removeFile(this);
    this.fire('fileProgress', this);
  }

  retry() {
    this.bootstrap();
    let firedRetry = false;
    this.on('chunkingComplete', () => {
      if (!firedRetry) this.resumableObj.upload();
      firedRetry = true;
    });
  }

  bootstrap() {
    this.abort();
    this._error = false;
    // Rebuild stack of chunks from file
    this.chunks = [];
    this._prevProgress = 0;
    const round = this.forceChunkSize ? Math.ceil : Math.floor;
    const maxOffset = Math.max(round(this.file.size / this.chunkSize), 1);
    for (var offset = 0; offset < maxOffset; offset++) {
      const chunk = new ResumableChunk(this.resumableObj, this, offset, this.opts);
      chunk.on('*', this.chunkEvent.bind(this));
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
      if (chunk.status === 'error') error = true;
      ret += chunk.progress(true); // get chunk progress relative to entire file
    }
    ret = error ? 1 : (ret > 0.99999 ? 1 : ret);
    ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused
    this._prevProgress = ret;
    return ret;
  }

  isUploading() {
    return this.chunks.some((chunk) => chunk.status === 'uploading');
  }

  isComplete() {
    if (this.preprocessState === 1) {
      return false;
    }
    return !this.chunks.some((chunk) =>
      chunk.status === 'pending' || chunk.status === 'uploading' || chunk.preprocessState === 1);
  }

  preprocessFinished() {
    this.preprocessState = 2;
    this.upload();
  }

  upload() {
    if (this.pause) {
      return false;
    }
    let preprocess = this.preprocessFile;
    if (typeof preprocess === 'function') {
      switch (this.preprocessState) {
        case 0:
          this.preprocessState = 1;
          preprocess(this);
          return true;
        case 1:
          return true;
        case 2:
          break;
      }
    }
    for (const chunk of this.chunks) {
      if (chunk.status === 'pending' && chunk.preprocessState !== 1) {
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
