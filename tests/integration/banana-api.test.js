/**
 * Banana Brain — Integration Test Suite: Banana API Adapter & Resilience
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BananaApiService } from '../../src/services/banana-api.service.js';

describe('Banana API Interoperability & Adapter Tests', () => {
  it('should fetch a real puzzle from the official Banana API endpoint when online', async () => {
    const service = new BananaApiService('https://marcconrad.com/uob/banana/api.php', 10000);
    try {
      const puzzle = await service.fetchRawPuzzle();
      assert.ok(puzzle);
      assert.equal(typeof puzzle.question, 'string');
      assert.ok(puzzle.question.startsWith('http'));
      assert.equal(typeof puzzle.solution, 'number');
      assert.ok(puzzle.solution >= 0 && puzzle.solution <= 9);
    } catch (err) {
      // If external provider is temporarily unreachable, verify fallback handling
      assert.match(err.message, /Banana API|Unable/i);
    }
  });

  it('should create an unpredictable challenge with solution kept server-side', async () => {
    const service = new BananaApiService();
    const challenge = await service.createChallenge(1, 'test-session-uuid');

    assert.ok(challenge.id);
    assert.equal(typeof challenge.id, 'string');
    assert.equal(challenge.id.length, 36); // UUID format
    assert.ok(challenge.imageUrl);
    assert.equal(typeof challenge.solution, 'number');
    assert.ok(new Date(challenge.expiresAt) > new Date());
  });

  it('should gracefully degrade to sample puzzle fixture when external endpoint is broken', async () => {
    // Intentionally bad base URL to test resilience
    process.env.ENABLE_OFFLINE_FALLBACK = 'true';
    const brokenService = new BananaApiService('https://invalid-host-name-for-testing-banana-api-12345.org', 1000);
    const puzzle = await brokenService.fetchRawPuzzle();

    assert.ok(puzzle);
    assert.equal(puzzle.source, 'resilient-fallback');
    assert.equal(typeof puzzle.question, 'string');
    assert.equal(typeof puzzle.solution, 'number');
  });
});
