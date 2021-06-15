var express = require('express');
var resumable = require('./resumable-node.js')('/tmp/resumable.js/');
var app = express();
var multipart = require('connect-multiparty');
var crypto = require('crypto');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

app.use(multipart());

// Uncomment to allow CORS
// app.use(function (req, res, next) {
//    res.header('Access-Control-Allow-Origin', '*');
//    next();
// });

// retrieve file id. invoke with /fileid?filename=my-file.jpg
app.get('/fileid', function(req, res){
  if(!req.query.filename){
    return res.status(500).end('query parameter missing');
  }
  // create md5 hash from filename
  res.end(
    crypto.createHash('md5')
    .update(req.query.filename)
    .digest('hex')
  );
});

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){
    resumable.post(req, function(status, filename, original_filename, identifier){
        console.log('POST', status, original_filename, identifier);

        res.send(status);
    });
});

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send((status == 'found' ? 200 : 404), status);
    });
});

app.get('/download/:identifier', function(req, res){
	resumable.write(req.params.identifier, res);
});
app.get('/resumable.js', function (req, res) {
  var fs = require('fs');
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("../../resumable.js").pipe(res);
});

app.listen(3000);
