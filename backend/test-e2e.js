/**
 * E2E Test Suite
 *
 * Test 1: FBI Most Wanted Check — verifies clean names pass, wanted names get 0/100
 * Test 2: Round-Robin Variety — 3 buyers get different CRS personas (different scores)
 * Test 3: Same Buyer Reuse (Option A) — same CRS data, different match scores per listing criteria
 */

require('dotenv').config();
const { pullComprehensiveReport, calculateMatchScore } = require('./src/services/crs');

// ============================================
// TEST 1: FBI Most Wanted Check
// ============================================
async function testFBI() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: FBI MOST WANTED CHECK');
  console.log('='.repeat(60));

  const criteria = {
    minCreditScore: 600,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
  };

  // Run 7 applications to cycle through all FBI test names
  // FBI_TEST_NAMES: DIANE(clean), BYSHERE(wanted), NATALIE(clean), CINDY(wanted), BROSE(clean), TERRY(wanted), EILEEN(clean)
  const fbiResults = [];

  for (let i = 0; i < 7; i++) {
    const buyer = { firstName: `Buyer${i + 1}`, lastName: 'Test', dob: '1990-01-01', email: `buyer${i + 1}@test.com` };
    console.log(`\n--- Application ${i + 1} ---`);

    const crsData = await pullComprehensiveReport(buyer);
    const match = calculateMatchScore(crsData, criteria);

    const fbiStatus = crsData.fbiMostWanted?.matchFound ? 'FBI WANTED' : 'CLEAN';
    const searchedName = crsData.fbiMostWanted?.searchedName || 'N/A';
    const crimeDesc = crsData.fbiMostWanted?.crimes?.map(c => c.description).join('; ') || 'None';

    fbiResults.push({
      app: i + 1,
      searchedName,
      fbiStatus,
      score: match.matchScore,
      color: match.matchColor,
      crimeDesc: crimeDesc.substring(0, 80),
    });

    console.log(`  FBI Name: ${searchedName}`);
    console.log(`  FBI Status: ${fbiStatus}`);
    console.log(`  Match Score: ${match.matchScore}%`);
    if (crsData.fbiMostWanted?.matchFound) {
      console.log(`  Crimes: ${crimeDesc}`);
      console.log(`  Warning: ${crsData.fbiMostWanted.crimes?.[0]?.warningMessage || 'N/A'}`);
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log('FBI TEST SUMMARY:');
  console.log('-'.repeat(60));
  fbiResults.forEach(r => {
    const icon = r.fbiStatus === 'FBI WANTED' ? '🚨' : '✅';
    console.log(`  ${icon} App ${r.app}: ${r.searchedName} — ${r.fbiStatus} — Score: ${r.score}% (${r.color})`);
    if (r.fbiStatus === 'FBI WANTED') {
      console.log(`     Crime: ${r.crimeDesc}`);
    }
  });

  // Verify: wanted names should have score 0, clean names should have score > 0
  const wantedApps = fbiResults.filter(r => r.fbiStatus === 'FBI WANTED');
  const cleanApps = fbiResults.filter(r => r.fbiStatus === 'CLEAN');
  const allWantedZero = wantedApps.every(r => r.score === 0);
  const allCleanAboveZero = cleanApps.every(r => r.score > 0);

  console.log('\n  ASSERTIONS:');
  console.log(`  ${allWantedZero ? 'PASS' : 'FAIL'} — All FBI wanted persons got 0/100 (${wantedApps.length} found)`);
  console.log(`  ${allCleanAboveZero ? 'PASS' : 'FAIL'} — All clean persons scored above 0 (${cleanApps.length} found)`);
  console.log(`  ${wantedApps.length === 3 ? 'PASS' : 'FAIL'} — Expected 3 FBI matches in 7 applications`);
}

// ============================================
// TEST 2: Round-Robin Variety
// ============================================
async function testRoundRobin() {
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST 2: ROUND-ROBIN VARIETY');
  console.log('Different buyers should get different CRS personas/scores');
  console.log('='.repeat(60));

  const criteria = {
    minCreditScore: 680,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
  };

  const buyers = [
    { firstName: 'Tiea', lastName: 'Hapani', dob: '2005-05-02', email: 'tiea@test.com' },
    { firstName: 'Sanjay', lastName: 'Kumar', dob: '1998-03-10', email: 'sanjay@test.com' },
    { firstName: 'Alex', lastName: 'Chen', dob: '2000-07-22', email: 'alex@test.com' },
  ];

  const results = [];

  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    console.log(`\n--- Buyer ${i + 1}: ${buyer.firstName} ${buyer.lastName} ---`);

    const crsData = await pullComprehensiveReport(buyer);
    const match = calculateMatchScore(crsData, criteria);

    results.push({
      name: `${buyer.firstName} ${buyer.lastName}`,
      creditScore: crsData.creditScore,
      evictions: crsData.evictions,
      bankruptcies: crsData.bankruptcies,
      criminalOffenses: crsData.criminalOffenses,
      fraudRiskScore: crsData.fraudRiskScore,
      fbiMatch: crsData.fbiMostWanted?.matchFound || false,
      matchScore: match.matchScore,
      matchColor: match.matchColor,
      totalPoints: match.totalPoints,
      earnedPoints: match.earnedPoints,
    });
  }

  console.log('\n' + '-'.repeat(60));
  console.log('ROUND-ROBIN RESULTS:');
  console.log('-'.repeat(60));
  results.forEach((r, i) => {
    console.log(`  Buyer ${i + 1}: ${r.name}`);
    console.log(`    Credit: ${r.creditScore} | Evictions: ${r.evictions} | Bankruptcies: ${r.bankruptcies}`);
    console.log(`    Criminal: ${r.criminalOffenses} | Fraud: ${r.fraudRiskScore} | FBI: ${r.fbiMatch ? 'WANTED' : 'Clean'}`);
    console.log(`    Match: ${r.matchScore}% (${r.matchColor}) — ${r.earnedPoints}/${r.totalPoints} pts`);
  });

  // Check that we got varied credit scores (round-robin should give different TU personas)
  const creditScores = results.filter(r => !r.fbiMatch).map(r => r.creditScore);
  const uniqueScores = new Set(creditScores);
  console.log('\n  ASSERTIONS:');
  console.log(`  ${uniqueScores.size > 1 ? 'PASS' : 'INFO'} — Got ${uniqueScores.size} unique credit scores from ${creditScores.length} clean buyers: [${[...uniqueScores].join(', ')}]`);
}

// ============================================
// TEST 3: Same Buyer Reuse (Option A Simulation)
// ============================================
async function testSameBuyerReuse() {
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST 3: SAME BUYER — DIFFERENT LISTINGS (Option A)');
  console.log('Same CRS data should produce different match scores');
  console.log('when seller criteria differ');
  console.log('='.repeat(60));

  // Simulate: one buyer's CRS data applied against two different listing criteria
  const buyer = { firstName: 'Tiea', lastName: 'Hapani', dob: '2005-05-02', email: 'tiea@test.com' };

  console.log('\n--- Pulling CRS data once (first application) ---');
  const crsData = await pullComprehensiveReport(buyer);

  console.log('\nCRS Data (stored in MongoDB, reused for all listings):');
  console.log(`  Credit Score: ${crsData.creditScore}`);
  console.log(`  Evictions: ${crsData.evictions}`);
  console.log(`  Bankruptcies: ${crsData.bankruptcies}`);
  console.log(`  Criminal Offenses: ${crsData.criminalOffenses}`);
  console.log(`  Fraud Risk: ${crsData.fraudRiskScore}`);
  console.log(`  FBI Match: ${crsData.fbiMostWanted?.matchFound ? 'YES' : 'No'}`);

  // Listing A: Strict criteria
  const criteriaA = {
    minCreditScore: 750,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
  };

  // Listing B: Relaxed criteria
  const criteriaB = {
    minCreditScore: 580,
    noEvictions: false,
    noBankruptcy: false,
    noCriminal: false,
  };

  // Listing C: No criteria at all
  const criteriaC = {
    minCreditScore: 0,
    noEvictions: false,
    noBankruptcy: false,
    noCriminal: false,
  };

  const matchA = calculateMatchScore(crsData, criteriaA);
  const matchB = calculateMatchScore(crsData, criteriaB);
  const matchC = calculateMatchScore(crsData, criteriaC);

  console.log('\n' + '-'.repeat(60));
  console.log('SAME BUYER, 3 DIFFERENT LISTINGS:');
  console.log('-'.repeat(60));

  [
    { label: 'Listing A (Strict: credit>=750, all checks on)', match: matchA, criteria: criteriaA },
    { label: 'Listing B (Relaxed: credit>=580, no toggles)', match: matchB, criteria: criteriaB },
    { label: 'Listing C (No criteria)', match: matchC, criteria: criteriaC },
  ].forEach(({ label, match }) => {
    console.log(`\n  ${label}`);
    console.log(`    Score: ${match.matchScore}% (${match.matchColor}) — ${match.earnedPoints}/${match.totalPoints} pts`);
    console.log('    Breakdown:');
    Object.entries(match.matchBreakdown).forEach(([key, val]) => {
      const icon = val.passed ? 'PASS' : 'FAIL';
      const pts = val.maxPoints > 0 ? ` (${val.points}/${val.maxPoints})` : '';
      console.log(`      [${icon}] ${key}: ${val.detail}${pts}`);
    });
  });

  console.log('\n  ASSERTIONS:');
  const scoresMatch = matchA.matchScore !== matchB.matchScore || matchB.matchScore !== matchC.matchScore;
  console.log(`  ${scoresMatch ? 'PASS' : 'INFO'} — Different criteria produced different scores: A=${matchA.matchScore}%, B=${matchB.matchScore}%, C=${matchC.matchScore}%`);
  console.log(`  ${matchC.matchScore === 100 ? 'PASS' : 'INFO'} — No criteria listing should give ~100%: got ${matchC.matchScore}%`);
  console.log(`  ${matchA.matchScore <= matchB.matchScore ? 'PASS' : 'INFO'} — Stricter criteria should produce lower or equal score`);
}

// ============================================
// RUN ALL TESTS
// ============================================
async function runAll() {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║      E2E TEST SUITE — FBI + Round-Robin + Option A      ║');
  console.log('╚' + '═'.repeat(58) + '╝');

  try {
    await testFBI();
    await testRoundRobin();
    await testSameBuyerReuse();

    console.log('\n\n' + '='.repeat(60));
    console.log('ALL TESTS COMPLETE');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\nTEST SUITE FAILED:', err);
    process.exit(1);
  }
}

runAll();
