## Java Demo for Resumable.js

This is a resumable.js demo for people who use java-servlet in server side.

`resumable.js.upload.UploadServlet` is the servlet. 

### Run

mvn jetty:run

http://localhost:8080/java-example/

Uploaded files will appear in "upload_dir".

### Upload chunks

UploadServlet accepts Resumable.js Upload with 'octet' type, gets parameters from url like 

```
http://localhost:8080/test/upload?resumableChunkNumber=21&resumableChunkSize=1048576&resumableCurrentChunkSize=1048576&resumableTotalSize=28052543&resumableIdentifier=28052543-wampserver22e-php5313-httpd2222-mysql5524-32bexe&resumableFilename=wampserver2.2e-php5.3.13-httpd2.2.22-mysql5.5.24-32b.exe&resumableRelativePath=wampserver2.2e-php5.3.13-httpd2.2.22-mysql5.5.24-32b.exe
```

and gets chunk-data from http-body.

Besides, UploadServlet uses RandomAccessFile to speed up File-Upload progress, which avoids merging chunk-files at last.


### testChunks

UploadServlet supports Resumable.js's `testChunks` feature, which makes file upload resumable.


### Resumable.js options

UploadServlet only supports 'octet' upload, so make sure method in your resumable options  is 'octet'.

	var r = new Resumable({
	            target:'/test/upload',
	            chunkSize:1*1024*1024,
	            simultaneousUploads:4,
	            testChunks: true,
	            throttleProgressCallbacks:1,
	            method: "octet"
	          });


