/**
 * Banana Brain — Integration Test Suite: Virtual Identity & Authentication
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { db } from '../../src/config/database.js';
import { initializeDatabase } from '../../src/database/init.js';

describe('Virtual Identity & Authentication Integration Tests', () => {
  let app;
  let testUser = {
    username: `usr_${Date.now().toString(36)}`,
    email: `test_${Date.now().toString(36)}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    displayName: 'Test Player'
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    await initializeDatabase();
    app = createApp();
  });

  it('should register a new virtual identity with status 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.user.username, testUser.username);
    assert.equal(res.body.user.email, testUser.email);
    assert.equal(res.body.user.password_hash, undefined); // Password hash must NEVER be returned
  });

  it('should reject duplicate username registration with status 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        email: `another_${Date.now()}@example.com`
      })
      .expect(409);

    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /already taken/i);
  });

  it('should reject invalid password during login with status 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.username,
        password: 'WrongPassword999!'
      })
      .expect(401);

    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /invalid username\/email or password/i);
  });

  it('should authenticate valid credentials and establish session', async () => {
    const agent = request.agent(app); // Persists session cookies

    const loginRes = await agent
      .post('/api/auth/login')
      .send({
        identifier: testUser.username,
        password: testUser.password
      })
      .expect(200);

    assert.equal(loginRes.body.success, true);
    assert.equal(loginRes.body.user.username, testUser.username);

    // Verify session persistence via /me
    const meRes = await agent
      .get('/api/auth/me')
      .expect(200);

    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.user.username, testUser.username);
    assert.ok(meRes.body.user.stats);

    // Logout
    await agent
      .post('/api/auth/logout')
      .expect(200);

    // Verify session invalidated
    await agent
      .get('/api/auth/me')
      .expect(401);
  });

  it('should reject unauthenticated access to protected game routes', async () => {
    const res = await request(app)
      .get('/api/game/stats')
      .expect(401);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
