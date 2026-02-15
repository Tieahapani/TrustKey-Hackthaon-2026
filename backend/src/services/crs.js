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
      // CRS tokens typically expire in 3600 seconds
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

/**
 * Sandbox test identities for TransUnion credit reports.
 * Index 0-1: Good credit profiles (should qualify)
 * Index 2-3: Poor credit profiles (should not qualify)
 */
const TU_TEST_IDENTITIES = [
  // Good: score ~735, no bankruptcies, clean history
  {
    firstName: 'BARBARA',
    middleName: 'M',
    lastName: 'DOTY',
    suffix: '',
    birthDate: '1966-01-04',
    ssn: '000000000',
    addresses: [
      {
        borrowerResidencyType: 'Current',
        addressLine1: '1100 LYNHURST LN',
        addressLine2: '',
        city: 'DENTON',
        state: 'TX',
        postalCode: '762058006',
      },
    ],
  },
  // Good: same identity, consistent good score for demo
  {
    firstName: 'BARBARA',
    middleName: 'M',
    lastName: 'DOTY',
    suffix: '',
    birthDate: '1966-01-04',
    ssn: '000000000',
    addresses: [
      {
        borrowerResidencyType: 'Current',
        addressLine1: '1100 LYNHURST LN',
        addressLine2: '',
        city: 'DENTON',
        state: 'TX',
        postalCode: '762058006',
      },
    ],
  },
  // Poor: low score profile for demo rejection
  {
    firstName: 'JONATHAN',
    middleName: 'A',
    lastName: 'CASEY',
    suffix: '',
    birthDate: '1980-07-15',
    ssn: '000000001',
    addresses: [
      {
        borrowerResidencyType: 'Current',
        addressLine1: '456 OAK AVE',
        addressLine2: '',
        city: 'DALLAS',
        state: 'TX',
        postalCode: '75201',
      },
    ],
  },
  // Poor: another low score profile
  {
    firstName: 'MARIA',
    middleName: 'L',
    lastName: 'TORRES',
    suffix: '',
    birthDate: '1975-03-22',
    ssn: '000000002',
    addresses: [
      {
        borrowerResidencyType: 'Current',
        addressLine1: '789 PINE ST',
        addressLine2: '',
        city: 'HOUSTON',
        state: 'TX',
        postalCode: '77001',
      },
    ],
  },
];

/**
 * Sandbox test identities for Eviction reports.
 * Index 0-1: Clean (no evictions)
 * Index 2-3: Has eviction records
 */
const EVICTION_TEST_IDENTITIES = [
  // Clean: no eviction records
  {
    reference: 'homescreen-clean-1',
    subjectInfo: {
      last: 'Smith',
      first: 'John',
      middle: '',
      dob: '01-01-1990',
      ssn: '000-00-0000',
      houseNumber: '100',
      streetName: 'Main',
      city: 'Anytown',
      state: 'CA',
      zip: '90210',
    },
  },
  // Clean: no eviction records
  {
    reference: 'homescreen-clean-2',
    subjectInfo: {
      last: 'Johnson',
      first: 'Sarah',
      middle: '',
      dob: '05-15-1985',
      ssn: '000-00-0001',
      houseNumber: '200',
      streetName: 'Elm',
      city: 'Springfield',
      state: 'CA',
      zip: '90211',
    },
  },
  // Has evictions: 3 records
  {
    reference: 'homescreen-evict-1',
    subjectInfo: {
      last: 'Chuang',
      first: 'Harold',
      middle: '',
      dob: '01-01-1982',
      ssn: '666-44-3321',
      houseNumber: '1803',
      streetName: 'Norma',
      city: 'Cottonwood',
      state: 'CA',
      zip: '91502',
    },
  },
  // Has evictions: same test subject for consistent results
  {
    reference: 'homescreen-evict-2',
    subjectInfo: {
      last: 'Chuang',
      first: 'Harold',
      middle: '',
      dob: '01-01-1982',
      ssn: '666-44-3321',
      houseNumber: '1803',
      streetName: 'Norma',
      city: 'Cottonwood',
      state: 'CA',
      zip: '91502',
    },
  },
];

/**
 * Sandbox test identities for Criminal reports.
 * Index 0-1: Clean (no criminal records — fake names not in CRS sandbox)
 * Index 2-3: Has criminal records (Jonathan Consumer — CRS sandbox test case)
 */
const CRIMINAL_TEST_IDENTITIES = [
  {
    reference: 'homescreen-crim-clean-1',
    subjectInfo: {
      last: 'Smith', first: 'John', middle: '',
      dob: '01-01-1990', ssn: '000-00-0000',
      houseNumber: '100', streetName: 'Main',
      city: 'Anytown', state: 'CA', zip: '90210',
    },
  },
  {
    reference: 'homescreen-crim-clean-2',
    subjectInfo: {
      last: 'Johnson', first: 'Sarah', middle: '',
      dob: '05-15-1985', ssn: '000-00-0001',
      houseNumber: '200', streetName: 'Elm',
      city: 'Springfield', state: 'CA', zip: '90211',
    },
  },
  {
    reference: 'homescreen-crim-hit-1',
    subjectInfo: {
      last: 'Consumer', first: 'Jonathan', middle: '',
      dob: '01-01-1982', ssn: '666-44-3321',
      houseNumber: '1803', streetName: 'Norma',
      city: 'Cottonwood', state: 'CA', zip: '91502',
    },
  },
  {
    reference: 'homescreen-crim-hit-2',
    subjectInfo: {
      last: 'Consumer', first: 'Jonathan', middle: '',
      dob: '01-01-1982', ssn: '666-44-3321',
      houseNumber: '1803', streetName: 'Norma',
      city: 'Cottonwood', state: 'CA', zip: '91502',
    },
  },
];

/**
 * Sandbox test identities for LexisNexis Consumer Flex ID (identity verification).
 * Index 0-1: Verified identity (NATALIE KORZEC — CRS sandbox test case)
 * Index 2-3: Unverified / risky identity (fake names not in CRS sandbox)
 */
const FLEX_ID_TEST_IDENTITIES = [
  {
    firstName: 'NATALIE', lastName: 'KORZEC', ssn: '7537',
    dateOfBirth: '1940-12-23', streetAddress: '801 E OGDEN 1011',
    city: 'VAUGHN', state: 'WA', zipCode: '98394', homePhone: '5031234567',
  },
  {
    firstName: 'NATALIE', lastName: 'KORZEC', ssn: '7537',
    dateOfBirth: '1940-12-23', streetAddress: '801 E OGDEN 1011',
    city: 'VAUGHN', state: 'WA', zipCode: '98394', homePhone: '5031234567',
  },
  {
    firstName: 'FAKE', lastName: 'PERSON', ssn: '0000',
    dateOfBirth: '1999-01-01', streetAddress: '999 NOWHERE ST',
    city: 'FAKETOWN', state: 'CA', zipCode: '00000', homePhone: '0000000000',
  },
  {
    firstName: 'FAKE', lastName: 'PERSON', ssn: '0000',
    dateOfBirth: '1999-01-01', streetAddress: '999 NOWHERE ST',
    city: 'FAKETOWN', state: 'CA', zipCode: '00000', homePhone: '0000000000',
  },
];

/**
 * Sandbox test identities for Fraud Finder (fraud pattern detection).
 * Uses different body format than Flex ID: { firstName, lastName, phoneNumber, email, ipAddress, address: {...} }
 * Index 0-1: Clean identity (from Postman collection test case)
 * Index 2-3: Risky / fake identity
 */
const FRAUD_FINDER_TEST_IDENTITIES = [
  {
    firstName: 'John', lastName: 'Doe',
    phoneNumber: '1234929999',
    email: 'example@atdata.com',
    ipAddress: '47.25.65.96',
    address: { addressLine1: '15900 SPACE CN', city: 'HOUSTON', state: 'TX', postalCode: '77062' },
  },
  {
    firstName: 'John', lastName: 'Doe',
    phoneNumber: '1234929999',
    email: 'example@atdata.com',
    ipAddress: '47.25.65.96',
    address: { addressLine1: '15900 SPACE CN', city: 'HOUSTON', state: 'TX', postalCode: '77062' },
  },
  {
    firstName: 'FAKE', lastName: 'PERSON',
    phoneNumber: '0000000000',
    email: 'fake.person@nowhere.invalid',
    ipAddress: '0.0.0.0',
    address: { addressLine1: '999 NOWHERE ST', city: 'FAKETOWN', state: 'CA', postalCode: '00000' },
  },
  {
    firstName: 'FAKE', lastName: 'PERSON',
    phoneNumber: '0000000000',
    email: 'fake.person@nowhere.invalid',
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
      const riskScore = findValueByKey(flexIdResponse.data, 'riskScore', 'score', 'fraudScore', 'verificationScore');
      const verified = findValueByKey(flexIdResponse.data, 'verified', 'identityVerified', 'valid');
      if (riskScore !== undefined && riskScore > 500) flexIdFailed = true;
      if (verified === false || verified === 0) flexIdFailed = true;
      const errorMsg = flexIdResponse.data?.messages || flexIdResponse.data?.error;
      if (errorMsg) flexIdFailed = true;
      console.log(`CRS Flex ID result: ${flexIdFailed ? 'FAILED' : 'PASSED'} (risk: ${riskScore}, verified: ${verified})`);
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
      // Fraud Finder returns: risk.score (0-1000, lower=safer), email_validation.status
      const riskScore = ffResponse.data?.risk?.score;
      const emailStatus = ffResponse.data?.email_validation?.status;
      // risk score > 500 = high risk
      if (typeof riskScore === 'number' && riskScore > 500) fraudFinderFailed = true;
      // invalid email = suspicious
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
