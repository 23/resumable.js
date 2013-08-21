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
  /**
   * @type {ResumableFile}
   */
  var file;

  beforeEach(function () {
    resumable = new Resumable({
      generateUniqueIdentifier: function (file) {
        return file.size;
      },
      testChunks: true
    });
    resumable.addFile(new Blob(['file part']));
    file = resumable.files[0];
    requests = [];
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function () {
    xhr.restore();
  });

  it('should test if file exists', function() {
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
});