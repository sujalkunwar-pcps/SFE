-- ====================================================================
-- BANANA BRAIN — RELATIONAL DATABASE SCHEMA (SQLite DDL)
-- University of Bedfordshire — Distributed Systems Assignment
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Users Table (Virtual Identity Core)
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

-- 2. User Stats Table (Persistent Aggregate Performance Metrics)
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

-- 3. Game Sessions Table (Play session tracking)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  score INTEGER NOT NULL DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Challenges Table (Banana API puzzle challenges & server-side solutions)
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  game_session_id TEXT,
  image_url TEXT NOT NULL,
  solution INTEGER NOT NULL, -- Confidential server-held puzzle solution
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE SET NULL
);

-- 5. Game Attempts Table (Individual answer submissions & audit log)
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

-- Indexes for optimal lookup performance & leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stats_score ON user_stats(total_score DESC, best_streak DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_user ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_session ON challenges(game_session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON game_attempts(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_challenge ON game_attempts(challenge_id);
