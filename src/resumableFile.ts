// INTERNAL OBJECT TYPES
import ResumableChunk from './resumableChunk';
import Helpers from './resumableHelpers';
import ResumableEventHandler from './resumableEventHandler';
import {ResumableConfiguration} from './types/types';

export default class ResumableFile extends ResumableEventHandler {
  private opts: object;
  private _prevProgress: number = 0;
  private isPaused: boolean = false;

  file: File;
  fileName: string;
  size: number;
  relativePath: string;
  uniqueIdentifier: string;
  private _error: boolean;
  chunks: ResumableChunk[] = [];
  private chunkSize: number = 1024 * 1024; // 1 MB
  private forceChunkSize: boolean = false;

  constructor(file: File, uniqueIdentifier: string, options: object) {
    super();
    this.opts = options;
    this.setInstanceProperties(options);
    this.file = file;
    this.fileName = Helpers.getFileNameFromFile(file);
    this.size = file.size;
    this.relativePath = /*file.relativePath ||*/ file.webkitRelativePath || this.fileName;
    this.uniqueIdentifier = uniqueIdentifier;
    this._error = uniqueIdentifier !== undefined;

    // Bootstrap file
    this.fire('chunkingStart', this);
    this.bootstrap();
  }

  get pause(): boolean {
    return this.isPaused;
  }

  set pause(pause: boolean) {
    if (pause === undefined) {
      this.isPaused = !this.isPaused;
    } else {
      this.isPaused = pause;
    }
  }

  setInstanceProperties(options: ResumableConfiguration) {
    // Options
    ({
      chunkSize: this.chunkSize,
      forceChunkSize: this.forceChunkSize,
    } = options);
  }

  /**
   * Stop current uploads
   */
  abort(): void {
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
  cancel(): void {
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

  retry(): void {
    this.bootstrap();
    let firedRetry = false;
    this.on('chunkingComplete', () => {
      if (!firedRetry) this.fire('fileRetry');
      firedRetry = true;
    });
  }

  bootstrap(): void {
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

  progress(): number {
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

  isUploading(): boolean {
    return this.chunks.some((chunk) => chunk.status === 'chunkUploading');
  }

  isComplete() {
    return !this.chunks.some((chunk) =>
      chunk.status === 'chunkPending' || chunk.status === 'chunkUploading');
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
