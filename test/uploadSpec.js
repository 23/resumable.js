describe('upload file', function() {
  /**
   * @type {Resumable}
   */
  var resumable;
  /**
   * @type {FakeXMLHttpRequest}
   */
  var xhr;
  /**
   * @type {FakeXMLHttpRequest[]}
   */
  var requests = [];

  beforeEach(function () {
    resumable = new Resumable({
      generateUniqueIdentifier: function (file) {
        return file.size;
      },
      testChunks: true
    });
    requests = [];
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function () {
    xhr.restore();
  });

  it('should test simple file upload', function() {
    resumable.addFile(new Blob(['file part']));
    var file = resumable.files[0];
    expect(file.isComplete()).toBeFalsy();
    expect(file.isUploading()).toBeFalsy();
    expect(file.chunks.length).toBe(1);
    expect(file.progress()).toBe(0);
    resumable.upload();
    expect(requests.length).toBe(1);
    expect(file.isComplete()).toBeFalsy();
    expect(file.isUploading()).toBeTruthy();
    requests[0].respond(200);
    expect(file.isComplete()).toBeTruthy();
    expect(file.isUploading()).toBeFalsy();
  });

  it('should test file upload status with lots of chunks', function() {
    function repeat(string, n) {
      var s = '';
      while (s.length < n) {
        s += string;
      }
      return s;
    }
    resumable.opts.chunkSize = 1;
    resumable.addFile(new Blob([repeat('A', 10)]));
    var file = resumable.files[0];
    expect(file.chunks.length).toBe(10);
    resumable.upload();
    expect(file.progress()).toBe(0);
    for (var i = 0; i < 9; i++) {
      expect(requests[i]).toBeDefined();
      expect(file.isComplete()).toBeFalsy();
      expect(file.isUploading()).toBeTruthy();
      requests[i].respond(200);
      expect(file.isComplete()).toBeFalsy();
      expect(file.isUploading()).toBeTruthy();
    }
    expect(requests[9]).toBeDefined();
    expect(file.isComplete()).toBeFalsy();
    expect(file.isUploading()).toBeTruthy();
    requests[i].respond(200);
    expect(file.isComplete()).toBeTruthy();
    expect(file.isUploading()).toBeFalsy();
    expect(file.progress()).toBe(1);
  });

  it('should throw expected events', function () {
    var events = [];
    resumable.on('catchAll', function (event) {
      events.push(event);
    });
    resumable.opts.chunkSize = 1;
    resumable.addFile(new Blob(['12']));
    var file = resumable.files[0];
    expect(file.chunks.length).toBe(2);
    resumable.upload();
    // Sync events
    expect(events.length).toBe(3);
    expect(events[0]).toBe('fileAdded');
    expect(events[1]).toBe('filesAdded');
    expect(events[2]).toBe('uploadStart');
    // Async
    requests[0].respond(200);
    expect(events.length).toBe(5);
    expect(events[3]).toBe('fileProgress');
    expect(events[4]).toBe('progress');
    requests[1].respond(200);
    expect(events.length).toBe(9);
    expect(events[5]).toBe('fileProgress');
    expect(events[6]).toBe('progress');
    expect(events[7]).toBe('fileSuccess');
    // Can be sync and async
    expect(events[8]).toBe('complete');
  });

  it('should pause and resume file', function () {
    resumable.opts.chunkSize = 1;
    resumable.opts.simultaneousUploads = 2;
    resumable.addFile(new Blob(['1234']));
    resumable.addFile(new Blob(['56']));
    var files = resumable.files;
    expect(files[0].chunks.length).toBe(4);
    expect(files[1].chunks.length).toBe(2);
    resumable.upload();
    expect(files[0].isUploading()).toBeTruthy();
    expect(requests.length).toBe(2);
    expect(requests[0].aborted).toBeUndefined();
    expect(requests[1].aborted).toBeUndefined();
    // should start upload second file
    files[0].pause();
    expect(files[0].isUploading()).toBeFalsy();
    expect(files[1].isUploading()).toBeTruthy();
    expect(requests.length).toBe(4);
    expect(requests[0].aborted).toBeTruthy();
    expect(requests[1].aborted).toBeTruthy();
    expect(requests[2].aborted).toBeUndefined();
    expect(requests[3].aborted).toBeUndefined();
    // Should resume file after second file chunks is uploaded
    files[0].resume();
    expect(files[0].isUploading()).toBeFalsy();
    expect(requests.length).toBe(4);
    requests[2].respond(200);// second file chunk
    expect(files[0].isUploading()).toBeTruthy();
    expect(files[1].isUploading()).toBeTruthy();
    expect(requests.length).toBe(5);
    requests[3].respond(200); // second file chunk
    expect(requests.length).toBe(6);
    expect(files[0].isUploading()).toBeTruthy();
    expect(files[1].isUploading()).toBeFalsy();
    expect(files[1].isComplete()).toBeTruthy();
    requests[4].respond(200);
    expect(requests.length).toBe(7);
    requests[5].respond(200);
    expect(requests.length).toBe(8);
    requests[6].respond(200);
    expect(requests.length).toBe(8);
    requests[7].respond(200);
    expect(requests.length).toBe(8);
    // Upload finished
    expect(files[0].isUploading()).toBeFalsy();
    expect(files[0].isComplete()).toBeTruthy();
    expect(files[1].isUploading()).toBeFalsy();
    expect(files[1].isComplete()).toBeTruthy();
  });
});