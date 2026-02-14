import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, DollarSign,
  CheckCircle, ShieldCheck, MessageSquare,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import PropertyChat from '@/components/PropertyChat';
import api from '@/lib/api';

interface Listing {
  _id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  price: number;
  listingType: 'rent' | 'sale';
  photos: string[];
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  propertyDetails: string;
  screeningCriteria: {
    minCreditScore: number;
    minIncomeMultiplier: number;
    noEvictions: boolean;
    noBankruptcy: boolean;
  };
  sellerId: { _id: string; name: string; email: string; phone: string };
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyResult, setApplyResult] = useState<any>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get(`/api/listings/${id}`);
        setListing(res.data);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await api.post('/api/applications', {
        listingId: id,
        consent: true,
      });
      setApplyResult(res.data);
      setApplied(true);
      setShowConsent(false);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setApplied(true);
      }
      alert(err?.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!listing) return null;

  const placeholderImg = `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(listing.title.slice(0, 20))}`;
  const displayPhotos = listing.photos.length > 0 ? listing.photos : [placeholderImg];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photos + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              <img
                src={displayPhotos[selectedPhoto]}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImg;
                }}
              />
            </div>
            {displayPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {displayPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedPhoto ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <span className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {listing.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              {listing.address}, {listing.city}, {listing.state}
            </div>

            <p className="text-3xl font-bold text-primary mb-6">
              {formatPrice(listing.price)}
              {listing.listingType === 'rent' && (
                <span className="text-base font-normal text-muted-foreground">/month</span>
              )}
            </p>

            <div className="flex gap-6 mb-6 py-4 border-y">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{listing.bedrooms}</span>
                <span className="text-muted-foreground">Beds</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{listing.bathrooms}</span>
                <span className="text-muted-foreground">Baths</span>
              </div>
              {listing.sqft > 0 && (
                <div className="flex items-center gap-2">
                  <Maximize className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{listing.sqft.toLocaleString()}</span>
                  <span className="text-muted-foreground">sqft</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-muted"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {listing.propertyDetails && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Additional Details</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {listing.propertyDetails}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Apply Card */}
          {profile?.role === 'buyer' && (
            <div className="border rounded-xl p-5 bg-card sticky top-20">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Apply to this Listing
              </h3>

              {applied && applyResult ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-600 font-medium">Application submitted!</p>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-1">Your Match Score</p>
                    <p className={`text-3xl font-bold ${
                      applyResult.matchColor === 'green' ? 'text-emerald-600' :
                      applyResult.matchColor === 'yellow' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {applyResult.matchScore}%
                    </p>
                  </div>
                </div>
              ) : applied ? (
                <p className="text-sm text-muted-foreground">You have already applied to this listing.</p>
              ) : showConsent ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    By applying, you consent to a credit check via CRS Credit API.
                    Your credit score, income, and background will be compared against the seller's criteria.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {applying ? 'Screening...' : 'I Consent — Apply'}
                    </button>
                    <button
                      onClick={() => setShowConsent(false)}
                      className="px-4 py-2 rounded-lg border text-sm hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConsent(true)}
                  className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          )}

          {/* Screening Requirements */}
          <div className="border rounded-xl p-5 bg-card">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Screening Requirements
            </h3>
            <ul className="space-y-2 text-sm">
              {listing.screeningCriteria.minCreditScore > 0 && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Min Credit Score</span>
                  <span className="font-medium">{listing.screeningCriteria.minCreditScore}</span>
                </li>
              )}
              {listing.screeningCriteria.minIncomeMultiplier > 0 && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Income Requirement</span>
                  <span className="font-medium">{listing.screeningCriteria.minIncomeMultiplier}x rent</span>
                </li>
              )}
              <li className="flex justify-between">
                <span className="text-muted-foreground">No Evictions</span>
                <span className="font-medium">{listing.screeningCriteria.noEvictions ? 'Required' : 'Not required'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">No Bankruptcy</span>
                <span className="font-medium">{listing.screeningCriteria.noBankruptcy ? 'Required' : 'Not required'}</span>
              </li>
            </ul>
          </div>

          {/* AI Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            {showChat ? 'Hide AI Assistant' : 'Ask AI About This Property'}
          </button>

          {/* Chat Widget */}
          {showChat && listing && (
            <PropertyChat listingId={listing._id} listingTitle={listing.title} />
          )}
        </div>
      </div>
    </div>
  );
}
