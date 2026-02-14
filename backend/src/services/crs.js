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
 * Sandbox test identity for TransUnion (from Postman collection).
 */
const TU_TEST_IDENTITY = {
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
};

/**
 * Sandbox test identity for Eviction report (from Postman collection).
 */
const EVICTION_TEST_IDENTITY = {
  reference: 'homescreen-ref',
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
};

/**
 * Call CRS Credit API to pull credit data for a buyer.
 * Uses login + JWT flow. Falls back to mock data if API unavailable.
 */
async function pullCreditReport(buyerInfo) {
  const baseUrl = process.env.CRS_API_URL;
  const username = process.env.CRS_API_USERNAME;
  const password = process.env.CRS_API_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.warn('CRS API not configured — returning mock data');
    return getMockCreditData(buyerInfo);
  }

  const token = await getCrsToken();
  if (!token) {
    console.warn('CRS login failed — returning mock data');
    return getMockCreditData(buyerInfo);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    // 1. TransUnion credit report (credit score, income, bankruptcy)
    const tuResponse = await axios.post(
      `${baseUrl}/api/transunion/credit-report/standard/tu-prequal-vantage4`,
      TU_TEST_IDENTITY,
      { headers }
    );

    // 2. Eviction report (eviction count)
    let evictionCount = 0;
    try {
      const evictionResponse = await axios.post(
        `${baseUrl}/api/eviction/new-request`,
        EVICTION_TEST_IDENTITY,
        { headers }
      );
      evictionCount = countOccurrences(evictionResponse.data, 'eviction', 'evictions', 'count', 'total') ||
        findValueByKey(evictionResponse.data, 'evictionCount', 'evictions', 'count') ||
        0;
    } catch (evErr) {
      console.warn('CRS eviction report failed, using 0:', evErr.message);
    }

    // Parse TransUnion response (CRS Standard Format)
    const tuData = tuResponse.data;
    const creditScore =
      findValueByKey(tuData, 'vantageScore', 'creditScore', 'score', 'riskScore', 'ficoScore') ||
      findValueByKey(tuData, 'models', 'scores');
    const income =
      findValueByKey(tuData, 'income', 'annualIncome', 'monthlyIncome', 'totalIncome') ||
      0;
    const bankruptcies =
      countOccurrences(tuData, 'bankruptcy', 'bankruptcies') ||
      findValueByKey(tuData, 'bankruptcyCount', 'bankruptcies') ||
      0;

    return {
      creditScore: typeof creditScore === 'number' ? Math.min(850, Math.max(300, creditScore)) : getMockCreditData().creditScore,
      income: typeof income === 'number' ? income : getMockCreditData().income,
      evictions: typeof evictionCount === 'number' ? evictionCount : 0,
      bankruptcies: typeof bankruptcies === 'number' ? bankruptcies : 0,
    };
  } catch (err) {
    console.error('CRS API error:', err.response?.data || err.message);
    return getMockCreditData(buyerInfo);
  }
}

/**
 * Mock credit data for development/demo when CRS API is unavailable.
 */
function getMockCreditData() {
  const scores = [580, 620, 650, 680, 700, 720, 740, 760, 780, 800];
  const incomes = [35000, 45000, 55000, 65000, 75000, 85000, 95000, 120000];

  return {
    creditScore: scores[Math.floor(Math.random() * scores.length)],
    income: incomes[Math.floor(Math.random() * incomes.length)],
    evictions: Math.random() > 0.85 ? 1 : 0,
    bankruptcies: Math.random() > 0.9 ? 1 : 0,
  };
}

/**
 * Calculate match score (0-100) by comparing CRS data against seller criteria.
 * Returns { matchScore, matchBreakdown, matchColor }
 */
function calculateMatchScore(crsData, criteria) {
  const breakdown = {};
  let totalPoints = 0;
  let earnedPoints = 0;

  // 1. Credit Score check
  if (criteria.minCreditScore > 0) {
    totalPoints += 25;
    const passed = crsData.creditScore >= criteria.minCreditScore;
    if (passed) {
      earnedPoints += 25;
    } else {
      const diff = criteria.minCreditScore - crsData.creditScore;
      if (diff <= 50) {
        earnedPoints += Math.round(25 * (1 - diff / 50));
      }
    }
    breakdown.creditScore = {
      passed,
      detail: `Score: ${crsData.creditScore} (min: ${criteria.minCreditScore})`,
    };
  } else {
    breakdown.creditScore = { passed: true, detail: 'No minimum set' };
  }

  // 2. Income multiplier check
  if (criteria.minIncomeMultiplier > 0) {
    totalPoints += 25;
    const monthlyIncome = crsData.income / 12;
    const ratio = criteria.rentAmount > 0 ? monthlyIncome / criteria.rentAmount : 0;
    const passed = ratio >= criteria.minIncomeMultiplier;
    if (passed) {
      earnedPoints += 25;
    } else if (ratio >= criteria.minIncomeMultiplier * 0.75) {
      earnedPoints += 15;
    }
    breakdown.income = {
      passed,
      detail: `Income ratio: ${ratio.toFixed(1)}x (min: ${criteria.minIncomeMultiplier}x)`,
    };
  } else {
    breakdown.income = { passed: true, detail: 'No minimum set' };
  }

  // 3. Evictions check
  if (criteria.noEvictions) {
    totalPoints += 25;
    const passed = crsData.evictions === 0;
    if (passed) earnedPoints += 25;
    breakdown.evictions = {
      passed,
      detail: passed ? 'No evictions' : `${crsData.evictions} eviction(s) found`,
    };
  } else {
    breakdown.evictions = { passed: true, detail: 'Not checked' };
  }

  // 4. Bankruptcy check
  if (criteria.noBankruptcy) {
    totalPoints += 25;
    const passed = crsData.bankruptcies === 0;
    if (passed) earnedPoints += 25;
    breakdown.bankruptcy = {
      passed,
      detail: passed ? 'No bankruptcies' : `${crsData.bankruptcies} bankruptcy(ies) found`,
    };
  } else {
    breakdown.bankruptcy = { passed: true, detail: 'Not checked' };
  }

  const matchScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

  let matchColor = 'red';
  if (matchScore >= 80) matchColor = 'green';
  else if (matchScore >= 50) matchColor = 'yellow';

  return { matchScore, matchBreakdown: breakdown, matchColor };
}

module.exports = { pullCreditReport, calculateMatchScore };
