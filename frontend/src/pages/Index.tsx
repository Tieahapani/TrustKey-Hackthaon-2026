/**
 * Home page — hero section with rotating images, smart search bar,
 * filter chips, and listing grid. Fetches listings from the backend API.
 */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Home as HomeIcon,
  Building2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/ListingCard";
import ListingSkeleton from "@/components/ListingSkeleton";
import { fetchListings, type Listing } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { matchesSearch, getMatchingCities } from "@/lib/city-aliases";

const heroImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop",
];

const cities = [
  "All",
  "Austin",
  "Portland",
  "Miami",
  "Denver",
  "San Francisco",
  "Charlotte",
];

export default function Index() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [listingType, setListingType] = useState<"all" | "rent" | "sale">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  // Rotate hero images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch listings once on mount
  useEffect(() => {
    setLoading(true);
    fetchListings()
      .then(setListings)
      .catch((err) => console.error("Failed to fetch listings:", err))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filtering on search, city, and listing type
  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const searchable = { ...l, id: l._id, images: l.photos };
      if (search && !matchesSearch(search, searchable as any)) return false;
      if (city !== "All" && l.city !== city) return false;
      if (listingType !== "all" && l.listingType !== listingType) return false;
      return true;
    });
  }, [search, city, listingType, listings]);

  // Suggestions for the search dropdown
  const suggestions = useMemo(() => {
    if (!search.trim()) return { cities: [] as string[], listings: [] as Listing[] };
    const matchedCities = getMatchingCities(search);
    const matchedListings = listings
      .filter((l) => matchesSearch(search, { ...l, id: l._id, images: l.photos } as any))
      .slice(0, 4);
    return { cities: matchedCities.slice(0, 3), listings: matchedListings };
  }, [search, listings]);

  const hasSuggestions = suggestions.cities.length > 0 || suggestions.listings.length > 0;

  const handleFocus = () => {
    clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  };
  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150);
  };
  const selectCity = (c: string) => {
    setCity(c);
    setSearch("");
    setShowSuggestions(false);
  };
  const selectListing = (id: string) => {
    setShowSuggestions(false);
    navigate(`/listing/${id}`);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "520px" }}>
        <AnimatePresence mode="popLayout">
          <motion.img
            key={heroIndex}
            src={heroImages[heroIndex]}
            alt="Luxury home"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </AnimatePresence>
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          >
            Find Your Perfect Home
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 text-lg text-white/90"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          >
            AI-powered screening, instant credit checks, and a smart assistant for every listing.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative mt-8"
          >
            <div className="flex items-center overflow-hidden rounded-xl bg-card shadow-2xl">
              <div className="flex flex-1 items-center gap-2 px-4">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === "Escape" && setShowSuggestions(false)}
                  placeholder="Search by city, zip code, or address..."
                  className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setShowSuggestions(false); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button size="lg" className="m-1.5 shrink-0 rounded-lg" onClick={() => setShowSuggestions(false)}>
                Search
              </Button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && hasSuggestions && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {suggestions.cities.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Cities</p>
                    {suggestions.cities.map((c) => (
                      <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => selectCity(c)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.listings.length > 0 && (
                  <div className="border-t border-border p-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Listings</p>
                    {suggestions.listings.map((l) => (
                      <button key={l._id} onMouseDown={(e) => e.preventDefault()} onClick={() => selectListing(l._id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent">
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{l.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{l.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Filters + Listings */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <button onClick={() => setListingType("all")} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${listingType === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              All
            </button>
            <button onClick={() => setListingType("rent")} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${listingType === "rent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Building2 className="h-3 w-3" /> Rent
            </button>
            <button onClick={() => setListingType("sale")} className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${listingType === "sale" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <HomeIcon className="h-3 w-3" /> Buy
            </button>
          </div>

          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground md:hidden">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>

          <div className={`flex flex-wrap gap-2 ${filtersOpen ? "flex" : "hidden md:flex"}`}>
            {cities.map((c) => (
              <button key={c} onClick={() => setCity(c)} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${city === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {c !== "All" && <MapPin className="h-3 w-3" />}
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 font-display text-xl font-semibold text-foreground">No listings found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCity("All"); setListingType("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing, i) => (
              <ListingCard key={listing._id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
