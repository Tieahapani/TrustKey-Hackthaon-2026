import { describe, it, expect } from "vitest";
import { getMatchingCities, matchesSearch } from "@/lib/city-aliases";

/* ================================================================== */
/*  getMatchingCities                                                  */
/* ================================================================== */

describe("getMatchingCities", () => {
  it("returns empty array for empty query", () => {
    expect(getMatchingCities("")).toEqual([]);
  });

  it("returns all cities for whitespace-only query (trimmed to empty matches everything)", () => {
    // "   " is truthy so the early `if (!query)` check doesn't trigger.
    // After trim, q="" which matches all aliases and all city names.
    const result = getMatchingCities("   ");
    expect(result).toContain("San Francisco");
    expect(result).toContain("Portland");
    expect(result).toContain("Miami");
    expect(result).toContain("Austin");
    expect(result).toContain("Denver");
    expect(result).toContain("Charlotte");
  });

  it("resolves 'sf' alias to San Francisco", () => {
    expect(getMatchingCities("sf")).toContain("San Francisco");
  });

  it("resolves 'pdx' alias to Portland", () => {
    expect(getMatchingCities("pdx")).toContain("Portland");
  });

  it("resolves 'mia' alias to Miami", () => {
    expect(getMatchingCities("mia")).toContain("Miami");
  });

  it("resolves 'atx' alias to Austin", () => {
    expect(getMatchingCities("atx")).toContain("Austin");
  });

  it("resolves 'den' alias to Denver", () => {
    expect(getMatchingCities("den")).toContain("Denver");
  });

  it("resolves 'clt' alias to Charlotte", () => {
    expect(getMatchingCities("clt")).toContain("Charlotte");
  });

  it("resolves 'char' alias to Charlotte", () => {
    expect(getMatchingCities("char")).toContain("Charlotte");
  });

  it("resolves partial city name 'aus' to Austin", () => {
    expect(getMatchingCities("aus")).toContain("Austin");
  });

  it("resolves partial city name 'por' to Portland", () => {
    expect(getMatchingCities("por")).toContain("Portland");
  });

  it("is case insensitive — 'SF' resolves to San Francisco", () => {
    expect(getMatchingCities("SF")).toContain("San Francisco");
  });

  it("returns empty array for unknown query", () => {
    expect(getMatchingCities("xyz")).toEqual([]);
  });

  it("resolves 'san fran' alias to San Francisco", () => {
    expect(getMatchingCities("san fran")).toContain("San Francisco");
  });

  it("resolves 'frisco' alias to San Francisco", () => {
    expect(getMatchingCities("frisco")).toContain("San Francisco");
  });

  it("resolves partial city 'denv' to Denver via substring match", () => {
    expect(getMatchingCities("denv")).toContain("Denver");
  });

  it("resolves 'miami' to Miami via exact city name match", () => {
    expect(getMatchingCities("miami")).toContain("Miami");
  });

  it("resolves 'charlotte' to Charlotte via full city name", () => {
    expect(getMatchingCities("charlotte")).toContain("Charlotte");
  });

  it("resolves 'san' to San Francisco via partial city match", () => {
    expect(getMatchingCities("san")).toContain("San Francisco");
  });

  it("resolves 'san francisco' to San Francisco via full name", () => {
    expect(getMatchingCities("san francisco")).toContain("San Francisco");
  });

  it("does not return duplicates when alias and city match overlap", () => {
    const results = getMatchingCities("mia");
    const unique = [...new Set(results)];
    expect(results).toEqual(unique);
  });

  it("handles leading/trailing whitespace in query", () => {
    expect(getMatchingCities("  sf  ")).toContain("San Francisco");
  });

  it("resolves 'cl' to Charlotte via alias prefix", () => {
    expect(getMatchingCities("cl")).toContain("Charlotte");
  });

  it("'de' matches Denver via alias prefix and partial city", () => {
    const results = getMatchingCities("de");
    expect(results).toContain("Denver");
  });
});

/* ================================================================== */
/*  matchesSearch                                                       */
/* ================================================================== */

describe("matchesSearch", () => {
  const listing = {
    title: "Luxury Condo Downtown",
    city: "San Francisco",
    address: "123 Market St",
    state: "CA",
  };

  it("returns true for empty query", () => {
    expect(matchesSearch("", listing)).toBe(true);
  });

  it("matches on title", () => {
    expect(matchesSearch("Luxury", listing)).toBe(true);
  });

  it("matches on city", () => {
    expect(matchesSearch("San Francisco", listing)).toBe(true);
  });

  it("matches on address", () => {
    expect(matchesSearch("Market", listing)).toBe(true);
  });

  it("matches on state", () => {
    expect(matchesSearch("CA", listing)).toBe(true);
  });

  it("matches via alias — 'sf' matches city San Francisco", () => {
    expect(matchesSearch("sf", listing)).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesSearch("Chicago", listing)).toBe(false);
  });

  it("is case insensitive", () => {
    expect(matchesSearch("luxury condo", listing)).toBe(true);
  });

  it("matches partial address", () => {
    expect(matchesSearch("123", listing)).toBe(true);
  });

  it("alias does not match unrelated city", () => {
    const austinListing = { title: "Home", city: "Austin", address: "1 Main", state: "TX" };
    expect(matchesSearch("sf", austinListing)).toBe(false);
  });
});
