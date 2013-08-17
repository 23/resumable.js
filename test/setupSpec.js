describe('setup', function() {
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
});