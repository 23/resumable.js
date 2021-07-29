export default class BaseClass {
	constructor(parent = undefined) {
		this.parent = parent;
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

		console.log(this.constructor.name, event, args);

		this.executeEventCallback(event, ...args);
		this.executeEventCallback('*', event, ...args);

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
		if (!this.events.hasOwnProperty(event)) return;
		this.events[event].forEach((callback) => callback(...args));

	}
}
