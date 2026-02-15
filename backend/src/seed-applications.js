/**
 * Seed script — creates buyer users and applications with REAL CRS screening data.
 *
 * Hits the StitchCredit sandbox API (5 products) and the FBI Most Wanted API,
 * then calculates match scores against each listing's screening criteria.
 *
 * Usage:
 *   cd backend
 *   node src/seed-applications.js
 *
 * Requires MONGODB_URI and CRS_API_* env vars in .env
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Listing = require('./models/Listing');
const User = require('./models/User');
const Application = require('./models/Application');
const { pullComprehensiveReport, calculateMatchScore } = require('./services/crs');

/* ------------------------------------------------------------------ */
/*  Demo buyer profiles                                                */
/* ------------------------------------------------------------------ */

// These names match the 5 TEST_PERSONAS in services/crs.js
// so each buyer gets deterministic, varied screening results.
const DEMO_BUYERS = [
  {
    email: 'alice.morgan@trustkey.app',
    name: 'Alice Morgan',
    phone: '(555) 111-2233',
    buyerInfo: { firstName: 'Alice', lastName: 'Morgan', dob: '1991-03-15', email: 'alice.morgan@trustkey.app' },
  },
  {
    email: 'bob.martinez@trustkey.app',
    name: 'Bob Martinez',
    phone: '(555) 222-3344',
    buyerInfo: { firstName: 'Bob', lastName: 'Martinez', dob: '1985-07-22', email: 'bob.martinez@trustkey.app' },
  },
  {
    email: 'charlie.kumar@trustkey.app',
    name: 'Charlie Kumar',
    phone: '(555) 333-4455',
    buyerInfo: { firstName: 'Charlie', lastName: 'Kumar', dob: '1993-11-08', email: 'charlie.kumar@trustkey.app' },
  },
  {
    email: 'diana.ross@trustkey.app',
    name: 'Diana Ross',
    phone: '(555) 444-5566',
    buyerInfo: { firstName: 'Diana', lastName: 'Ross', dob: '1988-01-30', email: 'diana.ross@trustkey.app' },
  },
  {
    email: 'evan.blackwell@trustkey.app',
    name: 'Evan Blackwell',
    phone: '(555) 555-6677',
    buyerInfo: { firstName: 'Evan', lastName: 'Blackwell', dob: '1990-09-12', email: 'evan.blackwell@trustkey.app' },
  },
];

/* ------------------------------------------------------------------ */
/*  Application assignment — which buyer applies to which listings     */
/*  (indices into the listings array sorted by creation date)          */
/* ------------------------------------------------------------------ */

// Each buyer applies to 3-4 listings for good coverage
const BUYER_LISTING_MAP = [
  [0, 2, 5, 10],   // Alice Morgan    (excellent) → variety of listings
  [1, 3, 6, 8],    // Bob Martinez    (fair)      → some will pass, some won't
  [4, 7, 9, 11],   // Charlie Kumar   (poor)      → mostly red
  [0, 4, 8],       // Diana Ross      (good)      → bankruptcy will fail some
  [2, 6, 10, 11],  // Evan Blackwell  (FBI match) → all 0/100
];

/* ------------------------------------------------------------------ */
/*  Main seed function                                                 */
/* ------------------------------------------------------------------ */

async function seedApplications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all listings sorted by creation date
    const listings = await Listing.find().sort({ createdAt: 1 });
    if (listings.length === 0) {
      console.error('No listings found. Run seed.js first.');
      process.exit(1);
    }
    console.log(`Found ${listings.length} listings\n`);

    // Clear existing demo applications
    const existingBuyerEmails = DEMO_BUYERS.map((b) => b.email);
    const existingBuyers = await User.find({ email: { $in: existingBuyerEmails } });
    const existingBuyerIds = existingBuyers.map((b) => b._id);
    if (existingBuyerIds.length > 0) {
      const deleted = await Application.deleteMany({ buyerId: { $in: existingBuyerIds } });
      console.log(`Cleared ${deleted.deletedCount} old demo applications\n`);
    }

    // Create/find buyer users
    const buyers = [];
    for (const profile of DEMO_BUYERS) {
      let user = await User.findOne({ email: profile.email });
      if (!user) {
        user = await User.create({
          firebaseUid: 'demo-buyer-uid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          email: profile.email,
          name: profile.name,
          role: 'buyer',
          phone: profile.phone,
        });
        console.log(`Created buyer: ${profile.name}`);
      } else {
        console.log(`Buyer exists: ${profile.name}`);
      }
      buyers.push({ user, ...profile });
    }

    console.log('');

    // Pull CRS data and create applications
    let totalCreated = 0;

    for (let i = 0; i < buyers.length; i++) {
      const buyer = buyers[i];
      const listingIndices = BUYER_LISTING_MAP[i];

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Processing ${buyer.name} (${listingIndices.length} applications)`);
      console.log('─'.repeat(60));

      // Pull CRS report once per buyer (reuse for all their applications)
      // Names match TEST_PERSONAS in crs.js — each gets deterministic data
      console.log(`\nPulling CRS screening data for ${buyer.name}...`);
      const crsData = await pullComprehensiveReport(buyer.buyerInfo);

      for (const idx of listingIndices) {
        if (idx >= listings.length) {
          console.warn(`  Skipping index ${idx} — only ${listings.length} listings exist`);
          continue;
        }

        const listing = listings[idx];
        const { matchScore, matchBreakdown, matchColor, totalPoints, earnedPoints } =
          calculateMatchScore(crsData, listing.screeningCriteria);

        // Assign varied statuses for realistic demo data
        let status;
        if (matchScore >= 80) {
          status = Math.random() > 0.3 ? 'approved' : 'screened';
        } else if (matchScore >= 60) {
          status = 'screened';
        } else {
          status = Math.random() > 0.5 ? 'rejected' : 'screened';
        }

        const application = await Application.create({
          listingId: listing._id,
          buyerId: buyer.user._id,
          buyerInfo: buyer.buyerInfo,
          status,
          consentGiven: true,
          crsData,
          matchScore,
          matchBreakdown,
          matchColor,
          totalPoints,
          earnedPoints,
          screenedAt: new Date(),
        });

        const colorEmoji = matchColor === 'green' ? '🟢' : matchColor === 'yellow' ? '🟡' : '🔴';
        console.log(
          `  ${colorEmoji} ${matchScore}/100 | ${status.padEnd(8)} | ${listing.city} — ${listing.title}`
        );

        totalCreated++;
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ Seeded ${totalCreated} applications with real CRS screening data`);
    console.log('═'.repeat(60));

    // Print summary
    const summary = await Application.aggregate([
      { $group: { _id: '$matchColor', count: { $sum: 1 }, avgScore: { $avg: '$matchScore' } } },
      { $sort: { _id: 1 } },
    ]);
    console.log('\nScore distribution:');
    for (const s of summary) {
      const emoji = s._id === 'green' ? '🟢' : s._id === 'yellow' ? '🟡' : '🔴';
      console.log(`  ${emoji} ${s._id}: ${s.count} applications (avg score: ${Math.round(s.avgScore)})`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  }
}

seedApplications();
