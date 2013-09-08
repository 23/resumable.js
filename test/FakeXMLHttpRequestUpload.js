/**
 * Extends sinon.FakeXMLHttpRequest with upload functionality.
 * Property `upload` to FakeXMLHttpRequest added. It works with the following events:
 *  "loadstart", "progress", "abort", "error", "load", "loadend"
 * Events are instance of FakeXMLHttpRequestProgressEvent and has following properties:
 *  loaded - loaded request size.
 *  total - total request size.
 *  lengthComputable - boolean indicates if loaded and total attributes were computed.
 * Helper method `progress`, such as `sinon.FakeXMLHttpRequest.respond(200...)`, was added.
 *
 */
(function() {
  function FakeXMLHttpRequestUpload() {
    var xhr = this;
    var events = ["loadstart", "progress", "abort", "error", "load", "loadend"];

    function addEventListener(eventName) {
      xhr.addEventListener(eventName, function (event) {
        var listener = xhr["on" + eventName];

        if (listener && typeof listener == "function") {
          listener(event);
        }
      });
    }

    for (var i = events.length - 1; i >= 0; i--) {
      addEventListener(events[i]);
    }
  }

  sinon.extend(FakeXMLHttpRequestUpload.prototype, sinon.EventTarget);

  function FakeXMLHttpRequestProgressEvent(
      type, bubbles, cancelable, target, loaded, total, lengthComputable
    ) {
    this.initEvent(type, bubbles, cancelable, target);
    this.initProgressEvent(loaded || 0, total || 0, lengthComputable || false);
  }

  sinon.extend(FakeXMLHttpRequestProgressEvent.prototype, sinon.Event.prototype, {
    initProgressEvent: function initProgressEvent(loaded, total, lengthComputable) {
      this.loaded = loaded;
      this.total = total;
      this.lengthComputable = lengthComputable;
    }
  });

  var originalFakeXMLHttpRequest = sinon.FakeXMLHttpRequest;

  function FakeXMLHttpRequestWithUpload() {
    sinon.extend(this, new originalFakeXMLHttpRequest());
    this.upload = new FakeXMLHttpRequestUpload();
    if (typeof FakeXMLHttpRequestWithUpload.onCreate == "function") {
      FakeXMLHttpRequestWithUpload.onCreate(this);
    }
  }

  sinon.extend(FakeXMLHttpRequestWithUpload.prototype, originalFakeXMLHttpRequest.prototype, {
    send: function send(data) {
      originalFakeXMLHttpRequest.prototype.send.call(this, data);
      this.upload.dispatchEvent(
        new FakeXMLHttpRequestProgressEvent("loadstart", false, false, this)
      );
    },
    /**
     * Report upload progress
     * @name sinon.FakeXMLHttpRequest.progress
     * @function
     * @param loaded
     * @param total
     * @param lengthComputable
     */
    progress: function progress(loaded, total, lengthComputable) {
      this.upload.dispatchEvent(
        new FakeXMLHttpRequestProgressEvent(
          "progress", false, false, this, loaded, total, lengthComputable)
      );
    },
    respond: function respond(status, headers, body) {
      originalFakeXMLHttpRequest.prototype.respond.call(this, status, headers, body);
      this.upload.dispatchEvent(
        new FakeXMLHttpRequestProgressEvent("load", false, false, this)
      );
      this.upload.dispatchEvent(
        new FakeXMLHttpRequestProgressEvent("loadend", false, false, this)
      );
    }
  });

  sinon.FakeXMLHttpRequest = FakeXMLHttpRequestWithUpload;
  sinon.FakeXMLHttpRequestProgressEvent = FakeXMLHttpRequestProgressEvent;
  sinon.FakeXMLHttpRequestWithUpload = FakeXMLHttpRequestWithUpload;
  sinon.originalFakeXMLHttpRequest = originalFakeXMLHttpRequest;
})();