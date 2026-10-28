-- ====================================================================
-- BANANA BRAIN — RELATIONAL DATABASE SCHEMA (MySQL / MariaDB for phpMyAdmin)
-- University of Bedfordshire — Distributed Systems Assignment
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `banana_brain` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `banana_brain`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `bio` TEXT NULL,
  `avatar_color` VARCHAR(20) NOT NULL DEFAULT '#F59E0B',
  `role` VARCHAR(20) NOT NULL DEFAULT 'player',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Stats Table
CREATE TABLE IF NOT EXISTS `user_stats` (
  `user_id` INT PRIMARY KEY,
  `total_score` INT NOT NULL DEFAULT 0,
  `games_played` INT NOT NULL DEFAULT 0,
  `correct_answers` INT NOT NULL DEFAULT 0,
  `incorrect_answers` INT NOT NULL DEFAULT 0,
  `current_streak` INT NOT NULL DEFAULT 0,
  `best_streak` INT NOT NULL DEFAULT 0,
  `last_played_at` TIMESTAMP NULL,
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_stats_score` (`total_score` DESC, `best_streak` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Game Sessions Table
CREATE TABLE IF NOT EXISTS `game_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `score` INT NOT NULL DEFAULT 0,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Challenges Table
CREATE TABLE IF NOT EXISTS `challenges` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `game_session_id` VARCHAR(64) NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `solution` INT NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  CONSTRAINT `fk_challenges_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_challenges_session` FOREIGN KEY (`game_session_id`) REFERENCES `game_sessions` (`id`) ON DELETE SET NULL,
  INDEX `idx_challenges_user` (`user_id`),
  INDEX `idx_challenges_session` (`game_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Game Attempts Table
CREATE TABLE IF NOT EXISTS `game_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `challenge_id` VARCHAR(64) NOT NULL,
  `submitted_answer` INT NOT NULL,
  `is_correct` TINYINT(1) NOT NULL,
  `points_awarded` INT NOT NULL DEFAULT 0,
  `speed_bonus` INT NOT NULL DEFAULT 0,
  `streak_bonus` INT NOT NULL DEFAULT 0,
  `response_time_ms` INT NOT NULL DEFAULT 0,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attempts_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  INDEX `idx_attempts_user` (`user_id`, `submitted_at` DESC),
  INDEX `idx_attempts_challenge` (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
