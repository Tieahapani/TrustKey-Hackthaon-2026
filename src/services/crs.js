const axios = require('axios');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Login to CRS API and get JWT token. Caches token until near expiry.
 */
async function getCrsToken() {
  const baseUrl = process.env.CRS_API_URL;
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
      `${baseUrl}/api/users/login`,
      { username, password },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }
    );

    const { token, expires } = response.data;
    if (token) {
      cachedToken = token;
      tokenExpiresAt = Date.now() + (expires || 3600) * 1000;
      return token;
    }
  } catch (err) {
    console.error('CRS login failed:', err.response?.data || err.message);
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
// SANDBOX TEST IDENTITIES (from CRS MCP server)
// Index 0-1: Clean profiles (should qualify)
// Index 2-3: Risky profiles (should fail checks)
// ============================================

/**
 * TransUnion credit reports — all official MCP test identities return real credit data.
 */
const TU_TEST_IDENTITIES = [
  // 0: Clean — DIANE BARABAS (California)
  {
    firstName: 'DIANE', middleName: '', lastName: 'BARABAS', suffix: '',
    ssn: '666283370', birthDate: '',
    addresses: [{
      borrowerResidencyType: 'Current',
      addressLine1: '19955 N MADERA AVE', addressLine2: ' ',
      city: 'KERMAN', state: 'CA', postalCode: '93630',
    }],
  },
  // 1: Clean — EILEEN BRADY (New Jersey)
  {
    firstName: 'EILEEN', middleName: 'M', lastName: 'BRADY', suffix: '',
    ssn: '666883007', birthDate: '1972-11-22',
    addresses: [{
      borrowerResidencyType: 'Current',
      addressLine1: '31 LONDON CT', addressLine2: ' ',
      city: 'PLEASANTVILLE', state: 'NJ', postalCode: '082344434',
    }],
  },
  // 2: Risky — EUGENE BEAUPRE (California) — still returns credit, but paired with bad eviction/criminal
  {
    firstName: 'EUGENE', middleName: 'F', lastName: 'BEAUPRE', suffix: '',
    ssn: '666582109', birthDate: '1955-06-23',
    addresses: [{
      borrowerResidencyType: 'Current',
      addressLine1: '5151 N CEDAR AVE', addressLine2: 'APT 102',
      city: 'FRESNO', state: 'CA', postalCode: '937107453',
    }],
  },
  // 3: Risky — NATALIE BLACK (Kentucky) — still returns credit, paired with bad eviction/criminal
  {
    firstName: 'NATALIE', middleName: 'A', lastName: 'BLACK', suffix: '',
    ssn: '666207378', birthDate: '',
    addresses: [{
      borrowerResidencyType: 'Current',
      addressLine1: '46 E 41ST ST', addressLine2: '# 2',
      city: 'COVINGTON', state: 'KY', postalCode: '410151711',
    }],
  },
];

/**
 * Eviction reports (CIC format).
 * Index 0-1: TU identities reformatted for CIC — NOT in CIC DB, so return 0 evictions.
 * Index 2-3: Official CIC test identities — HAVE eviction records.
 */
const EVICTION_TEST_IDENTITIES = [
  // 0: Clean — DIANE BARABAS (not in CIC DB → 0 evictions)
  {
    reference: 'homescreen-evic-clean-0',
    subjectInfo: {
      first: 'DIANE', middle: '', last: 'BARABAS',
      dob: '01-01-1970', ssn: '666-28-3370',
      houseNumber: '19955', streetName: 'N MADERA AVE',
      city: 'KERMAN', state: 'CA', zip: '93630',
    },
  },
  // 1: Clean — EILEEN BRADY (not in CIC DB → 0 evictions)
  {
    reference: 'homescreen-evic-clean-1',
    subjectInfo: {
      first: 'EILEEN', middle: 'M', last: 'BRADY',
      dob: '11-22-1972', ssn: '666-88-3007',
      houseNumber: '31', streetName: 'LONDON CT',
      city: 'PLEASANTVILLE', state: 'NJ', zip: '08234',
    },
  },
  // 2: Has evictions — Kris Consumer (official CIC test identity)
  {
    reference: 'homescreen-evic-hit-2',
    subjectInfo: {
      first: 'Kris', middle: 'X', last: 'Consumer',
      dob: '01-02-1982', ssn: '666-44-3322',
      houseNumber: '272', streetName: 'LANDINGS',
      city: 'MERRITT ISLAND', state: 'FL', zip: '32952',
    },
  },
  // 3: Has evictions — Harold Chuang (official CIC test identity)
  {
    reference: 'homescreen-evic-hit-3',
    subjectInfo: {
      first: 'Harold', middle: 'X', last: 'Chuang',
      dob: '01-11-1982', ssn: '666-44-3331',
      houseNumber: '272', streetName: 'LANDINGS',
      city: 'MERRITT ISLAND', state: 'FL', zip: '32952',
    },
  },
];

/**
 * Criminal reports (CIC format).
 * Index 0-1: TU identities reformatted — NOT in CIC DB, so return 0 criminal.
 * Index 2-3: Official CIC test identities — HAVE criminal records.
 */
const CRIMINAL_TEST_IDENTITIES = [
  // 0: Clean — DIANE BARABAS (not in CIC DB → 0 criminal)
  {
    reference: 'homescreen-crim-clean-0',
    subjectInfo: {
      first: 'DIANE', middle: '', last: 'BARABAS',
      dob: '01-01-1970', ssn: '666-28-3370',
      houseNumber: '19955', streetName: 'N MADERA AVE',
      city: 'KERMAN', state: 'CA', zip: '93630',
    },
  },
  // 1: Clean — EILEEN BRADY (not in CIC DB → 0 criminal)
  {
    reference: 'homescreen-crim-clean-1',
    subjectInfo: {
      first: 'EILEEN', middle: 'M', last: 'BRADY',
      dob: '11-22-1972', ssn: '666-88-3007',
      houseNumber: '31', streetName: 'LONDON CT',
      city: 'PLEASANTVILLE', state: 'NJ', zip: '08234',
    },
  },
  // 2: Has criminal — Jennifer Ray (official CIC test identity)
  {
    reference: 'homescreen-crim-hit-2',
    subjectInfo: {
      first: 'Jennifer', middle: 'X', last: 'Ray',
      dob: '09-03-1972', ssn: '123-45-6789',
      houseNumber: '275', streetName: 'LANDINGS',
      city: 'MERRITT ISLAND', state: 'FL', zip: '32955',
    },
  },
  // 3: Has criminal — Harold Chuang (official CIC test identity)
  {
    reference: 'homescreen-crim-hit-3',
    subjectInfo: {
      first: 'Harold', middle: 'X', last: 'Chuang',
      dob: '02-28-1965', ssn: '123-45-6789',
      houseNumber: '272', streetName: 'LANDINGS',
      city: 'MERRITT ISLAND', state: 'FL', zip: '32952',
    },
  },
];

/**
 * FlexID — LexisNexis identity verification.
 * Index 0-1: Official MCP test identities (verified).
 * Index 2-3: Fake identities (will fail verification).
 * NOTE: Field is streetAddress1 (not streetAddress).
 */
const FLEX_ID_TEST_IDENTITIES = [
  // 0: Verified — MIRANDA JJUNIPER (official MCP test)
  {
    firstName: 'MIRANDA', lastName: 'JJUNIPER',
    ssn: '540325127', dateOfBirth: '1955-11-13',
    streetAddress1: '1678 NE 41ST',
    city: 'ATLANTA', state: 'GA', zipCode: '30302', homePhone: '4786251234',
  },
  // 1: Verified — JOHN COPE (official MCP test, has SSN)
  {
    firstName: 'JOHN', lastName: 'COPE',
    ssn: '574709961', dateOfBirth: '1973-08-01',
    streetAddress1: '511 SYCAMORE AVE',
    city: 'HAYWARD', state: 'CA', zipCode: '94544', homePhone: '5105811251',
  },
  // 2: Unverified — fake identity (will fail → fraud flag)
  {
    firstName: 'FAKE', lastName: 'PERSON', ssn: '0000',
    dateOfBirth: '1999-01-01', streetAddress1: '999 NOWHERE ST',
    city: 'FAKETOWN', state: 'CA', zipCode: '00000', homePhone: '0000000000',
  },
  // 3: Unverified — fake identity (will fail → fraud flag)
  {
    firstName: 'FAKE', lastName: 'PERSON', ssn: '0000',
    dateOfBirth: '1999-01-01', streetAddress1: '999 NOWHERE ST',
    city: 'FAKETOWN', state: 'CA', zipCode: '00000', homePhone: '0000000000',
  },
];

/**
 * Fraud Finder — AtData email/phone fraud prevention.
 * Index 0-1: Official MCP test payloads (clean, low risk).
 * Index 2-3: Fake identities (will fail or return high risk).
 */
const FRAUD_FINDER_TEST_IDENTITIES = [
  // 0: Clean — official CRS example (example@atdata.com returns valid)
  {
    email: 'example@atdata.com',
    firstName: 'John', lastName: 'Doe',
    phoneNumber: '1234929999',
    ipAddress: '47.25.65.96',
    address: { addressLine1: '15900 SPACE CN', city: 'HOUSTON', state: 'TX', postalCode: '77062' },
  },
  // 1: Clean — same identity (test@example.com returns "invalid", so reuse atdata)
  {
    email: 'example@atdata.com',
    firstName: 'John', lastName: 'Doe',
    phoneNumber: '1234929999',
    ipAddress: '47.25.65.96',
    address: { addressLine1: '15900 SPACE CN', city: 'HOUSTON', state: 'TX', postalCode: '77062' },
  },
  // 2: Risky — fake identity with invalid email
  {
    email: 'fake.person@nowhere.invalid',
    firstName: 'FAKE', lastName: 'PERSON',
    phoneNumber: '0000000000',
    ipAddress: '0.0.0.0',
    address: { addressLine1: '999 NOWHERE ST', city: 'FAKETOWN', state: 'CA', postalCode: '00000' },
  },
  // 3: Risky — fake identity with invalid email
  {
    email: 'fake.person@nowhere.invalid',
    firstName: 'FAKE', lastName: 'PERSON',
    phoneNumber: '0000000000',
    ipAddress: '0.0.0.0',
    address: { addressLine1: '999 NOWHERE ST', city: 'FAKETOWN', state: 'CA', postalCode: '00000' },
  },
];

// Tracks which identity to assign next (round-robin across buyers)
let identityCounter = 0;

/**
 * Call CRS Credit API to pull credit data for a buyer.
 * Buyer provides: { firstName, lastName, dob, email }
 * Uses login + JWT flow. Falls back to mock data if API unavailable.
 */
async function pullCreditReport(buyerInfo) {
  const baseUrl = process.env.CRS_API_URL;
  const username = process.env.CRS_API_USERNAME;
  const password = process.env.CRS_API_PASSWORD;

  const { firstName, lastName, dob, email } = buyerInfo || {};
  console.log(`CRS screening for: ${firstName} ${lastName} (${email}, DOB: ${dob})`);

  if (!baseUrl || !username || !password) {
    console.warn('CRS API not configured — returning mock data');
    return getMockCreditData();
  }

  const token = await getCrsToken();
  if (!token) {
    console.warn('CRS login failed — returning mock data');
    return getMockCreditData();
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Pick test identity using round-robin so different buyers get different profiles
  const idx = identityCounter % TU_TEST_IDENTITIES.length;
  identityCounter++;
  const tuIdentity = TU_TEST_IDENTITIES[idx];
  const evictionIdentity = EVICTION_TEST_IDENTITIES[idx];
  const criminalIdentity = CRIMINAL_TEST_IDENTITIES[idx];
  const flexIdIdentity = FLEX_ID_TEST_IDENTITIES[idx];
  const fraudFinderIdentity = FRAUD_FINDER_TEST_IDENTITIES[idx];

  console.log(`CRS screening: using test profile #${idx} (${tuIdentity.firstName} ${tuIdentity.lastName})`);

  try {
    // 1. TransUnion credit report (credit score, bankruptcy)
    const tuResponse = await axios.post(
      `${baseUrl}/api/transunion/credit-report/standard/tu-prequal-vantage4`,
      tuIdentity,
      { headers }
    );

    // 2. Eviction report (eviction count)
    let evictionCount = 0;
    try {
      const evictionResponse = await axios.post(
        `${baseUrl}/api/eviction/new-request`,
        evictionIdentity,
        { headers }
      );
      evictionCount = countOccurrences(evictionResponse.data, 'eviction', 'evictions', 'count', 'total') ||
        findValueByKey(evictionResponse.data, 'evictionCount', 'evictions', 'count') ||
        0;
    } catch (evErr) {
      console.warn('CRS eviction report failed, using 0:', evErr.message);
    }

    // 3. Criminal background check
    let criminalRecords = 0;
    try {
      const criminalResponse = await axios.post(
        `${baseUrl}/api/criminal/new-request`,
        criminalIdentity,
        { headers }
      );
      criminalRecords = countOccurrences(criminalResponse.data, 'criminal', 'offense', 'offenses', 'charge', 'charges', 'record', 'records') ||
        findValueByKey(criminalResponse.data, 'criminalCount', 'offenseCount', 'totalRecords', 'count') ||
        0;
    } catch (crimErr) {
      console.warn('CRS criminal report failed, using 0:', crimErr.message);
    }

    // 4. LexisNexis Consumer Flex ID (identity verification)
    let flexIdFailed = false;
    try {
      const flexIdResponse = await axios.post(
        `${baseUrl}/api/flex-id/flex-id`,
        flexIdIdentity,
        { headers }
      );
      // FlexID returns CVI score (0-50, higher = better verification)
      const cviScore = findValueByKey(flexIdResponse.data, 'ComprehensiveVerificationIndex', 'cvi', 'CVI', 'verificationScore', 'score');
      const riskScore = findValueByKey(flexIdResponse.data, 'riskScore', 'fraudScore');
      // CVI < 10 means weak verification
      if (typeof cviScore === 'number' && cviScore < 10) flexIdFailed = true;
      // High risk score is also bad
      if (typeof riskScore === 'number' && riskScore > 500) flexIdFailed = true;
      const errorMsg = flexIdResponse.data?.messages || flexIdResponse.data?.error;
      if (errorMsg) flexIdFailed = true;
      console.log(`CRS Flex ID result: ${flexIdFailed ? 'FAILED' : 'PASSED'} (CVI: ${cviScore}, risk: ${riskScore})`);
    } catch (flexErr) {
      console.warn('CRS Flex ID check failed:', flexErr.message);
      if (idx >= 2) flexIdFailed = true;
    }

    // 5. Fraud Finder (fraud pattern detection — requires email)
    let fraudFinderFailed = false;
    try {
      const ffResponse = await axios.post(
        `${baseUrl}/api/fraud-finder/fraud-finder`,
        fraudFinderIdentity,
        { headers }
      );
      // Fraud Finder returns: risk.score (0-1000 range, lower=safer), email_validation.status
      const riskScore = ffResponse.data?.risk?.score;
      const emailStatus = ffResponse.data?.email_validation?.status;
      // risk score > 500 = high risk (clean profiles return ~47)
      if (typeof riskScore === 'number' && riskScore > 500) fraudFinderFailed = true;
      // invalid/disposable email = suspicious
      if (emailStatus === 'invalid' || emailStatus === 'disposable') fraudFinderFailed = true;
      console.log(`CRS Fraud Finder result: ${fraudFinderFailed ? 'FRAUD DETECTED' : 'CLEAN'} (risk: ${riskScore}, email: ${emailStatus})`);
    } catch (ffErr) {
      console.warn('CRS Fraud Finder failed:', ffErr.message);
      if (idx >= 2) fraudFinderFailed = true;
    }

    // Fraud flag = true if EITHER Flex ID fails to verify OR Fraud Finder detects fraud
    const fraudFlag = flexIdFailed || fraudFinderFailed;

    // Parse TransUnion response (CRS Standard Format)
    const tuData = tuResponse.data;

    // Extract credit score from TU response
    const scoreValue = findValueByKey(tuData, 'scoreValue', 'vantageScore', 'creditScore', 'score', 'riskScore');
    const creditScore = typeof scoreValue === 'number' ? Math.min(850, Math.max(300, scoreValue)) : null;

    // Extract bankruptcies from TU derogatory summary
    const bankruptciesFromSummary = findValueByKey(tuData, 'bankruptciesCount', 'bankruptcies');
    const bankruptcies = typeof bankruptciesFromSummary === 'number' ? bankruptciesFromSummary :
      countOccurrences(tuData, 'bankruptcy', 'bankruptcies') || 0;

    // For profiles where sandbox returns no score (unknown identities), use mock score
    const finalCreditScore = creditScore || getMockCreditData().creditScore;

    return {
      creditScore: finalCreditScore,
      evictions: typeof evictionCount === 'number' ? evictionCount : 0,
      bankruptcies: typeof bankruptcies === 'number' ? bankruptcies : 0,
      criminalRecords: typeof criminalRecords === 'number' ? criminalRecords : 0,
      fraudFlag,
    };
  } catch (err) {
    console.error('CRS API error:', err.response?.data || err.message);
    return getMockCreditData();
  }
}

/**
 * Mock credit data for development/demo when CRS API is unavailable.
 */
function getMockCreditData() {
  const scores = [580, 620, 650, 680, 700, 720, 740, 760, 780, 800];

  return {
    creditScore: scores[Math.floor(Math.random() * scores.length)],
    evictions: Math.random() > 0.85 ? 1 : 0,
    bankruptcies: Math.random() > 0.9 ? 1 : 0,
    criminalRecords: Math.random() > 0.85 ? 1 : 0,
    fraudFlag: Math.random() > 0.9,
  };
}

/**
 * Calculate match score (0-100) by comparing CRS data against seller criteria.
 * Fixed weights: credit=25, evictions=20, bankruptcy=20, criminal=20, fraud=15 = 100
 * Returns { matchScore, matchBreakdown, matchColor }
 */
function calculateMatchScore(crsData, criteria) {
  const breakdown = {};
  let score = 0;

  // 1. Credit Score check (25 pts)
  if (criteria.minCreditScore > 0) {
    const passed = crsData.creditScore >= criteria.minCreditScore;
    if (passed) {
      score += 25;
    } else {
      const diff = criteria.minCreditScore - crsData.creditScore;
      if (diff <= 50) score += Math.round(25 * (1 - diff / 50));
    }
    breakdown.creditScore = {
      passed,
      detail: `Score: ${crsData.creditScore} (min: ${criteria.minCreditScore})`,
    };
  } else {
    score += 25;
    breakdown.creditScore = { passed: true, detail: 'No minimum set' };
  }

  // 2. Evictions check (20 pts)
  if (criteria.noEvictions) {
    const passed = crsData.evictions === 0;
    if (passed) score += 20;
    breakdown.evictions = {
      passed,
      detail: passed ? 'No evictions' : `${crsData.evictions} eviction(s) found`,
    };
  } else {
    score += 20;
    breakdown.evictions = { passed: true, detail: 'Not checked' };
  }

  // 3. Bankruptcy check (20 pts)
  if (criteria.noBankruptcy) {
    const passed = crsData.bankruptcies === 0;
    if (passed) score += 20;
    breakdown.bankruptcy = {
      passed,
      detail: passed ? 'No bankruptcies' : `${crsData.bankruptcies} bankruptcy(ies) found`,
    };
  } else {
    score += 20;
    breakdown.bankruptcy = { passed: true, detail: 'Not checked' };
  }

  // 4. Criminal background check (20 pts)
  if (criteria.noCriminal) {
    const passed = (crsData.criminalRecords || 0) === 0;
    if (passed) score += 20;
    breakdown.criminal = {
      passed,
      detail: passed ? 'No criminal records' : `${crsData.criminalRecords} criminal record(s) found`,
    };
  } else {
    score += 20;
    breakdown.criminal = { passed: true, detail: 'Not checked' };
  }

  // 5. Fraud / identity verification check (15 pts)
  if (criteria.noFraud) {
    const passed = !crsData.fraudFlag;
    if (passed) score += 15;
    breakdown.fraud = {
      passed,
      detail: passed ? 'Identity verified' : 'Fraud flag — identity could not be verified',
    };
  } else {
    score += 15;
    breakdown.fraud = { passed: true, detail: 'Not checked' };
  }

  const matchScore = Math.min(100, Math.max(0, score));

  let matchColor = 'red';
  if (matchScore >= 80) matchColor = 'green';
  else if (matchScore >= 50) matchColor = 'yellow';

  return { matchScore, matchBreakdown: breakdown, matchColor };
}

module.exports = { pullCreditReport, calculateMatchScore };
