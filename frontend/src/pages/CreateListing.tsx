/**
 * CreateListing - 3-step listing creation wizard.
 *
 * Step 1: Property info (title, description, price, type, location, etc.)
 * Step 2: Photos (file upload via Vultr presigned URLs) and amenity selection
 * Step 3: Screening criteria (credit score, evictions, bankruptcy, criminal)
 *
 * On submit the assembled payload is POSTed to the backend via `createListing`.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";

import {
  ImagePlus,
  X,
  Upload,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createListing, uploadImages } from "@/lib/api";

/** Available amenity chips shown in Step 2. */
const AMENITY_OPTIONS = [
  "In-Unit Laundry",
  "Parking",
  "Gym",
  "Pool",
  "Rooftop Deck",
  "Concierge",
  "Smart Home",
  "Hardwood Floors",
  "Fireplace",
  "Backyard",
  "Garden",
  "Walk-In Closets",
  "Solar Panels",
  "Bike Storage",
  "Near Transit",
] as const;

/** Wizard step labels. */
const STEPS = ["Property Info", "Photos & Amenities", "Screening Criteria"];

/** Accepted image MIME types for the file picker. */
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";

export default function CreateListing() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);

  /* ------------------------------------------------------------------ */
  /*  Step 1 — Property Info                                            */
  /* ------------------------------------------------------------------ */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  /* ------------------------------------------------------------------ */
  /*  Step 2 — Photos & Amenities                                       */
  /* ------------------------------------------------------------------ */
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ------------------------------------------------------------------ */
  /*  Step 3 — Screening Criteria                                       */
  /* ------------------------------------------------------------------ */
  const [minCredit, setMinCredit] = useState("600");
  const [noEvictions, setNoEvictions] = useState(true);
  const [noBankruptcy, setNoBankruptcy] = useState(true);
  const [noCriminalRecord, setNoCriminalRecord] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  General UI state                                                   */
  /* ------------------------------------------------------------------ */
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Handle file input change — uploads all selected files to the backend.
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      setUploadProgress(10);
      const urls = await uploadImages(fileArray);
      setImageUrls((prev) => [...prev, ...urls]);
      setUploadProgress(100);
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /** Remove a photo from the list by index. */
  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  /** Toggle an amenity chip on/off. */
  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  /**
   * Submit the fully assembled listing payload to the backend.
   * On success the user is redirected to the dashboard.
   */
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      await createListing({
        title,
        description,
        price: Number(price),
        listingType,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: Number(sqft),
        address,
        city,
        state,
        photos: imageUrls,
        amenities,
        screeningCriteria: {
          minCreditScore: Number(minCredit),
          noEvictions,
          noBankruptcy,
          noCriminal: noCriminalRecord,
          noFraud: false,
        },
      });

      toast.success("Listing created successfully!");
      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message;
        toast.error(serverMsg || "Failed to create listing. Please try again.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Create New Listing
        </h1>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  i <= step
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className="h-px w-8 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* ----- Animated step panels ----- */}
        <AnimatePresence mode="wait">
          {/* ============================================================= */}
          {/*  Step 1 — Property Info                                       */}
          {/* ============================================================= */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-8 space-y-4"
            >
              {/* Listing type toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setListingType("rent")}
                  className={`rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    listingType === "rent"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  For Rent
                </button>
                <button
                  type="button"
                  onClick={() => setListingType("sale")}
                  className={`rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    listingType === "sale"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  For Sale
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  placeholder="Modern Downtown Loft"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Describe your property..."
                />
              </div>

              {/* Price + Sq Ft */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Price {listingType === "rent" ? "($/mo)" : "($)"}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Sq Ft
                  </label>
                  <input
                    type="number"
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Bedrooms + Bathrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="123 Main St"
                />
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    City
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    State
                  </label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="CA"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================= */}
          {/*  Step 2 — Photos & Amenities                                  */}
          {/* ============================================================= */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-8 space-y-6"
            >
              {/* Photos upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Photos
                </label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Upload button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Photos
                    </>
                  )}
                </Button>

                {/* Upload progress bar */}
                {uploading && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                )}

                {/* Photo grid */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-lg">
                      <img
                        src={url}
                        alt={`Property photo ${i + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length === 0 && !uploading && (
                    <div className="col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                      <p className="mt-2 text-xs">
                        Upload photos of your property
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenity chips */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        amenities.includes(a)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================= */}
          {/*  Step 3 — Screening Criteria                                  */}
          {/* ============================================================= */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-8 space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Set minimum requirements for applicant screening.
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Min Credit Score
                </label>
                <input
                  type="number"
                  value={minCredit}
                  onChange={(e) => setMinCredit(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noEvictions}
                    onChange={(e) => setNoEvictions(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    No prior evictions
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noBankruptcy}
                    onChange={(e) => setNoBankruptcy(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    No bankruptcy history
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noCriminalRecord}
                    onChange={(e) => setNoCriminalRecord(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    No criminal record
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----- Navigation ----- */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Listing"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
