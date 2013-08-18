describe('events', function() {
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

  it('should catch all events', function() {
    var valid = false;
    resumable.on('catchall', function (event) {
      expect(event).toBe('test');
      valid = true;
    });
    resumable.fire('test');
    expect(valid).toBeTruthy();
  });

  it('should catch an event', function() {
    var valid = false;
    resumable.on('test', function () {
      valid = true;
    });
    resumable.fire('test');
    expect(valid).toBeTruthy();
  });

  it('should pass some arguments', function() {
    var valid = false;
    var argumentOne = 123;
    var argumentTwo = "dqw";
    resumable.on('test', function () {
      expect(arguments.length).toBe(2);
      expect(arguments[0]).toBe(argumentOne);
      expect(arguments[1]).toBe(argumentTwo);
      expect(arguments[2]).toBeUndefined();
      valid = true;
    });
    resumable.fire('test', argumentOne, argumentTwo);
    expect(valid).toBeTruthy();
  });

  it('should call fileAdded event', function() {
    var valid = false;
    resumable.on('fileAdded', function () {
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
  });
});