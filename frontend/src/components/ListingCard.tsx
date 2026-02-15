/**
 * Listing card — displays a single property in the browse grid.
 * Uses backend Listing type (_id, photos) instead of Lovable mock shape.
 */
import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";
import type { Listing } from "@/lib/api";
import { motion } from "framer-motion";

interface Props {
  listing: Listing;
  index?: number;
}

const PLACEHOLDER = "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image";

export default function ListingCard({ listing, index = 0 }: Props) {
  const priceLabel =
    listing.listingType === "rent"
      ? `$${listing.price.toLocaleString()}/mo`
      : `$${listing.price.toLocaleString()}`;

  const thumbnail = listing.photos?.[0] || PLACEHOLDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/listing/${listing._id}`} className="group block">
        <div className="overflow-hidden rounded-xl bg-card card-shadow transition-shadow duration-300 hover:card-shadow-hover">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={thumbnail}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER;
              }}
            />
            <div className="absolute top-3 left-3">
              <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                For {listing.listingType === "rent" ? "Rent" : "Sale"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="font-display text-xl font-semibold text-foreground">{priceLabel}</p>
            <h3 className="mt-1 text-sm font-medium text-foreground line-clamp-1">{listing.title}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {listing.address}, {listing.city}, {listing.state}
            </div>

            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {listing.bedrooms} bd</span>
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {listing.bathrooms} ba</span>
              <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {listing.sqft.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
