/**
 * Tests for the /api/users routes (register, me).
 */
const request = require('supertest');
const app = require('../../server');
const { createTestUser, getAuthHeader } = require('../db');

describe('/api/users', () => {
  // ─── POST /api/users/register ──────────────────────────────────────────────

  describe('POST /api/users/register', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ name: 'Alice', role: 'buyer' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-seller1'))
        .send({ role: 'seller' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when role is missing', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-seller1'))
        .send({ name: 'Alice' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid role', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-seller1'))
        .send({ name: 'Alice', role: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/role/i);
    });

    it('returns 201 and creates a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-seller1'))
        .send({ name: 'Test Seller', role: 'seller' });
      expect(res.status).toBe(201);
      expect(res.body.firebaseUid).toBe('seller1');
      expect(res.body.email).toBe('seller@test.com');
      expect(res.body.name).toBe('Test Seller');
      expect(res.body.role).toBe('seller');
    });

    it('returns 200 with existing user if already registered (idempotent)', async () => {
      await createTestUser(); // creates seller1
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-seller1'))
        .send({ name: 'Different Name', role: 'buyer' });
      // Route returns existing user with 200
      expect(res.status).toBe(200);
      expect(res.body.firebaseUid).toBe('seller1');
      expect(res.body.name).toBe('Test Seller'); // original name, not updated
    });

    it('defaults phone to empty string when not provided', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set(getAuthHeader('valid-token-buyer1'))
        .send({ name: 'Buyer One', role: 'buyer' });
      expect(res.status).toBe(201);
      expect(res.body.phone).toBe('');
    });
  });

  // ─── GET /api/users/me ────────────────────────────────────────────────────

  describe('GET /api/users/me', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('returns 404 when user is not registered', async () => {
      // Token is valid but no User document exists
      const res = await request(app)
        .get('/api/users/me')
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(404);
    });

    it('returns 200 with user profile when registered', async () => {
      await createTestUser();
      const res = await request(app)
        .get('/api/users/me')
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(200);
      expect(res.body.firebaseUid).toBe('seller1');
      expect(res.body.email).toBe('seller@test.com');
      expect(res.body.name).toBe('Test Seller');
    });

    it('returns the correct user for buyer1 token', async () => {
      await createTestUser({ firebaseUid: 'buyer1', email: 'buyer@test.com', name: 'Test Buyer', role: 'buyer' });
      const res = await request(app)
        .get('/api/users/me')
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(200);
      expect(res.body.firebaseUid).toBe('buyer1');
      expect(res.body.role).toBe('buyer');
    });
  });
});
