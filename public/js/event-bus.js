/**
 * Banana Brain — Frontend Event Bus
 * Implements the Publish-Subscribe pattern for decoupled client-side state transitions.
 */

class ClientEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in event listener for [${event}]:`, err);
        }
      });
    }
  }
}

export const eventBus = new ClientEventBus();

export const CLIENT_EVENTS = {
  AUTH_STATE_CHANGED: 'auth:state-changed',
  CHALLENGE_LOADED: 'game:challenge-loaded',
  ANSWER_SUBMITTED: 'game:answer-submitted',
  ANSWER_RESULT: 'game:answer-result',
  SCORE_UPDATED: 'game:score-updated',
  TOAST_TRIGGERED: 'ui:toast'
};
