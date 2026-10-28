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

export async function initializeDatabase() {
  await db.init();
  logger.info(`Running database migration for driver [${db.driver}]...`);

  const schemaFile = db.driver === 'mysql' ? 'schema-mysql.sql' : 'schema.sql';
  const schemaPath = path.join(__dirname, schemaFile);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  if (db.driver === 'mysql') {
    // For MySQL, execute statements split by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
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
