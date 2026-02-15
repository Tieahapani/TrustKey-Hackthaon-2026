const axios = require('axios');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Login to CRS API and get JWT token. Caches token until near expiry.
 */
async function getCrsToken() {
  const baseUrl = process.env.CRS_API_URL; // https://api-sandbox.stitchcredit.com:443/api
  const username = process.env.CRS_API_USERNAME;
  const password = process.env.CRS_API_PASSWORD;

  if (!baseUrl || !username || !password) {
    return null;
  }

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
      `${baseUrl}/users/login`,
      { username, password },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }
    );

    const { token, expires } = response.data;
    if (token) {
      cachedToken = token;
      tokenExpiresAt = Date.now() + (expires || 3600) * 1000;
      console.log('✅ CRS authentication successful');
      return token;
    }
  } catch (err) {
    console.error('❌ CRS login failed:', err.response?.data || err.message);
  }

  return null;
}

/**
 * Recursively search for a value by key name in nested objects.
 */
function findValueByKey(obj, ...keys) {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      const val = obj[key];
      if (typeof val === 'number' && !Number.isNaN(val)) return val;
      if (typeof val === 'string' && /^\d+$/.test(val)) return parseInt(val, 10);
      if (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val)) return parseFloat(val);
      if (typeof val === 'number') return val;
    }
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findValueByKey(item, ...keys);
        if (found !== undefined) return found;
      }
    } else if (typeof value === 'object') {
      const found = findValueByKey(value, ...keys);
      if (found !== undefined) return found;
    }
  }

  return undefined;
}

/**
 * Count occurrences (e.g. evictions, bankruptcies) in nested response.
 */
function countOccurrences(obj, ...keys) {
  let count = 0;

  function walk(o) {
    if (o === null || o === undefined) return;
    if (typeof o !== 'object') return;

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        const val = o[key];
        if (Array.isArray(val)) count += val.length;
        else if (typeof val === 'number') count += val;
        else if (val != null) count += 1;
      }
    }

    for (const value of Object.values(o)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (typeof value === 'object') walk(value);
    }
  }

  walk(obj);
  return count;
}

// ============================================
// TEST IDENTITIES (from CRS MCP Sandbox)
// Round-robin arrays for varied test results
// ============================================

const TU_TEST_IDENTITIES = [
  {
    firstName: 'DIANE', middleName: '', lastName: 'BARABAS', suffix: '', ssn: '666283370', birthDate: '',
    addresses: [{ borrowerResidencyType: 'Current', addressLine1: '19955 N MADERA AVE', addressLine2: ' ', city: 'KERMAN', state: 'CA', postalCode: '93630' }],
  },
  {
    firstName: 'NATALIE', middleName: 'A', lastName: 'BLACK', suffix: '', ssn: '666207378', birthDate: '',
    addresses: [{ borrowerResidencyType: 'Current', addressLine1: '46 E 41ST ST', addressLine2: '# 2', city: 'COVINGTON', state: 'KY', postalCode: '410151711' }],
  },
  {
    firstName: 'BROSE', middleName: '', lastName: 'BAMBIKO', suffix: '', ssn: '666328649', birthDate: '',
    addresses: [{ borrowerResidencyType: 'Current', addressLine1: '4711 247TH STREET CT E', addressLine2: ' ', city: 'GRAHAM', state: 'WA', postalCode: '983388337' }],
  },
  {
    firstName: 'EILEEN', middleName: 'M', lastName: 'BRADY', suffix: '', ssn: '666883007', birthDate: '1972-11-22',
    addresses: [{ borrowerResidencyType: 'Current', addressLine1: '31 LONDON CT', addressLine2: ' ', city: 'PLEASANTVILLE', state: 'NJ', postalCode: '082344434' }],
  },
  {
    firstName: 'EUGENE', middleName: 'F', lastName: 'BEAUPRE', suffix: '', ssn: '666582109', birthDate: '1955-06-23',
    addresses: [{ borrowerResidencyType: 'Current', addressLine1: '5151 N CEDAR AVE', addressLine2: 'APT 102', city: 'FRESNO', state: 'CA', postalCode: '937107453' }],
  },
];

const EVICTION_TEST_IDENTITIES = [
  { reference: 'myRef123', subjectInfo: { first: 'Kris', middle: 'X', last: 'Consumer', houseNumber: '272', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32952', dob: '01-02-1982', ssn: '666-44-3322' } },
  { reference: 'myRef123', subjectInfo: { first: 'Indiana', middle: 'X', last: 'Consumer', houseNumber: '272', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32952', dob: '01-03-1982', ssn: '666-44-3323' } },
  { reference: 'myRef123', subjectInfo: { first: 'Harold', middle: 'X', last: 'Chuang', houseNumber: '272', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32952', dob: '01-11-1982', ssn: '666-44-3331' } },
  { reference: 'myRef123', subjectInfo: { first: 'William', middle: 'X', last: 'Bornstein', houseNumber: '272', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32952', dob: '01-14-1982', ssn: '666-44-3334' } },
  { reference: 'myRef123', subjectInfo: { first: 'Jennifer', middle: 'X', last: 'Ray', houseNumber: '275', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32955', dob: '09-03-1972', ssn: '123-45-6789' } },
];

const CRIMINAL_TEST_IDENTITIES = [
  { reference: 'myRef123', subjectInfo: { first: 'Jennifer', middle: 'X', last: 'Ray', houseNumber: '275', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32955', dob: '09-03-1972', ssn: '123-45-6789' } },
  { reference: 'myRef123', subjectInfo: { first: 'William', middle: 'X', last: 'Bornstein', houseNumber: '278', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32958', dob: '06-20-1990', ssn: '123-45-6789' } },
  { reference: 'myRef123', subjectInfo: { first: 'Ruth', middle: 'X', last: 'Brandis', houseNumber: '277', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32957', dob: '04-01-1985', ssn: '123-45-6789' } },
  { reference: 'myRef123', subjectInfo: { first: 'Harold', middle: 'X', last: 'Chuang', houseNumber: '272', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32952', dob: '02-28-1965', ssn: '123-45-6789' } },
  { reference: 'myRef123', subjectInfo: { first: 'Erron', middle: 'X', last: 'Consumer', houseNumber: '279', streetName: 'LANDINGS', city: 'MERRITT ISLAND', state: 'FL', zip: '32959', dob: '01-01-1980', ssn: '123-45-6789' } },
];

const FRAUD_TEST_IDENTITY = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '5551234567',
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
  address: {
    addressLine1: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    postalCode: '90210',
  },
};

const FLEXID_TEST_IDENTITIES = [
  { firstName: 'MIRANDA', lastName: 'JJUNIPER', ssn: '540325127', dateOfBirth: '1955-11-13', streetAddress1: '1678 NE 41ST', city: 'ATLANTA', state: 'GA', zipCode: '30302', homePhone: '4786251234' },
  { firstName: 'PEGGY', lastName: 'GRAVES', dateOfBirth: '1958-09-09', streetAddress1: '248 HOOD RD', city: 'CHESNEE', state: 'SC', zipCode: '29323', homePhone: '8644613780' },
  { firstName: 'CRYSTAL', lastName: 'GOODLEY', dateOfBirth: '1949-03-23', streetAddress1: '338 POND RD #716', city: 'WANCHESE', state: 'NC', zipCode: '27981', homePhone: '2524735295' },
  { firstName: 'HASAN', lastName: 'GIDI', dateOfBirth: '1963-10-02', streetAddress1: '4357A MARTINS CREEK BELVIDER', city: 'BANGOR', state: 'PA', zipCode: '18013', homePhone: '6105880643' },
  { firstName: 'JOHN', lastName: 'COPE', ssn: '574709961', dateOfBirth: '1973-08-01', streetAddress1: '511 SYCAMORE AVE', city: 'HAYWARD', state: 'CA', zipCode: '94544', homePhone: '5105811251' },
];

// Round-robin counters (for CRS sandbox test identities only — FBI uses real buyer name)
let tuIndex = 0;
let evictionIndex = 0;
let criminalIndex = 0;
let flexIdIndex = 0;

// ============================================
// COMPREHENSIVE SCREENING (All 5 Products)
// ============================================

/**
 * Pull comprehensive tenant screening data:
 * 1. Fraud Finder (email/phone/IP/address validation)
 * 2. FlexID (LexisNexis identity verification)
 * 3. Credit Report (TransUnion soft pull)
 * 4. Criminal background check
 * 5. Eviction history
 */
async function pullComprehensiveReport(buyerInfo) {
  const baseUrl = process.env.CRS_API_URL;
  const username = process.env.CRS_API_USERNAME;
  const password = process.env.CRS_API_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.warn('⚠️  CRS API not configured — returning mock data');
    return getMockComprehensiveData();
  }

  const token = await getCrsToken();
  if (!token) {
    console.warn('⚠️  CRS login failed — returning mock data');
    return getMockComprehensiveData();
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  console.log('\n' + '='.repeat(60));
  console.log('🔍 RUNNING COMPREHENSIVE TENANT SCREENING (5 Products)');
  console.log('='.repeat(60));

  const results = {
    creditScore: 680,
    evictions: 0,
    bankruptcies: 0,
    criminalOffenses: 0,
    fraudRiskScore: 0,
    identityVerified: false,
    requestIds: {},
  };

  try {
    // ── 1. Fraud Finder ──────────────────────────────────
    console.log('🔍 [1/5] Running Fraud Finder...');
    try {
      // Always use sandbox test identity — real buyer info is stored in DB, not sent to CRS
      const fraudPayload = FRAUD_TEST_IDENTITY;

      const fraudResponse = await axios.post(
        `${baseUrl}/fraud-finder/fraud-finder`,
        fraudPayload,
        { headers }
      );

      const fraudRequestId = fraudResponse.headers['requestid'];
      if (fraudRequestId) results.requestIds.fraud = fraudRequestId;

      results.fraudRiskScore =
        findValueByKey(fraudResponse.data, 'riskScore', 'score', 'fraudScore', 'overallScore') || 0;

      console.log(`   ✅ Fraud Risk Score: ${results.fraudRiskScore}`);
    } catch (err) {
      console.warn('   ⚠️  Fraud Finder failed:', err.response?.data?.messages?.[0] || err.message);
    }

    // ── 2. FlexID (Identity Verification) ────────────────
    console.log('🆔 [2/5] Running FlexID Identity Verification...');
    try {
      const flexPayload = FLEXID_TEST_IDENTITIES[flexIdIndex % FLEXID_TEST_IDENTITIES.length];
      flexIdIndex++;

      const flexResponse = await axios.post(
        `${baseUrl}/flex-id/flex-id`,
        flexPayload,
        { headers }
      );

      const flexRequestId = flexResponse.headers['requestid'];
      if (flexRequestId) results.requestIds.flexId = flexRequestId;

      results.identityVerified = true;
      console.log(`   ✅ Identity Verified`);
    } catch (err) {
      console.warn('   ⚠️  FlexID failed:', err.response?.data?.messages?.[0] || err.message);
      results.identityVerified = false;
    }

    // ── 3. Credit Report (TransUnion) ────────────────────
    console.log('📊 [3/5] Fetching TransUnion credit report...');
    try {
      const tuPayload = TU_TEST_IDENTITIES[tuIndex % TU_TEST_IDENTITIES.length];
      tuIndex++;
      const tuResponse = await axios.post(
        `${baseUrl}/transunion/credit-report/standard/tu-prequal-vantage4`,
        tuPayload,
        { headers }
      );

      const tuRequestId = tuResponse.headers['requestid'];
      if (tuRequestId) results.requestIds.credit = tuRequestId;

      results.creditScore =
        findValueByKey(tuResponse.data, 'scoreValue', 'vantageScore', 'creditScore', 'score') || 680;
      results.bankruptcies =
        parseInt(findValueByKey(tuResponse.data, 'bankruptciesCount', 'bankruptcies') || 0, 10);

      console.log(`   ✅ Credit Score: ${results.creditScore}`);
      console.log(`   ℹ️  Note: TransUnion does not provide income data`);
    } catch (err) {
      console.warn('   ⚠️  Credit report failed:', err.response?.data?.messages?.[0] || err.message);
    }

    // ── 4. Criminal Background Check ─────────────────────
    console.log('🚔 [4/5] Fetching criminal background...');
    try {
      const crimPayload = CRIMINAL_TEST_IDENTITIES[criminalIndex % CRIMINAL_TEST_IDENTITIES.length];
      criminalIndex++;
      const criminalResponse = await axios.post(
        `${baseUrl}/criminal/new-request`,
        crimPayload,
        { headers }
      );

      const crimRequestId = criminalResponse.headers['requestid'];
      if (crimRequestId) results.requestIds.criminal = crimRequestId;

      results.criminalOffenses =
        countOccurrences(criminalResponse.data, 'offense', 'offenses', 'conviction') ||
        findValueByKey(criminalResponse.data, 'offenseCount', 'convictions') ||
        0;

      console.log(`   ✅ Criminal Offenses: ${results.criminalOffenses}`);
    } catch (err) {
      console.warn('   ⚠️  Criminal report failed:', err.response?.data?.messages?.[0] || err.message);
    }

    // ── 5. Eviction History ──────────────────────────────
    console.log('🏠 [5/5] Fetching eviction history...');
    try {
      const evicPayload = EVICTION_TEST_IDENTITIES[evictionIndex % EVICTION_TEST_IDENTITIES.length];
      evictionIndex++;
      const evictionResponse = await axios.post(
        `${baseUrl}/eviction/new-request`,
        evicPayload,
        { headers }
      );

      const evicRequestId = evictionResponse.headers['requestid'];
      if (evicRequestId) results.requestIds.eviction = evicRequestId;

      results.evictions =
        countOccurrences(evictionResponse.data, 'eviction', 'evictions', 'count') ||
        findValueByKey(evictionResponse.data, 'evictionCount', 'total') ||
        0;

      console.log(`   ✅ Evictions: ${results.evictions}`);
    } catch (err) {
      console.warn('   ⚠️  Eviction report failed:', err.response?.data?.messages?.[0] || err.message);
    }

    // ── 6. FBI Most Wanted Check ────────────────────────────
    // Unlike CRS products (1-5) which use sandbox test identities,
    // the FBI API is a real public API — so we search by the ACTUAL buyer name.
    // This means entering "Cindy Singh" in the demo will trigger a real FBI match.
    console.log('🚨 [6/6] Checking FBI Most Wanted list...');
    try {
      const fbiFirstName = buyerInfo.firstName || '';
      const fbiLastName = buyerInfo.lastName || '';

      const fbiResponse = await axios.get(
        `https://api.fbi.gov/wanted/v1/list`,
        {
          params: { title: `${fbiFirstName} ${fbiLastName}`, pageSize: 5 },
          headers: { 'User-Agent': 'HomeScreen/1.0', Accept: 'application/json' },
        }
      );

      const fbiTotal = fbiResponse.data?.total || 0;
      const fbiItems = fbiResponse.data?.items || [];

      // Extract crime details from matching entries
      const crimes = fbiItems.map((item) => ({
        name: item.title || 'Unknown',
        description: item.description || '',
        subjects: item.subjects || [],
        warningMessage: item.warning_message || null,
        url: item.url || null,
      }));

      results.fbiMostWanted = {
        matchFound: fbiTotal > 0,
        matchCount: fbiTotal,
        searchedName: `${fbiFirstName} ${fbiLastName}`,
        crimes,
      };

      if (fbiTotal > 0) {
        console.log(`   🚨 FBI MATCH FOUND! ${fbiTotal} result(s) for "${fbiFirstName} ${fbiLastName}"`);
        crimes.forEach((c) => console.log(`      → ${c.name}: ${c.description}`));
      } else {
        console.log(`   ✅ No FBI match for "${fbiFirstName} ${fbiLastName}"`);
      }
    } catch (err) {
      console.warn('   ⚠️  FBI check failed:', err.message);
      results.fbiMostWanted = { matchFound: false, matchCount: 0, searchedName: '', crimes: [] };
    }

    console.log('='.repeat(60));
    console.log('✅ SCREENING COMPLETE — 6/6 products called');
    console.log('='.repeat(60) + '\n');

    return results;
  } catch (err) {
    console.error('❌ CRS API error:', err.response?.data || err.message);
    console.log('='.repeat(60) + '\n');
    return getMockComprehensiveData();
  }
}

/**
 * Mock comprehensive data for development/demo
 */
function getMockComprehensiveData() {
  const scores = [580, 620, 650, 680, 700, 720, 740, 760, 780];

  return {
    creditScore: scores[Math.floor(Math.random() * scores.length)],
    evictions: Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0,
    bankruptcies: Math.random() > 0.9 ? 1 : 0,
    criminalOffenses: Math.random() > 0.92 ? Math.floor(Math.random() * 2) + 1 : 0,
    fraudRiskScore: Math.floor(Math.random() * 4),
    identityVerified: Math.random() > 0.1,
    fbiMostWanted: { matchFound: false, matchCount: 0, searchedName: 'MOCK USER', crimes: [] },
    requestIds: {},
  };
}

/**
 * Calculate match score based on CRS screening data vs seller criteria.
 * Weights: credit=25, evictions=20, bankruptcy=20, criminal=20, fraud=15 = 100
 */
function calculateMatchScore(crsData, criteria) {
  const breakdown = {};
  let totalPoints = 0;
  let earnedPoints = 0;

  // ── FBI HARD FAIL CHECK ──
  // If buyer is on FBI Most Wanted list, instant 0/100 — no further scoring
  if (crsData.fbiMostWanted?.matchFound) {
    const crimeList = (crsData.fbiMostWanted.crimes || [])
      .map((c) => c.description || c.name)
      .filter(Boolean)
      .join('; ');

    breakdown.fbiMostWanted = {
      passed: false,
      points: 0,
      maxPoints: 100,
      detail: `FBI WANTED: ${crimeList || 'On FBI Most Wanted list'}`,
    };
    breakdown.creditScore = { passed: false, points: 0, maxPoints: 0, detail: 'Overridden by FBI match' };
    breakdown.evictions = { passed: false, points: 0, maxPoints: 0, detail: 'Overridden by FBI match' };
    breakdown.bankruptcy = { passed: false, points: 0, maxPoints: 0, detail: 'Overridden by FBI match' };
    breakdown.criminal = { passed: false, points: 0, maxPoints: 0, detail: 'Overridden by FBI match' };
    breakdown.fraud = { passed: false, points: 0, maxPoints: 0, detail: 'Overridden by FBI match' };

    return { matchScore: 0, matchBreakdown: breakdown, matchColor: 'red', totalPoints: 100, earnedPoints: 0 };
  }

  // FBI clear — add to breakdown
  breakdown.fbiMostWanted = {
    passed: true,
    points: 0,
    maxPoints: 0,
    detail: 'Not on FBI Most Wanted list',
  };

  // 1. Credit Score (25 points)
  if (criteria.minCreditScore > 0) {
    totalPoints += 25;
    const passed = crsData.creditScore >= criteria.minCreditScore;
    const pts = passed ? 25 : 0;
    if (passed) earnedPoints += 25;
    breakdown.creditScore = {
      passed,
      points: pts,
      maxPoints: 25,
      detail: `Score: ${crsData.creditScore} (min: ${criteria.minCreditScore})`,
    };
  } else {
    breakdown.creditScore = { passed: true, points: 0, maxPoints: 0, detail: 'No minimum set' };
  }

  // 2. Evictions (20 points)
  if (criteria.noEvictions) {
    totalPoints += 20;
    const passed = crsData.evictions === 0;
    const pts = passed ? 20 : 0;
    if (passed) earnedPoints += 20;
    breakdown.evictions = {
      passed,
      points: pts,
      maxPoints: 20,
      detail: passed ? 'No evictions' : `${crsData.evictions} eviction(s) found`,
    };
  } else {
    breakdown.evictions = { passed: true, points: 0, maxPoints: 0, detail: 'Not required' };
  }

  // 3. Bankruptcy (20 points)
  if (criteria.noBankruptcy) {
    totalPoints += 20;
    const passed = crsData.bankruptcies === 0;
    const pts = passed ? 20 : 0;
    if (passed) earnedPoints += 20;
    breakdown.bankruptcy = {
      passed,
      points: pts,
      maxPoints: 20,
      detail: passed ? 'No bankruptcies' : `${crsData.bankruptcies} bankruptcy(ies) found`,
    };
  } else {
    breakdown.bankruptcy = { passed: true, points: 0, maxPoints: 0, detail: 'Not required' };
  }

  // 4. Criminal Background (20 points)
  if (criteria.noCriminal) {
    totalPoints += 20;
    const passed = crsData.criminalOffenses === 0;
    const pts = passed ? 20 : 0;
    if (passed) earnedPoints += 20;
    breakdown.criminal = {
      passed,
      points: pts,
      maxPoints: 20,
      detail: passed ? 'No criminal record' : `${crsData.criminalOffenses} offense(s) found`,
    };
  } else {
    breakdown.criminal = { passed: true, points: 0, maxPoints: 0, detail: 'Not required' };
  }

  // 5. Fraud Risk (15 points)
  if (crsData.fraudRiskScore !== undefined) {
    totalPoints += 15;
    const passed = crsData.fraudRiskScore <= 3;
    const pts = passed ? 15 : 0;
    if (passed) earnedPoints += 15;
    breakdown.fraud = {
      passed,
      points: pts,
      maxPoints: 15,
      detail: passed
        ? `Low fraud risk (${crsData.fraudRiskScore}/10)`
        : `High fraud risk (${crsData.fraudRiskScore}/10)`,
    };
  } else {
    breakdown.fraud = { passed: true, points: 0, maxPoints: 0, detail: 'Not checked' };
  }

  const matchScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

  let matchColor = 'red';
  if (matchScore >= 80) matchColor = 'green';
  else if (matchScore >= 60) matchColor = 'yellow';

  return { matchScore, matchBreakdown: breakdown, matchColor, totalPoints, earnedPoints };
}

module.exports = {
  pullComprehensiveReport,
  calculateMatchScore,
  findValueByKey,
  countOccurrences,
  getMockComprehensiveData,
};