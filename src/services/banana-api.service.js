/**
 * Banana Brain — Banana API Service Adapter
 * Interoperates with Dr. Marc Conrad's official Banana API microservice.
 * Handles HTTP redirects, timeouts, schema validation, network resilience, and secret management.
 */
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Predefined fallback sample puzzles for offline resilience or controlled testing
const FALLBACK_PUZZLES = [
  { question: 'https://www.sanfoh.com/uob/banana/data/t7474a643b918bf0eb2b310f5b7n18.png', solution: 8 },
  { question: 'https://www.sanfoh.com/uob/banana/data/t8383b754c029cf1fc3c421f6c8n29.png', solution: 5 },
  { question: 'https://www.sanfoh.com/uob/banana/data/t9292c865d130df2fd4d532f7d9n30.png', solution: 7 }
];

export class BananaApiService {
  constructor(baseUrl = env.BANANA_API_BASE_URL, timeoutMs = env.BANANA_API_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Fetches a raw puzzle from the official Banana API endpoint.
   * Enforces timeout, follows 301/302 redirects, and validates schema contract.
   */
  async fetchRawPuzzle() {
    const url = new URL(this.baseUrl);
    url.searchParams.set('out', 'json');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      logger.debug(`Requesting Banana API puzzle from: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BananaBrain-DistributedSystem/1.0 (University of Bedfordshire)'
        },
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Banana API responded with HTTP status ${response.status} (${response.statusText})`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Banana API returned invalid JSON: "${text.substring(0, 100)}"`);
      }

      this.validateApiResponse(data);
      return {
        question: data.question.trim(),
        solution: parseInt(data.solution, 10),
        source: 'live-api'
      };
    } catch (err) {
      clearTimeout(timeoutId);
      logger.warn(`Banana API request failed: ${err.message}. Evaluating resilience fallback.`);

      // If live API fails (e.g. university server maintenance or test environment), use resilient fallback
      if (env.isTest || process.env.ENABLE_OFFLINE_FALLBACK === 'true' || err.name === 'AbortError' || err.code === 'ENOTFOUND') {
        const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
        logger.info('Using resilient sample puzzle fixture for graceful degradation.');
        return {
          question: fallback.question,
          solution: fallback.solution,
          source: 'resilient-fallback'
        };
      }

      throw new Error(`Unable to fetch puzzle from Banana API: ${err.message}`);
    }
  }

  /**
   * Validates the schema contract returned by Dr. Conrad's Banana API.
   * Expected: { question: string (URL), solution: number (0-9) }
   */
  validateApiResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed API response: Expected JSON object');
    }

    if (typeof data.question !== 'string' || !data.question.trim().startsWith('http')) {
      throw new Error('Malformed API response: "question" must be a valid HTTP/HTTPS URL');
    }

    const solutionNum = parseInt(data.solution, 10);
    if (isNaN(solutionNum) || solutionNum < 0 || solutionNum > 9) {
      throw new Error(`Malformed API response: "solution" must be an integer between 0 and 9, received: ${data.solution}`);
    }

    return true;
  }

  /**
   * Creates a secure server-managed challenge.
   * Solution is separated and kept strictly server-side.
   */
  async createChallenge(userId, gameSessionId = null) {
    const rawPuzzle = await this.fetchRawPuzzle();
    const challengeId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 180 * 1000).toISOString(); // 3 minutes expiration

    return {
      id: challengeId,
      userId,
      gameSessionId,
      imageUrl: rawPuzzle.question,
      solution: rawPuzzle.solution, // CONFIDENTIAL: To be stored server-side only
      createdAt: now.toISOString(),
      expiresAt,
      source: rawPuzzle.source
    };
  }
}

export const bananaApiService = new BananaApiService();
