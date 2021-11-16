export default class ResumableEventHandler {
  constructor(parent = undefined) {
    this.parent = parent;
    this.registeredEventHandlers = {};
  }

  /**
   * @param {string} event
   * @param {function} callback
   */
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

    console.log(this.constructor.name, event, args);
    this.executeEventCallback(event, ...args);
    this.executeEventCallback('*', event, ...args);

    //Let the event bubble up to the parent if present
    //if (this.parent !== undefined) this.parent.fire(event, ...args);
  }

  executeEventCallback(event, ...args) {
    if (!this.registeredEventHandlers.hasOwnProperty(event)) return;
    this.registeredEventHandlers[event].forEach((callback) => callback(...args));
  }
}
