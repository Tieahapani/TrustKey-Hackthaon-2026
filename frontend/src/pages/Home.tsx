import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Home as HomeIcon, X } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import api from '@/lib/api';

interface Listing {
  _id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number;
  listingType: 'rent' | 'sale';
  photos: string[];
  bedrooms: number;
  bathrooms: number;
  sqft: number;
}

// Demo listings shown when backend is not connected
const DEMO_LISTINGS: Listing[] = [
  {
    _id: 'demo-1',
    title: 'Sunny 2BR Apartment in Mission District',
    address: '2456 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    price: 3200,
    listingType: 'rent',
    photos: [],
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
  },
  {
    _id: 'demo-2',
    title: 'Modern Studio in Downtown Oakland',
    address: '1200 Broadway',
    city: 'Oakland',
    state: 'CA',
    price: 1800,
    listingType: 'rent',
    photos: [],
    bedrooms: 0,
    bathrooms: 1,
    sqft: 500,
  },
  {
    _id: 'demo-3',
    title: 'Spacious 3BR Family Home in Palo Alto',
    address: '850 Middlefield Road',
    city: 'Palo Alto',
    state: 'CA',
    price: 5500,
    listingType: 'rent',
    photos: [],
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
  },
  {
    _id: 'demo-4',
    title: 'Luxury 1BR Condo with Bay Views',
    address: '338 Spear Street',
    city: 'San Francisco',
    state: 'CA',
    price: 850000,
    listingType: 'sale',
    photos: [],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 780,
  },
  {
    _id: 'demo-5',
    title: 'Cozy 1BR near UC Berkeley Campus',
    address: '2530 Channing Way',
    city: 'Berkeley',
    state: 'CA',
    price: 1650,
    listingType: 'rent',
    photos: [],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
  },
  {
    _id: 'demo-6',
    title: 'Renovated 4BR Victorian in Noe Valley',
    address: '1100 Church Street',
    city: 'San Francisco',
    state: 'CA',
    price: 1250000,
    listingType: 'sale',
    photos: [],
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
  },
];

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [listingType, setListingType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (listingType) params.listingType = listingType;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (bedrooms) params.bedrooms = bedrooms;

      const res = await api.get('/api/listings', { params });
      setListings(res.data);
      setUsingDemo(false);
    } catch (err) {
      console.warn('Backend not available — showing demo listings');
      // Filter demo listings client-side
      let filtered = DEMO_LISTINGS;
      if (city) filtered = filtered.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
      if (listingType) filtered = filtered.filter(l => l.listingType === listingType);
      if (minPrice) filtered = filtered.filter(l => l.price >= Number(minPrice));
      if (maxPrice) filtered = filtered.filter(l => l.price <= Number(maxPrice));
      if (bedrooms) filtered = filtered.filter(l => l.bedrooms >= Number(bedrooms));
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(l =>
          l.title.toLowerCase().includes(s) ||
          l.city.toLowerCase().includes(s)
        );
      }
      setListings(filtered);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setListingType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setTimeout(fetchListings, 0);
  };

  const hasActiveFilters = city || listingType || minPrice || maxPrice || bedrooms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Find Your Next <span className="text-primary">Home</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse properties, get instantly screened, and ask our AI assistant anything about a listing.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, title, or keyword..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary/10 border-primary text-primary'
                : 'hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Any city"
                className="w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="$0"
                className="w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No max"
                className="w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Min Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>
          <button
            onClick={fetchListings}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Results */}
      {usingDemo && (
        <div className="max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
          Showing demo listings — connect the backend + MongoDB for live data.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <HomeIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No listings found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
