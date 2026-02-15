/**
 * Database lifecycle hooks and test helpers.
 * Required by test files that need MongoDB (routes, models).
 * Must be required inside a test file where beforeAll/afterAll/afterEach are available.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── Test Helpers ───

const User = require('../models/User');
const Listing = require('../models/Listing');
const Application = require('../models/Application');

async function createTestUser(overrides = {}) {
  const defaults = {
    firebaseUid: 'seller1',
    email: 'seller@test.com',
    name: 'Test Seller',
    role: 'seller',
    phone: '',
  };
  return User.create({ ...defaults, ...overrides });
}

function getAuthHeader(tokenKey = 'valid-token-seller1') {
  return { Authorization: `Bearer ${tokenKey}` };
}

async function seedListing(sellerId, overrides = {}) {
  const defaults = {
    sellerId,
    title: 'Test Listing',
    description: 'A nice place',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    price: 2000,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
  };
  return Listing.create({ ...defaults, ...overrides });
}

async function seedApplication(buyerId, listingId, overrides = {}) {
  const defaults = {
    buyerId,
    listingId,
    consentGiven: true,
    status: 'screened',
    matchScore: 85,
    matchColor: 'green',
    buyerInfo: { firstName: 'Jane', lastName: 'Doe', dob: '1990-01-01', email: 'jane@test.com' },
    crsData: {
      creditScore: 720,
      evictions: 0,
      bankruptcies: 0,
      criminalOffenses: 0,
      fraudRiskScore: 1,
      identityVerified: true,
      fbiMostWanted: { matchFound: false, matchCount: 0, searchedName: 'Jane Doe', crimes: [] },
    },
  };
  return Application.create({ ...defaults, ...overrides });
}

module.exports = { createTestUser, getAuthHeader, seedListing, seedApplication };
