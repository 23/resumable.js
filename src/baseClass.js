export default class BaseClass {
	constructor() {
		this.events = {};
	}

	on(event, callback) {
		event = event.toLowerCase();
		if (!this.events.hasOwnProperty(event)) {
			this.events[event] = []
		}
		this.events[event.toLowerCase()].push(callback);
	}

	fire(event, ...args) {
		// Find event listeners, and support wildcard-event `*` to catch all
		event = event.toLowerCase();
		for (let savedEvent in this.events) {
			if (!this.events.hasOwnProperty(savedEvent)) continue;
			if (savedEvent === event) {
				this.events[savedEvent].forEach((callback) => callback(...args));
			}
			if (savedEvent === '*') {
				this.events[savedEvent].forEach((callback) => callback(event, ...args));
			}
		}
		if (event === 'fileerror') this.fire('error', args[2], args[1]);
		if (event === 'fileprogress') this.fire('progress');
	}
}
