/**
 * Tests for CRS (Comprehensive Report Service) utility functions.
 *
 * These tests cover: findValueByKey, countOccurrences, calculateMatchScore,
 * and getMockComprehensiveData — all pure functions that do not require
 * database or network access.
 */
const {
  calculateMatchScore,
  findValueByKey,
  countOccurrences,
  getMockComprehensiveData,
} = require('../../services/crs');

// ─── findValueByKey ──────────────────────────────────────────────────────────

describe('findValueByKey', () => {
  it('returns a top-level numeric value', () => {
    expect(findValueByKey({ creditScore: 720 }, 'creditScore')).toBe(720);
  });

  it('coerces a string integer to a number ("720" -> 720)', () => {
    expect(findValueByKey({ score: '720' }, 'score')).toBe(720);
  });

  it('coerces a string float to a number ("3.5" -> 3.5)', () => {
    expect(findValueByKey({ rating: '3.5' }, 'rating')).toBe(3.5);
  });

  it('finds a value inside a nested object', () => {
    const obj = { data: { inner: { score: 650 } } };
    expect(findValueByKey(obj, 'score')).toBe(650);
  });

  it('finds a value inside an array element', () => {
    const obj = { items: [{ id: 1 }, { score: 700 }] };
    expect(findValueByKey(obj, 'score')).toBe(700);
  });

  it('returns undefined for null input', () => {
    expect(findValueByKey(null, 'score')).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(findValueByKey(undefined, 'score')).toBeUndefined();
  });

  it('returns undefined when key is not found', () => {
    expect(findValueByKey({ a: 1 }, 'missing')).toBeUndefined();
  });

  it('returns NaN when value is NaN (number type fallthrough)', () => {
    expect(findValueByKey({ score: NaN }, 'score')).toBeNaN();
  });

  it('finds a value deeply nested (4+ levels)', () => {
    const obj = { a: { b: { c: { d: { deep: 42 } } } } };
    expect(findValueByKey(obj, 'deep')).toBe(42);
  });

  it('accepts multiple keys and returns the first match found at top level', () => {
    const obj = { vantageScore: 750 };
    expect(findValueByKey(obj, 'creditScore', 'vantageScore')).toBe(750);
  });

  it('returns undefined for a non-object primitive input', () => {
    expect(findValueByKey(42, 'key')).toBeUndefined();
    expect(findValueByKey('hello', 'key')).toBeUndefined();
  });

  it('skips null property values and continues searching', () => {
    const obj = { score: null, nested: { score: 680 } };
    expect(findValueByKey(obj, 'score')).toBe(680);
  });
});

// ─── countOccurrences ────────────────────────────────────────────────────────

describe('countOccurrences', () => {
  it('counts array length for a matching key', () => {
    expect(countOccurrences({ offenses: [1, 2, 3] }, 'offenses')).toBe(3);
  });

  it('adds numeric values for a matching key', () => {
    expect(countOccurrences({ evictionCount: 5 }, 'evictionCount')).toBe(5);
  });

  it('counts truthy non-array/non-number value as 1', () => {
    expect(countOccurrences({ offense: 'theft' }, 'offense')).toBe(1);
  });

  it('counts occurrences in nested objects', () => {
    const obj = {
      data: {
        records: {
          offenses: ['a', 'b'],
        },
      },
    };
    expect(countOccurrences(obj, 'offenses')).toBe(2);
  });

  it('returns 0 for null input', () => {
    expect(countOccurrences(null, 'offenses')).toBe(0);
  });

  it('returns 0 for undefined input', () => {
    expect(countOccurrences(undefined, 'offenses')).toBe(0);
  });

  it('returns 0 for an empty array value', () => {
    expect(countOccurrences({ offenses: [] }, 'offenses')).toBe(0);
  });

  it('counts across multiple levels', () => {
    const obj = {
      offense: 'top',
      nested: {
        offense: 'inner',
      },
    };
    // top-level "offense" = truthy string = 1, nested "offense" = truthy string = 1
    expect(countOccurrences(obj, 'offense')).toBe(2);
  });

  it('counts values inside arrays of objects', () => {
    const obj = {
      results: [{ offense: 'a' }, { offense: 'b' }],
    };
    expect(countOccurrences(obj, 'offense')).toBe(2);
  });

  it('accepts multiple key names', () => {
    const obj = { eviction: 'yes', conviction: 2 };
    expect(countOccurrences(obj, 'eviction', 'conviction')).toBe(3); // 1 + 2
  });
});

// ─── calculateMatchScore ────────────────────────────────────────────────────

describe('calculateMatchScore', () => {
  // Helper to build default clear CRS data
  const cleanCrs = (overrides = {}) => ({
    creditScore: 750,
    evictions: 0,
    bankruptcies: 0,
    criminalOffenses: 0,
    fraudRiskScore: 1,
    identityVerified: true,
    fbiMostWanted: { matchFound: false, matchCount: 0, searchedName: 'Jane Doe', crimes: [] },
    ...overrides,
  });

  const allCriteria = {
    minCreditScore: 650,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
  };

  // ── FBI Hard Fail ──────────────────────────────────────────────────────

  describe('FBI Most Wanted hard fail', () => {
    it('returns score 0 and color red when matchFound is true', () => {
      const crs = cleanCrs({
        fbiMostWanted: { matchFound: true, matchCount: 1, searchedName: 'Bad Guy', crimes: [] },
      });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchScore).toBe(0);
      expect(result.matchColor).toBe('red');
    });

    it('overrides all breakdown entries when FBI match found', () => {
      const crs = cleanCrs({
        fbiMostWanted: { matchFound: true, matchCount: 1, searchedName: 'Bad Guy', crimes: [] },
      });
      const result = calculateMatchScore(crs, allCriteria);
      const bd = result.matchBreakdown;
      expect(bd.fbiMostWanted.passed).toBe(false);
      expect(bd.creditScore.detail).toContain('Overridden');
      expect(bd.evictions.detail).toContain('Overridden');
      expect(bd.bankruptcy.detail).toContain('Overridden');
      expect(bd.criminal.detail).toContain('Overridden');
      expect(bd.fraud.detail).toContain('Overridden');
    });

    it('includes crime descriptions in FBI detail when crimes list is provided', () => {
      const crs = cleanCrs({
        fbiMostWanted: {
          matchFound: true,
          matchCount: 1,
          searchedName: 'Most Wanted',
          crimes: [
            { name: 'Bank Robbery', description: 'Armed robbery of national bank' },
            { name: 'Fraud', description: 'Wire fraud scheme' },
          ],
        },
      });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchBreakdown.fbiMostWanted.detail).toContain('Armed robbery');
      expect(result.matchBreakdown.fbiMostWanted.detail).toContain('Wire fraud');
    });
  });

  describe('FBI clear', () => {
    it('sets fbiMostWanted.passed to true when not on list', () => {
      const result = calculateMatchScore(cleanCrs(), allCriteria);
      expect(result.matchBreakdown.fbiMostWanted.passed).toBe(true);
    });
  });

  // ── Credit Score ──────────────────────────────────────────────────────

  describe('Credit score', () => {
    it('awards 25 points when minCreditScore > 0 and score meets threshold', () => {
      const result = calculateMatchScore(cleanCrs({ creditScore: 700 }), { ...allCriteria, minCreditScore: 650 });
      expect(result.matchBreakdown.creditScore.points).toBe(25);
      expect(result.matchBreakdown.creditScore.passed).toBe(true);
    });

    it('awards 0 points when credit score is below threshold', () => {
      const result = calculateMatchScore(cleanCrs({ creditScore: 600 }), { ...allCriteria, minCreditScore: 650 });
      expect(result.matchBreakdown.creditScore.points).toBe(0);
      expect(result.matchBreakdown.creditScore.passed).toBe(false);
    });

    it('skips credit check when minCreditScore is 0', () => {
      const result = calculateMatchScore(cleanCrs(), { ...allCriteria, minCreditScore: 0 });
      expect(result.matchBreakdown.creditScore.maxPoints).toBe(0);
      expect(result.matchBreakdown.creditScore.detail).toContain('No minimum');
    });

    it('passes at exact boundary (score equals threshold)', () => {
      const result = calculateMatchScore(cleanCrs({ creditScore: 650 }), { ...allCriteria, minCreditScore: 650 });
      expect(result.matchBreakdown.creditScore.passed).toBe(true);
      expect(result.matchBreakdown.creditScore.points).toBe(25);
    });
  });

  // ── Evictions ─────────────────────────────────────────────────────────

  describe('Evictions', () => {
    it('awards 20 points when noEvictions is true and evictions are 0', () => {
      const result = calculateMatchScore(cleanCrs({ evictions: 0 }), { ...allCriteria, noEvictions: true });
      expect(result.matchBreakdown.evictions.points).toBe(20);
      expect(result.matchBreakdown.evictions.passed).toBe(true);
    });

    it('awards 0 points when noEvictions is true and evictions > 0', () => {
      const result = calculateMatchScore(cleanCrs({ evictions: 2 }), { ...allCriteria, noEvictions: true });
      expect(result.matchBreakdown.evictions.points).toBe(0);
      expect(result.matchBreakdown.evictions.passed).toBe(false);
    });

    it('skips eviction check when noEvictions is false', () => {
      const result = calculateMatchScore(cleanCrs(), { ...allCriteria, noEvictions: false });
      expect(result.matchBreakdown.evictions.maxPoints).toBe(0);
      expect(result.matchBreakdown.evictions.detail).toContain('Not required');
    });
  });

  // ── Bankruptcy ────────────────────────────────────────────────────────

  describe('Bankruptcy', () => {
    it('awards 20 points when noBankruptcy is true and bankruptcies are 0', () => {
      const result = calculateMatchScore(cleanCrs({ bankruptcies: 0 }), { ...allCriteria, noBankruptcy: true });
      expect(result.matchBreakdown.bankruptcy.points).toBe(20);
      expect(result.matchBreakdown.bankruptcy.passed).toBe(true);
    });

    it('awards 0 points when noBankruptcy is true and bankruptcies > 0', () => {
      const result = calculateMatchScore(cleanCrs({ bankruptcies: 1 }), { ...allCriteria, noBankruptcy: true });
      expect(result.matchBreakdown.bankruptcy.points).toBe(0);
      expect(result.matchBreakdown.bankruptcy.passed).toBe(false);
    });

    it('skips bankruptcy check when noBankruptcy is false', () => {
      const result = calculateMatchScore(cleanCrs(), { ...allCriteria, noBankruptcy: false });
      expect(result.matchBreakdown.bankruptcy.maxPoints).toBe(0);
      expect(result.matchBreakdown.bankruptcy.detail).toContain('Not required');
    });
  });

  // ── Criminal ──────────────────────────────────────────────────────────

  describe('Criminal', () => {
    it('awards 20 points when noCriminal is true and criminalOffenses are 0', () => {
      const result = calculateMatchScore(cleanCrs({ criminalOffenses: 0 }), { ...allCriteria, noCriminal: true });
      expect(result.matchBreakdown.criminal.points).toBe(20);
      expect(result.matchBreakdown.criminal.passed).toBe(true);
    });

    it('awards 0 points when noCriminal is true and criminalOffenses > 0', () => {
      const result = calculateMatchScore(cleanCrs({ criminalOffenses: 3 }), { ...allCriteria, noCriminal: true });
      expect(result.matchBreakdown.criminal.points).toBe(0);
      expect(result.matchBreakdown.criminal.passed).toBe(false);
    });

    it('skips criminal check when noCriminal is false', () => {
      const result = calculateMatchScore(cleanCrs(), { ...allCriteria, noCriminal: false });
      expect(result.matchBreakdown.criminal.maxPoints).toBe(0);
      expect(result.matchBreakdown.criminal.detail).toContain('Not required');
    });
  });

  // ── Fraud ─────────────────────────────────────────────────────────────

  describe('Fraud', () => {
    it('awards 15 points when fraudRiskScore <= 3', () => {
      const result = calculateMatchScore(cleanCrs({ fraudRiskScore: 2 }), allCriteria);
      expect(result.matchBreakdown.fraud.points).toBe(15);
      expect(result.matchBreakdown.fraud.passed).toBe(true);
    });

    it('awards 0 points when fraudRiskScore > 3', () => {
      const result = calculateMatchScore(cleanCrs({ fraudRiskScore: 7 }), allCriteria);
      expect(result.matchBreakdown.fraud.points).toBe(0);
      expect(result.matchBreakdown.fraud.passed).toBe(false);
    });

    it('skips fraud check when fraudRiskScore is undefined', () => {
      const crs = cleanCrs();
      delete crs.fraudRiskScore;
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchBreakdown.fraud.maxPoints).toBe(0);
      expect(result.matchBreakdown.fraud.detail).toContain('Not checked');
    });
  });

  // ── Overall scoring / color ───────────────────────────────────────────

  describe('Overall scoring and color', () => {
    it('returns 100 / green when all criteria are met', () => {
      const result = calculateMatchScore(cleanCrs(), allCriteria);
      expect(result.matchScore).toBe(100);
      expect(result.matchColor).toBe('green');
    });

    it('returns 100 / green when no criteria are set (empty object)', () => {
      const result = calculateMatchScore(cleanCrs(), {});
      expect(result.matchScore).toBe(100);
      expect(result.matchColor).toBe('green');
    });

    it('returns green for score exactly 80', () => {
      // credit(25) + evictions(20) + bankruptcy(20) + criminal_fail(0) + fraud(15) = 80/100 = 80
      const crs = cleanCrs({ criminalOffenses: 1 });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchScore).toBe(80);
      expect(result.matchColor).toBe('green');
    });

    it('returns yellow for score 60', () => {
      // Need earned/total = 60.  Total=100.  Earned=60.
      // credit pass(25) + eviction pass(20) + bankruptcy fail(0) + criminal fail(0) + fraud pass(15) = 60
      const crs = cleanCrs({ bankruptcies: 1, criminalOffenses: 2 });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchScore).toBe(60);
      expect(result.matchColor).toBe('yellow');
    });

    it('returns red for score 59 (below 60 threshold)', () => {
      // Need earned/total roughly 59. Total = 100, earned = 59 not easily achievable with given weights.
      // credit fail(0) + eviction pass(20) + bankruptcy fail(0) + criminal pass(20) + fraud pass(15) = 55
      // That's 55 -> red. Let's go with that.
      const crs = cleanCrs({ creditScore: 500, bankruptcies: 3 });
      const result = calculateMatchScore(crs, allCriteria);
      // 0 + 20 + 0 + 20 + 15 = 55
      expect(result.matchScore).toBe(55);
      expect(result.matchColor).toBe('red');
    });

    it('returns red for score below 60', () => {
      // credit fail(0) + eviction fail(0) + bankruptcy pass(20) + criminal pass(20) + fraud fail(0) = 40
      const crs = cleanCrs({ creditScore: 400, evictions: 1, fraudRiskScore: 9 });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchScore).toBe(40);
      expect(result.matchColor).toBe('red');
    });

    it('handles partial pass scenarios correctly', () => {
      // credit pass(25) + eviction fail(0) + bankruptcy pass(20) + criminal pass(20) + fraud pass(15) = 80
      const crs = cleanCrs({ evictions: 1 });
      const result = calculateMatchScore(crs, allCriteria);
      expect(result.matchScore).toBe(80);
      expect(result.matchColor).toBe('green');
      expect(result.earnedPoints).toBe(80);
      expect(result.totalPoints).toBe(100);
    });
  });
});

// ─── getMockComprehensiveData ────────────────────────────────────────────────

describe('getMockComprehensiveData', () => {
  it('returns an object with all expected keys', () => {
    const data = getMockComprehensiveData();
    expect(data).toHaveProperty('creditScore');
    expect(data).toHaveProperty('evictions');
    expect(data).toHaveProperty('bankruptcies');
    expect(data).toHaveProperty('criminalOffenses');
    expect(data).toHaveProperty('fraudRiskScore');
    expect(data).toHaveProperty('identityVerified');
    expect(data).toHaveProperty('fbiMostWanted');
    expect(data).toHaveProperty('requestIds');
  });

  it('returns creditScore from the allowed list', () => {
    const allowed = [580, 620, 650, 680, 700, 720, 740, 760, 780];
    const data = getMockComprehensiveData();
    expect(allowed).toContain(data.creditScore);
  });

  it('always returns fbiMostWanted.matchFound as false', () => {
    for (let i = 0; i < 20; i++) {
      const data = getMockComprehensiveData();
      expect(data.fbiMostWanted.matchFound).toBe(false);
    }
  });

  it('produces varied results over 20 calls (not all identical)', () => {
    const results = [];
    for (let i = 0; i < 20; i++) {
      results.push(getMockComprehensiveData());
    }
    const scores = results.map((r) => r.creditScore);
    const uniqueScores = new Set(scores);
    // With 9 possible scores and 20 trials, very unlikely to have only 1
    expect(uniqueScores.size).toBeGreaterThan(1);
  });
});
