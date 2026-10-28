/**
 * Banana Brain — Configuration & Environment Module
 * Validates and exposes structured configuration settings.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(rootDir, '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'banana_brain_development_secret_key_8f3c7b2a9e1d',
  SESSION_NAME: process.env.SESSION_NAME || 'banana_brain_sid',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',

  // Banana API
  BANANA_API_BASE_URL: process.env.BANANA_API_BASE_URL || 'https://marcconrad.com/uob/banana/api.php',
  BANANA_API_TIMEOUT_MS: parseInt(process.env.BANANA_API_TIMEOUT_MS || '8000', 10),

  // Database
  DB_DRIVER: (process.env.DB_DRIVER || 'sqlite').toLowerCase(),
  DB_SQLITE_PATH: path.resolve(rootDir, process.env.DB_SQLITE_PATH || './data/banana_brain.db'),

  // MySQL (for XAMPP phpMyAdmin)
  DB_MYSQL: {
    host: process.env.DB_MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_MYSQL_PORT || '3306', 10),
    user: process.env.DB_MYSQL_USER || 'root',
    password: process.env.DB_MYSQL_PASSWORD || '',
    database: process.env.DB_MYSQL_DATABASE || 'banana_brain',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
};
