/**
 * The underlying base class for ResumableJS. This class is responsible for registering and executing
 * events and listeners.
 */
export default class ResumableEventHandler {
    private registeredEventHandlers;
    /**
     * Construct a new event handler instance.
     */
    constructor();
    /**
     * Register a new callback for the given event.
     */
    on(event: string, callback: Function): void;
    /**
     * Fire the event listeners for the given event with the given arguments as well as the wildcard event '*'
     */
    fire(event: string, ...args: any[]): void;
    /**
     * Execute all callbacks for the given event with the provided arguments. This function is only used internally
     * to call all callbacks registered to a given event individually.
     */
    private executeEventCallback;
}
