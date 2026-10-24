/**
 * Banana Brain — Authentication & Virtual Identity Service
 * Handles user registration, bcrypt password hashing, credential verification, and profile management.
 */
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { eventBus, DOMAIN_EVENTS } from '../events/event-emitter.js';
import { logger } from '../utils/logger.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export class AuthService {
  /**
   * Registers a new virtual identity.
   */
  async register({ username, email, password, confirmPassword, displayName, bio = '', avatarColor = '#F59E0B' }) {
    // 1. Validation
    if (!username || !USERNAME_REGEX.test(username.trim())) {
      const err = new Error('Username must be 3-20 characters long and contain only letters, numbers, hyphens, or underscores');
      err.status = 400;
      throw err;
    }

    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      const err = new Error('A valid email address is required');
      err.status = 400;
      throw err;
    }

    if (!password || password.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      err.status = 400;
      throw err;
    }

    if (password !== confirmPassword) {
      const err = new Error('Passwords do not match');
      err.status = 400;
      throw err;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = (displayName && displayName.trim()) ? displayName.trim().substring(0, 50) : cleanUsername;

    // 2. Duplicate Account Prevention
    const existingByUsername = await userRepository.findByUsername(cleanUsername);
    if (existingByUsername) {
      const err = new Error('This username is already taken. Please choose another.');
      err.status = 409;
      throw err;
    }

    const existingByEmail = await userRepository.findByEmail(cleanEmail);
    if (existingByEmail) {
      const err = new Error('An account with this email address already exists.');
      err.status = 409;
      throw err;
    }

    // 3. Cryptographic Password Hashing (bcrypt, 10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Persistence
    const user = await userRepository.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      displayName: cleanDisplayName,
      bio: bio.trim().substring(0, 250),
      avatarColor
    });

    // 5. Emit Domain Event
    eventBus.emit(DOMAIN_EVENTS.USER_REGISTERED, {
      userId: user.id,
      username: user.username
    });

    logger.info(`User registered successfully: [${user.username}] (ID: ${user.id})`);
    return user;
  }

  /**
   * Verifies credentials for user login.
   */
  async login({ identifier, password }) {
    if (!identifier || !password) {
      const err = new Error('Username/email and password are required');
      err.status = 400;
      throw err;
    }

    const user = await userRepository.findByIdentifier(identifier.trim());
    if (!user) {
      logger.warn(`Failed login attempt for non-existent identifier: ${identifier}`);
      const err = new Error('Invalid username/email or password');
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn(`Failed login attempt (bad password) for user: ${user.username}`);
      const err = new Error('Invalid username/email or password');
      err.status = 401;
      throw err;
    }

    logger.info(`User authenticated: [${user.username}] (ID: ${user.id})`);

    // Return sanitized user object
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      bio: user.bio,
      avatarColor: user.avatar_color,
      role: user.role,
      createdAt: user.created_at
    };
  }

  /**
   * Retrieves profile information by ID.
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const stats = await userRepository.getStats(userId);
    return {
      ...user,
      stats
    };
  }

  /**
   * Updates profile fields.
   */
  async updateProfile(userId, { displayName, bio, avatarColor }) {
    return userRepository.updateProfile(userId, {
      displayName: displayName ? displayName.trim().substring(0, 50) : undefined,
      bio: bio !== undefined ? bio.trim().substring(0, 250) : undefined,
      avatarColor
    });
  }
}

export const authService = new AuthService();
