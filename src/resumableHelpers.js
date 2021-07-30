// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
export default class ResumableHelpers {
	static stopEvent(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	static each(o, callback) {
		if (o.length !== undefined) {
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

	static generateUniqueIdentifier(file) {
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

	static indexOf(array, obj) {
		if (array.indexOf) {
			return array.indexOf(obj);
		}
		for (var i = 0; i < array.length; i++) {
			if (array[i] === obj) {
				return i;
			}
		}
		return -1;
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

	/**
	 * Get the target url for the specified request type and params
	 * @param {string} requestType
	 * @param {string} sendTarget
	 * @param {string}testTarget
	 * @param {Object} params
	 * @param {string} parameterNamespace
	 */
	static getTarget(requestType, sendTarget, testTarget, params, parameterNamespace = '') {
		let target = sendTarget;

		if (requestType === 'test' && testTarget) {
			target = testTarget === '/' ? sendTarget : testTarget;
		}

		let separator = target.indexOf('?') < 0 ? '?' : '&';
		let joinedParams = Object.entries(params).map(([key, value]) => [
			encodeURIComponent(parameterNamespace + key),
			encodeURIComponent(value),
		].join('=')).join('&');

		if (joinedParams) target = target + separator + joinedParams;

		return target;
	}
}
