class BulwarkPubSub {
  constructor () {
    this.settings = {};
    this.events = [];

    return {
      settings:    this.settings,
      subscribe:   this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this),
      publish:     this.publish.bind(this)
    }
  }

  subscribe (event_name, event_callback) {
    // Add event and callback to events array
    this.events[event_name] = this.events[event_name] || [];
    this.events[event_name].push(event_callback);
  }

  unsubscribe (event_name, event_callback) {
    // Remove event and callback from events array
    if (this.events[event_name]) {
      for (let i = 0, event_callbacks_length = this.events[event_name].length; i < event_callbacks_length; i++) {
        if (this.events[event_name][i] == event_callback) {
          this.events[event_name].splice(i, 1);
          break;
        }
      }
    }
    this.events[event_name] = this.events[event_name] || [];
    this.events[event_name].push(event_callback);
  }

  publish (event_name, callback_arguments = null) {
    // Trigger functions that are indexed under event_name
    if (this.events[event_name]) {
      this.events[event_name].forEach(function(fn) {
        // Check if there are new arguments
        if (callback_arguments) {
          fn(callback_arguments);
        } else {
          fn();
        }
      });
    }
  }
}
