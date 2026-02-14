import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ScreeningBadge from '@/components/ScreeningBadge';
import {
  LayoutDashboard, Plus, ChevronDown, ChevronUp,
  User, Mail, Phone, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';

interface SellerListing {
  _id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  listingType: 'rent' | 'sale';
  status: string;
  photos: string[];
}

interface Applicant {
  _id: string;
  buyerId: { _id: string; name: string; email: string; phone: string };
  matchScore: number;
  matchColor: 'green' | 'yellow' | 'red';
  matchBreakdown: {
    creditScore: { passed: boolean; detail: string };
    income: { passed: boolean; detail: string };
    evictions: { passed: boolean; detail: string };
    bankruptcy: { passed: boolean; detail: string };
  };
  status: string;
  screenedAt: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});
  const [loadingApplicants, setLoadingApplicants] = useState<string | null>(null);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await api.get('/api/listings/seller/mine');
      setListings(res.data);
      if (res.data.length > 0) {
        const firstId = res.data[0]._id;
        setSelectedListing(firstId);
        fetchApplicants(firstId);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (listingId: string) => {
    if (applicants[listingId]) return;
    setLoadingApplicants(listingId);
    try {
      const res = await api.get(`/api/applications/listing/${listingId}`);
      setApplicants((prev) => ({ ...prev, [listingId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoadingApplicants(null);
    }
  };

  const handleSelectListing = (id: string) => {
    setSelectedListing(id);
    fetchApplicants(id);
  };

  const handleStatusChange = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/api/applications/${applicationId}/status`, { status });
      // Refresh applicants
      if (selectedListing) {
        const res = await api.get(`/api/applications/listing/${selectedListing}`);
        setApplicants((prev) => ({ ...prev, [selectedListing!]: res.data }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!profile || profile.role !== 'seller') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Seller Access Only</h2>
        <p className="text-muted-foreground">Log in as a seller to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentApplicants = selectedListing ? applicants[selectedListing] || [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Seller Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your listings and review applicants</p>
        </div>
        <Link
          to="/create-listing"
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 border rounded-xl">
          <LayoutDashboard className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
          <p className="text-muted-foreground mb-4">Create your first property listing to get started.</p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
          >
            <Plus className="w-4 h-4" /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Listings sidebar */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Listings</h3>
            {listings.map((listing) => (
              <button
                key={listing._id}
                onClick={() => handleSelectListing(listing._id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedListing === listing._id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium text-sm truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground">
                  {listing.city}, {listing.state} - {formatPrice(listing.price)}
                  {listing.listingType === 'rent' ? '/mo' : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Applicants panel */}
          <div className="lg:col-span-3">
            {selectedListing && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Applicants ({currentApplicants.length})
                  </h3>
                </div>

                {loadingApplicants === selectedListing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                  </div>
                ) : currentApplicants.length === 0 ? (
                  <div className="text-center py-12 border rounded-xl">
                    <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No applicants yet for this listing.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentApplicants.map((app) => (
                      <div key={app._id} className="border rounded-xl overflow-hidden">
                        {/* Applicant Header */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandedApplicant(expandedApplicant === app._id ? null : app._id)
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{app.buyerId?.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {app.buyerId?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <ScreeningBadge score={app.matchScore} color={app.matchColor} />

                            {app.status === 'screened' ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(app._id, 'approved');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(app._id, 'rejected');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  app.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : app.status === 'rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            )}

                            {expandedApplicant === app._id ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedApplicant === app._id && (
                          <div className="px-4 pb-4 border-t bg-muted/30">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                              {Object.entries(app.matchBreakdown).map(([key, val]) => (
                                <div key={key} className="p-3 rounded-lg bg-background border">
                                  <div className="flex items-center gap-1 mb-1">
                                    {val.passed ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-xs font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{val.detail}</p>
                                </div>
                              ))}
                            </div>
                            {app.buyerId?.phone && (
                              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {app.buyerId.phone}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Applied {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
