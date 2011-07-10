### What is Resumable.js

A JavaScript library for providing multiple simultaneous, stable and resumable uploads via the HTML5 File API. 

The library is design to introduce fault-tolerance into the upload of large files through HTTP. This is done by splitting each files into small chunks; whenever the upload of a chunk fails, uploading is retries until the procedure completes. This allows uploads to automatically resume uploading after a network connection is lost either locally or to the server. Additionally, it allows for users to pause and resume uploads without loosing state. 

Resumable.js relies on the `HTML5 File API` and the ability to chunks files into smaller pieces. Currently, this means that support is limited to Firefox 4+ and Chrome 11+.


### How does it work?

A new `Resumable` object is created with information of what and where to post:

    var r = new Resumable({
      target:'/api/photo/redeem-upload-token', 
      query:{upload_token:'my_token'}
    });
    if(!r.support) location.href = '/some-old-crappy-uploader';
  
To allow files to either selected or dropped, you'll assign drop target and a DOM item to be clicked for browsing:

    r.assignBrowse(document.getElementById('browseButton'));
    r.assignBrowse(document.getElementById('dropTarget'));

After this, interaction with Resumable.js is by listening to events:

    r.on('fileAdded', function(file){
        ...
      });
    r.on('fileSuccess', function(file,message){
        ...
      });
    r.on('fileError', function(file, message){
        ...
      });


bootstrapping options
extra parameters sent in POST
returning error messages (200 is good, 500 is bad, everything else is retry)

## Full documentation

### Resumable
#### Configuration

The object is loaded with a configuation hash:

    var r = new Resumable({opt1:'val', ...});
    
Available configuration options are:

* `target` The target URL for the multipart POST request (Default: `/`)
* `chunkSize` The size in bytes of each uploaded chunk of data (Default: `1*1024*1024`)
* `simultaneousUploads` Number of simultaneous uploads (Default: `3`)
* `fileParameterName` The name of the multipart POST parameter to use for the file chunk  (Default: `file`)
* `query` Extra parameters to include in the multipart POST with data (Default: `{}`)
* `prioritizeFirstAndLastChunk` Prioritize first and last chunks of all files. This can be handy if you can determine if a file is valid for your service from only the first or last chunk. For example, photo or video meta data is usually located in the first part of a file, making it easy to test support from only the first chunk. (Default: `false`)


#### Properties

* `.support` A boolean value indicator whether or not Resumable.js is supported by the current browser.
* `.opts` A hash object of the configuration of the Resumable.js instance.
* `.files` An array of `ResumableFile` file objects add by the user (see full docs for this object type below).

#### Methods

* `.assignBrowse(domNodes)` Assign a browse action to one or more DOM nodes.
* `.assignDrop(domNodes)` Assign one or more DOM nodes as a drop target.
* `.on(event, callback)` Listen for event from Resumable.js (see below)
* `.upload()` Start or resume uploading.
* `.pause()` Pause uploading.
* `.progress()` Returns a float between 0 and 1 indicating the current upload progress of all files.
* `.isUploading()` Returns a boolean indicating whether or not the instance is currently uploading anything.

#### Events

* `.fileSuccess(file)` A specific file was completed.
* `.fileProgress(file)` Uploading progressed for a specific file.
* `.fileAdded(file)` A new file was added.
* `.fileRetry(file)` Something went wrong during upload of a specific file, uploading is being retried.
* `.fileError(file, message)` An error occured during upload of a specific file.
* `.complete()` Uploading completed.
* `.progress()` Uploading progress.
* `.error(message, file)` An error, including fileError, occured.
* `.pause()` Uploading was paused.
* `.catchAll(event, ...)` Listen to all the events listed above with the same callback function.

### ResumableFile
#### Properties

* `.resumableObj` A back-reference to the parent `Resumable` object.
* `.file` The correlating HTML5 `File` object.
* `.fileName` The name of the file.
* `.size` Size in bytes of the file.
* `.uniqueIdentifier` A unique identifier assigned to this file object. This value is included in uploads to the server for reference, but can also be used in CSS classes etc when building your upload UI.
* `.chunks` An array of `ResumableChunk` items. You shouldn't need to dig into these.

#### Methods

* `.progress(relative)` Returns a float between 0 and 1 indicating the current upload progress of the file. If `relative` is `true`, the value is returned relative to all files in the Resumable.js instance.
* `.abort()` Abort uploading the file.
* `.retry()` Retry uploading the file.
* `.bootstrap()` Rebuild the state of a `ResumableFile` object, including reassigning chunks and XMLHttpRequest instances.
