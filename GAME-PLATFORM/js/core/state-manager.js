// 04-JS/core/state-manager.js
import { eventBus } from './event-bus.js';

class StateManager {
  constructor(initialState = {}) {
    this.state = new Proxy(initialState, {
      set: (target, key, value) => {
        const oldValue = target[key];
        target[key] = value;
        // ជូនដំណឹងនៅពេលមានការផ្លាស់ប្តូរ State
        eventBus.emit(`state:${key}`, { newValue: value, oldValue });
        eventBus.emit('state:change', { key, newValue: value, oldValue });
        return true;
      }
    });
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
  }
}

export const stateManager = new StateManager({
  user: null,
  balance: 0,
  theme: 'dark',
  lang: 'kh',
  currentGame: null
});
