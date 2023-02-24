import Helpers from './resumableHelpers';
import ResumableFile from './resumableFile';
import ResumableEventHandler from './resumableEventHandler';
import {ExtendedFile, ResumableChunkStatus, ResumableConfiguration} from './types/types';

/*
* MIT Licensed
* http://www.twentythree.com/
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@twentythree.com
*/

/**
 * An instance of a resumable upload handler that contains one or multiple files which should be uploaded in chunks.
 */
export class Resumable extends ResumableEventHandler {
  private opts: ResumableConfiguration;
  private files: ResumableFile[] = [];
  private validators: {[fileType: string]: Function} = {};
  private support: boolean;

  // Configuration Options
  clearInput: boolean = true;
  dragOverClass: string = 'dragover';
  fileTypes: string[] = [];
  fileTypeErrorCallback: Function = (file) => {
    alert(`${file.fileName || file.name} has an unsupported file type, please upload files of type ${this.fileTypes}.`);
  };
  _generateUniqueIdentifier: Function = null;
  maxFileSize?: number;
  maxFileSizeErrorCallback: Function = (file) => {
    alert(file.fileName || file.name + ' is too large, please upload files less than ' +
      Helpers.formatSize(this.maxFileSize) + '.');
  };
  maxFiles?: number;
  maxFilesErrorCallback: Function = (files) => {
    var maxFiles = this.maxFiles;
    alert('Please upload no more than ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
  };
  minFileSize: number = 1;
  minFileSizeErrorCallback: Function = (file) => {
    alert(file.fileName || file.name + ' is too small, please upload files larger than ' +
      Helpers.formatSize(this.minFileSize) + '.');
  };
  prioritizeFirstAndLastChunk: boolean = false;
  fileValidationErrorCallback: Function = (file) => {};
  simultaneousUploads: number = 3;

  constructor(options: ResumableConfiguration = {}) {
    super();
    this.setInstanceProperties(options);
    this.opts = options;
    this.checkSupport();
  }

  /**
   * Check whether the current browser supports the essential functions for the package to work.
   * The method checks if these features are supported:
   * - File object type
   * - Blob object type
   * - FileList object type
   * - slicing files
   */
  private checkSupport(): void {
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
  protected setInstanceProperties(options: ResumableConfiguration) {
    Object.assign(this, options);
    this.sanitizeFileTypes();
  }

  private sanitizeFileTypes() {
    // For good behaviour we do some sanitizing. Remove spaces and dots and lowercase all.
    this.fileTypes = this.fileTypes.map((type) => type.replace(/[\s.]/g, '').toLowerCase());
  }

  /**
   * Transforms a single fileEntry or directoryEntry item into a list of File objects this method is used to convert
   * entries found inside dragged-and-dropped directories.
   * @param {Object} item item to upload, may be file or directory entry
   * @param {string} path current file path
   */
  private async mapDirectoryItemToFile(item: FileSystemEntry, path: string): Promise<File[]> {
    if (item.isFile) {
      // file entry provided
      const file = await new Promise(
        (resolve, reject) => (item as FileSystemFileEntry).file(resolve, reject)
      ) as ExtendedFile;
      file.relativePath = path + file.name;
      return [file];
    } else if (item.isDirectory) {
      // directory entry provided
      return await this.processDirectory(item as FileSystemDirectoryEntry, path + item.name + '/');
    } else if (item instanceof File) {
      return [item];
    }

    console.warn('Item mapping did not return a file object. This might be due to an unknown file type.')
    return [];
  }

  /**
   * Transforms a single DataTransfer item into a File object. This may include either extracting the given file or
   * all files inside the provided directory.
   * @param item item to upload, may be file or directory entry
   * @param path current file path
   */
  private async mapDragItemToFile(item: DataTransferItem, path: string): Promise<File[]> {
    let entry = item.webkitGetAsEntry();
    if (entry.isDirectory) {
      return await this.processDirectory(entry as FileSystemDirectoryEntry, path + entry.name + '/');
    }

    let file = item.getAsFile();
    if (file instanceof File) {
      (file as ExtendedFile).relativePath = path + file.name;
      return [file];
    }

    console.warn('Item mapping did not return a file object. This might be due to an unknown file type.')
    return [];
  }

  /**
   * Recursively traverse a directory and collect files to upload
   */
  private processDirectory(directory: FileSystemDirectoryEntry, path: string): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const dirReader = directory.createReader();
      let allEntries = [];

      const readEntries = (): void => {
        dirReader.readEntries(async (entries: FileSystemEntry[]): Promise<void> => {
          // Read the files batch-wise (in chrome e.g. 100 at a time)
          if (entries.length) {
            allEntries = allEntries.concat(entries);
            return readEntries();
          }

          // After collecting all files, map all fileEntries to File objects
          allEntries = allEntries.map((entry) => {
            return this.mapDirectoryItemToFile(entry, path);
          });
          // Wait until all files are collected.
          resolve(await Promise.all(allEntries));
        }, reject);
      };

      readEntries();
    });
  }

  /**
   * Handle the event when a new file was provided via drag-and-drop
   */
  private async onDrop(e: DragEvent): Promise<void> {
    (e.currentTarget as HTMLElement).classList.remove(this.dragOverClass);
    Helpers.stopEvent(e);

    let items = [];

    //handle dropped things as items if we can (this lets us deal with folders nicer in some cases)
    if (e.dataTransfer && e.dataTransfer.items) {
      items = [...e.dataTransfer.items as any];
    }
    //else handle them as files
    else if (e.dataTransfer && e.dataTransfer.files) {
      items =  [...e.dataTransfer.files as any];
    }

    if (!items.length) {
      return; // nothing to do
    }
    this.fire('fileProcessingBegin', items);
    let promises = items.map((item) => this.mapDragItemToFile(item, ''));
    let files = Helpers.flattenDeep(await Promise.all(promises));
    if (files.length) {
      // at least one file found
      this.appendFilesFromFileList(files, e);
    }
  }

  /**
   * Handle the event when a drag-and-drop item leaves the area of assigned drag-and-drop area
   */
  private onDragLeave(e: DragEvent): void {
    (e.currentTarget as HTMLElement).classList.remove(this.dragOverClass);
  }

  /**
   * Handle the event when a drag-and-drop item enters the area of assigned drag-and-drop area
   */
  private onDragOverEnter(e: DragEvent): void {
    e.preventDefault();
    let dt = e.dataTransfer;
    if (dt.types.includes('Files')) { // only for file drop
      e.stopPropagation();
      dt.dropEffect = 'copy';
      dt.effectAllowed = 'copy';
      (e.currentTarget as HTMLElement).classList.add(this.dragOverClass);
    } else {
      dt.dropEffect = 'none';
      dt.effectAllowed = 'none';
    }
  };

  /**
   * Validate and clean a list of files. This includes the removal of duplicates, a check whether the file type is
   * allowed and custom validation functions defined per file type.
   * @param {ExtendedFile[]} files A list of File instances that were previously extended with a uniqueIdentifier
   */
  private async validateFiles(files: ExtendedFile[]): Promise<ExtendedFile[]> {
    // Remove files that are duplicated in the original array, based on their unique identifiers
    let uniqueFiles = Helpers.uniqBy(files,
      (file) => file.uniqueIdentifier,
      (file) => this.fire('fileProcessingFailed', file, 'duplicate'),
    );

    let validationPromises = uniqueFiles.map(async (file) => {
      // Remove files that were already added based on their unique identifiers
      if (this.files.some((addedFile) => addedFile.uniqueIdentifier === file.uniqueIdentifier)) {
        this.fire('fileProcessingFailed', file, 'duplicate');
        return false;
      }

      let fileType: string = file.type.toLowerCase();
      let fileExtension = file.name.split('.').pop().toLowerCase();

      if (this.fileTypes.length > 0) {
        const fileTypeFound = this.fileTypes.some((type) => {
          // Check whether the extension inside the filename is an allowed file type
          return fileExtension === type ||
            // If MIME type, check for wildcard or if extension matches the file's tile type
            type.includes('/') && (
              type.includes('*') &&
              fileType.substring(0, type.indexOf('*')) === type.substring(0, type.indexOf('*')) ||
              fileType === type
            );
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

  /**
   * Add an array of files to this instance's file list by creating new ResumableFiles. This includes a validation and
   * deduplication of the provided array.
   * @param fileList An array containing File objects
   * @param event The event with which the fileList was provided
   */
  private async appendFilesFromFileList(fileList: File[], event: Event): Promise<boolean> {
    // check for uploading too many files
    if (this.maxFiles !== undefined && this.maxFiles < fileList.length + this.files.length) {
      // if single-file upload, file is already added, and trying to add 1 new file, simply replace the already-added file
      if (this.maxFiles === 1 && this.files.length === 1 && fileList.length === 1) {
        this.removeFile(this.files[0]);
      } else {
        this.fire('fileProcessingFailed', undefined, 'maxFiles');
        this.maxFilesErrorCallback(fileList);
        return false;
      }
    }

    // Add the unique identifier for every new file.
    // Since this might return a promise, we have to wait until it completed.
    const filesWithUniqueIdentifiers = await Promise.all(fileList.map(async (file: ExtendedFile): Promise<ExtendedFile> => {
      file.uniqueIdentifier = await this.generateUniqueIdentifier(file, event);
      return file;
    }));

    // Validate the files and remove duplicates
    const validatedFiles = await this.validateFiles(filesWithUniqueIdentifiers);

    let skippedFiles = filesWithUniqueIdentifiers.filter((file) => !validatedFiles.includes(file));

    for (const file of validatedFiles) {
      let f = new ResumableFile(file, file.uniqueIdentifier, this.opts);
      f.on('chunkSuccess', () => this.handleChunkSuccess());
      f.on('chunkError', () => this.handleChunkError());
      f.on('chunkCancel', () => this.handleChunkCancel());
      f.on('fileProgress', (...args) => this.handleFileProgress(args));
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

  /**
   * Generate a new unique identifier for a given file either with a default helper function or with a custom
   * generator function.
   * @param file The file as an HTML 5 File object
   * @param event The event with which the file was provided originally
   */
  private generateUniqueIdentifier(file: File, event: Event): string {
    return typeof this._generateUniqueIdentifier === 'function' ?
      this._generateUniqueIdentifier(file, event) : Helpers.generateUniqueIdentifier(file);
  }

  /**
   * Queue a new chunk to be uploaded that is currently awaiting upload.
   */
  private uploadNextChunk(): void {
    // In some cases (such as videos) it's really handy to upload the first
    // and last chunk of a file quickly; this lets the server check the file's
    // metadata and determine if there's even a point in continuing.
    if (this.prioritizeFirstAndLastChunk) {
      for (const file of this.files) {
        if (file.chunks.length && file.chunks[0].status === ResumableChunkStatus.PENDING) {
          file.chunks[0].send();
          return;
        }
        if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status === ResumableChunkStatus.PENDING) {
          file.chunks[file.chunks.length - 1].send();
          return;
        }
      }
    }

    // Now, simply look for the next best thing to upload
    for (const file of this.files) {
      if (file.upload()) return;
    }
  }

  /**
   *  PUBLIC METHODS FOR RESUMABLE.JS
   *  This section only includes methods that should be callable from external packages.
   */

  /**
   * Assign a browse action to one or more DOM nodes. Pass in true to allow directories to be selected (Chrome only).
   */
  assignBrowse(domNodes: HTMLElement | HTMLElement[], isDirectory: boolean = false): void {
    if (domNodes instanceof HTMLElement) domNodes = [domNodes];
    for (const domNode of domNodes) {
      let input;
      if (domNode instanceof HTMLInputElement && domNode.type === 'file') {
        input = domNode;
      } else {
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
      } else {
        input.removeAttribute('multiple');
      }
      if (isDirectory) {
        input.setAttribute('webkitdirectory', 'webkitdirectory');
      } else {
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
      } else {
        input.removeAttribute('accept');
      }
      // When new files are added, simply append them to the overall list
      input.addEventListener('change', this.handleChangeEvent.bind(this), false);
    }
  }

  /**
   * Assign one or more DOM nodes as a drop target.
   */
  assignDrop(domNodes: HTMLElement | HTMLElement[]): void {
    if (domNodes instanceof HTMLElement) domNodes = [domNodes];

    for (const domNode of domNodes) {
      domNode.addEventListener('dragover', this.onDragOverEnter.bind(this), false);
      domNode.addEventListener('dragenter', this.onDragOverEnter.bind(this), false);
      domNode.addEventListener('dragleave', this.onDragLeave.bind(this), false);
      domNode.addEventListener('drop', this.onDrop.bind(this), false);
    }
  }

  /**
   * Remove one or more DOM nodes as a drop target.
   */
  unAssignDrop(domNodes: HTMLElement | HTMLElement[]): void {
    if (domNodes instanceof HTMLElement) domNodes = [domNodes];

    for (const domNode of domNodes) {
      domNode.removeEventListener('dragover', this.onDragOverEnter.bind(this));
      domNode.removeEventListener('dragenter', this.onDragOverEnter.bind(this));
      domNode.removeEventListener('dragleave', this.onDragLeave.bind(this));
      domNode.removeEventListener('drop', this.onDrop.bind(this));
    }
  }

  /**
   * Check whether any files are currently uploading
   */
  get isUploading(): boolean {
    return this.files.some((file) => file.isUploading);
  }

  /**
   * Start or resume the upload of the provided files by initiating the upload of the first chunk
   */
  upload(): void {
    // Make sure we don't start too many uploads at once
    if (this.isUploading) return;
    // Kick off the queue
    this.fire('uploadStart');
    for (let num = 1; num <= this.simultaneousUploads; num++) {
      this.uploadNextChunk();
    }
  }

  /**
   * Pause the upload
   */
  pause(): void {
    // Resume all chunks currently being uploaded
    for (const file of this.files) {
      file.abort();
    }
    this.fire('pause');
  };

  /**
   * Cancel uploading and reset all files to their initial states
   */
  cancel(): void {
    this.fire('beforeCancel');
    for (let i = this.files.length - 1; i >= 0; i--) {
      this.files[i].cancel();
    }
    this.fire('cancel');
  };

  /**
   * Return the progress of the current upload as a float between 0 and 1
   */
  progress(): number {
    let totalDone = this.files.reduce((accumulator, file) => accumulator + file.size * file.progress(), 0);
    let totalSize = this.getSize();
    return totalSize > 0 ? totalDone / totalSize : 0;
  };

  /**
   * Add a HTML5 File object to the list of files.
   */
  addFile(file: File, event: Event): void {
    this.appendFilesFromFileList([file], event);
  };

  /**
   * Add a list of HTML5 File objects to the list of files.
   */
  addFiles(files: File[], event: Event): void {
    this.appendFilesFromFileList(files, event);
  };

  /**
   * Add a validator function for the given file type. This can e.g. be used to read the file and validate
   * checksums based on certain properties.
   * @param fileType The file extension for the given validator
   * @param validator A callback function that should be called when validating files with the given type
   */
  addFileValidator(fileType: string, validator: Function): void {
    if (fileType in this.validators) {
      console.warn(`Overwriting validator for file type: ${fileType}`);
    }
    this.validators[fileType] = validator;
  }

  /**
   * Cancel the upload of a specific ResumableFile object and remove it from the file list.
   */
  removeFile(file: ResumableFile): void {
    for (let i = this.files.length - 1; i >= 0; i--) {
      if (this.files[i] === file) {
        this.files.splice(i, 1);
        break;
      }
    }
  };

  /**
   * Retrieve a ResumableFile object from the file list by its unique identifier.
   */
  getFromUniqueIdentifier(uniqueIdentifier: string): ResumableFile {
    return this.files.find((file) => file.uniqueIdentifier === uniqueIdentifier);
  };

  /**
   * Get the combined size of all files for the upload
   */
  getSize(): number {
    return this.files.reduce((accumulator, file) => accumulator + file.size, 0);
  }

  /**
   * Call the event handler when a file is dropped on the drag-and-drop area
   */
  handleDropEvent(e: DragEvent): void {
    this.onDrop(e);
  }
  /**
   * Call the event handler when the provided input element changes (i.e. receives one or multiple files.
   */
  handleChangeEvent(e: InputEvent): void {
    const eventTarget = e.target as HTMLInputElement;
    this.fire('fileProcessingBegin', eventTarget.files);
    this.appendFilesFromFileList([...eventTarget.files as any], e);
    if (this.clearInput) {
      eventTarget.value = '';
    }
  }

  /**
   * Check whether the upload is completed, i.e. if all files were uploaded successfully.
   */
  checkUploadComplete(): void {
    let uploadCompleted = this.files.every((file) => file.isComplete);
    if (uploadCompleted) {
      // All chunks have been uploaded, complete
      this.fire('complete');
    }
  }

  /**
   * Event Handlers: This section should only include methods that are used to
   * handle events coming from the files or chunks.
   */

  /**
   * The event handler when a chunk was uploaded successfully
   */
  private handleChunkSuccess(): void {
    this.uploadNextChunk();
  }

  /**
   * The event handler when a chunk was uploaded successfully
   */
  private handleChunkError(): void {
    this.uploadNextChunk();
  }

  /**
   * The event handler when an error occurred during the upload of a chunk
   */
  private handleChunkCancel(): void {
    this.uploadNextChunk();
  }

  /**
   * The event handler when an error occurred during the upload of a file
   */
  private handleFileError(args: any[]): void {
    this.fire('error', args[1], args[0]);
  }

  /**
   * The event handler when all chunks from a file were uploaded successfully
   */
  private handleFileSuccess(args: any[]): void {
    this.fire('fileSuccess', ...args);
    this.checkUploadComplete();
  }

  /**
   * The event handler when a file progress event was received
   */
  private handleFileProgress(args: any[]): void {
    this.fire('fileProgress', ...args);
    this.fire('progress');
  }

  /**
   * The event handler when the upload of a file was canceled
   */
  private handleFileCancel(args: any[]): void {
    this.removeFile(args[0])
  }

  /**
   * The event handler, when the retry of a file was initiated
   */
  private handleFileRetry(): void {
    this.upload();
  }
}
