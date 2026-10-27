/**
 * Banana Brain — Game Service
 * Orchestrates challenge creation, answer verification, scoring algorithms, and event publishing.
 */
import { bananaApiService } from './banana-api.service.js';
import { challengeRepository } from '../repositories/challenge.repository.js';
import { gameRepository } from '../repositories/game.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { eventBus, DOMAIN_EVENTS } from '../events/event-emitter.js';
import { logger } from '../utils/logger.js';

export class GameService {
  /**
   * Starts a new puzzle challenge for the authenticated user.
   */
  async startChallenge(userId, gameSessionId = null) {
    // Check for an existing unexpired, incomplete challenge first to prevent spamming
    const existing = await challengeRepository.findActiveByUser(userId);
    if (existing) {
      logger.info(`Reusing active challenge [${existing.id}] for user [${userId}]`);
      return challengeRepository.toPublic(existing);
    }

    // Fetch new challenge from Banana API
    const challengeData = await bananaApiService.createChallenge(userId, gameSessionId);

    // Persist challenge with confidential server-held solution
    const createdChallenge = await challengeRepository.create({
      id: challengeData.id,
      userId: challengeData.userId,
      gameSessionId: challengeData.gameSessionId,
      imageUrl: challengeData.imageUrl,
      solution: challengeData.solution, // CONFIDENTIAL
      expiresAt: challengeData.expiresAt
    });

    // Publish domain event
    eventBus.emit(DOMAIN_EVENTS.CHALLENGE_STARTED, {
      challengeId: createdChallenge.id,
      userId,
      startedAt: createdChallenge.created_at
    });

    // Return sanitized payload to client (solution NEVER sent)
    return challengeRepository.toPublic(createdChallenge);
  }

  /**
   * Submits and validates a player's answer against the server-held solution.
   * Calculates score, speed bonus, streak multiplier, records the attempt, and updates user stats.
   */
  async submitAnswer(userId, challengeId, rawAnswer) {
    if (!challengeId) {
      const err = new Error('Challenge ID is required');
      err.status = 400;
      throw err;
    }

    // Validate answer is numeric
    const parsedAnswer = parseInt(rawAnswer, 10);
    if (isNaN(parsedAnswer) || parsedAnswer < 0 || parsedAnswer > 9) {
      const err = new Error('Answer must be a single digit between 0 and 9');
      err.status = 400;
      throw err;
    }

    // Retrieve challenge
    const challenge = await challengeRepository.findById(challengeId);
    if (!challenge) {
      const err = new Error('Challenge not found');
      err.status = 404;
      throw err;
    }

    // Authorization guard: Ensure user owns this challenge (Anti-IDOR)
    if (challenge.user_id !== userId) {
      const err = new Error('Forbidden: You do not have authorization to answer this challenge');
      err.status = 403;
      throw err;
    }

    // Prevent duplicate scoring: Check if challenge was already answered
    if (challenge.is_completed === 1) {
      const err = new Error('Conflict: This challenge has already been completed and scored');
      err.status = 409;
      throw err;
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(challenge.expires_at);
    if (now > expiresAt) {
      const err = new Error('Challenge has expired. Please request a new puzzle.');
      err.status = 410; // HTTP 410 Gone
      throw err;
    }

    // Calculate response time in milliseconds
    const createdAt = new Date(challenge.created_at);
    const responseTimeMs = Math.max(0, now.getTime() - createdAt.getTime());

    // Evaluate correctness against server-side secret
    const isCorrect = (parsedAnswer === challenge.solution);

    // Scoring Rules
    const currentStats = await userRepository.getStats(userId);
    let pointsAwarded = 0;
    let speedBonus = 0;
    let streakBonus = 0;
    let newStreak = 0;
    let bestStreak = currentStats ? currentStats.best_streak : 0;

    if (isCorrect) {
      const basePoints = 100;

      // Speed bonus: up to +50 points
      if (responseTimeMs < 10000) {
        speedBonus = 50;
      } else if (responseTimeMs < 20000) {
        speedBonus = 30;
      } else if (responseTimeMs < 30000) {
        speedBonus = 15;
      }

      // Streak multiplier: +10 pts per consecutive answer (capped at +100)
      newStreak = (currentStats ? currentStats.current_streak : 0) + 1;
      streakBonus = Math.min(newStreak * 10, 100);
      bestStreak = Math.max(bestStreak, newStreak);

      pointsAwarded = basePoints + speedBonus + streakBonus;
    } else {
      // Incorrect answers yield 0 points and break streak
      newStreak = 0;
      streakBonus = 0;
      speedBonus = 0;
      pointsAwarded = 0;
    }

    // Mark challenge completed so it cannot be re-answered
    await challengeRepository.markCompleted(challengeId);

    // Record attempt in database
    await gameRepository.recordAttempt({
      userId,
      challengeId,
      submittedAnswer: parsedAnswer,
      isCorrect,
      pointsAwarded,
      speedBonus,
      streakBonus,
      responseTimeMs
    });

    // Update player aggregate statistics
    const newTotalScore = (currentStats ? currentStats.total_score : 0) + pointsAwarded;
    const newGamesPlayed = (currentStats ? currentStats.games_played : 0) + 1;
    const newCorrect = (currentStats ? currentStats.correct_answers : 0) + (isCorrect ? 1 : 0);
    const newIncorrect = (currentStats ? currentStats.incorrect_answers : 0) + (isCorrect ? 0 : 1);

    await userRepository.updateStats(userId, {
      totalScore: newTotalScore,
      gamesPlayed: newGamesPlayed,
      correctAnswers: newCorrect,
      incorrectAnswers: newIncorrect,
      currentStreak: newStreak,
      bestStreak: bestStreak
    });

    // Publish application domain events
    eventBus.emit(DOMAIN_EVENTS.ANSWER_SUBMITTED, {
      challengeId,
      userId,
      isCorrect,
      responseTimeMs
    });

    eventBus.emit(DOMAIN_EVENTS.CHALLENGE_COMPLETED, {
      challengeId,
      userId,
      isCorrect,
      pointsAwarded,
      currentStreak: newStreak
    });

    eventBus.emit(DOMAIN_EVENTS.SCORE_UPDATED, {
      userId,
      newTotalScore,
      pointsDelta: pointsAwarded
    });

    // Return verification result (solution now safely revealed to provide educational feedback)
    return {
      success: true,
      correct: isCorrect,
      submittedAnswer: parsedAnswer,
      solution: challenge.solution,
      pointsAwarded,
      speedBonus,
      streakBonus,
      currentStreak: newStreak,
      bestStreak,
      totalScore: newTotalScore,
      responseTimeMs
    };
  }

  /**
   * Retrieves player stats along with competitive leaderboard ranking.
   */
  async getUserStats(userId) {
    const stats = await userRepository.getStats(userId);
    if (!stats) return null;

    const rank = await gameRepository.getUserLeaderboardRank(userId);
    const totalAttempts = stats.correct_answers + stats.incorrect_answers;
    const accuracy = totalAttempts > 0
      ? Math.round((stats.correct_answers / totalAttempts) * 100 * 10) / 10
      : 0;

    return {
      userId: stats.user_id,
      username: stats.username,
      displayName: stats.display_name,
      avatarColor: stats.avatar_color,
      totalScore: stats.total_score,
      gamesPlayed: stats.games_played,
      correctAnswers: stats.correct_answers,
      incorrectAnswers: stats.incorrect_answers,
      accuracyPercentage: accuracy,
      currentStreak: stats.current_streak,
      bestStreak: stats.best_streak,
      rank: rank || 1,
      lastPlayedAt: stats.last_played_at
    };
  }

  /**
   * Retrieves paginated game history attempts for the user.
   */
  async getUserHistory(userId, limit = 20, offset = 0) {
    const attempts = await gameRepository.getUserAttempts(userId, limit, offset);
    return attempts.map(att => ({
      id: att.id,
      challengeId: att.challenge_id,
      imageUrl: att.image_url,
      submittedAnswer: att.submitted_answer,
      solution: att.solution,
      isCorrect: Boolean(att.is_correct),
      pointsAwarded: att.points_awarded,
      speedBonus: att.speed_bonus,
      streakBonus: att.streak_bonus,
      responseTimeMs: att.response_time_ms,
      submittedAt: att.submitted_at
    }));
  }
}

export const gameService = new GameService();
