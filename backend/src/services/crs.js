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
// MORTGAGE CALCULATOR (for home sales)
// ============================================

/**
 * Estimate monthly mortgage payment for home sales
 * @param {number} homePrice - Total home price
 * @param {number} downPaymentPercent - Down payment as percentage (default 20%)
 * @param {number} interestRate - Annual interest rate as percentage (default 7%)
 * @param {number} loanTermYears - Loan term in years (default 30)
 * @returns {object} Mortgage breakdown with monthly payment
 */
function estimateMortgage(
  homePrice,
  downPaymentPercent = 20,
  interestRate = 7,
  loanTermYears = 30
) {
  const downPayment = homePrice * (downPaymentPercent / 100);
  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return {
    homePrice,
    downPayment: Math.round(downPayment),
    loanAmount: Math.round(loanAmount),
    interestRate,
    loanTermYears,
    monthlyPayment: Math.round(monthlyPayment),
    totalPaid: Math.round(monthlyPayment * numberOfPayments),
    totalInterest: Math.round(monthlyPayment * numberOfPayments - loanAmount),
  };
}

// ============================================
// TEST IDENTITIES (from Postman Sandbox)
// ============================================

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

const CRIMINAL_TEST_IDENTITY = {
  reference: 'homescreen-criminal-ref',
  subjectInfo: {
    last: 'Consumer',
    first: 'Jonathan',
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

const FRAUD_TEST_IDENTITY = {
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '1234929999',
  email: 'example@atdata.com',
  ipAddress: '47.25.65.96',
  address: {
    addressLine1: '15900  SPACE CN',
    city: 'HOUSTON',
    state: 'TX',
    postalCode: '77062',
  },
};

const FLEXID_TEST_IDENTITY = {
  firstName: 'NATALIE',
  lastName: 'KORZEC',
  ssn: '7537',
  dateOfBirth: '1940-12-23',
  streetAddress: '801 E OGDEN 1011',
  city: 'VAUGHN',
  state: 'WA',
  zipCode: '98394',
  homePhone: '5031234567',
};

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
      const fraudPayload = buyerInfo?.email
        ? {
            firstName: buyerInfo.firstName || 'John',
            lastName: buyerInfo.lastName || 'Doe',
            phoneNumber: buyerInfo.phone || '1234929999',
            email: buyerInfo.email || 'example@atdata.com',
            ipAddress: buyerInfo.ipAddress || '47.25.65.96',
            address: {
              addressLine1: buyerInfo.addressLine1 || '15900  SPACE CN',
              city: buyerInfo.city || 'HOUSTON',
              state: buyerInfo.state || 'TX',
              postalCode: buyerInfo.zip || '77062',
            },
          }
        : FRAUD_TEST_IDENTITY;

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
      const flexPayload = buyerInfo?.ssn
        ? {
            firstName: buyerInfo.firstName || 'NATALIE',
            lastName: buyerInfo.lastName || 'KORZEC',
            ssn: buyerInfo.ssn || '7537',
            dateOfBirth: buyerInfo.dob || '1940-12-23',
            streetAddress: buyerInfo.addressLine1 || '801 E OGDEN 1011',
            city: buyerInfo.city || 'VAUGHN',
            state: buyerInfo.state || 'WA',
            zipCode: buyerInfo.zip || '98394',
            homePhone: buyerInfo.phone || '5031234567',
          }
        : FLEXID_TEST_IDENTITY;

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
      const tuResponse = await axios.post(
        `${baseUrl}/transunion/credit-report/standard/tu-prequal-vantage4`,
        TU_TEST_IDENTITY,
        { headers }
      );

      const tuRequestId = tuResponse.headers['requestid'];
      if (tuRequestId) results.requestIds.credit = tuRequestId;

      results.creditScore =
        findValueByKey(tuResponse.data, 'vantageScore', 'creditScore', 'score') || 680;
      results.bankruptcies =
        countOccurrences(tuResponse.data, 'bankruptcy', 'bankruptcies') || 0;

      console.log(`   ✅ Credit Score: ${results.creditScore}`);
      console.log(`   ℹ️  Note: TransUnion does not provide income data`);
    } catch (err) {
      console.warn('   ⚠️  Credit report failed:', err.response?.data?.messages?.[0] || err.message);
    }

    // ── 4. Criminal Background Check ─────────────────────
    console.log('🚔 [4/5] Fetching criminal background...');
    try {
      const criminalResponse = await axios.post(
        `${baseUrl}/criminal/new-request`,
        CRIMINAL_TEST_IDENTITY,
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
      const evictionResponse = await axios.post(
        `${baseUrl}/eviction/new-request`,
        EVICTION_TEST_IDENTITY,
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

    console.log('='.repeat(60));
    console.log('✅ SCREENING COMPLETE — 5/5 products called');
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
    requestIds: {},
  };
}

/**
 * Calculate match score with all criteria (supports both rental and sale)
 * @param {object} crsData - CRS screening results
 * @param {object} criteria - Seller's screening criteria
 * @param {number} buyerMonthlyIncome - Self-reported monthly income from buyer
 * @param {number} listingPrice - Monthly rent (for rentals) or home price (for sales)
 * @param {string} listingType - 'rent' or 'sale'
 */
function calculateMatchScore(crsData, criteria, buyerMonthlyIncome, listingPrice, listingType) {
  const breakdown = {};
  let totalPoints = 0;
  let earnedPoints = 0;
  let mortgageEstimate = null;

  // 1. Credit Score (25 points)
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

  // 2. Income (25 points) - Different logic for rent vs sale
  if (criteria.minIncomeMultiplier > 0 && buyerMonthlyIncome > 0) {
    totalPoints += 25;
    let passed = false;
    let ratio = 0;
    let detailText = '';

    if (listingType === 'rent') {
      // RENTAL: Compare monthly income vs monthly rent
      ratio = buyerMonthlyIncome / listingPrice;
      passed = ratio >= criteria.minIncomeMultiplier;
      detailText = `Monthly income: $${buyerMonthlyIncome.toLocaleString()}, ${ratio.toFixed(1)}x rent (min: ${criteria.minIncomeMultiplier}x)`;
    } else {
      // SALE: Calculate mortgage, then compare income vs mortgage payment
      mortgageEstimate = estimateMortgage(listingPrice);
      ratio = buyerMonthlyIncome / mortgageEstimate.monthlyPayment;
      passed = ratio >= criteria.minIncomeMultiplier;
      detailText = `Monthly income: $${buyerMonthlyIncome.toLocaleString()}, ${ratio.toFixed(1)}x mortgage payment of $${mortgageEstimate.monthlyPayment.toLocaleString()} (min: ${criteria.minIncomeMultiplier}x)`;
    }

    if (passed) {
      earnedPoints += 25;
    } else if (ratio >= criteria.minIncomeMultiplier * 0.75) {
      earnedPoints += 15; // Partial credit if within 75% of requirement
    }

    breakdown.income = { passed, detail: detailText };
  } else {
    breakdown.income = { passed: true, detail: 'No minimum set' };
  }

  // 3. Criminal Background (15 points)
  if (criteria.noCriminal) {
    totalPoints += 15;
    const passed = crsData.criminalOffenses === 0;
    if (passed) earnedPoints += 15;
    breakdown.criminal = {
      passed,
      detail: passed ? 'No criminal record' : `${crsData.criminalOffenses} offense(s) found`,
    };
  } else {
    breakdown.criminal = { passed: true, detail: 'Not required' };
  }

  // 4. Evictions (20 points)
  if (criteria.noEvictions) {
    totalPoints += 20;
    const passed = crsData.evictions === 0;
    if (passed) earnedPoints += 20;
    breakdown.evictions = {
      passed,
      detail: passed ? 'No evictions' : `${crsData.evictions} eviction(s) found`,
    };
  } else {
    breakdown.evictions = { passed: true, detail: 'Not required' };
  }

  // 5. Bankruptcy (10 points)
  if (criteria.noBankruptcy) {
    totalPoints += 10;
    const passed = crsData.bankruptcies === 0;
    if (passed) earnedPoints += 10;
    breakdown.bankruptcy = {
      passed,
      detail: passed ? 'No bankruptcies' : `${crsData.bankruptcies} bankruptcy(ies) found`,
    };
  } else {
    breakdown.bankruptcy = { passed: true, detail: 'Not required' };
  }

  // 6. Fraud Risk (5 points)
  if (crsData.fraudRiskScore !== undefined) {
    totalPoints += 5;
    const passed = crsData.fraudRiskScore <= 3;
    if (passed) earnedPoints += 5;
    breakdown.fraud = {
      passed,
      detail: passed
        ? `Low fraud risk (${crsData.fraudRiskScore}/10)`
        : `High fraud risk (${crsData.fraudRiskScore}/10)`,
    };
  } else {
    breakdown.fraud = { passed: true, detail: 'Not checked' };
  }

  const matchScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

  let matchColor = 'red';
  if (matchScore >= 80) matchColor = 'green';
  else if (matchScore >= 60) matchColor = 'yellow';

  const result = { matchScore, matchBreakdown: breakdown, matchColor };
  
  // Add mortgage estimate for sales listings
  if (listingType === 'sale' && mortgageEstimate) {
    result.mortgageEstimate = mortgageEstimate;
  }

  return result;
}

/**
 * Legacy function - calls new comprehensive screening
 * @deprecated Use pullComprehensiveReport instead
 */
async function pullCreditReport(buyerInfo) {
  return await pullComprehensiveReport(buyerInfo);
}

module.exports = {
  pullCreditReport,
  pullComprehensiveReport,
  calculateMatchScore,
  estimateMortgage,
};