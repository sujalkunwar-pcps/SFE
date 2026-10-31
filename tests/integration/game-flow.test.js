/**
 * Banana Brain — Integration Test Suite: Game Loop, Solution Secrecy & Scoring
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/config/database.js';
import { initializeDatabase } from '../../src/database/init.js';
import { challengeRepository } from '../../src/repositories/challenge.repository.js';

describe('Game Loop & Solution Confidentiality Integration Tests', () => {
  let app;
  let playerAgent;
  let attackerAgent;
  let currentChallengeId;
  let serverSolution;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await initializeDatabase();
    app = createApp();

    // Setup player 1
    playerAgent = request.agent(app);
    const p1Username = `p1_${Date.now().toString(36)}`;
    await playerAgent.post('/api/auth/register').send({
      username: p1Username,
      email: `${p1Username}@example.com`,
      password: 'PlayerPassword123!',
      confirmPassword: 'PlayerPassword123!',
      displayName: 'Player One'
    }).expect(201);

    // Setup player 2 (attacker)
    attackerAgent = request.agent(app);
    const p2Username = `p2_${(Date.now() + 10).toString(36)}`;
    await attackerAgent.post('/api/auth/register').send({
      username: p2Username,
      email: `${p2Username}@example.com`,
      password: 'PlayerPassword123!',
      confirmPassword: 'PlayerPassword123!',
      displayName: 'Player Two'
    }).expect(201);
  });

  it('should fetch a new puzzle challenge and verify SOLUTION IS WITHHELD from client', async () => {
    const res = await playerAgent
      .post('/api/game/challenges')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.challenge);
    assert.ok(res.body.challenge.id);
    assert.ok(res.body.challenge.imageUrl);
    assert.ok(res.body.challenge.expiresAt);

    // CRITICAL SECURITY ASSERTION: Solution MUST NOT be exposed in public response!
    assert.equal(res.body.challenge.solution, undefined);
    assert.equal(res.body.solution, undefined);

    currentChallengeId = res.body.challenge.id;

    // Verify solution IS safely recorded in backend database
    const dbRecord = await challengeRepository.findById(currentChallengeId);
    assert.ok(dbRecord);
    assert.equal(typeof dbRecord.solution, 'number');
    serverSolution = dbRecord.solution;
  });

  it('should prevent unauthorized answer submission from another player (Anti-IDOR)', async () => {
    const res = await attackerAgent
      .post(`/api/game/challenges/${currentChallengeId}/answer`)
      .send({ answer: serverSolution })
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /forbidden|authorization/i);
  });

  it('should submit correct answer, calculate score, and return verification result', async () => {
    const res = await playerAgent
      .post(`/api/game/challenges/${currentChallengeId}/answer`)
      .send({ answer: serverSolution })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.correct, true);
    assert.equal(res.body.solution, serverSolution);
    assert.ok(res.body.pointsAwarded >= 100);
    assert.equal(res.body.currentStreak, 1);
  });

  it('should reject duplicate submission attempt on already completed challenge (Anti-Cheat)', async () => {
    const res = await playerAgent
      .post(`/api/game/challenges/${currentChallengeId}/answer`)
      .send({ answer: serverSolution })
      .expect(409);

    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /already been completed/i);
  });

  it('should reflect updated score in user stats and leaderboard', async () => {
    const statsRes = await playerAgent
      .get('/api/game/stats')
      .expect(200);

    assert.equal(statsRes.body.success, true);
    assert.ok(statsRes.body.stats.totalScore > 0);
    assert.equal(statsRes.body.stats.correctAnswers, 1);
    assert.equal(statsRes.body.stats.currentStreak, 1);
  });
});
