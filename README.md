# What is Resumable.js

A JavaScript library for providing multiple simultaneous, stable and resumable uploads via the HTML5 File API. 

The library is design to introduce fault-tolerance into the upload of large files through HTTP. This is done by splitting each files into small chunks; whenever the upload of a chunk fails, uploading is retries until the procedure completes. This allows uploads to automatically resume uploading after a network connection is lost either locally or to the server. Additionally, it allows for users to pause and resume uploads without loosing state. 

Resumable.js relies on the `HTML5 File API` and the ability to chunks files into smaller pieces. Currently, this means that support is limited to Firefox 4+ and Chrome 11+.

# How does it work?

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


# Full documentation
