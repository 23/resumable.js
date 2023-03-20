import ResumableChunk from './resumableChunk';
import Helpers from './resumableHelpers';
import ResumableEventHandler from './resumableEventHandler';
import {ResumableChunkStatus, ResumableConfiguration} from './types/types';

/**
 * A single file object that should be uploaded in multiple chunks
 */
export default class ResumableFile extends ResumableEventHandler {
  private opts: ResumableConfiguration;
  private _prevProgress: number = 0;
  private isPaused: boolean = false;

  file: File;
  fileName: string;
  size: number;
  relativePath: string;
  uniqueIdentifier: string;
  fileCategory: string;
  private _error: boolean;
  chunks: ResumableChunk[] = [];
  private chunkSize: number = 1024 * 1024; // 1 MB

  constructor(file: File, uniqueIdentifier: string, fileCategory: string, options: object) {
    super();
    this.opts = options;
    this.setInstanceProperties(options);
    this.file = file;
    this.fileName = file.name;
    this.size = file.size;
    this.relativePath = file.webkitRelativePath || this.fileName;
    this.uniqueIdentifier = uniqueIdentifier;
    this.fileCategory = fileCategory;
    this._error = uniqueIdentifier !== undefined;

    // Bootstrap file
    this.fire('chunkingStart', this);
    this.bootstrap();
  }

  /**
   * Set the options provided inside the configuration object on this instance
   */
  protected setInstanceProperties(options: ResumableConfiguration) {
    Object.assign(this, options);
  }

  /**
   * Stop current uploads for this file
   */
  abort(): void {
    let abortCount = 0;
    for (const chunk of this.chunks) {
      if (chunk.status === ResumableChunkStatus.UPLOADING) {
        chunk.abort();
        abortCount++;
      }
    }
    if (abortCount > 0) this.fire('fileProgress', this, null);
  }

  /**
   * Cancel uploading this file and remove it from the file list
   */
  cancel(): void {
    for (const chunk of this.chunks) {
      if (chunk.status === ResumableChunkStatus.UPLOADING) {
        chunk.abort();
        this.fire('chunkCancel', chunk);
      }
    }
    // Reset this file to be void
    this.chunks = [];
    this.fire('fileCancel', this);
    this.fire('fileProgress', this, null);
  }

  /**
   * Retry uploading this file
   */
  retry(): void {
    this.bootstrap();
    let firedRetry = false;
    this.on('chunkingComplete', () => {
      if (!firedRetry) this.fire('fileRetry');
      firedRetry = true;
    });
  }

  /**
   * Prepare this file for a new upload, by dividing it into multiple chunks
   */
  bootstrap(): void {
    const progressHandler = (message) => this.fire('fileProgress', this, message);
    const retryHandler = () =>  this.fire('fileRetry', this);
    const successHandler = (message) => {
      if (this._error) return;
      this.fire('chunkSuccess');
      this.fire('fileProgress', this, message); // it's at least progress
      if (this.isComplete) {
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
    const maxOffset = Math.max(Math.ceil(this.file.size / this.chunkSize), 1);
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

  /**
   * Get the progress for uploading this file based on the progress of the individual file chunks
   */
  progress(): number {
    if (this._error) return 1;
    // Sum up progress across everything
    var ret = 0;
    var error = false;
    for (const chunk of this.chunks) {
      if (chunk.status === ResumableChunkStatus.ERROR) error = true;
      ret += chunk.progress(true); // get chunk progress relative to entire file
    }
    ret = error ? 1 : (ret > 0.99999 ? 1 : ret);
    ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused
    this._prevProgress = ret;
    return ret;
  }

  /**
   * Check whether at least one of this file's chunks is currently uploading
   */
  get isUploading(): boolean {
    return this.chunks.some((chunk) => chunk.status === ResumableChunkStatus.UPLOADING);
  }

  /**
   * Check whether all of this file's chunks completed their upload requests and whether it should be
   * treated as completed.
   */
  get isComplete(): boolean {
    return !this.chunks.some((chunk) =>
      chunk.status === ResumableChunkStatus.PENDING || chunk.status === ResumableChunkStatus.UPLOADING);
  }

  /**
   * Initiate the upload of a new chunk for this file. This function returns whether a new upload was started or not.
   */
  upload(): boolean {
    if (this.isPaused) {
      return false;
    }

    for (const chunk of this.chunks) {
      if (chunk.status === ResumableChunkStatus.PENDING) {
        chunk.send();
        return true;
      }
    }
    return false;
  }

  /**
   * Mark a given number of chunks as already uploaded to the server.
   * @param chunkNumber The index until which all chunks should be marked as completed
   */
  markChunksCompleted(chunkNumber: number): void {
    if (!this.chunks || this.chunks.length <= chunkNumber) {
      return;
    }
    for (let num = 0; num < chunkNumber; num++) {
      this.chunks[num].markComplete();
    }
  }
}
