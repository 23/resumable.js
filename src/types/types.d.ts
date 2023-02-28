import ResumableFile from '../resumableFile';

declare interface ExtendedFile extends File {
  uniqueIdentifier?: string,
  relativePath?: string,
}

declare const enum ResumableChunkStatus {
  PENDING ='chunkPending',
  UPLOADING = 'chunkUploading',
  SUCCESS = 'chunkSuccess',
  ERROR = 'chunkError',
}

declare interface ResumableConfiguration {
  /**
   * The target URL for the multipart POST request. This can be a string or a function that allows you to construct and return a value, based on supplied params. (Default: /)
   **/
  target?: string;
  /**
   * The size in bytes of each uploaded chunk of data. The last uploaded chunk will be at least this size and up to two the size, see Issue #51 for details and reasons. (Default: 1*1024*1024)
   **/
  chunkSize?: number;
  /**
   * Whether the value of the HTML element should be cleared after adding new files
   */
  clearInput ?: boolean;
  /**
   * The class name to add on drag over an assigned drop zone. (Default: `dragover`)
   */
  dragOverClass?: string;
  /**
   * Number of simultaneous uploads (Default: 3)
   **/
  simultaneousUploads?: number;
  /**
   * The name of the multipart POST parameter to use for the file chunk (Default: file)
   **/
  fileParameterName?: string;
  /**
   * The name of the chunk index (base-1) in the current upload POST parameter to use for the file chunk (Default: resumableChunkNumber)
   */
  chunkNumberParameterName?: string;
  /**
   * The name of the total number of chunks POST parameter to use for the file chunk (Default: resumableTotalChunks)
   */
  totalChunksParameterName?: string;
  /**
   * The time in milliseconds that defines the minimum time span between two progress callbacks
   */
  throttleProgressCallbacks?: number;
  /**
   * The name of the general chunk size POST parameter to use for the file chunk (Default: resumableChunkSize)
   */
  chunkSizeParameterName?: string;
  /**
   * The name of the total file size number POST parameter to use for the file chunk (Default: resumableTotalSize)
   */
  totalSizeParameterName?: string;
  /**
   * The name of the unique identifier POST parameter to use for the file chunk (Default: resumableIdentifier)
   */
  identifierParameterName?: string;
  /**
   * The name of the file category POST parameter to use for the file chunk (Default: resumableFileCategory)
   */
  fileCategoryParameterName?: string;
  /**
   * The name of the original file name POST parameter to use for the file chunk (Default: resumableFilename)
   */
  fileNameParameterName?: string;
  /**
   * The name of the file's relative path POST parameter to use for the file chunk (Default: resumableRelativePath)
   */
  relativePathParameterName?: string;
  /**
   * The name of the current chunk size POST parameter to use for the file chunk (Default: resumableCurrentChunkSize)
   */
  currentChunkSizeParameterName?: string;
  /**
   * The name of the file type POST parameter to use for the file chunk (Default: resumableType)
   */
  typeParameterName?: string;
  /**
   * Extra parameters to include in the multipart POST with data. This can be an object or a function. If a function, it will be passed a ResumableFile and a ResumableChunk object (Default: {})
   **/
  query?: Object;
  /**
   * Method for chunk test request. (Default: 'GET')
   **/
  testMethod?: string;
  /**
   * Method for chunk upload request. (Default: 'POST')
   **/
  uploadMethod?: string;
  /**
   * Extra prefix added before the name of each parameter included in the multipart POST or in the test GET. (Default: '')
   **/
  parameterNamespace?: string;
  /**
   * Extra headers to include in the multipart POST with data. This can be an object or a function that allows you to construct and return a value, based on supplied file (Default: {})
   **/
  headers?: Object | ((file: ResumableFile) => Object);
  /**
   * Method to use when POSTing chunks to the server (multipart or octet) (Default: multipart)
   **/
  method?: string;
  /**
   * Prioritize first and last chunks of all files. This can be handy if you can determine if a file is valid for your service from only the first or last chunk. For example, photo or video meta data is usually located in the first part of a file, making it easy to test support from only the first chunk. (Default: false)
   **/
  prioritizeFirstAndLastChunk?: boolean;
  /**
   * Make a GET request to the server for each chunks to see if it already exists. If implemented on the server-side, this will allow for upload resumes even after a browser crash or even a computer restart. (Default: true)
   **/
  testChunks?: boolean;
  /**
   * Override the function that generates unique identifiers for each file. (Default: null)
   **/
  generateUniqueIdentifier?: () => string;
  /**
   * Indicates how many files can be uploaded in a single session. Valid values are any positive integer and undefined for no limit. (Default: undefined)
   **/
  maxFiles?: number;
  /**
   * A function which displays the please upload n file(s) at a time message. (Default: displays an alert box with the message Please n one file(s) at a time.)
   **/
  maxFilesErrorCallback?: (files: ResumableFile) => void;
  /**
   * The minimum allowed file size. (Default: undefined)
   **/
  minFileSize?: number;
  /**
   * A function which displays an error a selected file is smaller than allowed. (Default: displays an alert for every bad file.)
   **/
  minFileSizeErrorCallback?: (file: ResumableFile) => void;
  /**
   * The maximum allowed file size. (Default: undefined)
   **/
  maxFileSize?: number;
  /**
   * A function which displays an error a selected file is larger than allowed. (Default: displays an alert for every bad file.)
   **/
  maxFileSizeErrorCallback?: (file: ResumableFile) => void;
  /**
   * The file categories that will be used. Every file that is added to this resumable instance can be added to any of
   * these categories.
   * The order of the categories in this array also determines the order in which files are uploaded (files of first
   * category are uploaded first). (Default: [], only the default category will be available.)
   */
  fileCategories?: string[];
  /**
   * The name of the default file category. This file category is always present, even when the fileCategories parameter
   * is not set. (Default: 'default').
   */
  defaultFileCategory?: string;
  /**
   * The file types allowed to upload. An empty array allow any file type. (Default: [])
   **/
  fileTypes?: string[];
  /**
   * A function which displays an error a selected file has type not allowed. (Default: displays an alert for every bad file.)
   **/
  fileTypeErrorCallback?: (file: ResumableFile) => void;
  /**
   * A function which displays an error when the validator for a given file has failed
   * @param file
   */
  fileValidationErrorCallback?: (file: ResumableFile) => void;
  /**
   * The maximum number of retries for a chunk before the upload is failed. Valid values are any positive integer and undefined for no limit. (Default: undefined)
   **/
  maxChunkRetries?: number;
  /**
   * The number of milliseconds to wait before retrying a chunk on a non-permanent error. Valid values are any positive integer and undefined for immediate retry. (Default: undefined)
   **/
  chunkRetryInterval?: number;
  /**
   * A list of HTTP errors that should be interpreted as failed requests
   */
  permanentErrors?: number[];
  /**
   * Standard CORS requests do not send or set any cookies by default. In order to include cookies as part of the request, you need to set the withCredentials property to true. (Default: false)
   **/
  withCredentials?: boolean;
  /**
   * The timeout in milliseconds for each request (Default: `0`)
   */
  xhrTimeout?: number;
  /**
   * The format of the chunk (Either Blob or base64)
   */
  chunkFormat?: string;
  /**
   * Whether or not the chunk content-type should be derived from original file.type.
   */
  setChunkTypeFromFile?: boolean;
  /**
   * The target URL for the GET request to the server for each chunk to see if it already exists.
   */
  testTarget?: string;
}
