## Resumable.js v2

Resumable.js is a JavaScript library providing multiple simultaneous, stable and resumable uploads via the HTML5 File API. 

The library is designed to introduce fault-tolerance into the upload of large files through HTTP. This is done by splitting each file into small chunks. Then, whenever the upload of a chunk fails, uploading is retried until the procedure completes. This allows uploads to automatically resume uploading after a network connection is lost either locally or to the server. Additionally, it allows for users to pause, resume and even recover uploads without losing state because only the currently uploading chunks will be aborted, not the entire upload.

Resumable.js does not have any external dependencies other than the `HTML5 File API`. This is relied on for the ability to chunk files into smaller pieces. Currently, this means that support is limited to Firefox 4+, Chrome 11+, Safari 6+ and Internet Explorer 10+.

Samples and examples are available in the `samples/` folder. Please push your own as Markdown to help document the project.

## How can I use it?

A new `Resumable` object is created with information of what and where to post:

    var r = new Resumable({
      target:'/api/photo/redeem-upload-token', 
      query:{upload_token:'my_token'}
    });
    // Resumable.js isn't supported, fall back on a different method
    if(!r.support) location.href = '/some-old-crappy-uploader';
  
To allow files to be either selected and drag-dropped, you'll assign drop target and a DOM item to be clicked for browsing:

    r.assignBrowse(document.getElementById('browseButton'));
    r.assignDrop(document.getElementById('dropTarget'));

After this, interaction with Resumable.js is done by listening to events:

    r.on('fileAdded', function(file, event){
        ...
      });
    r.on('fileSuccess', function(file,message){
        ...
      });
    r.on('fileError', function(file, message){
        ...
      });

## How do I set it up with my server?

Most of the magic for Resumable.js happens in the user's browser, but files still need to be reassembled from chunks on the server side. This should be a fairly simple task and can be achieved in any web framework or language, which is able to receive file uploads.

To handle the state of upload chunks, a number of extra parameters are sent along with all requests:

* `resumableChunkNumber`: The index of the chunk in the current upload. First chunk is `1` (no base-0 counting here).
* `resumableTotalChunks`: The total number of chunks.  
* `resumableChunkSize`: The general chunk size. Using this value and `resumableTotalSize` you can calculate the total number of chunks. Please note that the size of the data received in the HTTP might be lower than `resumableChunkSize` of this for the last chunk for a file.
* `resumableTotalSize`: The total file size.
* `resumableIdentifier`: A unique identifier for the file contained in the request.
* `resumableFilename`: The original file name (since a bug in Firefox results in the file name not being transmitted in chunk multipart posts).
* `resumableRelativePath`: The file's relative path when selecting a directory (defaults to file name in all browsers except Chrome).

You should allow for the same chunk to be uploaded more than once; this isn't standard behaviour, but on an unstable network environment it could happen, and this case is exactly what Resumable.js is designed for.

For every request, you can confirm reception in HTTP status codes (can be change through the `permanentErrors` option):

* `200`: The chunk was accepted and correct. No need to re-upload.
* `415`. `500`, `501`: The file for which the chunk was uploaded is not supported, cancel the entire upload. 
* _Anything else_: Something went wrong, but try reuploading the file.

## Handling GET (or `test()` requests)

Enabling the `testChunks` option will allow uploads to be resumed after browser restarts and even across browsers (in theory you could even run the same file upload across multiple tabs or different browsers).  The `POST` data requests listed are required to use Resumable.js to receive data, but you can extend support by implementing a corresponding `GET` request with the same parameters:

* If this request returns a `200` HTTP code, the chunks is assumed to have been completed.
* If the request returns anything else, the chunk will be uploaded in the standard fashion.

After this is done and `testChunks` enabled, an upload can quickly catch up even after a browser restart by simply verifying already uploaded chunks that do not need to be uploaded again.

## Full documentation

### Resumable
#### Configuration

The object is loaded with a configuation hash:

    var r = new Resumable({opt1:'val', ...});
    
Available configuration options are:

* `target` The target URL for the multipart POST request (Default: `/`)
* `chunkSize` The size in bytes of each uploaded chunk of data. The last uploaded chunk will be at least this size and up to two the size, see [Issue #51](https://github.com/23/resumable.js/issues/51) for details and reasons. (Default: `1*1024*1024`)
* `forceChunkSize` Force all chunks to be less or equal than chunkSize. Otherwise, the last chunk will be greater than or equal to `chunkSize`. (Default: `false`)
* `simultaneousUploads` Number of simultaneous uploads (Default: `3`)
* `fileParameterName` The name of the multipart POST parameter to use for the file chunk  (Default: `file`)
* `query` Extra parameters to include in the multipart POST with data. This can be an object or a function. If a function, it will be passed a ResumableFile and a ResumableChunk object (Default: `{}`)
* `headers` Extra headers to include in the multipart POST with data (Default: `{}`)
* `method` Method to use when POSTing chunks to the server (`multipart` or `octet`) (Default: `multipart`)
* `prioritizeFirstAndLastChunk` Prioritize first and last chunks of all files. This can be handy if you can determine if a file is valid for your service from only the first or last chunk. For example, photo or video meta data is usually located in the first part of a file, making it easy to test support from only the first chunk. (Default: `false`)
* `testChunks` Make a GET request to the server for each chunks to see if it already exists. If implemented on the server-side, this will allow for upload resumes even after a browser crash or even a computer restart. (Default: `true`)
* `preprocess` Optional function to process each chunk before testing & sending. Function is passed the chunk as parameter, and should call the `preprocessFinished` method on the chunk when finished. (Default: `null`)
* `generateUniqueIdentifier` Override the function that generates unique identifiers for each file.  (Default: `null`)
* `maxChunkRetries` The maximum number of retries for a chunk before the upload is failed. Valid values are any positive integer and `undefined` for no limit. (Default: `undefined`)
* `chunkRetryInterval` The number of milliseconds to wait before retrying a chunk on a non-permanent error.  Valid values are any positive integer and `undefined` for immediate retry.  (Default: `undefined`)


#### Properties

* `.support` A boolean value indicator whether or not Resumable.js is supported by the current browser.
* `.opts` A hash object of the configuration of the Resumable.js instance.
* `.files` An array of `ResumableFile` file objects added by the user (see full docs for this object type below).

#### Methods

* `.assignBrowse(domNodes, isDirectory)` Assign a browse action to one or more DOM nodes.  Pass in `true` to allow directories to be selected (Chrome only).
* `.assignDrop(domNodes)` Assign one or more DOM nodes as a drop target.
* `.on(event, callback)` Listen for event from Resumable.js (see below)
* `.upload()` Start or resume uploading.
* `.pause()` Pause uploading.
* `.resume()` Resume uploading.
* `.cancel()` Cancel upload of all `ResumableFile` objects and remove them from the list.
* `.progress()` Returns a float between 0 and 1 indicating the current upload progress of all files.
* `.isUploading()` Returns a boolean indicating whether or not the instance is currently uploading anything.
* `.addFile(file)` Add a HTML5 File object to the list of files.
* `.removeFile(file)` Cancel upload of a specific `ResumableFile` object on the list from the list.
* `.getFromUniqueIdentifier(uniqueIdentifier)` Look up a `ResumableFile` object by its unique identifier.
* `.getSize()` Returns the total size of the upload in bytes.

#### Events

* `.fileSuccess(file)` A specific file was completed.
* `.fileProgress(file)` Uploading progressed for a specific file.
* `.fileAdded(file, event)` This event is used for file validation. To reject this file return false.
This event is also called before file is added to upload queue,
this means that calling `Resumable.upload()` function will not start current file upload.
Optionally, you can use the browser `event` object from when the file was
added.
* `.filesAdded(array)` Same as fileAdded, but used for multiple file validation.
* `.afterFilesAdded(array)` Can be used to start upload of currently added files.
* `.fileRetry(file)` Something went wrong during upload of a specific file, uploading is being retried.
* `.fileError(file, message)` An error occured during upload of a specific file.
* `.uploadStart()` Upload has been started on the Resumable object.
* `.complete()` Uploading completed.
* `.progress()` Uploading progress.
* `.error(message, file)` An error, including fileError, occured.
* `.catchAll(event, ...)` Listen to all the events listed above with the same callback function.

### ResumableFile
#### Properties

* `.resumableObj` A back-reference to the parent `Resumable` object.
* `.file` The correlating HTML5 `File` object.
* `.fileName` The name of the file.
* `.relativePath` The relative path to the file (defaults to file name if relative path doesn't exist)
* `.size` Size in bytes of the file.
* `.uniqueIdentifier` A unique identifier assigned to this file object. This value is included in uploads to the server for reference, but can also be used in CSS classes etc when building your upload UI.
* `.chunks` An array of `ResumableChunk` items. You shouldn't need to dig into these.
* `.paused` Indicated if file is paused.
* `.error` Indicated if file has encountered an error.

#### Methods

* `.progress(relative)` Returns a float between 0 and 1 indicating the current upload progress of the file. If `relative` is `true`, the value is returned relative to all files in the Resumable.js instance.
* `.pause()` Pause uploading the file.
* `.resume()` Resume uploading the file.
* `.cancel()` Abort uploading the file and delete it from the list of files to upload.
* `.retry()` Retry uploading the file.
* `.bootstrap()` Rebuild the state of a `ResumableFile` object, including reassigning chunks and XMLHttpRequest instances.
* `.isUploading()` Returns a boolean indicating whether file chunks is uploading.
* `.isComplete()` Returns a boolean indicating whether the file has completed uploading and received a server response.
* `.getExtension()` Returns file extension in lowercase.
* `.getType()` Returns file type.

## Contribution

To ensure consistency throughout the source code, keep these rules in mind as you are working:

* All features or bug fixes must be tested by one or more specs.

* With the exceptions listed below, we follow the rules contained in [Google's JavaScript Style Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml):

  * Wrap all code at 100 characters.

  * Instead of complex inheritance hierarchies, we prefer simple objects. We use prototypical
inheritance only when absolutely necessary.


## Installation Dependencies
1. To clone your Github repository, run:

        git clone git@github.com:<github username>/resumable.js.git

2. To go to the Resumable.js directory, run:

        cd resumable.js

3. To add node.js dependencies

        npm install

## Testing

Our unit and integration tests are written with Jasmine and executed with Karma. To run all of the
tests on Chrome run:

    grunt karma:watch

Or choose other browser

   grunt karma:watch --browsers=Firefox,Chrome

Browsers should be comma separated and case sensitive.
    
To re-run tests just change any source or test file.

Automated tests is running after every commit at travis-ci, current build status: [![Build Status](https://travis-ci.org/AidasK/resumable.js.png?branch=Next)](https://travis-ci.org/AidasK/resumable.js)

## Alternatives

This library is explicitly designed for modern browsers supporting advanced HTML5 file features, and the motivation has been to provide stable and resumable support for large files (allowing uploads of several GB files through HTTP in a predictable fashion). 

If your aim is just to support progress indications during upload/uploading multiple files at once, Resumable.js isn't for you. In those cases, [SWFUpload](http://swfupload.org/) and [Plupload](http://plupload.com/) provides the same features with wider browser support.
