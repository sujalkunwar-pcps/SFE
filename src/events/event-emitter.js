/**
 * Banana Brain — Domain Event Emitter
 * Implements the Publish-Subscribe pattern for decoupled backend application events.
 */
import { EventEmitter } from 'node:events';

class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    // Allow ample listeners for multi-subscriber domain handlers
    this.setMaxListeners(20);
  }
}

export const eventBus = new DomainEventEmitter();

// Domain Event Name Constants
export const DOMAIN_EVENTS = {
  CHALLENGE_STARTED: 'challenge.started',
  ANSWER_SUBMITTED: 'answer.submitted',
  CHALLENGE_COMPLETED: 'challenge.completed',
  SCORE_UPDATED: 'score.updated',
  SESSION_COMPLETED: 'game.session.completed',
  USER_REGISTERED: 'user.registered'
};
