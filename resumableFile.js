// INTERNAL OBJECT TYPES
import ResumableChunk from './resumableChunk';
import {ResumableHelpers as Helpers} from './resumableHelpers';

export default class ResumableFile {
	constructor(resumableObj, file, uniqueIdentifier) {
		this.opts = {};
		this.getOpt = resumableObj.getOpt;
		this._prevProgress = 0;
		this.resumableObj = resumableObj;
		this.file = file;
		this.fileName = file.fileName || file.name; // Some confusion in different versions of Firefox
		this.size = file.size;
		this.relativePath = file.relativePath || file.webkitRelativePath || this.fileName;
		this.uniqueIdentifier = uniqueIdentifier;
		this._pause = false;
		this.container = '';
		this.preprocessState = 0; // 0 = unprocessed, 1 = processing, 2 = finished

		// Main code to set up a file object with chunks,
		// packaged to be able to handle retries if needed.
		this.chunks = [];

		// Bootstrap and return
		this.resumableObj.fire('chunkingStart', this);
		this.bootstrap();
		return this;
	}

	// Callback when something happens within the chunk
	chunkEvent(event, message) {
		var _error = uniqueIdentifier !== undefined;

		// event can be 'progress', 'success', 'error' or 'retry'
		switch (event) {
			case 'progress':
				this.resumableObj.fire('fileProgress', this, message);
				break;
			case 'error':
				this.abort();
				_error = true;
				this.chunks = [];
				this.resumableObj.fire('fileError', this, message);
				break;
			case 'success':
				if (_error) return;
				this.resumableObj.fire('fileProgress', this, message); // it's at least progress
				if (this.isComplete()) {
					this.resumableObj.fire('fileSuccess', this, message);
				}
				break;
			case 'retry':
				this.resumableObj.fire('fileRetry', this);
				break;
		}
	};

	abort() {
		// Stop current uploads
		var abortCount = 0;
		Helpers.each(this.chunks, function(c) {
			if (c.status() === 'uploading') {
				c.abort();
				abortCount++;
			}
		});
		if (abortCount > 0) this.resumableObj.fire('fileProgress', this);
	}

	cancel() {
		// Reset this file to be void
		var _chunks = this.chunks;
		this.chunks = [];
		// Stop current uploads
		Helpers.each(_chunks, function(c) {
			if (c.status() === 'uploading') {
				c.abort();
				this.resumableObj.uploadNextChunk();
			}
		});
		this.resumableObj.removeFile(this);
		this.resumableObj.fire('fileProgress', this);
	}

	retry() {
		this.bootstrap();
		var firedRetry = false;
		this.resumableObj.on('chunkingComplete', function() {
			if (!firedRetry) this.resumableObj.upload();
			firedRetry = true;
		});
	};

	bootstrap() {
		this.abort();
		_error = false;
		// Rebuild stack of chunks from file
		this.chunks = [];
		this._prevProgress = 0;
		var round = this.getOpt('forceChunkSize') ? Math.ceil : Math.floor;
		var maxOffset = Math.max(round(this.file.size / this.getOpt('chunkSize')), 1);
		for (var offset = 0; offset < maxOffset; offset++) {
			this.chunks.push(new ResumableChunk(this.resumableObj, this, offset, this.chunkEvent));
			this.resumableObj.fire('chunkingProgress', this, offset / maxOffset);
		}
		window.setTimeout(function() {
			this.resumableObj.fire('chunkingComplete', this);
		}, 0);
	};

	progress() {
		if (_error) return (1);
		// Sum up progress across everything
		var ret = 0;
		var error = false;
		Helpers.each(this.chunks, function(c) {
			if (c.status() === 'error') error = true;
			ret += c.progress(true); // get chunk progress relative to entire file
		});
		ret = (error ? 1 : (ret > 0.99999 ? 1 : ret));
		ret = Math.max(this._prevProgress, ret); // We don't want to lose percentages when an upload is paused
		this._prevProgress = ret;
		return (ret);
	};

	isUploading() {
		var uploading = false;
		Helpers.each(this.chunks, function(chunk) {
			if (chunk.status() === 'uploading') {
				uploading = true;
				return false;
			}
		});
		return uploading;
	};

	isComplete() {
		var outstanding = false;
		if (this.preprocessState === 1) {
			return false;
		}
		Helpers.each(this.chunks, function(chunk) {
			var status = chunk.status();
			if (status === 'pending' || status === 'uploading' || chunk.preprocessState === 1) {
				outstanding = true;
				return false;
			}
		});
		return !outstanding;
	};

	pause(pause) {
		if (pause === undefined) {
			this._pause = !this._pause;
		} else {
			this._pause = pause;
		}
	};

	isPaused() {
		return this._pause;
	};

	preprocessFinished() {
		this.preprocessState = 2;
		this.upload();
	};

	upload() {
		var found = false;
		if (this.isPaused() === false) {
			var preprocess = this.getOpt('preprocessFile');
			if (typeof preprocess === 'function') {
				switch (this.preprocessState) {
					case 0:
						this.preprocessState = 1;
						preprocess(this);
						return true;
					case 1:
						return true;
					case 2:
						break;
				}
			}
			Helpers.each(this.chunks, function(chunk) {
				if (chunk.status() === 'pending' && chunk.preprocessState !== 1) {
					chunk.send();
					found = true;
					return false;
				}
			});
		}
		return found;
	};

	markChunksCompleted(chunkNumber) {
		if (!this.chunks || this.chunks.length <= chunkNumber) {
			return;
		}
		for (var num = 0; num < chunkNumber; num++) {
			this.chunks[num].markComplete = true;
		}
	}
}
