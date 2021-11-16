export default class ResumableEventHandler {
  constructor(parent = undefined) {
    this.parent = parent;
    this.registeredEventHandlers = {};
  }

  on(event, callback) {
    event = event.toLowerCase();
    if (!this.registeredEventHandlers.hasOwnProperty(event)) {
      this.registeredEventHandlers[event] = [];
    }
    this.registeredEventHandlers[event].push(callback);
  }

  fire(event, ...args) {
    // Find event listeners, and support wildcard-event `*` to catch all
    event = event.toLowerCase();

    this.executeEventCallback(event, ...args);
    this.executeEventCallback('*', event, ...args);

    // For some specific registeredEventHandlers, additional more general registeredEventHandlers are fired
    switch (event) {
      case 'fileerror':
        this.fire('error', args[1], args[0]);
        break;
      case 'fileprogress':
        this.fire('progress');
        break;
    }

    //Let the event bubble up to the parent if present
    if (this.parent !== undefined) this.parent.fire(event, ...args);
  }

  executeEventCallback(event, ...args) {
    if (!this.registeredEventHandlers.hasOwnProperty(event)) return;
    this.registeredEventHandlers[event].forEach((callback) => callback(...args));
  }
}
