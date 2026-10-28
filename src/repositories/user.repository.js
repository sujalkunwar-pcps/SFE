/**
 * Banana Brain — User Repository
 * Encapsulates database operations for virtual identity and user statistics.
 */
import { db } from '../config/database.js';

export const userRepository = {
  async create({ username, email, passwordHash, displayName, bio = '', avatarColor = '#F59E0B' }) {
    const userResult = await db.run(
      `INSERT INTO users (username, email, password_hash, display_name, bio, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, displayName, bio, avatarColor]
    );

    const userId = userResult.lastInsertRowid;

    // Initialize stats record
    await db.run(
      `INSERT INTO user_stats (user_id, total_score, games_played, correct_answers, incorrect_answers, current_streak, best_streak)
       VALUES (?, 0, 0, 0, 0, 0, 0)`,
      [userId]
    );

    return this.findById(userId);
  },

  async findById(id) {
    return db.get(
      `SELECT id, username, email, display_name, bio, avatar_color, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
  },

  async findByIdWithPassword(id) {
    return db.get(`SELECT * FROM users WHERE id = ?`, [id]);
  },

  async findByUsername(username) {
    return db.get(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`, [username]);
  },

  async findByEmail(email) {
    return db.get(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`, [email]);
  },

  async findByIdentifier(identifier) {
    return db.get(
      `SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE`,
      [identifier, identifier]
    );
  },

  async updateProfile(id, { displayName, bio, avatarColor }) {
    await db.run(
      `UPDATE users
       SET display_name = COALESCE(?, display_name),
           bio = COALESCE(?, bio),
           avatar_color = COALESCE(?, avatar_color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [displayName, bio, avatarColor, id]
    );
    return this.findById(id);
  },

  async getStats(userId) {
    return db.get(
      `SELECT s.*, u.username, u.display_name, u.avatar_color
       FROM user_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ?`,
      [userId]
    );
  },

  async updateStats(userId, { totalScore, gamesPlayed, correctAnswers, incorrectAnswers, currentStreak, bestStreak }) {
    await db.run(
      `UPDATE user_stats
       SET total_score = ?,
           games_played = ?,
           correct_answers = ?,
           incorrect_answers = ?,
           current_streak = ?,
           best_streak = ?,
           last_played_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [totalScore, gamesPlayed, correctAnswers, incorrectAnswers, currentStreak, bestStreak, userId]
    );
    return this.getStats(userId);
  }
};
