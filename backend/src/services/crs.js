const axios = require('axios');

/**
 * Call CRS Credit API sandbox to pull credit data for a buyer.
 * Returns normalized credit data object.
 */
async function pullCreditReport(buyerInfo) {
  const apiKey = process.env.CRS_API_KEY;
  const apiUrl = process.env.CRS_API_URL;

  if (!apiKey || !apiUrl) {
    console.warn('CRS API not configured — returning mock data');
    return getMockCreditData(buyerInfo);
  }

  try {
    const response = await axios.post(`${apiUrl}/credit-report`, {
      firstName: buyerInfo.firstName,
      lastName: buyerInfo.lastName,
      ssn: buyerInfo.ssn,
      dateOfBirth: buyerInfo.dateOfBirth,
      address: buyerInfo.address,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Normalize the CRS response into our format
    const data = response.data;
    return {
      creditScore: data.creditScore || data.score || 0,
      income: data.income || data.annualIncome || 0,
      evictions: data.evictions || data.evictionCount || 0,
      bankruptcies: data.bankruptcies || data.bankruptcyCount || 0,
    };
  } catch (err) {
    console.error('CRS API error:', err.message);
    // Fall back to mock data if API fails
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
      // Partial credit: if within 50 points, give partial
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
    // Assume monthly rent = listing price, annual income / 12 / rent >= multiplier
    // We pass in the monthly rent via criteria context
    const monthlyIncome = crsData.income / 12;
    const ratio = criteria.rentAmount > 0 ? monthlyIncome / criteria.rentAmount : 0;
    const passed = ratio >= criteria.minIncomeMultiplier;
    if (passed) {
      earnedPoints += 25;
    } else if (ratio >= criteria.minIncomeMultiplier * 0.75) {
      earnedPoints += 15; // partial
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

  // Calculate final score
  const matchScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;

  let matchColor = 'red';
  if (matchScore >= 80) matchColor = 'green';
  else if (matchScore >= 50) matchColor = 'yellow';

  return { matchScore, matchBreakdown: breakdown, matchColor };
}

module.exports = { pullCreditReport, calculateMatchScore };
