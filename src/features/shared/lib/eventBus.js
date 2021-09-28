import { Mutex } from 'async-mutex';
import { EventEmitter } from 'fbemitter';
import { v4 as uuidv4 } from 'uuid';

class EventBus {
  emitter = new EventEmitter();

  subscibers = [];

  subscribeToEvent(eventName, callback) {
    return this.emitter.addListener(eventName, callback);
  }

  unsubscribeWithToken(token) {
    if (token) {
      token.remove();
    }
  }

  subscribe(component, eventName, callback) {
    const token = this.emitter.addListener(eventName, callback);

    this.subscibers.push({
      component,
      token,
    });

    this.publish('eventbus.addedListener', {
      listeners: this.emitter.listeners.length,
    });
  }

  unsubscribe(component) {
    const mutex = new Mutex();

    mutex.runExclusive(() => {
      const listeners = this.subscibers.filter((x) => x.component === component);

      this.subscibers = this.subscibers.filter((x) => x.component !== component);

      listeners.forEach((x) => x.token.remove());
    });
  }

  publish(eventName, message) {
    console.log('EventBus - publishing event', { eventName, message });
    const eventId = uuidv4();
    this.emitter.emit(eventName, { eventId, message });
  }
}

const eventBus = new EventBus();

export default eventBus;
