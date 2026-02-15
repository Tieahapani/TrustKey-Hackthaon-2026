/**
 * End-to-end test: Seller → Listing → Buyer applies → CRS screening → Seller reviews
 *
 * Usage: node test-e2e.js
 * Requires: backend server running on localhost:5001
 */

const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const API = 'http://localhost:5001/api';

// Load Firebase Admin (same as backend)
const saPath = path.resolve(__dirname, 'secrets/trustkey-2026-firebase-adminsdk-fbsvc-0a8eaf6c16.json');
const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const API_KEY = 'AIzaSyCuABMSj26DTIzBTARDCqyZes4SzJqPoMo';
const createdFirebaseUids = []; // track for cleanup

// Helper: create a real Firebase user, sign in, and return ID token
async function getIdToken(uid, email) {
  const password = 'TestPass123!';

  // Create user in Firebase Auth (or reuse if exists)
  try {
    await admin.auth().createUser({ uid, email, password });
  } catch (err) {
    if (err.code !== 'auth/uid-already-exists' && err.code !== 'auth/email-already-exists') {
      throw err;
    }
  }
  createdFirebaseUids.push(uid);

  // Sign in via REST API to get ID token
  const resp = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email, password, returnSecureToken: true }
  );
  return resp.data.idToken;
}

// Helper: make authenticated request
function authApi(token) {
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function run() {
  console.log('\n========================================');
  console.log('  HomeScreen E2E Test');
  console.log('========================================\n');

  // ─── Step 1: Register Seller ───
  console.log('STEP 1: Register seller...');
  const ts = Date.now();
  const sellerUid = 'test-seller-' + ts;
  const sellerToken = await getIdToken(sellerUid, `seller-${ts}@test.com`);
  const sellerApi = authApi(sellerToken);

  const sellerRes = await sellerApi.post('/users/register', {
    name: 'Test Seller',
    role: 'seller',
    phone: '555-0001',
  });
  console.log('  Seller registered:', sellerRes.data.name, `(${sellerRes.data._id})`);

  // ─── Step 2: Seller Creates Listing ───
  console.log('\nSTEP 2: Create listing with screening criteria...');
  const listingRes = await sellerApi.post('/listings', {
    title: '2BR Downtown Apartment',
    description: 'Modern apartment in downtown area',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    price: 2500,
    listingType: 'rent',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 900,
    screeningCriteria: {
      minCreditScore: 700,
      noEvictions: true,
      noBankruptcy: true,
      noCriminal: true,
      noFraud: true,
    },
  });
  const listingId = listingRes.data._id;
  console.log('  Listing created:', listingRes.data.title, `(${listingId})`);
  console.log('  Screening criteria:', JSON.stringify(listingRes.data.screeningCriteria));
  console.log('  Monthly rent: $' + listingRes.data.price);

  // ─── Step 3: Register Buyers & Apply ───
  const buyers = [
    { firstName: 'Alice', lastName: 'Green', dob: '1990-03-15' },
    { firstName: 'Bob', lastName: 'Williams', dob: '1985-07-22' },
    { firstName: 'Charlie', lastName: 'Brown', dob: '1992-11-08' },
    { firstName: 'Diana', lastName: 'Ross', dob: '1988-01-30' },
  ];

  const applicationIds = [];

  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    const buyerEmail = `buyer${i}-${ts}@test.com`;
    console.log(`\nSTEP 3.${i + 1}: Register & apply as "${buyer.firstName} ${buyer.lastName}" (${buyerEmail})...`);

    const buyerUid = `test-buyer-${i}-${ts}`;
    const buyerToken = await getIdToken(buyerUid, buyerEmail);
    const buyerApi = authApi(buyerToken);

    // Register
    await buyerApi.post('/users/register', {
      name: `${buyer.firstName} ${buyer.lastName}`,
      role: 'buyer',
      phone: `555-100${i}`,
    });

    // Apply with buyer identity info
    const appRes = await buyerApi.post('/applications', {
      listingId,
      consent: true,
      buyerInfo: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        dob: buyer.dob,
        email: buyerEmail,
      },
    });

    applicationIds.push(appRes.data._id);
    const d = appRes.data;
    console.log(`  CRS Data: credit=${d.crsData.creditScore}, evictions=${d.crsData.evictions}, bankruptcies=${d.crsData.bankruptcies}, criminal=${d.crsData.criminalRecords}, fraud=${d.crsData.fraudFlag}`);
    console.log(`  Match Score: ${d.matchScore}/100 (${d.matchColor.toUpperCase()})`);
    console.log('  Breakdown:');
    Object.entries(d.matchBreakdown).forEach(([key, val]) => {
      console.log(`    ${val.passed ? 'PASS' : 'FAIL'} ${key}: ${val.detail}`);
    });
  }

  // ─── Step 4: Seller Views Applicants ───
  console.log('\n\nSTEP 4: Seller views all applicants (sorted by match score)...');
  const applicantsRes = await sellerApi.get(`/applications/listing/${listingId}`);
  console.log(`  Total applicants: ${applicantsRes.data.length}`);
  applicantsRes.data.forEach((app, i) => {
    console.log(`  #${i + 1}: ${app.buyerId.name} — Score: ${app.matchScore}/100 (${app.matchColor}) — Status: ${app.status}`);
  });

  // ─── Step 5: Seller Approves Best, Rejects Worst ───
  console.log('\nSTEP 5: Seller approves top applicant, rejects last...');
  const sorted = applicantsRes.data;
  if (sorted.length >= 2) {
    const approveRes = await sellerApi.patch(`/applications/${sorted[0]._id}/status`, { status: 'approved' });
    console.log(`  APPROVED: ${sorted[0].buyerId.name} (score: ${sorted[0].matchScore})`);

    const rejectRes = await sellerApi.patch(`/applications/${sorted[sorted.length - 1]._id}/status`, { status: 'rejected' });
    console.log(`  REJECTED: ${sorted[sorted.length - 1].buyerId.name} (score: ${sorted[sorted.length - 1].matchScore})`);
  }

  // ─── Step 6: Final Status ───
  console.log('\nSTEP 6: Final applicant status...');
  const finalRes = await sellerApi.get(`/applications/listing/${listingId}`);
  finalRes.data.forEach((app) => {
    console.log(`  ${app.buyerId.name}: ${app.status.toUpperCase()} (score: ${app.matchScore})`);
  });

  console.log('\n========================================');
  console.log('  E2E Test Complete!');
  console.log('========================================\n');

  // Cleanup: remove test data
  console.log('Cleaning up test data...');
  await sellerApi.delete(`/listings/${listingId}`);
  console.log('  Test listing deleted.');

  // Delete Firebase test users
  for (const uid of createdFirebaseUids) {
    try {
      await admin.auth().deleteUser(uid);
    } catch (e) { /* ignore */ }
  }
  console.log(`  ${createdFirebaseUids.length} Firebase test users deleted.`);

  process.exit(0);
}

run().catch((err) => {
  console.error('\nE2E TEST FAILED:');
  console.error('  Message:', err.message);
  console.error('  Status:', err.response?.status);
  console.error('  Data:', JSON.stringify(err.response?.data, null, 2));
  if (!err.response) console.error('  Full error:', err);
  process.exit(1);
});
