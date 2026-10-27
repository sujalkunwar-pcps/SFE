/**
 * Banana Brain — Game & Attempt Repository
 * Manages game sessions, answer attempt history, and competitive leaderboard rankings.
 */
import { db } from '../config/database.js';

export const gameRepository = {
  async createSession(id, userId) {
    await db.run(
      `INSERT INTO game_sessions (id, user_id, status, score)
       VALUES (?, ?, 'active', 0)`,
      [id, userId]
    );
    return this.findSessionById(id);
  },

  async findSessionById(id) {
    return db.get(`SELECT * FROM game_sessions WHERE id = ?`, [id]);
  },

  async endSession(id, finalScore) {
    await db.run(
      `UPDATE game_sessions
       SET status = 'completed', score = ?, ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [finalScore, id]
    );
    return this.findSessionById(id);
  },

  async recordAttempt({
    userId,
    challengeId,
    submittedAnswer,
    isCorrect,
    pointsAwarded,
    speedBonus = 0,
    streakBonus = 0,
    responseTimeMs = 0
  }) {
    const result = await db.run(
      `INSERT INTO game_attempts
       (user_id, challenge_id, submitted_answer, is_correct, points_awarded, speed_bonus, streak_bonus, response_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        challengeId,
        submittedAnswer,
        isCorrect ? 1 : 0,
        pointsAwarded,
        speedBonus,
        streakBonus,
        responseTimeMs
      ]
    );
    return result.lastInsertRowid;
  },

  async getUserAttempts(userId, limit = 20, offset = 0) {
    return db.query(
      `SELECT a.*, c.image_url, c.solution
       FROM game_attempts a
       JOIN challenges c ON c.id = a.challenge_id
       WHERE a.user_id = ?
       ORDER BY a.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  },

  async getLeaderboard(limit = 20) {
    return db.query(
      `SELECT
         u.id AS user_id,
         u.username,
         u.display_name,
         u.avatar_color,
         s.total_score,
         s.games_played,
         s.correct_answers,
         s.incorrect_answers,
         s.best_streak,
         s.current_streak,
         CASE WHEN (s.correct_answers + s.incorrect_answers) > 0
              THEN ROUND((CAST(s.correct_answers AS FLOAT) / (s.correct_answers + s.incorrect_answers)) * 100, 1)
              ELSE 0 END AS accuracy_percentage
       FROM user_stats s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.total_score DESC, s.best_streak DESC, s.correct_answers DESC
       LIMIT ?`,
      [limit]
    );
  },

  async getUserLeaderboardRank(userId) {
    // Determine 1-based rank by counting users with higher total_score
    const userStats = await db.get(`SELECT total_score FROM user_stats WHERE user_id = ?`, [userId]);
    if (!userStats) return null;

    const rankResult = await db.get(
      `SELECT COUNT(*) + 1 AS user_rank
       FROM user_stats
       WHERE total_score > ?`,
      [userStats.total_score]
    );

    return rankResult ? rankResult.user_rank : null;
  }
};
