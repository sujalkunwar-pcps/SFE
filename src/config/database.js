/**
 * Banana Brain — Database Abstraction Layer
 * Supports both SQLite (via native node:sqlite DatabaseSync) and MySQL (via mysql2)
 * Exposes a uniform Promise-friendly interface: query(), get(), run(), exec()
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class DatabaseAdapter {
  constructor() {
    this.driver = env.DB_DRIVER;
    this.sqliteDb = null;
    this.mysqlPool = null;
    this.isReady = false;
  }

  async init() {
    if (this.driver === 'mysql') {
      try {
        logger.info('Connecting to MySQL database...', { host: env.DB_MYSQL.host, port: env.DB_MYSQL.port, db: env.DB_MYSQL.database });
        this.mysqlPool = mysql.createPool(env.DB_MYSQL);
        // Test connection
        const conn = await this.mysqlPool.getConnection();
        conn.release();
        logger.info('Connected to MySQL successfully.');
        this.isReady = true;
        return;
      } catch (err) {
        logger.warn(`MySQL connection failed (${err.message}). Falling back to SQLite for local reliability.`);
        this.driver = 'sqlite';
      }
    }

    // Default to SQLite
    const dbDir = path.dirname(env.DB_SQLITE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.sqliteDb = new DatabaseSync(env.DB_SQLITE_PATH);
    this.sqliteDb.exec('PRAGMA foreign_keys = ON;');
    this.sqliteDb.exec('PRAGMA journal_mode = WAL;');
    logger.info(`Connected to SQLite database at: ${env.DB_SQLITE_PATH}`);
    this.isReady = true;
  }

  async exec(sql) {
    if (!this.isReady) await this.init();
    if (this.driver === 'mysql') {
      const [result] = await this.mysqlPool.query(sql);
      return result;
    } else {
      return this.sqliteDb.exec(sql);
    }
  }

  async query(sql, params = []) {
    if (!this.isReady) await this.init();
    if (this.driver === 'mysql') {
      const [rows] = await this.mysqlPool.execute(sql, params);
      return rows;
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      return stmt.all(...params);
    }
  }

  async get(sql, params = []) {
    if (!this.isReady) await this.init();
    if (this.driver === 'mysql') {
      const [rows] = await this.mysqlPool.execute(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      const row = stmt.get(...params);
      return row || null;
    }
  }

  async run(sql, params = []) {
    if (!this.isReady) await this.init();
    if (this.driver === 'mysql') {
      const [result] = await this.mysqlPool.execute(sql, params);
      return {
        changes: result.affectedRows || 0,
        lastInsertRowid: result.insertId || null
      };
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      const result = stmt.run(...params);
      return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid)
      };
    }
  }

  async close() {
    if (this.mysqlPool) {
      await this.mysqlPool.end();
    }
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    this.isReady = false;
  }
}

export const db = new DatabaseAdapter();
