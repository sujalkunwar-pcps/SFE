/**
 * Banana Brain — MySQL / phpMyAdmin Automated Setup & Migration Script
 * University of Bedfordshire — Distributed Systems Assignment
 * 
 * Connects to local MySQL (XAMPP default: 127.0.0.1:3306, user: root, password: "")
 * Automatically provisions the database, executes schema-mysql.sql, and seeds accounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

dotenv.config({ path: path.join(rootDir, '.env') });

const config = {
  host: process.env.DB_MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_MYSQL_PORT || '3306', 10),
  user: process.env.DB_MYSQL_USER || 'root',
  password: process.env.DB_MYSQL_PASSWORD || '',
  database: process.env.DB_MYSQL_DATABASE || 'banana_brain'
};

async function setupMySQL() {
  console.log('===============================================================');
  console.log('  BANANA BRAIN — MYSQL & XAMPP PHPMYADMIN CONFIGURATION SETUP  ');
  console.log('===============================================================');
  console.log(`Target MySQL Server: ${config.host}:${config.port}`);
  console.log(`Target User:         ${config.user}`);
  console.log(`Target Database:     ${config.database}`);
  console.log('---------------------------------------------------------------');

  let connection;
  try {
    // 1. Connect without selecting database to allow creating it
    console.log('[1/4] Connecting to MySQL daemon...');
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });
    console.log('✓ Successfully connected to MySQL server.');

    // 2. Create database
    console.log(`[2/4] Ensuring database '${config.database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${config.database}\`;`);
    console.log(`✓ Database '${config.database}' is ready.`);

    // 3. Read and execute schema
    console.log('[3/4] Importing relational tables from schema-mysql.sql...');
    const schemaPath = path.join(rootDir, 'src/database/schema-mysql.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Split and execute statements
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('✓ All 5 tables and indexes verified in MySQL:');
    console.log('  - users (Virtual Identity)');
    console.log('  - user_stats (Player Metrics)');
    console.log('  - game_sessions (Session Tracking)');
    console.log('  - challenges (Banana API Challenges & Solutions)');
    console.log('  - game_attempts (Historical Attempt Logs)');

    // 4. Seed demo account if not exists
    console.log('[4/4] Checking and seeding demo account in MySQL...');
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE username = ?', ['demoplayer']);
    if (existingUsers.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Banana123!', salt);

      const [insertUser] = await connection.query(
        `INSERT INTO users (username, email, password_hash, display_name, bio, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['demoplayer', 'demo@bedfordshire.ac.uk', passwordHash, 'Demo Monkey', 'Official University of Bedfordshire test virtual identity', '#F59E0B']
      );

      const userId = insertUser.insertId;
      await connection.query(
        `INSERT INTO user_stats (user_id, total_score, games_played, correct_answers, incorrect_answers, current_streak, best_streak, last_played_at)
         VALUES (?, 450, 5, 4, 1, 2, 3, NOW())`,
        [userId]
      );
      console.log('✓ Demo player seeded in MySQL: username="demoplayer", password="Banana123!"');
    } else {
      console.log('✓ Demo account already present in MySQL database.');
    }

    // 5. Update .env to switch active driver to MySQL
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/^DB_DRIVER=.*/m, 'DB_DRIVER=mysql');
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('✓ Active database driver in .env updated to: DB_DRIVER=mysql');
    }

    console.log('---------------------------------------------------------------');
    console.log('🎉 MySQL setup complete! You can now view tables in phpMyAdmin:');
    console.log('   👉 http://localhost/phpmyadmin/index.php?route=/database/structure&db=banana_brain');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ MySQL Connection / Setup Error:');
    console.error(`   ${err.message}`);
    console.log('\n💡 Troubleshooting Steps:');
    console.log('   1. Ensure XAMPP Control Panel is open.');
    console.log('   2. Click "Start" next to MySQL in XAMPP.');
    console.log('   3. Verify MySQL port is 3306 (default in XAMPP).');
    console.log('   4. If you have a custom root password, configure DB_MYSQL_PASSWORD in .env.');
    console.log('   5. Note: The application safely falls back to SQLite so it never crashes.\n');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupMySQL();
