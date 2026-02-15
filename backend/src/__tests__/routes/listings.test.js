/**
 * Tests for the /api/listings routes.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const { createTestUser, getAuthHeader, seedListing } = require('../db');

describe('/api/listings', () => {
  let seller;

  beforeEach(async () => {
    seller = await createTestUser(); // seller1
  });

  // ─── GET /api/listings ────────────────────────────────────────────────────

  describe('GET /api/listings', () => {
    it('returns active listings', async () => {
      await seedListing(seller._id);
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('does NOT return closed listings', async () => {
      await seedListing(seller._id, { status: 'closed' });
      await seedListing(seller._id, { title: 'Active One' });
      const res = await request(app).get('/api/listings');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Active One');
    });

    it('filters by city (case-insensitive)', async () => {
      await seedListing(seller._id, { city: 'Austin' });
      await seedListing(seller._id, { city: 'Dallas', title: 'Dallas Pad' });
      const res = await request(app).get('/api/listings?city=austin');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].city).toBe('Austin');
    });

    it('filters by listingType', async () => {
      await seedListing(seller._id, { listingType: 'rent' });
      await seedListing(seller._id, { listingType: 'sale', title: 'For Sale' });
      const res = await request(app).get('/api/listings?listingType=sale');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].listingType).toBe('sale');
    });

    it('filters by minimum bedrooms', async () => {
      await seedListing(seller._id, { bedrooms: 1, title: '1BR' });
      await seedListing(seller._id, { bedrooms: 3, title: '3BR' });
      const res = await request(app).get('/api/listings?bedrooms=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('3BR');
    });

    it('filters by price range', async () => {
      await seedListing(seller._id, { price: 1000, title: 'Cheap' });
      await seedListing(seller._id, { price: 3000, title: 'Expensive' });
      const res = await request(app).get('/api/listings?minPrice=1500&maxPrice=3500');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Expensive');
    });
  });

  // ─── GET /api/listings/seller/mine ────────────────────────────────────────

  describe('GET /api/listings/seller/mine', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).get('/api/listings/seller/mine');
      expect(res.status).toBe(401);
    });

    it('returns 404 when user document does not exist', async () => {
      // buyer2 token is valid but no User doc for buyer2
      const res = await request(app)
        .get('/api/listings/seller/mine')
        .set(getAuthHeader('valid-token-buyer2'));
      expect(res.status).toBe(404);
    });

    it('returns only the authenticated user\'s listings', async () => {
      // Seller owns two listings
      await seedListing(seller._id, { title: 'Listing A' });
      await seedListing(seller._id, { title: 'Listing B' });

      // Another seller owns one listing
      const otherSeller = await createTestUser({
        firebaseUid: 'buyer1',
        email: 'buyer@test.com',
        name: 'Other Seller',
        role: 'seller',
      });
      await seedListing(otherSeller._id, { title: 'Other Listing' });

      const res = await request(app)
        .get('/api/listings/seller/mine')
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const titles = res.body.map((l) => l.title);
      expect(titles).toContain('Listing A');
      expect(titles).toContain('Listing B');
      expect(titles).not.toContain('Other Listing');
    });
  });

  // ─── GET /api/listings/:id ────────────────────────────────────────────────

  describe('GET /api/listings/:id', () => {
    it('returns a listing with populated seller info', async () => {
      const listing = await seedListing(seller._id);
      const res = await request(app).get(`/api/listings/${listing._id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Test Listing');
      // sellerId is populated
      expect(res.body.sellerId.name).toBe('Test Seller');
      expect(res.body.sellerId.email).toBe('seller@test.com');
    });

    it('returns 404 for a non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/listings/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/listings ───────────────────────────────────────────────────

  describe('POST /api/listings', () => {
    const listingData = {
      title: 'New Place',
      description: 'A fresh listing',
      address: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      price: 2500,
      listingType: 'rent',
      bedrooms: 3,
      bathrooms: 2,
    };

    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/listings')
        .send(listingData);
      expect(res.status).toBe(401);
    });

    it('returns 404 when user document does not exist', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set(getAuthHeader('valid-token-buyer2'))
        .send(listingData);
      expect(res.status).toBe(404);
    });

    it('returns 201 and creates a listing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set(getAuthHeader('valid-token-seller1'))
        .send(listingData);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Place');
      expect(res.body.sellerId).toBe(seller._id.toString());
    });
  });

  // ─── PUT /api/listings/:id ────────────────────────────────────────────────

  describe('PUT /api/listings/:id', () => {
    it('returns 401 when no auth token is provided', async () => {
      const listing = await seedListing(seller._id);
      const res = await request(app)
        .put(`/api/listings/${listing._id}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/listings/${fakeId}`)
        .set(getAuthHeader('valid-token-seller1'))
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('returns 403 when a non-owner tries to update', async () => {
      const listing = await seedListing(seller._id);
      // Create another user (buyer1)
      await createTestUser({ firebaseUid: 'buyer1', email: 'buyer@test.com', name: 'Buyer', role: 'buyer' });
      const res = await request(app)
        .put(`/api/listings/${listing._id}`)
        .set(getAuthHeader('valid-token-buyer1'))
        .send({ title: 'Hacked' });
      expect(res.status).toBe(403);
    });

    it('returns 200 and updates when the owner sends a valid update', async () => {
      const listing = await seedListing(seller._id);
      const res = await request(app)
        .put(`/api/listings/${listing._id}`)
        .set(getAuthHeader('valid-token-seller1'))
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });
  });

  // ─── DELETE /api/listings/:id ─────────────────────────────────────────────

  describe('DELETE /api/listings/:id', () => {
    it('returns 401 when no auth token is provided', async () => {
      const listing = await seedListing(seller._id);
      const res = await request(app).delete(`/api/listings/${listing._id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 for a non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/listings/${fakeId}`)
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(404);
    });

    it('returns 403 when a non-owner tries to delete', async () => {
      const listing = await seedListing(seller._id);
      await createTestUser({ firebaseUid: 'buyer1', email: 'buyer@test.com', name: 'Buyer', role: 'buyer' });
      const res = await request(app)
        .delete(`/api/listings/${listing._id}`)
        .set(getAuthHeader('valid-token-buyer1'));
      expect(res.status).toBe(403);
    });

    it('returns 200 and deletes when the owner requests deletion', async () => {
      const listing = await seedListing(seller._id);
      const res = await request(app)
        .delete(`/api/listings/${listing._id}`)
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });
});
