export default class ResumableEventHandler {
  private registeredEventHandlers: { [event: string]: Function[]};

  /**
   * Construct a new event handler instance.
   */
  constructor() {
    this.registeredEventHandlers = {};
  }

  /**
   * Register a new callback for the given event.
   * @param event
   * @param callback
   */
  on(event: string, callback: Function): void {
    event = event.toLowerCase();
    if (!this.registeredEventHandlers.hasOwnProperty(event)) {
      this.registeredEventHandlers[event] = [];
    }
    this.registeredEventHandlers[event].push(callback);
  }

  /**
   * Fire the event listeners for the given event with the given arguments.
   * @param event
   * @param args
   */
  fire(event: string, ...args): void {
    // Find event listeners, and support wildcard-event `*` to catch all
    event = event.toLowerCase();

    this.executeEventCallback(event, ...args);
    this.executeEventCallback('*', event, ...args);
  }

  /**
   * Execute all callbacks for the given event with the provided arguments. This function is only used internally
   * to call the callbacks individually.
   * @param event
   * @param args
   * @private
   */
  private executeEventCallback(event: string, ...args): void {
    if (!this.registeredEventHandlers.hasOwnProperty(event)) return;
    this.registeredEventHandlers[event].forEach((callback) => callback(...args));
  }
}
