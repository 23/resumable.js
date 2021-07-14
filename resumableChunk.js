import {ResumableHelpers as Helpers} from './resumableHelpers';

export default class ResumableChunk {
	constructor(resumableObj, fileObj, offset, callback) {
		this.opts = {};
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

		// Default Options
		this.chunkSize = 1 * 1024 * 1024;
		this.fileParameterName = 'file';
		this.chunkNumberParameterName = 'resumableChunkNumber';
		this.chunkSizeParameterName = 'resumableChunkSize';
		this.currentChunkSizeParameterName = 'resumableCurrentChunkSize';
		this.totalSizeParameterName = 'resumableTotalSize';
		this.typeParameterName = 'resumableType';
		this.identifierParameterName = 'resumableIdentifier';
		this.fileNameParameterName = 'resumableFilename';
		this.relativePathParameterName = 'resumableRelativePath';
		this.totalChunksParameterName = 'resumableTotalChunks';
		this.throttleProgressCallbacks = 0.5;
		this.query = {};
		this.headers = {};
		this.preprocess = null;
		this.method = 'multipart';
		this.uploadMethod = 'POST';
		this.testMethod = 'GET';
		this.parameterNamespace = '';
		this.testChunks = true;
		this.maxChunkRetries = 100;
		this.chunkRetryInterval = undefined;
		this.permanentErrors= [400, 401, 403, 404, 409, 415, 500, 501];
		this.withCredentials = false;
		this.xhrTimeout = 0;
		this.chunkFormat = 'blob';
		this.setChunkTypeFromFile = false;
		this.target = '/';
		this.testTarget = null;

		// Computed properties
		this.loaded = 0;
		this.startByte = this.offset * this.chunkSize;
		this.endByte = Math.min(this.fileObjSize, (this.offset + 1) * this.chunkSize);
		if (this.fileObjSize - this.endByte < this.chunkSize && !this.forceChunkSize) {
			// The last chunk will be bigger than the chunk size, but less than 2*chunkSize
			this.endByte = this.fileObjSize;
		}
		this.xhr = null;
	}

	get formattedQuery() {
		var customQuery = this.query;
		if (typeof customQuery == 'function') customQuery = customQuery(this.fileObj, this);

		// Add extra data to identify chunk
		const extraData = {
			// define key/value pairs for additional parameters
			[this.chunkNumberParameterName]: this.offset + 1,
			[this.chunkSizeParameterName]: this.chunkSize,
			[this.currentChunkSizeParameterName]: this.endByte - this.startByte,
			[this.totalSizeParameterName]: this.fileObjSize,
			[this.typeParameterName]: this.fileObjType,
			[this.identifierParameterName]: this.fileObj.uniqueIdentifier,
			[this.fileNameParameterName]: this.fileObj.fileName,
			[this.relativePathParameterName]: this.fileObj.relativePath,
			[this.totalChunksParameterName]: this.fileObj.chunks.length,
		};
		return {...extraData, ...customQuery};
	}

	getOpt(option) {
		// Get multiple option if passed an array
		if (option instanceof Array) {
			var options = {};
			Helpers.each(option, (o) => {
				options[o] = this.getOpt(o);
			});
			return options;
		}

		// Otherwise, just return a simple option
		return this.opts[option] !== undefined ? this.opts[option] : this.fileObj.getOpt(option);
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

		// Append the relevant chunk and send it
		this.xhr.open(this.testMethod, this.getTarget('test'));
		this.xhr.timeout = this.xhrTimeout;
		this.xhr.withCredentials = this.withCredentials;
		// Add data from header options
		this.setCustomHeaders();

		this.xhr.send(null);
	}

	setCustomHeaders() {
		if (!this.xhr) {
			return;
		}
		let customHeaders = this.headers;
		if (typeof customHeaders === 'function') {
			customHeaders = customHeaders(this.fileObj, this);
		}
		Helpers.each(customHeaders, (k, v) => {
			this.xhr.setRequestHeader(k, v);
		});
	}

	getTarget(requestType) {
		return Helpers.getTarget(requestType, this.target, this.testTarget, this.formattedQuery,
			this.parameterNamespace);
	}

	preprocessFinished() {
		this.preprocessState = 2;
		this.send();
	};

	// send() uploads the actual data in a POST call
	send() {
		let preprocess = this.preprocess;
		if (typeof preprocess === 'function') {
			switch (this.preprocessState) {
				case 0:
					this.preprocessState = 1;
					preprocess(this);
					return;
				case 1:
					return;
				case 2:
					break;
			}
		}
		if (this.testChunks && !this.tested) {
			this.test();
			return;
		}

		// Set up request and listen for event
		this.xhr = new XMLHttpRequest();

		// Progress
		this.xhr.upload.addEventListener('progress', (e) => {
			if ((new Date) - this.lastProgressCallback > this.throttleProgressCallbacks * 1000) {
				this.callback('progress');
				this.lastProgressCallback = (new Date);
			}
			this.loaded = e.loaded || 0;
		}, false);
		this.loaded = 0;
		this.pendingRetry = false;
		this.callback('progress');

		// Done (either done, failed or retry)
		let doneHandler = (e) => {
			var status = this.status();
			if (status === 'success' || status === 'error') {
				this.callback(status, this.message());
				this.resumableObj.uploadNextChunk();
			} else {
				this.callback('retry', this.message());
				this.abort();
				this.retries++;
				var retryInterval = this.chunkRetryInterval;
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
		let func = (this.fileObj.file.slice ?
			'slice' :
			(this.fileObj.file.mozSlice ? 'mozSlice' : (this.fileObj.file.webkitSlice ? 'webkitSlice' : 'slice')));
		let bytes = this.fileObj.file[func](this.startByte, this.endByte,
			this.setChunkTypeFromFile ? this.fileObj.file.type : '');
		let data = null;

		let parameterNamespace = this.parameterNamespace;
		if (this.method === 'octet') {
			// Add data from the query options
			data = bytes;
		} else {
			// Add data from the query options
			data = new FormData();
			Helpers.each(this.formattedQuery, function(k, v) {
				data.append(parameterNamespace + k, v);
			});
			if (this.chunkFormat === 'blob') {
				data.append(parameterNamespace + this.fileParameterName, bytes, this.fileObj.fileName);
			} else if (this.chunkFormat === 'base64') {
				var fr = new FileReader();
				fr.onload = function(e) {
					data.append(parameterNamespace + this.fileParameterName, fr.result);
					this.xhr.send(data);
				};
				fr.readAsDataURL(bytes);
			}
		}

		let target = this.getTarget('upload');
		let method = this.uploadMethod;

		this.xhr.open(method, target);
		if (this.method === 'octet') {
			this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
		}
		this.xhr.timeout = this.xhrTimeout;
		this.xhr.withCredentials = this.withCredentials;
		// Add data from header options
		this.setCustomHeaders();

		if (this.chunkFormat === 'blob') {
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
			return 'uploading';
		} else if (this.markComplete) {
			return 'success';
		} else if (!this.xhr) {
			return 'pending';
		} else if (this.xhr.readyState < 4) {
			// Status is really 'OPENED', 'HEADERS_RECEIVED' or 'LOADING' - meaning that stuff is happening
			return 'uploading';
		} else if (this.xhr.status === 200 || this.xhr.status === 201) {
			// HTTP 200, 201 (created)
			return 'success';
		} else if (Helpers.contains(this.permanentErrors, this.xhr.status) || this.retries >= this.maxChunkRetries) {
			// HTTP 400, 404, 409, 415, 500, 501 (permanent error)
			return 'error';
		} else {
			// this should never happen, but we'll reset and queue a retry
			// a likely case for this would be 503 service unavailable
			this.abort();
			return 'pending';
		}
	};

	message() {
		return this.xhr ? this.xhr.responseText : '';
	};

	progress(relative = false) {
		var factor = relative ? (this.endByte - this.startByte) / this.fileObjSize : 1;
		if (this.pendingRetry) return 0;
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
