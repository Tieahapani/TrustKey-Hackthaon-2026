/**
 * My Listings page — displays the authenticated seller's property listings
 * in a responsive card grid.
 *
 * Features:
 * - Auth guard: redirects to /login when unauthenticated
 * - Card grid with cover photos, property stats, and status badges
 * - Inline edit via Dialog for title, description, price, bed/bath/sqft
 * - Delete with AlertDialog confirmation
 * - Loading skeletons, empty state, staggered entrance animations
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchMyListings, updateListing, deleteListing, uploadImages } from "@/lib/api";
import type { Listing } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  Home,
  Bed,
  Bath,
  Maximize,
  Loader2,
  PlusCircle,
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AMENITY_OPTIONS = [
  "In-Unit Laundry", "Parking", "Gym", "Pool", "Rooftop Deck",
  "Concierge", "Smart Home", "Hardwood Floors", "Fireplace",
  "Backyard", "Garden", "Walk-In Closets", "Solar Panels",
  "Bike Storage", "Near Transit",
];

/* ------------------------------------------------------------------ */
/*  Currency formatter                                                 */
/* ------------------------------------------------------------------ */

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function ListingCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card overflow-hidden">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-6 w-1/3 rounded bg-muted" />
        <div className="flex gap-4 mt-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-9 w-20 rounded bg-muted" />
          <div className="h-9 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit form state type                                               */
/* ------------------------------------------------------------------ */

interface EditFormState {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  address: string;
  city: string;
  state: string;
  listingType: "rent" | "sale";
  status: "active" | "closed";
  photos: string[];
  amenities: string[];
  minCreditScore: string;
  noEvictions: boolean;
  noBankruptcy: boolean;
  noCriminal: boolean;
}

/* ------------------------------------------------------------------ */
/*  MyListings component                                               */
/* ------------------------------------------------------------------ */

export default function MyListings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  /* ----- Data state ----- */
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ----- Edit dialog state ----- */
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: "", description: "", price: "", bedrooms: "", bathrooms: "", sqft: "",
    address: "", city: "", state: "", listingType: "rent", status: "active",
    photos: [], amenities: [],
    minCreditScore: "600", noEvictions: true, noBankruptcy: true, noCriminal: true,
  });
  const [saving, setSaving] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  /* ----- Delete state ----- */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Auth guard                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* ---------------------------------------------------------------- */
  /*  Fetch listings                                                   */
  /* ---------------------------------------------------------------- */

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyListings();
      setListings(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load listings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadListings();
    }
  }, [isAuthenticated, loadListings]);

  /* ---------------------------------------------------------------- */
  /*  Edit handlers                                                    */
  /* ---------------------------------------------------------------- */

  const openEditDialog = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title,
      description: listing.description,
      price: String(listing.price),
      bedrooms: String(listing.bedrooms),
      bathrooms: String(listing.bathrooms),
      sqft: String(listing.sqft),
      address: listing.address || "",
      city: listing.city || "",
      state: listing.state || "",
      listingType: listing.listingType || "rent",
      status: listing.status || "active",
      photos: listing.photos || [],
      amenities: listing.amenities || [],
      minCreditScore: String(listing.screeningCriteria?.minCreditScore ?? 600),
      noEvictions: listing.screeningCriteria?.noEvictions ?? true,
      noBankruptcy: listing.screeningCriteria?.noBankruptcy ?? true,
      noCriminal: listing.screeningCriteria?.noCriminal ?? true,
    });
  };

  const handleEditPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setEditUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));
      setEditForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded`);
    } catch {
      toast.error("Failed to upload photos");
    } finally {
      setEditUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const removeEditPhoto = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const toggleEditAmenity = (amenity: string) => {
    setEditForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleEditSave = async () => {
    if (!editingListing) return;

    const price = Number(editForm.price);
    if (!editForm.title.trim()) { toast.error("Title is required"); return; }
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }

    setSaving(true);
    try {
      const updated = await updateListing(editingListing._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        price,
        bedrooms: Number(editForm.bedrooms),
        bathrooms: Number(editForm.bathrooms),
        sqft: Number(editForm.sqft),
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim(),
        listingType: editForm.listingType,
        status: editForm.status,
        photos: editForm.photos,
        amenities: editForm.amenities,
        screeningCriteria: {
          minCreditScore: Number(editForm.minCreditScore),
          noEvictions: editForm.noEvictions,
          noBankruptcy: editForm.noBankruptcy,
          noCriminal: editForm.noCriminal,
          noFraud: false,
        },
      });
      setListings((prev) =>
        prev.map((l) => (l._id === updated._id ? updated : l))
      );
      setEditingListing(null);
      toast.success("Listing updated successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update listing";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Delete handler                                                   */
  /* ---------------------------------------------------------------- */

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
      toast.success("Listing deleted successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete listing";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Framer Motion variants                                           */
  /* ---------------------------------------------------------------- */

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  /* ---------------------------------------------------------------- */
  /*  Don't render until auth state is resolved                        */
  /* ---------------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-10">
        {/* ------ Page header ------ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Listings
            </h1>
            {!loading && (
              <Badge variant="secondary" className="text-sm">
                {listings.length}
              </Badge>
            )}
          </div>
          <Button asChild>
            <Link to="/create-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Listing
            </Link>
          </Button>
        </div>

        {/* ------ Loading skeleton ------ */}
        {loading && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ------ Error state ------ */}
        {error && !loading && (
          <div className="mt-10 flex flex-col items-center gap-3 text-destructive">
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadListings}>
              Retry
            </Button>
          </div>
        )}

        {/* ------ Empty state ------ */}
        {!loading && !error && listings.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              You haven't created any listings yet
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start by creating your first property listing. It only takes a few
              minutes to get your property in front of potential buyers.
            </p>
            <Button asChild className="mt-2">
              <Link to="/create-listing">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Listing
              </Link>
            </Button>
          </div>
        )}

        {/* ------ Listing card grid ------ */}
        {!loading && !error && listings.length > 0 && (
          <motion.div
            className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {listings.map((listing) => (
              <motion.div key={listing._id} variants={cardVariants}>
                <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                  {/* Cover image */}
                  <div className="relative h-48 w-full bg-muted">
                    {listing.photos && listing.photos.length > 0 ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Status badge overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={
                          listing.status === "active"
                            ? "border-transparent bg-green-500/90 text-white hover:bg-green-500"
                            : "border-transparent bg-gray-500/90 text-white hover:bg-gray-500"
                        }
                      >
                        {listing.status === "active" ? "Active" : "Closed"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-lg">
                      {listing.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {listing.address}
                      {listing.city ? `, ${listing.city}` : ""}
                      {listing.state ? `, ${listing.state}` : ""}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price */}
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(listing.price)}
                      {listing.listingType === "rent" && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      )}
                    </p>

                    {/* Property stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{listing.bedrooms} bd</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{listing.bathrooms} ba</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4" />
                        <span>
                          {listing.sqft?.toLocaleString() ?? "—"} sqft
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(listing)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={deletingId === listing._id}
                          >
                            {deletingId === listing._id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Listing
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &ldquo;
                              {listing.title}&rdquo;? This action cannot be
                              undone and all associated data will be permanently
                              removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(listing._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ------ Edit Dialog ------ */}
        <Dialog
          open={!!editingListing}
          onOpenChange={(open) => {
            if (!open) setEditingListing(null);
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Listing</DialogTitle>
              <DialogDescription>Update any details about your listing.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              {/* Listing Type + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Listing Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, listingType: "rent" }))}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${editForm.listingType === "rent" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                      For Rent
                    </button>
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, listingType: "sale" }))}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${editForm.listingType === "sale" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                      For Sale
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, status: "active" }))}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${editForm.status === "active" ? "border-green-500 bg-green-500/5 text-green-600" : "border-border text-muted-foreground"}`}>
                      Active
                    </button>
                    <button type="button" onClick={() => setEditForm((p) => ({ ...p, status: "closed" }))}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${editForm.status === "closed" ? "border-gray-500 bg-gray-500/5 text-gray-600" : "border-border text-muted-foreground"}`}>
                      Closed
                    </button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Property title" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Property description" rows={3} />
              </div>

              {/* Price + Sqft */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price ($){editForm.listingType === "rent" ? "/mo" : ""}</Label>
                  <Input id="edit-price" type="number" min="0" value={editForm.price}
                    onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sqft">Sq Ft</Label>
                  <Input id="edit-sqft" type="number" min="0" value={editForm.sqft}
                    onChange={(e) => setEditForm((p) => ({ ...p, sqft: e.target.value }))} />
                </div>
              </div>

              {/* Bed + Bath */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                  <Input id="edit-bedrooms" type="number" min="0" value={editForm.bedrooms}
                    onChange={(e) => setEditForm((p) => ({ ...p, bedrooms: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                  <Input id="edit-bathrooms" type="number" min="0" value={editForm.bathrooms}
                    onChange={(e) => setEditForm((p) => ({ ...p, bathrooms: e.target.value }))} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="123 Main St" />
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" value={editForm.city}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" value={editForm.state}
                    onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="CA" />
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <Label>Photos</Label>
                <input ref={editFileInputRef} type="file" accept="image/*" multiple
                  onChange={handleEditPhotoUpload} className="hidden" />
                <Button type="button" variant="outline" size="sm" disabled={editUploading}
                  onClick={() => editFileInputRef.current?.click()} className="w-full">
                  {editUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" />Add Photos</>
                  )}
                </Button>
                {editForm.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {editForm.photos.map((url, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-lg">
                        <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
                        <button type="button" onClick={() => removeEditPhoto(i)}
                          className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleEditAmenity(a)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        editForm.amenities.includes(a)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screening Criteria */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <Label className="text-sm font-semibold">Screening Criteria</Label>
                <div className="space-y-2">
                  <Label htmlFor="edit-credit" className="text-xs">Min Credit Score</Label>
                  <Input id="edit-credit" type="number" min="300" max="850" value={editForm.minCreditScore}
                    onChange={(e) => setEditForm((p) => ({ ...p, minCreditScore: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  {[
                    { key: "noEvictions" as const, label: "No prior evictions" },
                    { key: "noBankruptcy" as const, label: "No bankruptcy history" },
                    { key: "noCriminal" as const, label: "No criminal record" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editForm[key]}
                        onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-input accent-primary" />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingListing(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
