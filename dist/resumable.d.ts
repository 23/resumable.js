import ResumableFile from './resumableFile';
import ResumableEventHandler from './resumableEventHandler';
import { ResumableConfiguration } from './types/types';
/**
 * An instance of a resumable upload handler that contains one or multiple files which should be uploaded in chunks.
 */
export declare class Resumable extends ResumableEventHandler {
    private opts;
    /**
     * An object that contains one entry for every file category. The key is the category name, the value is an array of
     * all ResumableFiles of that category that were added to this instance.
     */
    private files;
    /**
     * Contains all file categories for which the upload was not yet completed.
     */
    private uncompletedFileCategories;
    private validators;
    private support;
    clearInput: boolean;
    dragOverClass: string;
    fileCategories: string[];
    defaultFileCategory: string | null;
    fileTypes: string[] | {
        [fileCategory: string]: string[];
    };
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
    private sanitizeFileTypes;
    private throwIfUnknownFileCategory;
    /**
     * Transforms a single fileEntry or directoryEntry item into a list of File objects this method is used to convert
     * entries found inside dragged-and-dropped directories.
     * @param {Object} item item to upload, may be file or directory entry
     * @param {string} path current file path
     */
    private mapDirectoryItemToFile;
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
     * If "assignDrop" was used to assign the drop events to an element, we automatically add the "dragOverClass" CSS
     * class to the element when a file is dropped onto it. In this case, we have to remove that class again before
     * calling "onDrop()".
     * If "onDrop()" is called from "handleDropEvent()" this is not needed.
     */
    private removeDragOverClassAndCallOnDrop;
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
     * @param fileCategory The file category that has been provided for the files. Defaults to `defaultFileCategory`.
     */
    private validateFiles;
    /**
     * Add an array of files to this instance's file list (of the file category, if given) by creating new ResumableFiles.
     * This includes a validation and deduplication of the provided array.
     * @param fileList An array containing File objects
     * @param event The event with which the fileList was provided
     * @param fileCategory The file category that has been provided for the file. Defaults to `defaultFileCategory`.
     */
    private appendFilesFromFileList;
    /**
     * Generate a new unique identifier for a given file either with a default helper function or with a custom
     * generator function.
     * @param file The file as an HTML 5 File object
     * @param event The event with which the file was provided originally
     * @param fileCategory The file category that has been provided for the file. Defaults to `defaultFileCategory`.
     */
    private generateUniqueIdentifier;
    /**
     * Queue a new chunk to be uploaded that is currently awaiting upload.
     */
    private uploadNextChunk;
    /**
     * Returns all ResumableFiles of all file categories.
     * The files are ordered by the order of the file categories in `this.fileCategories`. Files of the first category
     * are added first, files of the second category are added second etc.
     *
     * @returns {ResumableFile[]} Array of all ResumableFiles that are stored for any category.
     */
    private getFilesOfAllCategories;
    /**
     *  PUBLIC METHODS FOR RESUMABLE.JS
     *  This section only includes methods that should be callable from external packages.
     */
    /**
     * Assign a browse action to one or more DOM nodes. Pass in true to allow directories to be selected (Chrome only).
     *
     * @param domNodes The dom nodes to which the browse action should be assigned (can be an array or a single dom node).
     * @param isDirectory If true, directories can be added via the file picker (Chrome only).
     * @param fileCategory The file category that will be assigned to all added files. Defaults to `defaultFileCategory`.
     */
    assignBrowse(domNodes: HTMLElement | HTMLElement[], isDirectory?: boolean, fileCategory?: string): void;
    /**
     * Assign one or more DOM nodes as a drop target.
     *
     * @param domNodes The dom nodes to which the drop action should be assigned (can be an array or a single dom node).
     * @param fileCategory The file category that will be assigned to all added files. Defaults to `defaultFileCategory`.
     */
    assignDrop(domNodes: HTMLElement | HTMLElement[], fileCategory?: string): void;
    /**
     * Remove one or more DOM nodes as a drop target.
     */
    unAssignDrop(domNodes: HTMLElement | HTMLElement[]): void;
    /**
     * Set the file types allowed to upload.
     * Per default the file types are updated for the default file category.
     * Optionally pass a dom node on which the accepted file types should be updated as well.
     *
     * @param fileTypes String array of all allowed file types
     * @param domNode An optional HTMLInputElement for which the "accepted" attribute should be updated accordingly.
     * @param fileCategory The file category for which the file types should be updated. Defaults to `defaultFileCategory`.
     */
    setFileTypes(fileTypes: string[], domNode?: HTMLInputElement, fileCategory?: string): void;
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
    addFile(file: File, event: Event, fileCategory?: string): void;
    /**
     * Add a list of HTML5 File objects to the list of files.
     */
    addFiles(files: File[], event: Event, fileCategory?: string): void;
    /**
     * Add a validator function for the given file type. This can e.g. be used to read the file and validate
     * checksums based on certain properties.
     * @param fileType The file extension for the given validator
     * @param validator A callback function that should be called when validating files with the given type
     */
    addFileValidator(fileType: string, validator: Function): void;
    /**
     * Remove the given resumable file from the file list (of its corresponding file category).
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
     * Call the event handler for a DragEvent (when a file is dropped on a drop area).
     */
    handleDropEvent(e: DragEvent, fileCategory?: string): void;
    /**
     * Call the event handler for an InputEvent (i.e. received one or multiple files).
     */
    handleChangeEvent(e: InputEvent, fileCategory?: string): void;
    /**
     * Check whether the upload is completed (if all files of a category are uploaded and if all files in general are
     * uploaded).
     */
    checkUploadComplete(): void;
    /**
     * Event Handlers: This section should only include methods that are used to
     * handle events coming from the files or chunks.
     */
    /**
     * The event handler when the chunking of a file was started
     */
    private handleChunkingStart;
    /**
     * The event handler when there was any progress while chunking a file
     */
    private handleChunkingProgress;
    /**
     * The event handler when the chunking of a file was completed
     */
    private handleChunkingComplete;
    /**
     * The event handler when a chunk was uploaded successfully
     */
    private handleChunkSuccess;
    /**
     * The event handler when an error happened while uploading a chunk
     */
    private handleChunkError;
    /**
     * The event handler when an the upload of a chunk was canceled
     */
    private handleChunkCancel;
    /**
     * The event handler when the upload of a chunk is being retried
     */
    private handleChunkRetry;
    /**
     * The event handler when there is any progress while uploading a chunk
     */
    private handleChunkProgress;
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
