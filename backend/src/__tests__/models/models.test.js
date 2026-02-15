/**
 * Tests for Mongoose model validation: User, Listing, Application.
 *
 * These tests run against the in-memory MongoDB provided by setup.js.
 */
require('../db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Listing = require('../../models/Listing');
const Application = require('../../models/Application');

// ─── User Model ──────────────────────────────────────────────────────────────

describe('User model', () => {
  const validUser = {
    firebaseUid: 'uid-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  it('requires firebaseUid', async () => {
    const user = new User({ ...validUser, firebaseUid: undefined });
    await expect(user.validate()).rejects.toThrow();
  });

  it('requires email', async () => {
    const user = new User({ ...validUser, email: undefined });
    await expect(user.validate()).rejects.toThrow();
  });

  it('requires name', async () => {
    const user = new User({ ...validUser, name: undefined });
    await expect(user.validate()).rejects.toThrow();
  });

  it('enforces unique firebaseUid', async () => {
    await User.create(validUser);
    await expect(
      User.create({ ...validUser, email: 'other@example.com' })
    ).rejects.toThrow();
  });

  it('enforces unique email', async () => {
    await User.create(validUser);
    await expect(
      User.create({ ...validUser, firebaseUid: 'uid-different' })
    ).rejects.toThrow();
  });

  it('defaults phone to empty string', async () => {
    const user = await User.create(validUser);
    expect(user.phone).toBe('');
  });
});

// ─── Listing Model ───────────────────────────────────────────────────────────

describe('Listing model', () => {
  let sellerId;

  beforeEach(async () => {
    const user = await User.create({
      firebaseUid: 'listing-seller',
      email: 'ls@test.com',
      name: 'Listing Seller',
    });
    sellerId = user._id;
  });

  const validListing = () => ({
    sellerId,
    title: 'Cozy Apt',
    description: 'Nice place',
    address: '1 Main St',
    city: 'Austin',
    state: 'TX',
    price: 2000,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
  });

  it('requires sellerId', async () => {
    const l = new Listing({ ...validListing(), sellerId: undefined });
    await expect(l.validate()).rejects.toThrow();
  });

  it('requires title', async () => {
    const l = new Listing({ ...validListing(), title: undefined });
    await expect(l.validate()).rejects.toThrow();
  });

  it('requires description', async () => {
    const l = new Listing({ ...validListing(), description: undefined });
    await expect(l.validate()).rejects.toThrow();
  });

  it('requires address, city, state', async () => {
    for (const field of ['address', 'city', 'state']) {
      const data = validListing();
      delete data[field];
      const l = new Listing(data);
      await expect(l.validate()).rejects.toThrow();
    }
  });

  it('requires price', async () => {
    const l = new Listing({ ...validListing(), price: undefined });
    await expect(l.validate()).rejects.toThrow();
  });

  it('requires listingType', async () => {
    const l = new Listing({ ...validListing(), listingType: undefined });
    await expect(l.validate()).rejects.toThrow();
  });

  it('only allows rent or sale for listingType', async () => {
    const l = new Listing({ ...validListing(), listingType: 'auction' });
    await expect(l.validate()).rejects.toThrow();
  });

  it('requires bedrooms and bathrooms', async () => {
    const l1 = new Listing({ ...validListing(), bedrooms: undefined });
    await expect(l1.validate()).rejects.toThrow();

    const l2 = new Listing({ ...validListing(), bathrooms: undefined });
    await expect(l2.validate()).rejects.toThrow();
  });

  it('defaults status to active', async () => {
    const l = await Listing.create(validListing());
    expect(l.status).toBe('active');
  });

  it('only allows active or closed for status', async () => {
    const l = new Listing({ ...validListing(), status: 'pending' });
    await expect(l.validate()).rejects.toThrow();
  });
});

// ─── Application Model ──────────────────────────────────────────────────────

describe('Application model', () => {
  let buyerId;
  let listingId;

  beforeEach(async () => {
    const seller = await User.create({
      firebaseUid: 'app-seller',
      email: 'appseller@test.com',
      name: 'App Seller',
    });
    const buyer = await User.create({
      firebaseUid: 'app-buyer',
      email: 'appbuyer@test.com',
      name: 'App Buyer',
    });
    buyerId = buyer._id;

    const listing = await Listing.create({
      sellerId: seller._id,
      title: 'Test',
      description: 'Desc',
      address: '1 St',
      city: 'NY',
      state: 'NY',
      price: 1500,
      listingType: 'rent',
      bedrooms: 1,
      bathrooms: 1,
    });
    listingId = listing._id;
  });

  it('requires listingId', async () => {
    const a = new Application({ buyerId, consentGiven: true });
    await expect(a.validate()).rejects.toThrow();
  });

  it('requires buyerId', async () => {
    const a = new Application({ listingId, consentGiven: true });
    await expect(a.validate()).rejects.toThrow();
  });

  it('defaults status to pending', async () => {
    const a = await Application.create({ listingId, buyerId, consentGiven: true });
    expect(a.status).toBe('pending');
  });

  it('only allows valid status enum values', async () => {
    const a = new Application({ listingId, buyerId, consentGiven: true, status: 'unknown' });
    await expect(a.validate()).rejects.toThrow();
  });

  it('enforces matchScore min 0', async () => {
    const a = new Application({ listingId, buyerId, consentGiven: true, matchScore: -1 });
    await expect(a.validate()).rejects.toThrow();
  });

  it('enforces matchScore max 100', async () => {
    const a = new Application({ listingId, buyerId, consentGiven: true, matchScore: 101 });
    await expect(a.validate()).rejects.toThrow();
  });

  it('accepts matchScore within 0-100 range', async () => {
    const a = new Application({ listingId, buyerId, consentGiven: true, matchScore: 50 });
    await expect(a.validate()).resolves.toBeUndefined();
  });

  it('enforces compound unique index on {listingId, buyerId}', async () => {
    await Application.create({ listingId, buyerId, consentGiven: true });
    await expect(
      Application.create({ listingId, buyerId, consentGiven: true })
    ).rejects.toThrow();
  });
});
