const cityAliases: Record<string, string> = {
  "sf": "San Francisco",
  "san fran": "San Francisco",
  "frisco": "San Francisco",
  "pdx": "Portland",
  "mia": "Miami",
  "atx": "Austin",
  "den": "Denver",
  "clt": "Charlotte",
  "char": "Charlotte",
};

const allCities = ["Austin", "Portland", "Miami", "Denver", "San Francisco", "Charlotte"];

export function getMatchingCities(query: string): string[] {
  if (!query) return [];
  const q = query.toLowerCase().trim();

  const matched = new Set<string>();

  // Check aliases
  for (const [alias, city] of Object.entries(cityAliases)) {
    if (alias.startsWith(q) || q.startsWith(alias)) {
      matched.add(city);
    }
  }

  // Check partial city name match
  for (const city of allCities) {
    if (city.toLowerCase().includes(q)) {
      matched.add(city);
    }
  }

  return Array.from(matched);
}

export function matchesSearch(query: string, listing: { title: string; city: string; address: string; state: string }): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();

  // Direct field matches
  if (
    listing.title.toLowerCase().includes(q) ||
    listing.city.toLowerCase().includes(q) ||
    listing.address.toLowerCase().includes(q) ||
    listing.state.toLowerCase().includes(q)
  ) return true;

  // Alias match
  const matchedCities = getMatchingCities(q);
  if (matchedCities.includes(listing.city)) return true;

  return false;
}
