describe('events', function() {
  /**
   * @type {Resumable}
   */
  var resumable;

  beforeEach(function () {
    resumable = new Resumable();
  });

  it('should catch all events', function() {
    var valid = false;
    resumable.on('catchall', function () {
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
});