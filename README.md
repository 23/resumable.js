## Who created Resumable.js?
The original library was developed and maintained mainly by [Steffen Fagerström Christensen](https://github.com/steffentchr) of [23](https://github.com/23).  
[Point Cloud Technology](https://github.com/pointcloudtechnology) (PCT) forked the original repo on Sep 24, 2020. Any development/changes in this repo from this point on was done by PCT.  
Big thanks to Steffen and 23 for providing us with this awesome piece of software! :D

## What is Resumable.js?

Resumable.js is a JavaScript library providing multiple simultaneous, stable and resumable uploads via the [`HTML5 File API`](http://www.w3.org/TR/FileAPI/).

The library is designed to introduce fault-tolerance into the upload of large files through HTTP. This is done by splitting each file into small chunks. Then, whenever the upload of a chunk fails, uploading is retried until the procedure completes. This allows uploads to automatically resume uploading after a network connection is lost either locally or to the server. Additionally, it allows for users to pause, resume and even recover uploads without losing state because only the currently uploading chunks will be aborted, not the entire upload.

Resumable.js does not have any external dependencies other than the `HTML5 File API`. This is relied on for the ability to chunk files into smaller pieces. Currently, this means that support is widely available.  
However, as we want to prevent the usage of polyfills for already widely adopted functions, really old browsers are not supported.  
Firefox 47+, Chrome 54+, Edge 14+, Safari 10.1 (all released around 2017) should be supported (though not all browsers and versions are tested). The Internet Explorer is not supported.

Examples are available in the `samples/` folder. Feel free to update the existing examples or add your own (via pull requests) to help document the project.  
(Some examples might be outdated, but should give an overview for how to work with this package. In general they should still work, but might not use newer/updated functionality. We'll try to go through the examples and update them as soon as possible (see issue #12), but this doesn't have a high priority right now.)

## How can I use it?

A new `Resumable` object is created with information of what and where to post:

```js
try {
  var r = new Resumable({
    target:'/api/photo/redeem-upload-token',
    query:{upload_token: 'my_token'}
  });
} catch (error) {
  // Resumable.js is very likely not supported in this browser, fall back on a different method.
  if(!r.support) location.href = '/some-other-uploader';
}
```

To allow files to be selected and drag-dropped, you need to assign a drop target and a DOM item to be clicked for browsing:

```js
r.assignBrowse(document.getElementById('browseButton'));
r.assignDrop(document.getElementById('dropTarget'));
```
It is recommended to use an HTML span for the browse button.  
Using an actual button does not work reliably across all browsers, because Resumable.js creates the file input as a child of this control, and this may be invalid in the case of an HTML button.

Alternatively you can let Resumable handle some input or drop events that occurred outside of the package on any element that you added a listener to:

```js
r.handleChangeEvent(inputEvent);
r.handleDropEvent(dropEvent);
```
The `inputEvent` needs to be the [input event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) of a [file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file).  
The `dropEvent` needs to be the [drop event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event) of any HTML element.

After this, interaction with Resumable.js is done by listening to events:

```js
r.on('fileAdded', (file, event, fileCategory) => {
  ...
});
r.on('fileSuccess', (file, message, fileCategory) => {
  ...
});
r.on('error', (message, file, fileCategory) => {
  ...
});
```

A full list of events can be found below.

## How do I set it up with my server?

Most of the magic for Resumable.js happens in the user's browser, but files still need to be reassembled from chunks on the server side. This should be a fairly simple task and can be achieved using any web framework or language that is capable of handling file uploads.

To handle the state of upload chunks, a number of extra parameters are sent along with all requests:

* `resumableChunkNumber`: The index of the chunk in the current upload. First chunk is `1` (no base-0 counting here).
* `resumableTotalChunks`: The total number of chunks.
* `resumableChunkSize`: The general chunk size. Using this value and `resumableTotalSize` you can calculate the total number of chunks. Please note that the size of the data received in the HTTP might be higher than `resumableChunkSize` for the last chunk for a file. See `resumableCurrentChunkSize`.
* `resumableCurrentChunkSize` The actual size of the current chunk. For the last chunk of a file this might be smaller thant the general chunk size provided by `resumableChunkSize`, because the size of a file is usually not an exact multiple of the defined chunk size.
* `resumableTotalSize`: The total file size.
* `resumableIdentifier`: A unique identifier for the file contained in the request.
* `resumableFilename`: The original file name (since a bug in Firefox results in the file name not being transmitted in chunk multipart posts).
* `resumableRelativePath`: The file's relative path when selecting a directory (might default to the file name if not supported by the client browser).
* `resumableFileCategory`: The category that the file belongs to.

You should allow for the same chunk to be uploaded more than once; this isn't standard behaviour, but on an unstable network environment it could happen, and this case is exactly what Resumable.js is designed for.

For every request, you can confirm reception in HTTP status codes (can be changed through the `permanentErrors` option):

* `200`, `201`: The chunk was accepted and correct. No need to re-upload.
* `400`, `401`, `403`, `404`, `409`, `415`, `500`, `501`: The file for which the chunk was uploaded is not supported, cancel the entire upload.
* _Anything else_: Something went wrong, but try reuploading the file.

## Handling GET (or `test()` requests)

Enabling the `testChunks` option will allow uploads to be resumed after browser restarts and even across browsers (in theory you could even run the same file upload across multiple tabs or different browsers).  
The `POST` data requests listed are required to use Resumable.js to receive data, but you can extend support by implementing a corresponding `GET` request with the same parameters:

* If this request returns a `200` HTTP code, the chunk is assumed to have been completed.
* If the request returns anything else, the chunk will be uploaded in the standard fashion. (It is recommended to return *204 No Content* in these cases if possible to [avoid unwarranted notices in browser consoles](https://github.com/23/resumable.js/issues/160).)

After this is done and `testChunks` enabled, an upload can quickly catch up even after a browser restart by simply verifying already uploaded chunks that do not need to be uploaded again.

## Full documentation

### Resumable
#### Configuration

The object is loaded with a configuration hash:

```js
var r = new Resumable({opt1:'val', ...});
```

All POST parameters can be omitted by setting them to a falsy value (e.g. `null`, `false` or empty string).
Available configuration options are:

* `target` The target URL for the multipart POST request. This can be a `string` or a `function` that allows you you to construct and return a value, based on supplied `params`. (Default: `/`)
* `testTarget` The target URL for the GET request to the server for each chunk to see if it already exists. This can be a `string` or a `function` that allows you you to construct and return a value, based on supplied `params`. (Default: `null`)
* `chunkSize` The size in bytes of each uploaded chunk of data. The last uploaded chunk will be at least this size and up to two the size, see [Issue #51](https://github.com/23/resumable.js/issues/51) for details and reasons. (Default: `1*1024*1024`)
* `chunkFormat` The format of the chunk (Either Blob or base64). (Default: `blob`)
* `simultaneousUploads` Number of simultaneous uploads (Default: `3`)
* `throttleProgressCallbacks` The time in milliseconds that defines the minimum time span between two progress callbacks. (Default: `0.5`)
* `fileParameterName` The name of the multipart request parameter to use for the file chunk (Default: `file`)
* `chunkNumberParameterName` The name of the chunk index (base-1) in the current upload POST parameter to use for the file chunk (Default: `resumableChunkNumber`)
* `totalChunksParameterName` The name of the total number of chunks POST parameter to use for the file chunk (Default: `resumableTotalChunks`)
* `chunkSizeParameterName` The name of the general chunk size POST parameter to use for the file chunk (Default: `resumableChunkSize`)
* `totalSizeParameterName` The name of the total file size number POST parameter to use for the file chunk (Default: `resumableTotalSize`)
* `identifierParameterName` The name of the unique identifier POST parameter to use for the file chunk (Default: `resumableIdentifier`)
* `fileCategoryParameterName` The name of the file category POST parameter to use for the file chunk. (Default: `resumableFileCategory`)
* `fileNameParameterName` The name of the original file name POST parameter to use for the file chunk (Default: `resumableFilename`)
* `relativePathParameterName` The name of the file's relative path POST parameter to use for the file chunk (Default: `resumableRelativePath`)
* `currentChunkSizeParameterName` The name of the current chunk size POST parameter to use for the file chunk (Default: `resumableCurrentChunkSize`)
* `typeParameterName` The name of the file type POST parameter to use for the file chunk (Default: `resumableType`)
* `query` Extra parameters to include in the multipart request with data. This can be an object or a function. If a function, it will be passed a ResumableFile and a ResumableChunk object (Default: `{}`)
* `testMethod` Method for chunk test request. (Default: `'GET'`)
* `uploadMethod` HTTP method to use when sending chunks to the server (`POST`, `PUT`, `PATCH`) (Default: `POST`)
* `parameterNamespace` Extra prefix added before the name of each parameter included in the multipart POST or in the test GET. (Default: `''`)
* `headers` Extra headers to include in the multipart POST with data. This can be an `object` or a `function` that allows you to construct and return a value, based on supplied `file` (Default: `{}`)
* `method` Method to use when sending chunks to the server (`multipart` or `octet`) (Default: `multipart`)
* `prioritizeFirstAndLastChunk` Prioritize first and last chunks of all files. This can be handy if you can determine if a file is valid for your service from only the first or last chunk. For example, photo or video meta data is usually located in the first part of a file, making it easy to test support from only the first chunk. (Default: `false`)
* `testChunks` Make a GET request to the server for each chunks to see if it already exists. If implemented on the server-side, this will allow for upload resumes even after a browser crash or even a computer restart. (Default: `true`)
* `preprocess` Optional function to process each chunk before testing & sending. Function is passed the chunk as parameter, and should call the `preprocessFinished` method on the chunk when finished. (Default: `null`)
* `preprocessFile` Optional function to process each file before testing & sending the corresponding chunks. Function is passed the file as parameter, and should call the `preprocessFinished` method on the file when finished. (Default: `null`)
* `generateUniqueIdentifier(file, event)` Override the function that generates unique identifiers for each file. May return [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)-like object with `then()` method for asynchronous id generation. Parameters are the ES `File` object and the event that led to
adding the file. (Default: `null`)
* `maxFiles` Indicates how many files can be uploaded in a single session. Valid values are any positive integer and `undefined` for no limit. (Default: `undefined`)
* `maxFilesErrorCallback(files, errorCount)` A function which displays the *please upload n file(s) at a time* message. (Default: displays an alert box with the message *Please n one file(s) at a time.*)
* `minFileSize` The minimum allowed file size.  (Default: `undefined`)
* `minFileSizeErrorCallback(file, errorCount)` A function which displays an error when a selected file is smaller than allowed. (Default: displays an alert for every bad file.)
* `maxFileSize` The maximum allowed file size.  (Default: `undefined`)
* `maxFileSizeErrorCallback(file, errorCount)` A function which displays an error when a selected file is larger than allowed. (Default: displays an alert for every bad file.)
* `fileCategories` The file categories that will be used. Every file that is added to this resumable instance can be added to any of these categories. The order of the categories in this array also determines the order in which files are uploaded (files of first category are uploaded first). (Default: `[]`, only the default category will be available.)
* `defaultFileCategory` The name of the default file category. This file category is always present, even when the fileCategories parameter is not set. If null is passed, the default category is not used. In this case, `fileCategories` must be set. (Default: `'default'`).
* `fileTypes` The file types allowed to upload. If this is an array, the file types are used for all defined file categories. Otherwise this needs to be an object, with an entry for every file category (category name as key, array of allowed file types as value). An empty array (either in the object or standalone) allows for any file type. Can also be changed later by calling `setFileTypes()`. (Default: `[]`)
* `fileTypeErrorCallback(file)` A function which displays an error when a selected file has a type that is not allowed. (Default: displays an alert for every bad file.)
* `fileValidationErrorCallback(file)` A function which displays an error when the validator for a given file has failed.
* `maxChunkRetries` The maximum number of retries for a chunk before the upload is failed. Valid values are any positive integer and `undefined` for no limit. (Default: `undefined`)
* `permanentErrors` List of HTTP status codes that define if the chunk upload was a permanent error and should not retry the upload. (Default: `[400, 401, 403, 404, 409, 415, 500, 501]`)
* `chunkRetryInterval` The number of milliseconds to wait before retrying a chunk on a non-permanent error.  Valid values are any positive integer and `undefined` for immediate retry.  (Default: `undefined`)
* `withCredentials` Standard CORS requests do not send or set any cookies by default. In order to include cookies as part of the request, you need to set the `withCredentials` property to true. (Default: `false`)
* `xhrTimeout` The timeout in milliseconds for each request (Default: `0`)
* `setChunkTypeFromFile` Set chunk content-type from original file.type. (Default: `false`, if `false` default Content-Type: `application/octet-stream`)
* `dragOverClass` The class name to add on drag over an assigned drop zone. (Default: `dragover`)
* `clearInput` Whether the value of the HTML element that received the file input event should be cleared after adding new files. This is done for elements added via `assignBrowse` and also for elements that received the event given to `handleChangeEvent`. (Default: `true`).

#### Properties
* `.isUploading` *[readonly]* Is `true` when the instance is uploading (as long as at least one chunk of any file is currently uploading). `false` otherwise.

#### Methods

* `.assignBrowse(domNodes, isDirectory, fileCategory)` Assign a browse action to one or more DOM nodes. Pass in `true` for `isDirectory` to allow directories to be selected (Chrome only). Pass any file category (as string) for `fileCategory` to assign this file category to all files added via the DOM nodes (defaults to the `defaultFileCategory`).  
See the note above about using an HTML span instead of an actual button.
* `.assignDrop(domNodes, fileCategory)` Assign one or more DOM nodes as a drop target. Pass any file category (as string) for `fileCategory` to assign this file category to all files added via the DOM nodes (defaults to the `defaultFileCategory`).
* `.unAssignDrop(domNodes)` Remove one or more DOM nodes as a drop target.
* `.setFileTypes(fileTypes, domNode, fileCategory)` Set the file types allowed to upload. Optionally pass a DOM node (HTMLInputElement) on which the accepted file types should be updated as well. Pass any file category (as string) for `fileCategory` to set the file types for this file category (defaults to the `defaultFileCategory`).
* `.handleChangeEvent(inputEvent, fileCategory)` Call the event handler for an InputEvent (i.e. received one or multiple files). Also used internally when an input occurs on an element that was added via `assignBrowse()`. `fileCategory` needs to be a valid file category (defaults to the `defaultFileCategory`).
* `.handleDropEvent(dropEvent, fileCategory)` Call the event handler for a DragEvent (when a file is dropped on a drop area). Also used internally when a drop occurs on an element that was added via `assignDrop()`. `fileCategory` needs to be a valid file category (defaults to the `defaultFileCategory`).
* `.on(event, callback)` Listen for an event from Resumable.js. A full list of events can be found below.
* `.upload()` Start or resume uploading.
* `.pause()` Pause uploading.
* `.cancel()` Cancel upload of all `ResumableFile` objects and empty file list.
* `.progress()` Returns a float between 0 and 1 indicating the current upload progress of all files.
* `.addFile(file, fileCategory)` Add a HTML5 File object to the list of files and assign the given `fileCategory` (defaults to the `defaultFileCategory`).
* `.addFiles(files)` Add an Array of HTML5 File objects to the list of files and assign the given `fileCategory` to every file (defaults to the `defaultFileCategory`).
* `addFileValidator(fileType, validatorFunction)` Add a validator function for the given file type. This can e.g. be used to read the file and validate checksums based on certain properties. `fileType` is the extension of the files that should be validated. `validatorFunction` is the function to validate the files.
  * File validators can either return a function or a promise that returns a boolean determining if validation passed or not. E.g. to validate the signature bytes of a zip file:  
  ```js
  r.addFileValidator('zip', (file) => {
    const readerPromise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event) => resolve(event.target.result);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file.slice(0, 4));
    });

    return readerPromise.then((result) => {
      const result = new Uint32Array(result);
      return result[0] === 0x04034b50;
    });
  })
  ```
* `.removeFile(file)` Cancel upload of a specific `ResumableFile` and remove it from the file list.
* `.getFromUniqueIdentifier(uniqueIdentifier)` Look up a `ResumableFile` object by its unique identifier and return it.
* `.getSize()` Returns the total size of the upload in bytes.

#### Events

The `Resumable` object fires events in different steps of the chunking and upload process.
This includes events which occur on the top level (in the `Resumable` object itself), like `fileProcessingBegin`, but also all events that are fired by any `ResumableChunk` or by any `ResumableFile`.
The re-fired events might contain additional information, but will always contain the information that was originally sent by the `ResumableChunk` or the `ResumableFile`.
To listen to any event just call `.on('<event name>', callback())` on the `Resumable` object. E.g.:
```js
r.on('fileAdded', (file, event, fileCategory) => {
    ...
});
```

#### List of all events (parameters that are provided to the event listener are in parenthesis)
##### Main Resumable events:
* `fileProcessingBegin (htmlFiles, fileCategory)` File processing (e.g. transforming to chunks) of the provided [HTML files](https://developer.mozilla.org/en-US/docs/Web/API/File) has begun. The files are all part of the provided file category.
* `fileProcessingFailed (htmlFile, reason, fileCategory)` The processing of the provided [HTML file](https://developer.mozilla.org/en-US/docs/Web/API/File) failed because of the given `reason`. The file belongs to the provided file category.  
  If `file` is undefined, the processing failed in general (e.g. unknown file category) and not because of a specific file.  
  (The `file` is actually an extended version of the normal HTML file. It additionally contains a `uniqueIdentifier` and a `relativePath` which defaults to the filename if no path information is available.)  
  `reason` can be:
  * `unknownFileCategory` While validating files (e.g. added via `addFiles()`) the given file category was unknown. Usually Resumable should already throw an error somewhere else before this happens.
  * `maxFiles` More files than allowed (set via `maxFiles`) were added.
  * `duplicate` The same file has already been added before.
  * `fileType` The file type of the file is not part of the allowed file types (set via `fileTypes` or `setFileTypes()`).
  * `minFileSize` The file is smaller than the allowed minimum file size (set via `minFileSize`).
  * `maxFileSize` The file is bigger than the allowed maximum file size (set via `maxFileSize`).
  * `validation` Validation of the file failed (can only happen if a validator for the corresponding file type was provided).
* `fileAdded (file, event, fileCategory)` A new `ResumableFile` of the given file category was added. The DOM `event` object from when the [HTML file](https://developer.mozilla.org/en-US/docs/Web/API/File) was added is also provided.
* `filesAdded (files, skippedFiles, fileCategory)` New `ResumableFile`s of the given file category were added. All `ResumableFile`s that were skipped (e.g. due to some processing error) are also provided. `fileProcessingFailed` events were very likely fired for all skipped files.
* `uploadStart ()` Upload has been started.
* `pause ()` Upload was paused.
* `progress()` Upload progressed.
  * This will always be fired together with a corresponding `fileProgress` event.
* `complete ()` Upload of all files from all file categories is complete.
* `categoryComplete (fileCategory)` Upload of all files of the provided file category is complete.
  * If the completed category was the last one to complete its upload, a `complete` event is fired afterwards.
* `beforeCancel ()` Upload is about to be cancelled. Triggers before anything is actually happening in the cancelling process, allowing to do any additional processing, e.g. on currently uploading files.
  * This will be followed by a `chunkCancel` event for all currently uploading chunks.
  * This will be followed by a `fileCancel` event for all `ResumableFiles`.
* `cancel ()` Upload was canceled.
  * This will be fired after all `chunkCancel` and `fileCancel` events were fired.
* `error (message, file, fileCategory)` An error occurred during upload of the provided `ResumableFile` of the provided file category. `message` is the response body from the server that was given when the error occurred (while uploading a chunk).
  * This will always be fired together with a corresponding `fileError` event, that contains the same information but in different order.  
  As there currently are no other errors than `fileErrors`, there is no advantage in using one over the other.

##### ResumableFile events:
* `chunkingStart (file, fileCategory)` The chunking process for the provided `ResumableFile` of the provided file category has been started.
* `chunkingProgress (file, progress, fileCategory)` The chunking process for the provided `ResumableFile` of the provided file category progressed. The current progress (0.0 to 1.0) is also provided.
* `chunkingComplete (file, fileCategory)` The chunking process for the provided `ResumableFile` of the provided file category has been started.
* `fileProgress (file, message, fileCategory)` The upload of the provided `ResumableFile` of the provided file category has progressed. `message` is the last response body that was received from the server (for the successful chunk upload).
  * This will always be fired together with a corresponding `progress` event.
* `fileSuccess (file, message, fileCategory)` Upload of the provided `ResumableFile` of the provided file category is complete. `message` is the last received response body from the server.
* `fileCancel (file, fileCategory)` Upload of the provided `ResumableFile` of the provided file category has been canceled.
  * This is fired after all corresponding `chunkCanceled` events of this `ResumableFile`.
  * This is always followed by a `fileProgress` event (as upload progress is reset to 0).
* `fileError (file, message, fileCategory)` An error occurred during upload of the provided `ResumableFile` of the provided file category. `message` is the response body from the server that was given when the error occurred (while uploading a chunk).
  * This will always be fired together with a corresponding `error` event, that contains the same information but in different order.  
  As there currently are no other errors than `fileErrors`, there is no advantage in using one over the other.
* `fileRetry (file, message, fileCategory)` The upload of the provided `ResumableFile` of the provided file category or the upload of one of its chunks is being retried. `message` is the last received response body from the server before the retry was started.

##### ResumableChunk events:
* `chunkProgress (chunk, message, fileCategory)` The upload of the provided `ResumableChunk` of a `ResumableFile` of the provided file category has progressed. `message` is the last received response body from the server.
  * This will always be fired together with a corresponding `fileProgress` event.
* `chunkSuccess (chunk, message, fileCategory)` The upload of the provided `ResumableChunk` of a `ResumableFile` of the provided file category is complete. `message` is the last received response body from the server.
  * This will always be fired together with a corresponding `fileProgress` event.
  * If this was the last chunk of a file, a `fileSuccess` event will also be fired.
* `chunkCancel (chunk, fileCategory)` The upload of the provided `ResumableChunk` of a `ResumableFile` of the provided file category was canceled.
  * If this was the last chunk that needed to be cancelled for the corresponding `ResumableFile` a `fileCancel` event will also be fired.
* `chunkError (chunk, message, fileCategory)` An error occurred during upload of the provided `ResumableChunk` of a `ResumableFile` of the provided file category. `message` is the response body from the server that was given when the error occurred.
  * This will always be followed by a corresponding `fileError` event.
* `chunkRetry (chunk, message, fileCategory)` The upload of the provided `ResumableChunk` of a `ResumableFile` of the provided file category is being retried. `message` is the last received response body from the server before the retry was started.
  * This will always be followed by a corresponding `fileRetry` event.

### ResumableFile
#### Properties

* `.file` The correlating HTML5 `File` object.
* `.fileName` The name of the file.
* `.relativePath` The relative path to the file (defaults to file name if relative path doesn't exist)
* `.size` Size in bytes of the file.
* `.fileCategory` The file category this file belongs to.
* `.uniqueIdentifier` A unique identifier assigned to this file object. This value is included in uploads to the server for reference, but can also be used in CSS classes etc when building your upload UI.
* `.chunks` An array of `ResumableChunk` items. You shouldn't need to dig into these.
* `.isUploading` *[readonly]* A boolean indicating whether file chunks is uploading.
* `.isComplete` *[readonly]* A boolean indicating whether the file has completed uploading and received a server response.

#### Methods

* `.progress()` Returns a float between 0 and 1 indicating the current upload progress of the file.
* `.abort()` Abort uploading the file.
* `.cancel()` Abort uploading the file and delete it from the list of files to upload.
* `.retry()` Retry uploading the file. This will also remove and recreate all chunks of this file.

### ResumableChunk
You should generally not need to mess around with the single chunks of a file. Usually working with the main `Resumable` object and sometimes with the `ResumableFile`s is enough. So use the following properties and functions with care!

#### Properties
* `.formattedQuery` *[readonly]* The query parameters for this chunk as an object, combined with custom parameters if provided.
* `.status` *[readonly]* The status for this Chunk based on different parameters of the underlying [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).

#### Methods

* `.getTarget(requestType)` Get the target url for the specified request type and the configured parameters of this chunk. `requestType` can either be `"test"` or `"upload"`.
* `send()` Upload this chunk. If `testChunks` is `true`, this will first send a test GET request to the server. In this case, if the chunk was already uploaded previously, it won't be uploaded again.
* `abort()` Abort the currently running upload of this chunk. If no upload is running, this function does nothing.
* `message()` Get the last server response of the underlying [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest). If no XMLHttpRequest is present (no upload is running and no test request was sent), this returns an empty string.
* `progress(relative)` Return the upload progress for the current chunk as a number between 0 and 1. If `relative` is `true`, the progress will be calculated based on the size of the entire file (e.g. if the file is 10mb with two chunks of 5mb each, this function returns `0.5` for the first chunk if the chunk is uploaded and `relative` is `true`. If `relative` is `false` it returns `1.0` in this case.).
* `markComplete()` Mark this chunk as completed (as already uploaded). You should usually not have to call this manually as resumable is handling that already.


## Alternatives

This library is explicitly designed for modern browsers supporting advanced HTML5 file features, and the motivation has been to provide stable and resumable support for large files (allowing uploads of several GB files through HTTP in a predictable fashion).  
If your aim is just to support progress indications during upload/uploading multiple files at once, Resumable.js isn't for you. In those cases, something like [Plupload](http://plupload.com/) provides the same features with wider browser support.
