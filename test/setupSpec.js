describe('setup', function() {
  /**
   * @type {Resumable}
   */
  var resumable;

  beforeEach(function () {
    resumable = new Resumable();
  });

  it('should be supported', function() {
    expect(resumable.support).toBeTruthy();
  });

  it('files should be empty', function() {
    expect(resumable.files).toBeDefined();
    expect(resumable.files.length).toBe(0);
  });

  it('events should be empty', function() {
    expect(resumable.events).toBeDefined();
    expect(resumable.events.length).toBe(0);
  });

  it('set opts', function() {
    resumable = new Resumable({
      chunkSize: 123
    });
    expect(resumable.opts.chunkSize).toBe(123);
    expect(resumable.opts.simultaneousUploads).toBe(resumable.defaults.simultaneousUploads);
  });

  it('test methods', function() {
    expect(resumable.getSize()).toBe(0);
    expect(resumable.getFromUniqueIdentifier('')).toBe(false);
    expect(resumable.progress()).toBe(0);
    expect(resumable.isUploading()).toBe(false);
    expect(resumable.uploadNextChunk()).toBe(false);
  });

});