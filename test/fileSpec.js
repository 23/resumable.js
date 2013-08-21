describe('ResumableFile helper functions', function() {

  /**
   * @type {Resumable}
   */
  var resumable;
  /**
   * @type {ResumableFile}
   */
  var file;

  beforeEach(function () {
    resumable = new Resumable({
    });
    file = new resumable.ResumableFile(resumable, {
      name: 'image.jpg',
      type: 'image/png'
    });
  });

  it('should get type', function() {
    expect(file.getType()).toBe('png');
    file.file.type = '';
    expect(file.getType()).toBe('');
  });

  it('should get extension', function() {
    expect(file.name).toBe('image.jpg');
    expect(file.getExtension()).toBe('jpg');
    file.name = '';
    expect(file.getExtension()).toBe('');
    file.name = '.dwq.dq.wd.qdw.e';
    expect(file.getExtension()).toBe('e');
  });
});