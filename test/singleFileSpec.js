describe('add single file', function() {
  /**
   * @type {Resumable}
   */
  var resumable;

  beforeEach(function () {
    resumable = new Resumable({
      generateUniqueIdentifier: function (file) {
        return file.size;
      },
      singleFile: true
    });
  });

  it('should add single file', function() {
    resumable.addFile(new Blob(['file part']));
    expect(resumable.files.length).toBe(1);
    var file = resumable.files[0];
    resumable.upload();
    expect(file.isUploading()).toBeTruthy();
    resumable.addFile(new Blob(['file part 2']));
    expect(resumable.files.length).toBe(1);
    expect(file.isUploading()).toBeFalsy();
  });
});