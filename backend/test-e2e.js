/**
 * E2E Test: Multiple buyers applying to the same listing
 * Each application cycles through different CRS sandbox personas (round-robin)
 */

require('dotenv').config();
const { pullComprehensiveReport, calculateMatchScore } = require('./src/services/crs');

const BUYERS = [
  { firstName: 'Tiea', lastName: 'Hapani', dob: '2005-05-02', email: 'hapanitiea6@gmail.com' },
  { firstName: 'Sanjay', lastName: 'Kumar', dob: '1998-03-10', email: 'sanjay@example.com' },
  { firstName: 'Alex', lastName: 'Chen', dob: '2000-07-22', email: 'alex.chen@example.com' },
];

const sellerCriteria = {
  minCreditScore: 680,
  noEvictions: true,
  noBankruptcy: true,
  noCriminal: true,
};

async function run() {
  console.log('='.repeat(60));
  console.log('E2E TEST: 3 Buyers Applying to Same Listing');
  console.log('Seller Criteria:', JSON.stringify(sellerCriteria));
  console.log('='.repeat(60));

  const results = [];

  for (let i = 0; i < BUYERS.length; i++) {
    const buyer = BUYERS[i];
    console.log('\n' + '-'.repeat(60));
    console.log('BUYER ' + (i + 1) + ': ' + buyer.firstName + ' ' + buyer.lastName);
    console.log('-'.repeat(60));

    const crsData = await pullComprehensiveReport(buyer);

    console.log('\nCRS Results:');
    console.log('  Credit Score:', crsData.creditScore);
    console.log('  Evictions:', crsData.evictions);
    console.log('  Criminal Offenses:', crsData.criminalOffenses);
    console.log('  Fraud Risk Score:', crsData.fraudRiskScore);
    console.log('  Identity Verified:', crsData.identityVerified);
    console.log('  Bankruptcies:', crsData.bankruptcies);

    const match = calculateMatchScore(crsData, sellerCriteria);

    console.log('\nMatch Result:');
    console.log('  Score:', match.matchScore + '%');
    console.log('  Color:', match.matchColor);
    console.log('  Breakdown:');
    Object.entries(match.matchBreakdown).forEach(function(entry) {
      var icon = entry[1].passed ? 'PASS' : 'FAIL';
      console.log('    [' + icon + '] ' + entry[0] + ': ' + entry[1].detail);
    });

    results.push({
      name: buyer.firstName + ' ' + buyer.lastName,
      score: match.matchScore,
      color: match.matchColor,
    });
  }

  // Leaderboard
  console.log('\n' + '='.repeat(60));
  console.log('LEADERBOARD');
  console.log('='.repeat(60));
  results.sort(function(a, b) { return b.score - a.score; });
  results.forEach(function(r, i) {
    console.log('  ' + (i + 1) + '. ' + r.name + ' — ' + r.score + '% (' + r.color + ')');
  });
  console.log('='.repeat(60));
}

run().catch(function(err) {
  console.error('Test failed:', err);
  process.exit(1);
});
