/**
 * Banana Brain — Challenge Repository
 * Encapsulates challenge state persistence. Enforces strict server-side solution secrecy.
 */
import { db } from '../config/database.js';

export const challengeRepository = {
  async create({ id, userId, gameSessionId = null, imageUrl, solution, expiresAt }) {
    await db.run(
      `INSERT INTO challenges (id, user_id, game_session_id, image_url, solution, is_completed, expires_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, gameSessionId, imageUrl, solution, expiresAt]
    );

    return this.findById(id);
  },

  async findById(id) {
    return db.get(`SELECT * FROM challenges WHERE id = ?`, [id]);
  },

  async findActiveByUser(userId) {
    return db.get(
      `SELECT * FROM challenges
       WHERE user_id = ? AND is_completed = 0 AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
  },

  async markCompleted(id) {
    await db.run(
      `UPDATE challenges SET is_completed = 1 WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  },

  /**
   * Sanitizes challenge object for safe transmission to browser.
   * STRICT INVARIANT: The solution field is never included.
   */
  toPublic(challenge) {
    if (!challenge) return null;
    return {
      id: challenge.id,
      imageUrl: challenge.image_url,
      expiresAt: challenge.expires_at,
      createdAt: challenge.created_at
    };
  }
};
