// INTERNAL HELPER METHODS (handy, but ultimately not part of uploading)
export default class ResumableHelpers {
  /**
   * Stop the propagation and default behavior of the given event `e`.
   * @param {Event} e
   */
  static stopEvent(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Generate a unique identifier for the given file based on its size, filename and relative path.
   * @param {File} file
   * @returns {string}
   */
  static generateUniqueIdentifier(file) {
    var relativePath = file.webkitRelativePath || file.relativePath || file.fileName || file.name; // Some confusion in different versions of Firefox
    var size = file.size;
    return (size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, ''));
  }

  /**
   * Flatten the given array and all contained subarrays.
   * Credit: {@link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_flattendeep}
   * @param {*[]} array
   * @returns {*[]} The flattened array
   */
  static flattenDeep(array) {
    return Array.isArray(array)
      ? array.reduce((a, b) => a.concat(this.flattenDeep(b)), [])
      : [array];
  }

  /**
   * Filter the given array based on the predicate inside `callback`
   * and executes `errorCallback` for duplicate elements.
   * @param {*[]} array
   * @param {function(*): *} callback
   * @param {function(*): void} errorCallback
   */
  static uniqBy(array, callback, errorCallback) {
    let seen = new Set();
    return array.filter((item) => {
      let k = callback(item);
      if (seen.has(k)) {
        errorCallback(item);
        return false;
      } else {
        return seen.add(k);
      }
    });
  }

  /**
   * Format the size given in Bytes in a human readable format.
   * @param {number} size
   */
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
