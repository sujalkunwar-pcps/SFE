/**
 * Banana Brain — Domain Event Handlers
 * Subscribes to application domain events to decouple side effects (auditing, metrics, notifications).
 */
import { eventBus, DOMAIN_EVENTS } from './event-emitter.js';
import { logger } from '../utils/logger.js';

export function registerDomainEventHandlers() {
  // 1. challenge.started
  eventBus.on(DOMAIN_EVENTS.CHALLENGE_STARTED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.CHALLENGE_STARTED}] Challenge initiated`, {
      challengeId: payload.challengeId,
      userId: payload.userId,
      startedAt: payload.startedAt
    });
  });

  // 2. answer.submitted
  eventBus.on(DOMAIN_EVENTS.ANSWER_SUBMITTED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.ANSWER_SUBMITTED}] Answer submitted`, {
      challengeId: payload.challengeId,
      userId: payload.userId,
      isCorrect: payload.isCorrect,
      responseTimeMs: payload.responseTimeMs
    });
  });

  // 3. challenge.completed
  eventBus.on(DOMAIN_EVENTS.CHALLENGE_COMPLETED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.CHALLENGE_COMPLETED}] Challenge concluded`, {
      challengeId: payload.challengeId,
      userId: payload.userId,
      isCorrect: payload.isCorrect,
      pointsAwarded: payload.pointsAwarded,
      currentStreak: payload.currentStreak
    });
  });

  // 4. score.updated
  eventBus.on(DOMAIN_EVENTS.SCORE_UPDATED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.SCORE_UPDATED}] Player score updated`, {
      userId: payload.userId,
      newTotalScore: payload.newTotalScore,
      pointsDelta: payload.pointsDelta
    });
  });

  // 5. game.session.completed
  eventBus.on(DOMAIN_EVENTS.SESSION_COMPLETED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.SESSION_COMPLETED}] Session finished`, {
      sessionId: payload.sessionId,
      userId: payload.userId,
      finalScore: payload.finalScore
    });
  });

  // 6. user.registered
  eventBus.on(DOMAIN_EVENTS.USER_REGISTERED, (payload) => {
    logger.info(`[Event: ${DOMAIN_EVENTS.USER_REGISTERED}] New virtual identity created`, {
      userId: payload.userId,
      username: payload.username
    });
  });

  logger.info('Registered all backend domain event observers.');
}
