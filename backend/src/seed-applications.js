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

const DEMO_BUYERS = [
  {
    email: 'demo-buyer@trustkey.app',
    name: 'Sam Rivera',
    phone: '(555) 987-6543',
    buyerInfo: { firstName: 'Sam', lastName: 'Rivera', dob: '1992-05-14', email: 'demo-buyer@trustkey.app' },
  },
  {
    email: 'jordan.lee@trustkey.app',
    name: 'Jordan Lee',
    phone: '(555) 234-5678',
    buyerInfo: { firstName: 'Jordan', lastName: 'Lee', dob: '1988-11-03', email: 'jordan.lee@trustkey.app' },
  },
  {
    email: 'maria.santos@trustkey.app',
    name: 'Maria Santos',
    phone: '(555) 345-6789',
    buyerInfo: { firstName: 'Maria', lastName: 'Santos', dob: '1995-02-20', email: 'maria.santos@trustkey.app' },
  },
  {
    email: 'david.chen@trustkey.app',
    name: 'David Chen',
    phone: '(555) 456-7890',
    buyerInfo: { firstName: 'David', lastName: 'Chen', dob: '1990-08-12', email: 'david.chen@trustkey.app' },
  },
  {
    email: 'priya.patel@trustkey.app',
    name: 'Priya Patel',
    phone: '(555) 567-8901',
    buyerInfo: { firstName: 'Priya', lastName: 'Patel', dob: '1993-06-30', email: 'priya.patel@trustkey.app' },
  },
];

/* ------------------------------------------------------------------ */
/*  Application assignment — which buyer applies to which listings     */
/*  (indices into the listings array sorted by creation date)          */
/* ------------------------------------------------------------------ */

// Each buyer applies to 3-4 listings for good coverage
const BUYER_LISTING_MAP = [
  [0, 2, 5, 10],   // Sam Rivera    → Austin Loft, Pearl District, Brickell, Charlotte High-Rise
  [1, 3, 6, 8],    // Jordan Lee    → East Austin Bungalow, Hawthorne Studio, RiNo Townhome, Mission District
  [4, 7, 9, 11],   // Maria Santos  → South Beach Penthouse, Highland Ranch, Bay View Condo, South End Townhome
  [0, 4, 8],       // David Chen    → Austin Loft, South Beach Penthouse, Mission District
  [2, 6, 10, 11],  // Priya Patel   → Pearl District, RiNo Townhome, Charlotte High-Rise, South End Townhome
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
      console.log(`\nPulling CRS screening data for ${buyer.name}...`);
      const crsData = await pullComprehensiveReport(buyer.buyerInfo);

      // Override FBI false positives — the FBI API does fuzzy name matching
      // which flags common names like "Lee", "Chen", "Patel" against unrelated
      // wanted persons.  For demo, clear those and give one buyer a real match.
      if (i !== 1) {
        // Clear false-positive FBI matches for everyone except Jordan Lee (for demo)
        crsData.fbiMostWanted = {
          matchFound: false,
          matchCount: 0,
          searchedName: `${buyer.buyerInfo.firstName} ${buyer.buyerInfo.lastName}`,
          crimes: [],
        };
      } else {
        // Jordan Lee keeps the FBI match for demo purposes (shows hard-fail 0/100)
        // but limit to 1 realistic match
        crsData.fbiMostWanted = {
          matchFound: true,
          matchCount: 1,
          searchedName: 'Jordan Lee',
          crimes: [{
            name: 'JORDAN LEE WILLIAMS',
            description: 'Unlawful Flight to Avoid Prosecution - Murder',
            subjects: ['Violent Crime'],
            warningMessage: 'SHOULD BE CONSIDERED ARMED AND DANGEROUS',
            url: null,
          }],
        };
      }

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
