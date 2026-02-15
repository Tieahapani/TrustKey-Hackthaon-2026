/**
 * Tests for the /api/applications routes.
 *
 * pullComprehensiveReport is mocked so no real CRS API calls are made.
 * calculateMatchScore uses the real implementation.
 */
jest.mock('../../services/crs', () => ({
  pullComprehensiveReport: jest.fn(async () => ({
    creditScore: 720,
    evictions: 0,
    bankruptcies: 0,
    criminalOffenses: 0,
    fraudRiskScore: 1,
    identityVerified: true,
    fbiMostWanted: { matchFound: false, matchCount: 0, searchedName: 'Jane Doe', crimes: [] },
    requestIds: {},
  })),
  calculateMatchScore: jest.requireActual('../../services/crs').calculateMatchScore,
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const { createTestUser, getAuthHeader, seedListing, seedApplication } = require('../db');

describe('/api/applications', () => {
  let seller;
  let buyer;
  let listing;

  beforeEach(async () => {
    seller = await createTestUser(); // seller1
    buyer = await createTestUser({
      firebaseUid: 'buyer1',
      email: 'buyer@test.com',
      name: 'Test Buyer',
      role: 'buyer',
    });
    listing = await seedListing(seller._id, {
      screeningCriteria: {
        minCreditScore: 650,
        noEvictions: true,
        noBankruptcy: true,
        noCriminal: true,
      },
    });
  });

  const validBody = () => ({
    listingId: listing._id.toString(),
    consent: true,
    buyerInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      dob: '1990-01-01',
      email: 'jane@test.com',
    },
  });

  // ─── POST /api/applications ───────────────────────────────────────────────

  describe('POST /api/applications', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send(validBody());
      expect(res.status).toBe(401);
    });

    it('returns 400 when listingId is missing', async () => {
      const body = validBody();
      delete body.listingId;
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when consent is missing', async () => {
      const body = validBody();
      delete body.consent;
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when buyerInfo fields are missing', async () => {
      const body = validBody();
      body.buyerInfo = { firstName: 'Jane' }; // missing lastName, dob, email
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/buyerInfo/i);
    });

    it('returns 404 when listing does not exist', async () => {
      const body = validBody();
      body.listingId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(body);
      expect(res.status).toBe(404);
    });

    it('returns 404 when user document does not exist', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer2'))
        .send(validBody());
      expect(res.status).toBe(404);
    });

    it('returns 201 and creates an application with CRS data and match score', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(validBody());
      expect(res.status).toBe(201);
      expect(res.body.listingId).toBe(listing._id.toString());
      expect(res.body.buyerId).toBe(buyer._id.toString());
      expect(res.body.status).toBe('screened');
      expect(res.body.crsData).toBeDefined();
      expect(res.body.crsData.creditScore).toBe(720);
      expect(res.body.matchScore).toBeDefined();
      expect(typeof res.body.matchScore).toBe('number');
      expect(res.body.matchColor).toBeDefined();
    });

    it('returns 409 for duplicate application', async () => {
      await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(validBody());

      const res = await request(app)
        .post('/api/applications')
        .set(getAuthHeader('valid-token-buyer1'))
        .send(validBody());
      expect(res.status).toBe(409);
    });
  });

  // ─── GET /api/applications/listing/:listingId ─────────────────────────────

  describe('GET /api/applications/listing/:listingId', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).get(`/api/applications/listing/${listing._id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when listing does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/applications/listing/${fakeId}`)
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(404);
    });

    it('returns 403 when a non-owner queries applicants', async () => {
      const res = await request(app)
        .get(`/api/applications/listing/${listing._id}`)
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(403);
    });

    it('returns applications sorted by matchScore descending for the listing owner', async () => {
      // Seed two applications with different scores
      const buyer2 = await createTestUser({
        firebaseUid: 'buyer2',
        email: 'buyer2@test.com',
        name: 'Buyer Two',
        role: 'buyer',
      });
      await seedApplication(buyer._id, listing._id, { matchScore: 70, matchColor: 'yellow' });
      await seedApplication(buyer2._id, listing._id, { matchScore: 95, matchColor: 'green' });

      const res = await request(app)
        .get(`/api/applications/listing/${listing._id}`)
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // First should have higher score
      expect(res.body[0].matchScore).toBeGreaterThanOrEqual(res.body[1].matchScore);
    });
  });

  // ─── GET /api/applications/mine ───────────────────────────────────────────

  describe('GET /api/applications/mine', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).get('/api/applications/mine');
      expect(res.status).toBe(401);
    });

    it('returns 404 when user document does not exist', async () => {
      const res = await request(app)
        .get('/api/applications/mine')
        .set(getAuthHeader('valid-token-buyer2'));
      expect(res.status).toBe(404);
    });

    it('returns the buyer\'s own applications', async () => {
      await seedApplication(buyer._id, listing._id);

      const res = await request(app)
        .get('/api/applications/mine')
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].buyerId).toBe(buyer._id.toString());
    });

    it('does not return other buyers\' applications', async () => {
      const buyer2 = await createTestUser({
        firebaseUid: 'buyer2',
        email: 'buyer2@test.com',
        name: 'Buyer Two',
        role: 'buyer',
      });
      await seedApplication(buyer2._id, listing._id);

      const res = await request(app)
        .get('/api/applications/mine')
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  // ─── PATCH /api/applications/:id/status ───────────────────────────────────

  describe('PATCH /api/applications/:id/status', () => {
    let application;

    beforeEach(async () => {
      application = await seedApplication(buyer._id, listing._id);
    });

    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application._id}/status`)
        .send({ status: 'approved' });
      expect(res.status).toBe(401);
    });

    it('returns 400 for an invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application._id}/status`)
        .set(getAuthHeader('valid-token-seller1'))
        .send({ status: 'pending' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when application does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/applications/${fakeId}/status`)
        .set(getAuthHeader('valid-token-seller1'))
        .send({ status: 'approved' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when a non-seller tries to update status', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application._id}/status`)
        .set(getAuthHeader('valid-token-buyer1'))
        .send({ status: 'approved' });
      expect(res.status).toBe(403);
    });

    it('returns 200 and updates the application status for the listing owner', async () => {
      const res = await request(app)
        .patch(`/api/applications/${application._id}/status`)
        .set(getAuthHeader('valid-token-seller1'))
        .send({ status: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });
  });

  // ─── DELETE /api/applications/:id ─────────────────────────────────────────

  describe('DELETE /api/applications/:id', () => {
    let application;

    beforeEach(async () => {
      application = await seedApplication(buyer._id, listing._id);
    });

    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).delete(`/api/applications/${application._id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when application does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/applications/${fakeId}`)
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(404);
    });

    it('returns 403 when a non-buyer tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set(getAuthHeader('valid-token-seller1'));
      // seller1 is not the buyerId on this application, so 403
      expect(res.status).toBe(403);
    });

    it('returns 200 and deletes the application for the buyer', async () => {
      const res = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/withdrawn/i);
    });
  });
});
