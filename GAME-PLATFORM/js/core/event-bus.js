"use strict";

/* =========================================
   EVENT BUS SYSTEM
========================================= */

class EventBus {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(data));
  }
}

// បង្កើត Instance សម្រាប់ប្រើប្រាស់
const eventBus = new EventBus();

// បញ្ជូនទៅ Global Scope ដើម្បីអាចប្រើបានគ្រប់ File ទាំងអស់
window.EventBus = EventBus;
window.eventBus = eventBus;
