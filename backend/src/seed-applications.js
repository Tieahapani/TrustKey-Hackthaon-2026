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

// Demo buyer profiles — CRS sandbox API provides screening data.
// Results vary based on round-robin CRS test identities + real FBI name check.
const DEMO_BUYERS = [
  // GREEN TIER
  { email: 'alice.morgan@trustkey.app', name: 'Alice Morgan', phone: '(555) 111-2233', buyerInfo: { firstName: 'Alice', lastName: 'Morgan', dob: '1991-03-15', email: 'alice.morgan@trustkey.app' } },
  { email: 'fiona.chen@trustkey.app', name: 'Fiona Chen', phone: '(555) 111-3344', buyerInfo: { firstName: 'Fiona', lastName: 'Chen', dob: '1994-06-20', email: 'fiona.chen@trustkey.app' } },
  { email: 'hannah.patel@trustkey.app', name: 'Hannah Patel', phone: '(555) 111-4455', buyerInfo: { firstName: 'Hannah', lastName: 'Patel', dob: '1989-12-05', email: 'hannah.patel@trustkey.app' } },
  { email: 'laura.simmons@trustkey.app', name: 'Laura Simmons', phone: '(555) 111-5566', buyerInfo: { firstName: 'Laura', lastName: 'Simmons', dob: '1992-04-18', email: 'laura.simmons@trustkey.app' } },
  { email: 'quinn.foster@trustkey.app', name: 'Quinn Foster', phone: '(555) 111-6677', buyerInfo: { firstName: 'Quinn', lastName: 'Foster', dob: '1987-08-22', email: 'quinn.foster@trustkey.app' } },
  { email: 'samuel.wright@trustkey.app', name: 'Samuel Wright', phone: '(555) 111-7788', buyerInfo: { firstName: 'Samuel', lastName: 'Wright', dob: '1990-02-14', email: 'samuel.wright@trustkey.app' } },
  // YELLOW TIER
  { email: 'bob.martinez@trustkey.app', name: 'Bob Martinez', phone: '(555) 222-3344', buyerInfo: { firstName: 'Bob', lastName: 'Martinez', dob: '1985-07-22', email: 'bob.martinez@trustkey.app' } },
  { email: 'diana.ross@trustkey.app', name: 'Diana Ross', phone: '(555) 222-4455', buyerInfo: { firstName: 'Diana', lastName: 'Ross', dob: '1988-01-30', email: 'diana.ross@trustkey.app' } },
  { email: 'julia.white@trustkey.app', name: 'Julia White', phone: '(555) 222-5566', buyerInfo: { firstName: 'Julia', lastName: 'White', dob: '1993-09-11', email: 'julia.white@trustkey.app' } },
  { email: 'kevin.brooks@trustkey.app', name: 'Kevin Brooks', phone: '(555) 222-6677', buyerInfo: { firstName: 'Kevin', lastName: 'Brooks', dob: '1986-05-03', email: 'kevin.brooks@trustkey.app' } },
  { email: 'nina.garcia@trustkey.app', name: 'Nina Garcia', phone: '(555) 222-7788', buyerInfo: { firstName: 'Nina', lastName: 'Garcia', dob: '1991-11-27', email: 'nina.garcia@trustkey.app' } },
  // RED TIER
  { email: 'charlie.kumar@trustkey.app', name: 'Charlie Kumar', phone: '(555) 333-4455', buyerInfo: { firstName: 'Charlie', lastName: 'Kumar', dob: '1993-11-08', email: 'charlie.kumar@trustkey.app' } },
  { email: 'greg.thompson@trustkey.app', name: 'Greg Thompson', phone: '(555) 333-5566', buyerInfo: { firstName: 'Greg', lastName: 'Thompson', dob: '1984-03-25', email: 'greg.thompson@trustkey.app' } },
  { email: 'isaac.nguyen@trustkey.app', name: 'Isaac Nguyen', phone: '(555) 333-6677', buyerInfo: { firstName: 'Isaac', lastName: 'Nguyen', dob: '1996-07-19', email: 'isaac.nguyen@trustkey.app' } },
  { email: 'marcus.davis@trustkey.app', name: 'Marcus Davis', phone: '(555) 333-7788', buyerInfo: { firstName: 'Marcus', lastName: 'Davis', dob: '1982-10-12', email: 'marcus.davis@trustkey.app' } },
  { email: 'patricia.young@trustkey.app', name: 'Patricia Young', phone: '(555) 333-8899', buyerInfo: { firstName: 'Patricia', lastName: 'Young', dob: '1990-06-08', email: 'patricia.young@trustkey.app' } },
  { email: 'rachel.kim@trustkey.app', name: 'Rachel Kim', phone: '(555) 333-9900', buyerInfo: { firstName: 'Rachel', lastName: 'Kim', dob: '1995-01-15', email: 'rachel.kim@trustkey.app' } },
  { email: 'tanya.mitchell@trustkey.app', name: 'Tanya Mitchell', phone: '(555) 333-0011', buyerInfo: { firstName: 'Tanya', lastName: 'Mitchell', dob: '1988-04-30', email: 'tanya.mitchell@trustkey.app' } },
  // FBI MATCH TIER
  { email: 'evan.blackwell@trustkey.app', name: 'Evan Blackwell', phone: '(555) 444-5566', buyerInfo: { firstName: 'Evan', lastName: 'Blackwell', dob: '1990-09-12', email: 'evan.blackwell@trustkey.app' } },
  { email: 'oscar.lee@trustkey.app', name: 'Oscar Lee', phone: '(555) 444-6677', buyerInfo: { firstName: 'Oscar', lastName: 'Lee', dob: '1983-12-01', email: 'oscar.lee@trustkey.app' } },
];

/* ------------------------------------------------------------------ */
/*  Application assignment — which buyer applies to which listings     */
/*  (indices into the listings array sorted by creation date)          */
/* ------------------------------------------------------------------ */

// Each buyer applies to 2-4 listings for good coverage
// Indices refer to listings sorted by creation date
const BUYER_LISTING_MAP = [
  // GREEN TIER
  [0, 2, 5, 10],   //  0 Alice Morgan    — excellent
  [1, 4, 8],       //  1 Fiona Chen      — perfect
  [2, 6, 11],      //  2 Hannah Patel    — excellent
  [0, 3, 7],       //  3 Laura Simmons   — excellent
  [1, 5, 9],       //  4 Quinn Foster    — excellent
  [3, 6, 10],      //  5 Samuel Wright   — good
  // YELLOW TIER
  [1, 3, 6, 8],    //  6 Bob Martinez    — 1 criminal
  [0, 4, 8],       //  7 Diana Ross      — 1 bankruptcy
  [2, 5, 9],       //  8 Julia White     — 1 eviction
  [0, 7, 11],      //  9 Kevin Brooks    — high fraud
  [3, 6, 10],      // 10 Nina Garcia     — 1 criminal
  // RED TIER
  [4, 7, 9, 11],   // 11 Charlie Kumar   — everything bad
  [1, 5, 8],       // 12 Greg Thompson   — eviction + criminal
  [0, 3, 10],      // 13 Isaac Nguyen    — bankruptcy + criminal
  [2, 6, 11],      // 14 Marcus Davis    — 3 evictions, 2 bankruptcies
  [1, 4, 7],       // 15 Patricia Young  — eviction + bankruptcy
  [0, 5, 9],       // 16 Rachel Kim      — 2 criminal, high fraud
  [3, 8, 11],      // 17 Tanya Mitchell  — everything bad
  // FBI TIER
  [2, 6, 10, 11],  // 18 Evan Blackwell  — FBI armed robbery
  [0, 4, 8],       // 19 Oscar Lee       — FBI wire fraud
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
      // CRS sandbox API called — results vary by round-robin test identity
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
