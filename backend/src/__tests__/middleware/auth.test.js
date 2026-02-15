/**
 * Tests for the verifyToken and optionalAuth middleware.
 *
 * A minimal Express app is built per-test-suite so that supertest can exercise
 * the middleware in isolation without pulling in all application routes.
 */
const express = require('express');
const request = require('supertest');
const { verifyToken, optionalAuth } = require('../../middleware/auth');

// Build tiny apps that use each middleware and echo back req.user
function buildVerifyApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', verifyToken, (req, res) => {
    res.json({ user: req.user });
  });
  return app;
}

function buildOptionalApp() {
  const app = express();
  app.use(express.json());
  app.get('/optional', optionalAuth, (req, res) => {
    res.json({ user: req.user || null });
  });
  return app;
}

// ─── verifyToken ─────────────────────────────────────────────────────────────

describe('verifyToken middleware', () => {
  let app;
  beforeAll(() => {
    app = buildVerifyApp();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Token some-token');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });

  it('sets req.user and calls next for a valid seller token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token-seller1');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ uid: 'seller1', email: 'seller@test.com' });
  });

  it('sets req.user and calls next for a valid buyer token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token-buyer1');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ uid: 'buyer1', email: 'buyer@test.com' });
  });

  it('returns 401 when Bearer prefix is present but token is empty', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ');
    // The empty string after "Bearer " is not in validTokens, so it should fail
    expect(res.status).toBe(401);
  });

  it('handles whitespace-only Authorization gracefully (401)', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', '   ');
    expect(res.status).toBe(401);
  });
});

// ─── optionalAuth ────────────────────────────────────────────────────────────

describe('optionalAuth middleware', () => {
  let app;
  beforeAll(() => {
    app = buildOptionalApp();
  });

  it('calls next with no req.user when no Authorization header is present', async () => {
    const res = await request(app).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('calls next with no req.user when header does not start with Bearer', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Token abc');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('sets req.user for a valid token', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Bearer valid-token-seller1');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ uid: 'seller1', email: 'seller@test.com' });
  });

  it('calls next without req.user for an invalid token', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('sets req.user for a valid buyer token', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Bearer valid-token-buyer1');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ uid: 'buyer1', email: 'buyer@test.com' });
  });

  it('sets req.user for a valid buyer2 token', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Bearer valid-token-buyer2');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ uid: 'buyer2', email: 'buyer2@test.com' });
  });

  it('does not set req.user when Authorization header is empty string', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', '');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('still calls next even when token is completely garbage', async () => {
    const res = await request(app)
      .get('/optional')
      .set('Authorization', 'Bearer !!!garbage!!!');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
