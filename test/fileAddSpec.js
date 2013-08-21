describe('fileAdd event', function() {
  /**
   * @type {Resumable}
   */
  var resumable;

  beforeEach(function () {
    resumable = new Resumable({
      generateUniqueIdentifier: function (file) {
        return file.size;
      }
    });
  });

  it('should call fileAdded event', function() {
    var valid = false;
    resumable.on('fileAdded', function (file) {
      expect(file.file instanceof Blob).toBeTruthy();
      valid = true;
    });
    resumable.addFile(new Blob(['file part']));
    expect(valid).toBeTruthy();
  });

  it('should call filesAdded event', function() {
    var count = 0;
    resumable.on('filesAdded', function (files) {
      count = files.length;
    });
    resumable.addFiles([
      new Blob(['file part']),
      new Blob(['file 2 part'])
    ]);
    expect(count).toBe(2);
    expect(resumable.files.length).toBe(2);
  });

  it('should validate fileAdded', function() {
    resumable.on('fileAdded', function () {
      return false;
    });
    resumable.addFile(new Blob(['file part']));
    expect(resumable.files.length).toBe(0);
  });

  it('should validate filesAdded', function() {
    resumable.on('filesAdded', function () {
      return false;
    });
    resumable.addFile(new Blob(['file part']));
    expect(resumable.files.length).toBe(0);
  });

  it('should validate fileAdded and filesAdded', function() {
    resumable.on('fileAdded', function () {
      return false;
    });
    var valid = false;
    resumable.on('filesAdded', function (files) {
      valid = files.length === 0;
    });
    resumable.addFile(new Blob(['file part']));
    expect(valid).toBeTruthy();
  });
});