# Resumable.js front-end in jQuery
[@steffentchr](http://twitter.com/steffentchr)

This library is originally built to work with [23 Video](http://www.23video.com), and the 23 uploader is a good example of:

* Selecing files or drag-dropping them in
* Using events to build UI and progress bar
* Pausing and Resuming uploads
* Recovering uploads after browser crashes and even across different computers
* Detecting file support from chunks, for example whether an upload is actually a video file
* Building thumbnails from chunks to give better feedback during upload
* Falling back to alternative upload options when Resumable.js is not supported.

There's [a free trial for 23 Video](http://www.23video.com/signup) if
you want to see this in action, but the pieces are:

* Resumable.js itself.
* [A piece of jQuery](http://reinvent.23video.com/resources/um/script/resumable-uploader.js), which sets up Resumable.js and glues it to the UI.
* [An API methods](http://www.23developer.com/api/photo-redeem-upload-token) with support for Resumable.js chunks and feedback.
* Finally, some HTML elements for the glue script to use.

```html
<div class="resumable-drop">
  Drop video files here to upload or <a class="resumable-browse"><u>select from your computer</u></a>
</div>

<div class="progress" style="display:none;">
  <table>
    <tr>
      <td width="100%"><div class="progress-container"><div class="progress-bar"></div></div></td>
      <td class="progress-text" nowrap="nowrap"></td>
      <td class="progress-pause" nowrap="nowrap">
        <a href="#" onclick="uploader.resumable.upload(); return(false);" class="progress-resume-link"><img src="/resources/um/graphics/uploader/resume.png" title="Resume upload" /></a>
        <a href="#" onclick="uploader.resumable.pause(); return(false);" class="progress-pause-link"><img src="/resources/um/graphics/uploader/pause.png" title="Pause upload" /></a>
      </td>
    </tr>
  </table>
</div>

<div class="uploader-list" style="display:none;">
  <div class="uploader-item">
    ... (generated thumbnails for each file)
  </div>
</div>

<div class="file-edit-container" style="display:none;">
  ... (elements for the edit UI)
</div>

<script src="/resources/um/script/resumable.js"></script>
<script src="/resources/um/script/resumable-uploader.js"></script>
<script>
  uploader = (function($){
      var upload_token = '<api upload token>';
      var meta = {};
      return (new ResumableUploader(upload_token, meta, $('.resumable-browse'), $('.resumable-drop'), $('.progress'), $('.uploader-list'), $('.file-edit-container')));
    })(jQuery);
</script>
```
