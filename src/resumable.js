import Helpers from './resumableHelpers.js';
import ResumableFile from './resumableFile.js';
//import _ from 'lodash';
/*
* MIT Licensed
* http://www.23developer.com/opensource
* http://github.com/23/resumable.js
* Steffen Tiedemann Christensen, steffen@23company.com
*/

export default class Resumable {
	constructor(options) {
		this.setOptions({options: options});
		this.opts = options;
		this.files = [];
		this.validators = {};
		this.events = [];
		this.checkSupport();
	}

	get version() {
		return 1.0;
	}

	/**
	 * processes a single upload item (file or directory)
	 * @param {Object} item item to upload, may be file or directory entry
	 * @param {string} path current file path
	 */
	async processItem(item, path) {
		let entry;
		if (item.isFile) {
			// file entry provided
			const file = await new Promise((resolve, reject) => item.file(resolve, reject));
			file.relativePath = path + file.name;
			return file;
		} else if (item.isDirectory) {
			// item is already a directory entry, just assign
			entry = item;
		} else if (item instanceof File) {
			return item
		}
		if (typeof item.webkitGetAsEntry === 'function') {
			// get entry from file object
			entry = item.webkitGetAsEntry();
		}
		if (entry && entry.isDirectory) {
			// directory provided, process it
			return await this.processDirectory(entry, path + entry.name + '/');
		}
		if (typeof item.getAsFile === 'function') {
			// item represents a File object, convert it
			item = item.getAsFile();
			if (item instanceof File) {
				item.relativePath = path + item.name;
				return item
			}
		}
	}

	/**
	 * @param {{options}|{maxFileSizeErrorCallback: Resumable.maxFileSizeErrorCallback, minFileSizeErrorCallback: Resumable.minFileSizeErrorCallback, clearInput: boolean, generateUniqueIdentifier: null, minFileSize: number, simultaneousUploads: number, maxFileSize: undefined, fileTypeErrorCallback: Resumable.fileTypeErrorCallback, maxFilesErrorCallback: Resumable.maxFilesErrorCallback, dragOverClass: string, prioritizeFirstAndLastChunk: boolean, fileType: *[], maxFiles: undefined}} options
	 */
	setOptions(options) {
		// Options
		({
			clearInput: this.clearInput = true,
			dragOverClass: this.dragOverClass = 'dragover',
			fileType: this.fileType = [],
			fileTypeErrorCallback: this.fileTypeErrorCallback = (file, errorCount) => {
				alert(file.fileName || file.name + ' has type not allowed, please upload files of type ' +
					this.fileType + '.');
			},
			generateUniqueIdentifier: this._generateUniqueIdentifier = null,
			maxFileSize: this.maxFileSize = undefined,
			maxFileSizeErrorCallback: this.maxFileSizeErrorCallback = (file, errorCount) => {
				alert(file.fileName || file.name + ' is too large, please upload files less than ' +
					Helpers.formatSize(this.maxFileSize) + '.');
			},
			maxFiles: this.maxFiles = undefined,
			maxFilesErrorCallback: this.maxFilesErrorCallback = (files, errorCount) => {
				var maxFiles = this.maxFiles;
				alert('Please upload no more than ' + maxFiles + ' file' + (maxFiles === 1 ? '' : 's') + ' at a time.');
			},
			minFileSize: this.minFileSize = 1,
			minFileSizeErrorCallback: this.minFileSizeErrorCallback = (file, errorCount) => {
				alert(file.fileName || file.name + ' is too small, please upload files larger than ' +
					Helpers.formatSize(this.minFileSize) + '.');
			},
			prioritizeFirstAndLastChunk: this.prioritizeFirstAndLastChunk = false,
			fileValidationErrorCallback: this.fileValidationErrorCallback = (file, errorCount) => {},
			simultaneousUploads: this.simultaneousUploads = 3,
		} = options);

		// For good behaviour we do some initial sanitizing. Remove spaces and dots and lowercase all
		this.fileType = this.fileType.map((type) => type.replace(/[\s.]/g, '').toLowerCase());
	}

	/**
	 * cps-style list iteration.
	 * invokes all functions in list and waits for their callback to be
	 * triggered.
	 * @param  {Function[]}   items list of functions expecting callback parameter
	 * @param  {Function} cb    callback to trigger after the last callback has been invoked
	 */
	static processCallbacks(items, cb) {
		if (!items || items.length === 0) {
			// empty or no list, invoke callback
			return cb();
		}
		// invoke current function, pass the next part as continuation
		items[0](() => {
			this.processCallbacks(items.slice(1), cb);
		});
	}

	/**
	 * recursively traverse directory and collect files to upload
	 * @param  {Object}   directory directory to process
	 * @param  {string}   path      current path
	 */
	processDirectory(directory, path) {
		return new Promise(((resolve, reject) => {
			const dirReader = directory.createReader();
			let allEntries = [];

			const readEntries = () => {
				dirReader.readEntries(async (entries) => {
					// Read the files batch-wise (in chrome e.g. 100 at a time)
					if (entries.length) {
						allEntries = allEntries.concat(entries);
						return readEntries();
					}

					// After collecting all files, map all fileEntries to File objects
					allEntries = allEntries.map((entry) => {
						return this.processItem(entry, path);
					});
					// Wait until all files are collected.
					const files = await Promise.all(allEntries);
					resolve(files);
				}, reject);
			};

			readEntries();
		}));
	}

	checkSupport() {
		// SUPPORTED BY BROWSER?
		// Check if these features are support by the browser:
		// - File object type
		// - Blob object type
		// - FileList object type
		// - slicing files
		this.support =
			typeof (File) !== 'undefined' &&
			typeof (Blob) !== 'undefined' &&
			typeof (FileList) !== 'undefined' &&
			(!!Blob.prototype.webkitSlice || !!Blob.prototype.mozSlice || !!Blob.prototype.slice || false);
		if (!this.support) {
			throw new Error('Not supported by Browser');
		}
	}

	on(event, callback) {
		this.events.push(event.toLowerCase(), callback);
	}

	fire() {
		// `arguments` is an object, not array, in FF, so:
		var args = [];
		for (let i = 0; i < arguments.length; i++) args.push(arguments[i]);
		// Find event listeners, and support pseudo-event `catchAll`
		var event = args[0].toLowerCase();
		console.log(event, args);
		for (let i = 0; i <= this.events.length; i += 2) {
			if (this.events[i] === event) this.events[i + 1].apply(this, args.slice(1));
			if (this.events[i] === 'catchall') this.events[i + 1].apply(null, args);
		}
		if (event === 'fileerror') this.fire('error', args[2], args[1]);
		if (event === 'fileprogress') this.fire('progress');
	}

	async onDrop(e) {
		e.currentTarget.classList.remove(this.dragOverClass);
		Helpers.stopEvent(e);

		let items = [];

		//handle dropped things as items if we can (this lets us deal with folders nicer in some cases)
		if (e.dataTransfer && e.dataTransfer.items) {
			items = e.dataTransfer.items;
		}
		//else handle them as files
		else if (e.dataTransfer && e.dataTransfer.files) {
			items = e.dataTransfer.files;
		}

		if (!items.length) {
			return; // nothing to do
		}
		this.fire('fileProcessingBegin');
		let promises =  [...items].map((item) => this.processItem(item, ''));
		let files = _.flattenDeep(await Promise.all(promises));
		if (files.length) {
			// at least one file found
			this.appendFilesFromFileList(files, e);
		}
	}

	onDragLeave(e) {
		e.currentTarget.classList.remove(this.dragOverClass);
	}

	onDragOverEnter(e) {
		e.preventDefault();
		let dt = e.dataTransfer;
		if (Helpers.indexOf(dt.types, 'Files') >= 0) { // only for file drop
			e.stopPropagation();
			dt.dropEffect = 'copy';
			dt.effectAllowed = 'copy';
			e.currentTarget.classList.add(this.dragOverClass);
		} else { // not work on IE/Edge....
			dt.dropEffect = 'none';
			dt.effectAllowed = 'none';
		}
	};

	appendFilesFromFileList(fileList, event) {
		// check for uploading too many files
		let errorCount = 0;
		if (this.maxFiles !== undefined && this.maxFiles < fileList.length + this.files.length) {
			// if single-file upload, file is already added, and trying to add 1 new file, simply replace the already-added file
			if (this.maxFiles === 1 && this.files.length === 1 && fileList.length === 1) {
				this.removeFile(this.files[0]);
			} else {
				this.fire('fileProcessingFailed');
				this.maxFilesErrorCallback(fileList, errorCount++);
				return false;
			}
		}
		let files = [], filesSkipped = [], remaining = fileList.length;
		const decreaseRemaining = () => {
			if (!--remaining) {
				// all files processed, trigger event
				if (!files.length && !filesSkipped.length) {
					// no succeeded files, just skip
					return;
				}
				this.fire('filesAdded', files, filesSkipped);
			}
		};
		for (const file of fileList) {
			let fileName = file.name;
			let fileType = file.type.toLowerCase(); // e.g video/mp4
			let fileExtension = fileName.split('.').pop().toLowerCase();
			if (this.fileType.length > 0) {
				const fileTypeFound = this.fileType.some((type) => {
					// Check whether the extension inside the filename is an allowed file type
					return fileExtension === type ||
						//If MIME type, check for wildcard or if extension matches the file's tile type
						_.includes(type, '/') && (
							_.includes(type, '*') &&
							fileType.substr(0, type.indexOf('*')) === type.substr(0, type.indexOf('*')) ||
							fileType === type
						);
				});
				if (!fileTypeFound) {
					this.fire('fileProcessingFailed', file);
					this.fileTypeErrorCallback(file, errorCount++);
					continue;
				}
			}

			if (this.minFileSize !== undefined && file.size < this.minFileSize) {
				this.fire('fileProcessingFailed', file);
				this.minFileSizeErrorCallback(file, errorCount++);
				continue;
			}
			if (this.maxFileSize !== undefined && file.size > this.maxFileSize) {
				this.fire('fileProcessingFailed', file);
				this.maxFileSizeErrorCallback(file, errorCount++);
				continue;
			}

			if (fileExtension in this.validators && !this.validators[fileExtension](file)) {
				this.fire('fileProcessingFailed', file);
				this.fileValidationErrorCallback(file, errorCount++);
				continue;
			}

			this.fire('fileLoaded', file);

			const addFile = (uniqueIdentifier) => {
				if (!this.getFromUniqueIdentifier(uniqueIdentifier)) {
					file.uniqueIdentifier = uniqueIdentifier;
					let f = new ResumableFile(this, file, uniqueIdentifier, this.opts);
					this.files.push(f);
					files.push(f);
					f.container = event !== undefined ? event.target : null;
					// Make the firing of the event asynchronous
					this.fire('fileAdded', f, event);
				} else {
					filesSkipped.push(file);
				}
				decreaseRemaining();
			};

			// directories have size == 0
			let uniqueIdentifier = this.generateUniqueIdentifier(file, event);
			if (uniqueIdentifier && typeof uniqueIdentifier.then === 'function') {
				// Promise or Promise-like object provided as unique identifier
				uniqueIdentifier.then(
					// unique identifier generation succeeded
					addFile,
					// unique identifier generation failed
					// skip further processing, only decrease file count
					decreaseRemaining,
				);
			} else {
				// non-Promise provided as unique identifier, process synchronously
				addFile(uniqueIdentifier);
			}
		}
	};

	// QUEUE
	uploadNextChunk() {
		let found = false;

		// In some cases (such as videos) it's really handy to upload the first
		// and last chunk of a file quickly; this let's the server check the file's
		// metadata and determine if there's even a point in continuing.
		if (this.prioritizeFirstAndLastChunk) {
			Helpers.each(this.files, function(file) {
				if (file.chunks.length && file.chunks[0].status === 'pending' && file.chunks[0].preprocessState ===	0) {
					file.chunks[0].send();
					found = true;
					return false;
				}
				if (file.chunks.length > 1 && file.chunks[file.chunks.length - 1].status === 'pending' &&
					file.chunks[file.chunks.length - 1].preprocessState === 0) {
					file.chunks[file.chunks.length - 1].send();
					found = true;
					return false;
				}
			});
			if (found) return true;
		}

		// Now, simply look for the next, best thing to upload
		Helpers.each(this.files, function(file) {
			found = file.upload();
			if (found) return false;
		});
		if (found) return true;

		// The are no more outstanding chunks to upload, check is everything is done
		let uploadCompleted = this.files.every((file) => file.isComplete());
		if (uploadCompleted) {
			// All chunks have been uploaded, complete
			this.fire('complete');
		}
		return false;
	}

	// PUBLIC METHODS FOR RESUMABLE.JS
	assignBrowse(domNodes, isDirectory = false) {
		if (domNodes.length === undefined) domNodes = [domNodes];
		Helpers.each(domNodes, (domNode) => {
			let input;
			if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
				input = domNode;
			} else {
				input = document.createElement('input');
				input.setAttribute('type', 'file');
				input.style.display = 'none';
				domNode.addEventListener('click', () => {
					input.style.opacity = 0;
					input.style.display = 'block';
					input.focus();
					input.click();
					input.style.display = 'none';
				}, false);
				domNode.appendChild(input);
			}
			if (this.maxFiles !== 1) {
				input.setAttribute('multiple', 'multiple');
			} else {
				input.removeAttribute('multiple');
			}
			if (isDirectory) {
				input.setAttribute('webkitdirectory', 'webkitdirectory');
			} else {
				input.removeAttribute('webkitdirectory');
			}
			if (this.fileType.length >= 1) {
				input.setAttribute('accept', fileTypes.map((type) => {
					type = type.replace(/\s/g, '').toLowerCase();
					if (type.match(/^[^.][^/]+$/)) {
						type = '.' + type;
					}
					return type;
				}).join(','));
			} else {
				input.removeAttribute('accept');
			}
			// When new files are added, simply append them to the overall list
			input.addEventListener('change', (e) => {
				this.fire('fileProcessingBegin');
				this.appendFilesFromFileList(e.target.files, e);
				if (this.clearInput) {
					e.target.value = '';
				}
			}, false);
		});
	}

	assignDrop(domNodes) {
		if (typeof (domNodes.length) == 'undefined') domNodes = [domNodes];

		Helpers.each(domNodes, (domNode) => {
			domNode.addEventListener('dragover', this.onDragOverEnter.bind(this), false);
			domNode.addEventListener('dragenter', this.onDragOverEnter.bind(this), false);
			domNode.addEventListener('dragleave', this.onDragLeave.bind(this), false);
			domNode.addEventListener('drop', this.onDrop.bind(this), false);
		});
	}

	unAssignDrop(domNodes) {
		if (domNodes.length === undefined) domNodes = [domNodes];

		Helpers.each(domNodes, (domNode) => {
			domNode.removeEventListener('dragover', this.onDragOverEnter.bind(this));
			domNode.removeEventListener('dragenter', this.onDragOverEnter.bind(this));
			domNode.removeEventListener('dragleave', this.onDragLeave.bind(this));
			domNode.removeEventListener('drop', this.onDrop.bind(this));
		});
	}

	isUploading() {
		return this.files.some((file) => file.isUploading());
	}

	upload() {
		// Make sure we don't start too many uploads at once
		if (this.isUploading()) return;
		// Kick off the queue
		this.fire('uploadStart');
		for (let num = 1; num <= this.simultaneousUploads; num++) {
			this.uploadNextChunk();
		}
	}

	pause() {
		// Resume all chunks currently being uploaded
		Helpers.each(this.files, function(file) {
			file.abort();
		});
		this.fire('pause');
	};

	cancel() {
		this.fire('beforeCancel');
		for (let i = this.files.length - 1; i >= 0; i--) {
			this.files[i].cancel();
		}
		this.fire('cancel');
	};

	progress() {
		let totalDone = 0;
		let totalSize = 0;
		// Resume all chunks currently being uploaded
		Helpers.each(this.files, function(file) {
			totalDone += file.progress() * file.size;
			totalSize += file.size;
		});
		return totalSize > 0 ? totalDone / totalSize : 0;
	};

	addFile(file, event) {
		this.appendFilesFromFileList([file], event);
	};

	addFiles(files, event) {
		this.appendFilesFromFileList(files, event);
	};

	addFileValidator(fileType, validator) {
		if (fileType in this.validators) {
			console.warn(`Overwriting validator for file type: ${fileType}`)
		}
		this.validators[fileType] = validator;
	}

	removeFile(file) {
		for (let i = this.files.length - 1; i >= 0; i--) {
			if (this.files[i] === file) {
				this.files.splice(i, 1);
			}
		}
	};

	generateUniqueIdentifier(file, event) {
		return typeof this._generateUniqueIdentifier === 'function' ?
			this._generateUniqueIdentifier(file, event) : Helpers.generateUniqueIdentifier(file, event);
	}

	getFromUniqueIdentifier(uniqueIdentifier) {
		return _.find(this.files, {uniqueIdentifier});
	};

	getSize() {
		this.files.reduce((accumulator, file) => accumulator + file.size, 0);
	}

	handleDropEvent(e) {
		this.onDrop(e);
	}

	handleChangeEvent(e) {
		this.appendFilesFromFileList(e.target.files, e);
		e.target.value = '';
	}

	updateQuery(query) {
		this.query = query;
	}
}
