var express = require('express');
var form = require('connect-form');
var resumable = require('./resumable-node.js')('/tmp/resumable.js/');
var app = express.createServer(form({
      keepExtensions: true
    }));

var fs = require('fs');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){
	
	// console.log(req);
	
    resumable.post(req, function(status, filename, original_filename, identifier){
        console.log('POST', status, original_filename, identifier);

        res.send(status, {
            // NOTE: Uncomment this funciton to enable cross-domain request.
            //'Access-Control-Allow-Origin': '*'
          });

		if(status && status == 'done') {
			console.log('original_filename, identifier', original_filename, identifier, filename);

			var project = 'hello';
			var target = path.join(__dirname, filename);

		 	var stream = fs.createWriteStream(target);
			resumable.write(original_filename, stream, {
				done: function() {
					console.log('done! :)');
					git.setUserName('hello', 'mr hello', 'abc@abc.com');
					git.addAndCommitFile('hello', filename, 'commit file ' + filename+ 'larh!');
					// cleanup tmp files
					resumable.clean(original_filename, {done: function() {console.log('cleaning done');} });

			}});
		}


      }); // end resum post

  });

// Handle cross-domain requests
// NOTE: Uncomment this funciton to enable cross-domain request.
/*
  app.options('/upload', function(req, res){
  console.log('OPTIONS');
  res.send(true, {
  'Access-Control-Allow-Origin': '*'
  }, 200);
  });
*/

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send(status, (status == 'found' ? 200 : 404));
      });
  });

app.get('/download/:identifier', function(req, res){
	console.log('req.params.identifier',req.params.identifier);
    // resumable.write(req.params.identifier, res);
   var stream = fs.createWriteStream('testing.mp3');
	resumable.write(req.params.identifier, stream, {
		done: function() {
			console.log('done! :)');
		}
	});
    // r.write(identifier, stream);
    // stream.on('data', function(data){...});
    // stream.on('end', function(){...});

  });

app.listen(3000);
