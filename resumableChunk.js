import {ResumableHelpers as Helpers} from './resumableHelpers';

export default class ResumableChunk {
	constructor(resumableObj, fileObj, offset, callback) {
		this.opts = {};
		this.getOpt = resumableObj.getOpt;
		this.resumableObj = resumableObj;
		this.fileObj = fileObj;
		this.fileObjSize = fileObj.size;
		this.fileObjType = fileObj.file.type;
		this.offset = offset;
		this.callback = callback;
		this.lastProgressCallback = (new Date);
		this.tested = false;
		this.retries = 0;
		this.pendingRetry = false;
		this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished
		this.markComplete = false;

		// Computed properties
		var chunkSize = this.getOpt('chunkSize');
		this.loaded = 0;
		this.startByte = this.offset * chunkSize;
		this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * chunkSize);
		if (this.fileObjSize - this.endByte < chunkSize && !this.getOpt('forceChunkSize')) {
			// The last chunk will be bigger than the chunk size, but less than 2*chunkSize
			this.endByte = this.fileObjSize;
		}
		this.xhr = null;
	}

	// test() makes a GET request without any data to see if the chunk has already been uploaded in a previous session
	test() {
		// Set up request and listen for event
		this.xhr = new XMLHttpRequest();

		var testHandler = () => {
			this.tested = true;
			var status = this.status();
			if (status === 'success') {
				this.callback(status, this.message());
				this.resumableObj.uploadNextChunk();
			} else {
				this.send();
			}
		};
		this.xhr.addEventListener('load', testHandler, false);
		this.xhr.addEventListener('error', testHandler, false);
		this.xhr.addEventListener('timeout', testHandler, false);

		// Add data from the query options
		var params = [];
		var parameterNamespace = this.getOpt('parameterNamespace');
		var customQuery = this.getOpt('query');
		if (typeof customQuery == 'function') customQuery = customQuery(this.fileObj, this);
		Helpers.each(customQuery, function(k, v) {
			params.push([encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='));
		});
		// Add extra data to identify chunk
		params = params.concat(
			[
				// define key/value pairs for additional parameters
				['chunkNumberParameterName', this.offset + 1],
				['chunkSizeParameterName', this.getOpt('chunkSize')],
				['currentChunkSizeParameterName', this.endByte - this.startByte],
				['totalSizeParameterName', this.fileObjSize],
				['typeParameterName', this.fileObjType],
				['identifierParameterName', this.fileObj.uniqueIdentifier],
				['fileNameParameterName', this.fileObj.fileName],
				['relativePathParameterName', this.fileObj.relativePath],
				['totalChunksParameterName', this.fileObj.chunks.length],
			].filter(function(pair) {
				// include items that resolve to truthy values
				// i.e. exclude false, null, undefined and empty strings
				return this.getOpt(pair[0]);
			}).map(function(pair) {
				// map each key/value pair to its final form
				return [
					parameterNamespace + this.getOpt(pair[0]),
					encodeURIComponent(pair[1]),
				].join('=');
			}),
		);
		// Append the relevant chunk and send it
		this.xhr.open(this.getOpt('testMethod'), Helpers.getTarget('test', params));
		this.xhr.timeout = this.getOpt('xhrTimeout');
		this.xhr.withCredentials = this.getOpt('withCredentials');
		// Add data from header options
		var customHeaders = this.getOpt('headers');
		if (typeof customHeaders === 'function') {
			customHeaders = customHeaders(this.fileObj, this);
		}
		Helpers.each(customHeaders, (k, v) => {
			this.xhr.setRequestHeader(k, v);
		});
		this.xhr.send(null);
	}


	preprocessFinished() {
		this.preprocessState = 2;
		this.send();
	};

	// send() uploads the actual data in a POST call
	send() {
		var preprocess = this.getOpt('preprocess');
		if (typeof preprocess === 'function') {
			switch (this.preprocessState) {
				case 0:
					this.preprocessState = 1;
					preprocess($);
					return;
				case 1:
					return;
				case 2:
					break;
			}
		}
		if (this.getOpt('testChunks') && !this.tested) {
			this.test();
			return;
		}

		// Set up request and listen for event
		this.xhr = new XMLHttpRequest();

		// Progress
		this.xhr.upload.addEventListener('progress', function(e) {
			if ((new Date) - this.lastProgressCallback > this.getOpt('throttleProgressCallbacks') * 1000) {
				this.callback('progress');
				this.lastProgressCallback = (new Date);
			}
			this.loaded = e.loaded || 0;
		}, false);
		this.loaded = 0;
		this.pendingRetry = false;
		this.callback('progress');

		// Done (either done, failed or retry)
		var doneHandler = function(e) {
			var status = this.status();
			if (status == 'success' || status == 'error') {
				this.callback(status, this.message());
				this.resumableObj.uploadNextChunk();
			} else {
				this.callback('retry', this.message());
				this.abort();
				this.retries++;
				var retryInterval = this.getOpt('chunkRetryInterval');
				if (retryInterval !== undefined) {
					this.pendingRetry = true;
					setTimeout(this.send, retryInterval);
				} else {
					this.send();
				}
			}
		};
		this.xhr.addEventListener('load', doneHandler, false);
		this.xhr.addEventListener('error', doneHandler, false);
		this.xhr.addEventListener('timeout', doneHandler, false);

		// Set up the basic query data from Resumable
		var query = [
			['chunkNumberParameterName', this.offset + 1],
			['chunkSizeParameterName', this.getOpt('chunkSize')],
			['currentChunkSizeParameterName', this.endByte - this.startByte],
			['totalSizeParameterName', this.fileObjSize],
			['typeParameterName', this.fileObjType],
			['identifierParameterName', this.fileObj.uniqueIdentifier],
			['fileNameParameterName', this.fileObj.fileName],
			['relativePathParameterName', this.fileObj.relativePath],
			['totalChunksParameterName', this.fileObj.chunks.length],
		].filter(function(pair) {
			// include items that resolve to truthy values
			// i.e. exclude false, null, undefined and empty strings
			return this.getOpt(pair[0]);
		}).reduce(function(query, pair) {
			// assign query key/value
			query[this.getOpt(pair[0])] = pair[1];
			return query;
		}, {});
		// Mix in custom data
		var customQuery = this.getOpt('query');
		if (typeof customQuery == 'function') customQuery = customQuery(this.fileObj, $);
		Helpers.each(customQuery, function(k, v) {
			query[k] = v;
		});

		var func = (this.fileObj.file.slice ?
			'slice' :
			(this.fileObj.file.mozSlice ? 'mozSlice' : (this.fileObj.file.webkitSlice ? 'webkitSlice' : 'slice')));
		var bytes = this.fileObj.file[func](this.startByte, this.endByte,
			this.getOpt('setChunkTypeFromFile') ? this.fileObj.file.type : '');
		var data = null;
		var params = [];

		var parameterNamespace = this.getOpt('parameterNamespace');
		if (this.getOpt('method') === 'octet') {
			// Add data from the query options
			data = bytes;
			Helpers.each(query, function(k, v) {
				params.push([encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='));
			});
		} else {
			// Add data from the query options
			data = new FormData();
			Helpers.each(query, function(k, v) {
				data.append(parameterNamespace + k, v);
				params.push([encodeURIComponent(parameterNamespace + k), encodeURIComponent(v)].join('='));
			});
			if (this.getOpt('chunkFormat') === 'blob') {
				data.append(parameterNamespace + this.getOpt('fileParameterName'), bytes, this.fileObj.fileName);
			} else if (this.getOpt('chunkFormat') === 'base64') {
				var fr = new FileReader();
				fr.onload = function(e) {
					data.append(parameterNamespace + this.getOpt('fileParameterName'), fr.result);
					this.xhr.send(data);
				};
				fr.readAsDataURL(bytes);
			}
		}

		var target = Helpers.getTarget('upload', params);
		var method = this.getOpt('uploadMethod');

		this.xhr.open(method, target);
		if (this.getOpt('method') === 'octet') {
			this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
		}
		this.xhr.timeout = this.getOpt('xhrTimeout');
		this.xhr.withCredentials = this.getOpt('withCredentials');
		// Add data from header options
		var customHeaders = this.getOpt('headers');
		if (typeof customHeaders === 'function') {
			customHeaders = customHeaders(this.fileObj, $);
		}

		Helpers.each(customHeaders, function(k, v) {
			this.xhr.setRequestHeader(k, v);
		});

		if (this.getOpt('chunkFormat') === 'blob') {
			this.xhr.send(data);
		}
	}

	abort() {
		// Abort and reset
		if (this.xhr) this.xhr.abort();
		this.xhr = null;
	};

	status() {
		// Returns: 'pending', 'uploading', 'success', 'error'
		if (this.pendingRetry) {
			// if pending retry then that's effectively the same as actively uploading,
			// there might just be a slight delay before the retry starts
			return ('uploading');
		} else if (this.markComplete) {
			return 'success';
		} else if (!this.xhr) {
			return ('pending');
		} else if (this.xhr.readyState < 4) {
			// Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
			return ('uploading');
		} else {
			if (this.xhr.status === 200 || this.xhr.status === 201) {
				// HTTP 200, 201 (created)
				return ('success');
			} else if (Helpers.contains(this.getOpt('permanentErrors'), this.xhr.status) || this.retries >=
				this.getOpt('maxChunkRetries')) {
				// HTTP 400, 404, 409, 415, 500, 501 (permanent error)
				return ('error');
			} else {
				// this should never happen, but we'll reset and queue a retry
				// a likely case for this would be 503 service unavailable
				this.abort();
				return ('pending');
			}
		}
	};

	message() {
		return this.xhr ? this.xhr.responseText : '';
	};

	progress(relative) {
		if (typeof (relative) === 'undefined') relative = false;
		var factor = (relative ? (this.endByte - this.startByte) / this.fileObjSize : 1);
		if (this.pendingRetry) return (0);
		if ((!this.xhr || !this.xhr.status) && !this.markComplete) factor *= .95;
		var s = this.status();
		switch (s) {
			case 'success':
			case 'error':
				return 1 * factor;
			case 'pending':
				return 0;
			default:
				return this.loaded / (this.endByte - this.startByte) * factor;
		}
	}
}
