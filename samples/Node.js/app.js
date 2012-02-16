var express = require('express');
var form = require('connect-form');
var resumable = require('./resumable-node.js')('/tmp/resumable.js/');
var app = express.createServer(form({
	keepExtensions: true
}));

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){
	resumable.post(req, function(status, filename, original_filename, identifier){
		console.log('POST', status);
		res.send(status, {
			// NOTE: Uncomment this funciton to enable cross-domain request.
			//'Access-Control-Allow-Origin': '*'
		});
	});
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

app.listen(3000);
