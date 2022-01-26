import ResumableEventHandler from './resumableEventHandler';
import ResumableFile from './resumableFile';
import { ResumableChunkStatus, ResumableConfiguration } from './types/types';
/**
 * A file chunk that contains all the data that for a single upload request
 */
export default class ResumableChunk extends ResumableEventHandler {
    private fileObj;
    private fileObjSize;
    private fileObjType;
    private offset;
    private lastProgressCallback;
    private tested;
    private retries;
    private pendingRetry;
    private isMarkedComplete;
    private loaded;
    private startByte;
    private endByte;
    private xhr;
    private chunkSize;
    private forceChunkSize;
    private fileParameterName;
    chunkNumberParameterName: string;
    chunkSizeParameterName: string;
    currentChunkSizeParameterName: string;
    totalSizeParameterName: string;
    typeParameterName: string;
    identifierParameterName: string;
    fileNameParameterName: string;
    relativePathParameterName: string;
    totalChunksParameterName: string;
    throttleProgressCallbacks: number;
    query: object;
    headers: object;
    method: string;
    uploadMethod: string;
    testMethod: string;
    parameterNamespace: string;
    testChunks: boolean;
    maxChunkRetries: number;
    chunkRetryInterval?: number;
    permanentErrors: number[];
    withCredentials: boolean;
    xhrTimeout: number;
    chunkFormat: string;
    setChunkTypeFromFile: boolean;
    target: string;
    testTarget: string;
    constructor(fileObj: ResumableFile, offset: number, options: ResumableConfiguration);
    /**
     * Set the options provided inside the configuration object on this instance
     */
    setInstanceProperties(options: ResumableConfiguration): void;
    /**
     * Set the header values for the current XMLHttpRequest
     */
    setCustomHeaders(): void;
    /**
     * Get query parameters for this chunk as an object, combined with custom parameters if provided
     */
    get formattedQuery(): object;
    /**
     * Determine the status for this Chunk based on different parameters of the underlying XMLHttpRequest
     */
    get status(): ResumableChunkStatus;
    /**
     * Get the target url for the specified request type and the configured parameters of this chunk
     * @param requestType The type of the request, either 'test' or 'upload'
     */
    getTarget(requestType: string): string;
    /**
     * Makes a GET request without any data to see if the chunk has already been uploaded in a previous session
     */
    test(): void;
    /**
     * Abort and reset a request
     */
    abort(): void;
    /**
     *  Uploads the actual data in a POST call
     */
    send(): void;
    /**
     * Return the response text of the underlying XMLHttpRequest if it exists
     */
    message(): string;
    /**
     * Return the progress for the current chunk as a number between 0 and 1
     * @param relative Whether or not the progress should be calculated based on the size of the entire file
     */
    progress(relative?: boolean): number;
    /**
     * Mark this chunk as completed because it was already uploaded to the server.
     */
    markComplete(): void;
}
