/*
* MIT Licensed
*
* For all code added/modified until Sep 24, 2020
* (see original repo as original code was split up into multiple files)
* https://www.twentythree.com
* https://github.com/23/resumable.js
* Steffen Fagerström Christensen, steffen@twentythree.com
*
* For all code added/modified since Sep 24, 2020
* https://www.pointcloudtechnology.com/en/
* https://github.com/pointcloudtechnology/resumable.js
* For contact (not the sole author): Marcel Wendler, https://github.com/UniquePanda, marcel.wendler@pointcloudtechnology.com
*/

/**
 * The underlying base class for ResumableJS. This class is responsible for registering and executing
 * events and listeners.
 */
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
   */
  on(event: string, callback: Function): void {
    event = event.toLowerCase();
    if (!this.registeredEventHandlers.hasOwnProperty(event)) {
      this.registeredEventHandlers[event] = [];
    }
    this.registeredEventHandlers[event].push(callback);
  }

  /**
   * Fire the event listeners for the given event with the given arguments as well as the wildcard event '*'
   */
  fire(event: string, ...args): void {
    event = event.toLowerCase();

    this.executeEventCallback(event, ...args);
    this.executeEventCallback('*', event, ...args);
  }

  /**
   * Execute all callbacks for the given event with the provided arguments. This function is only used internally
   * to call all callbacks registered to a given event individually.
   */
  private executeEventCallback(event: string, ...args): void {
    if (!this.registeredEventHandlers.hasOwnProperty(event)) return;
    this.registeredEventHandlers[event].forEach((callback) => callback(...args));
  }
}
