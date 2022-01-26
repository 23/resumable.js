import ResumableFile from './resumableFile';
import ResumableEventHandler from './resumableEventHandler';
import { ResumableConfiguration } from './types/types';
/**
 * An instance of a resumable upload handler that contains one or multiple files which should be uploaded in chunks.
 */
export declare class Resumable extends ResumableEventHandler {
    private opts;
    private files;
    private validators;
    private support;
    clearInput: boolean;
    dragOverClass: string;
    fileTypes: string[];
    fileTypeErrorCallback: Function;
    _generateUniqueIdentifier: Function;
    maxFileSize?: number;
    maxFileSizeErrorCallback: Function;
    maxFiles?: number;
    maxFilesErrorCallback: Function;
    minFileSize: number;
    minFileSizeErrorCallback: Function;
    prioritizeFirstAndLastChunk: boolean;
    fileValidationErrorCallback: Function;
    simultaneousUploads: number;
    constructor(options?: ResumableConfiguration);
    /**
     * Check whether the current browser supports the essential functions for the package to work.
     * The method checks if these features are supported:
     * - File object type
     * - Blob object type
     * - FileList object type
     * - slicing files
     */
    private checkSupport;
    /**
     * Assign the attributes of this instance via destructuring of the options object.
     */
    protected setInstanceProperties(options: ResumableConfiguration): void;
    /**
     * Transforms a single fileEntry or DirectoryEntry item into a list of File objects
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     */
    private mapItemToFile;
    /**
     * Transforms a single DataTransfer item into a File object. This may include either extracting the given file or
     * all files inside the provided directory.
     * @param item item to upload, may be file or directory entry
     * @param path current file path
     */
    private mapDragItemToFile;
    /**
     * Recursively traverse a directory and collect files to upload
     */
    private processDirectory;
    /**
     * Handle the event when a new file was provided via drag-and-drop
     */
    private onDrop;
    /**
     * Handle the event when a drag-and-drop item leaves the area of assigned drag-and-drop area
     */
    private onDragLeave;
    /**
     * Handle the event when a drag-and-drop item enters the area of assigned drag-and-drop area
     */
    private onDragOverEnter;
    /**
     * Validate and clean a list of files. This includes the removal of duplicates, a check whether the file type is
     * allowed and custom validation functions defined per file type.
     * @param {ExtendedFile[]} files A list of File instances that were previously extended with a uniqueIdentifier
     */
    private validateFiles;
    /**
     * Add an array of files to this instance's file list by creating new ResumableFiles. This includes a validation and
     * deduplication of the provided array.
     * @param fileList An array containing File objects
     * @param event The event with which the fileList was provided
     */
    private appendFilesFromFileList;
    /**
     * Generate a new unique identifier for a given file either with a default helper function or with a custom
     * generator function.
     * @param file The file as an HTML 5 File object
     * @param event The event with which the file was provided originally
     */
    private generateUniqueIdentifier;
    /**
     * Queue a new chunk to be uploaded that is currently awaiting upload.
     */
    private uploadNextChunk;
    /**
     *  PUBLIC METHODS FOR RESUMABLE.JS
     *  This section only includes methods that should be callable from external packages.
     */
    /**
     * Assign a browse action to one or more DOM nodes. Pass in true to allow directories to be selected (Chrome only).
     */
    assignBrowse(domNodes: HTMLInputElement | HTMLInputElement[], isDirectory?: boolean): void;
    /**
     * Assign one or more DOM nodes as a drop target.
     */
    assignDrop(domNodes: HTMLElement | HTMLElement[]): void;
    /**
     * Remove one or more DOM nodes as a drop target.
     */
    unAssignDrop(domNodes: HTMLElement | HTMLElement[]): void;
    /**
     * Check whether any files are currently uploading
     */
    get isUploading(): boolean;
    /**
     * Start or resume the upload of the provided files by initiating the upload of the first chunk
     */
    upload(): void;
    /**
     * Pause the upload
     */
    pause(): void;
    /**
     * Cancel uploading and reset all files to their initial states
     */
    cancel(): void;
    /**
     * Return the progress of the current upload as a float between 0 and 1
     */
    progress(): number;
    /**
     * Add a HTML5 File object to the list of files.
     */
    addFile(file: File, event: Event): void;
    /**
     * Add a list of HTML5 File objects to the list of files.
     */
    addFiles(files: File[], event: Event): void;
    /**
     * Add a validator function for the given file type. This can e.g. be used to read the file and validate
     * checksums based on certain properties.
     * @param fileType The file extension for the given validator
     * @param validator A callback function that should be called when validating files with the given type
     */
    addFileValidator(fileType: string, validator: Function): void;
    /**
     * Cancel the upload of a specific ResumableFile object and remove it from the file list.
     */
    removeFile(file: ResumableFile): void;
    /**
     * Retrieve a ResumableFile object from the file list by its unique identifier.
     */
    getFromUniqueIdentifier(uniqueIdentifier: string): ResumableFile;
    /**
     * Get the combined size of all files for the upload
     */
    getSize(): number;
    /**
     * Call the event handler when a file is dropped on the drag-and-drop area
     */
    handleDropEvent(e: DragEvent): void;
    /**
     * Call the event handler when the provided input element changes (i.e. receives one or multiple files.
     */
    handleChangeEvent(e: InputEvent): void;
    /**
     * Check whether the upload is completed, i.e. if all files were uploaded successfully.
     */
    checkUploadComplete(): void;
    /**
     * Event Handlers: This section should only include methods that are used to
     * handle events coming from the files or chunks.
     */
    /**
     * The event handler when a chunk was uploaded successfully
     */
    private handleChunkSuccess;
    /**
     * The event handler when a chunk was uploaded successfully
     */
    private handleChunkError;
    /**
     * The event handler when an error occurred during the upload of a chunk
     */
    private handleChunkCancel;
    /**
     * The event handler when an error occurred during the upload of a file
     */
    private handleFileError;
    /**
     * The event handler when all chunks from a file were uploaded successfully
     */
    private handleFileSuccess;
    /**
     * The event handler when a file progress event was received
     */
    private handleFileProgress;
    /**
     * The event handler when the upload of a file was canceled
     */
    private handleFileCancel;
    /**
     * The event handler, when the retry of a file was initiated
     */
    private handleFileRetry;
}
