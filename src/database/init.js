/**
 * Banana Brain — Database Initializer & Migration Runner
 * Sets up tables, constraints, indexes, and initial demo accounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_SCHEMA_FALLBACK = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE,
  email TEXT NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_color TEXT DEFAULT '#F59E0B',
  role TEXT DEFAULT 'player',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  score INTEGER NOT NULL DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  game_session_id TEXT,
  image_url TEXT NOT NULL,
  solution INTEGER NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS game_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_id TEXT NOT NULL,
  submitted_answer INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  speed_bonus INTEGER NOT NULL DEFAULT 0,
  streak_bonus INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stats_score ON user_stats(total_score DESC, best_streak DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_user ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_session ON challenges(game_session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON game_attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_challenge ON game_attempts(challenge_id);
`;

const MYSQL_SCHEMA_FALLBACK = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT NULL,
  avatar_color VARCHAR(20) NOT NULL DEFAULT '#F59E0B',
  role VARCHAR(20) NOT NULL DEFAULT 'player',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INT PRIMARY KEY,
  total_score INT NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  incorrect_answers INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP NULL,
  CONSTRAINT fk_stats_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_stats_score (total_score DESC, best_streak DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  score INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS challenges (
  id VARCHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  game_session_id VARCHAR(64) NULL,
  image_url VARCHAR(500) NOT NULL,
  solution INT NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  CONSTRAINT fk_challenges_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_challenges_session FOREIGN KEY (game_session_id) REFERENCES game_sessions (id) ON DELETE SET NULL,
  INDEX idx_challenges_user (user_id),
  INDEX idx_challenges_session (game_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id VARCHAR(64) NOT NULL,
  submitted_answer INT NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  speed_bonus INT NOT NULL DEFAULT 0,
  streak_bonus INT NOT NULL DEFAULT 0,
  response_time_ms INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_challenge FOREIGN KEY (challenge_id) REFERENCES challenges (id) ON DELETE CASCADE,
  INDEX idx_attempts_user (user_id, submitted_at DESC),
  INDEX idx_attempts_challenge (challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export async function initializeDatabase() {
  await db.init();
  logger.info(`Running database migration for driver [${db.driver}]...`);

  let sql = '';
  try {
    const schemaFile = db.driver === 'mysql' ? 'schema-mysql.sql' : 'schema.sql';
    const schemaPath = path.join(__dirname, schemaFile);
    if (fs.existsSync(schemaPath)) {
      sql = fs.readFileSync(schemaPath, 'utf8');
    } else {
      sql = db.driver === 'mysql' ? MYSQL_SCHEMA_FALLBACK : SQLITE_SCHEMA_FALLBACK;
    }
  } catch {
    sql = db.driver === 'mysql' ? MYSQL_SCHEMA_FALLBACK : SQLITE_SCHEMA_FALLBACK;
  }

  if (db.driver === 'mysql') {
    // For MySQL, strip comment lines and execute statements split by semicolon
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));
    for (const stmt of statements) {
      await db.exec(stmt);
    }
  } else {
    // SQLite can execute whole script in exec
    await db.exec(sql);
  }

  // Seed demo account if none exists
  const existingUser = await db.get('SELECT id FROM users WHERE username = ?', ['demoplayer']);
  if (!existingUser) {
    logger.info('Seeding default demo player account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Banana123!', salt);

    const userResult = await db.run(
      `INSERT INTO users (username, email, password_hash, display_name, bio, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'demoplayer',
        'demo@bedfordshire.ac.uk',
        passwordHash,
        'Demo Monkey',
        'Official University of Bedfordshire test virtual identity',
        '#F59E0B'
      ]
    );

    const userId = userResult.lastInsertRowid;
    await db.run(
      `INSERT INTO user_stats (user_id, total_score, games_played, correct_answers, incorrect_answers, current_streak, best_streak, last_played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, 450, 5, 4, 1, 2, 3]
    );
    logger.info('Demo account seeded: username="demoplayer", password="Banana123!"');
  }

  logger.info('Database initialization completed successfully.');
}

// Allow direct execution via `npm run db:init`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Database initialization failed:', { error: err.message, stack: err.stack });
      await db.close();
      process.exit(1);
    });
}
