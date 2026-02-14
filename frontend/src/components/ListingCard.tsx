import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ListingCardProps {
  listing: {
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
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const placeholderImg = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(listing.title.slice(0, 20))}`;

  return (
    <Link
      to={`/listing/${listing._id}`}
      className="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
        <img
          src={listing.photos?.[0] || placeholderImg}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImg;
          }}
        />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-foreground backdrop-blur-sm">
          {listing.listingType === 'rent' ? 'For Rent' : 'For Sale'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-semibold text-lg text-foreground truncate pr-2">
            {listing.title}
          </h3>
        </div>

        <p className="text-2xl font-bold text-primary mb-2">
          {formatPrice(listing.price)}
          {listing.listingType === 'rent' && (
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          )}
        </p>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{listing.city}, {listing.state}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            {listing.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            {listing.bathrooms} ba
          </span>
          {listing.sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {listing.sqft.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
