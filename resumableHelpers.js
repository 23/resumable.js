// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
export default class ResumableHelpers {
	static stopEvent(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	static each(o, callback) {
		if (typeof (o.length) !== 'undefined') {
			for (var i = 0; i < o.length; i++) {
				// Array or FileList
				if (callback(o[i]) === false) return;
			}
		} else {
			for (i in o) {
				// Object
				if (callback(i, o[i]) === false) return;
			}
		}
	}

	static generateUniqueIdentifier(file, event) {
		var custom = $.getOpt('generateUniqueIdentifier');
		if (typeof custom === 'function') {
			return custom(file, event);
		}
		var relativePath = file.webkitRelativePath || file.relativePath || file.fileName || file.name; // Some confusion in different versions of Firefox
		var size = file.size;
		return (size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
	}

	static contains(array, test) {
		var result = false;

		this.each(array, function(value) {
			if (value === test) {
				result = true;
				return false;
			}
			return true;
		});

		return result;
	}

	static formatSize(size) {
		if (size < 1024) {
			return size + ' bytes';
		} else if (size < 1024 * 1024) {
			return (size / 1024.0).toFixed(0) + ' KB';
		} else if (size < 1024 * 1024 * 1024) {
			return (size / 1024.0 / 1024.0).toFixed(1) + ' MB';
		} else {
			return (size / 1024.0 / 1024.0 / 1024.0).toFixed(1) + ' GB';
		}
	}

	static getTarget(request, params) {
		var target = $.getOpt('target');

		if (request === 'test' && $.getOpt('testTarget')) {
			target = $.getOpt('testTarget') === '/' ? $.getOpt('target') : $.getOpt('testTarget');
		}

		if (typeof target === 'function') {
			return target(params);
		}

		var separator = target.indexOf('?') < 0 ? '?' : '&';
		var joinedParams = params.join('&');

		if (joinedParams) target = target + separator + joinedParams;

		return target;
	}
}
