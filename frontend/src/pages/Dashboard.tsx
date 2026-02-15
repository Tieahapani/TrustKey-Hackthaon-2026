/**
 * Seller Dashboard page.
 *
 * Displays the authenticated seller's listings and the applications
 * associated with each listing.  All data is fetched from the backend
 * API — no mock data is used.
 *
 * Key features:
 * - Listing selector to switch between the seller's properties
 * - Animated stat cards (total applicants, approved, rejected)
 * - Expandable applicant rows with an animated TrustKey score meter
 * - One-click approve / reject with optimistic UI + confetti on approval
 * - Loading skeletons and error states for every async operation
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  fetchMyListings,
  fetchApplications,
  updateApplicationStatus,
} from "@/lib/api";
import type { Listing, Application } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Home,
  Scale,
  Fingerprint,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  AnimatedNumber — eased counter that rolls from 0 to `value`       */
/* ------------------------------------------------------------------ */

/**
 * Renders a number that animates from 0 to the target value using an
 * ease-out cubic curve.  Re-triggers whenever `value` changes.
 */
function AnimatedNumber({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

/* ------------------------------------------------------------------ */
/*  Helper — resolve populated buyerId to display-friendly strings    */
/* ------------------------------------------------------------------ */

/**
 * Extracts the applicant's display name from a populated `buyerId`
 * object.  Falls back to `buyerInfo` fields or a placeholder when the
 * buyer reference is a plain string (not populated).
 */
function getApplicantName(app: Application): string {
  if (typeof app.buyerId === "object" && app.buyerId !== null) {
    return app.buyerId.name;
  }
  if (app.buyerInfo) {
    return `${app.buyerInfo.firstName} ${app.buyerInfo.lastName}`.trim();
  }
  return "Unknown Applicant";
}

/**
 * Extracts the applicant's email from a populated `buyerId` object.
 * Falls back to `buyerInfo.email` or a placeholder.
 */
function getApplicantEmail(app: Application): string {
  if (typeof app.buyerId === "object" && app.buyerId !== null) {
    return app.buyerId.email;
  }
  if (app.buyerInfo?.email) {
    return app.buyerInfo.email;
  }
  return "—";
}

/**
 * Returns initials (up to 2 characters) derived from the applicant's
 * display name.
 */
function getApplicantInitials(app: Application): string {
  const name = getApplicantName(app);
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Helper — map matchColor from the backend to Tailwind stroke class */
/* ------------------------------------------------------------------ */

/**
 * Resolves the Tailwind CSS stroke class for the TrustKey score ring
 * using the `matchColor` field returned by the backend.  Falls back to
 * a threshold-based heuristic when `matchColor` is absent.
 */
function getScoreStrokeClass(app: Application): string {
  if (app.matchColor === "green") return "stroke-screening-green";
  if (app.matchColor === "yellow") return "stroke-screening-yellow";
  if (app.matchColor === "red") return "stroke-screening-red";

  // Fallback: derive from numeric score
  if (app.matchScore >= 75) return "stroke-screening-green";
  if (app.matchScore >= 50) return "stroke-screening-yellow";
  return "stroke-screening-red";
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader for the applicant list                            */
/* ------------------------------------------------------------------ */

/** Pulsing placeholder rows shown while applications are loading. */
function ApplicationsSkeleton() {
  return (
    <div className="mt-8 space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-card to-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard component                                               */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  /* ----- Listings state ----- */
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  /** The currently selected listing whose applications are shown. */
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  /* ----- Applications state ----- */
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  /** Which applicant row is expanded (by `_id`). */
  const [expanded, setExpanded] = useState<string | null>(null);

  /** Set of application `_id`s that are currently being updated. */
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  /* ---------------------------------------------------------------- */
  /*  Fetch seller's listings on mount                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const load = async () => {
      setListingsLoading(true);
      setListingsError(null);
      try {
        const data = await fetchMyListings();
        if (cancelled) return;
        setListings(data);
        // Auto-select the first listing if available
        if (data.length > 0) {
          setSelectedListingId(data[0]._id);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load listings";
        setListingsError(message);
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ---------------------------------------------------------------- */
  /*  Fetch applications whenever the selected listing changes        */
  /* ---------------------------------------------------------------- */

  const loadApplications = useCallback(async (listingId: string) => {
    setAppsLoading(true);
    setAppsError(null);
    setExpanded(null);
    try {
      const data = await fetchApplications(listingId);
      setApplications(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load applications";
      setAppsError(message);
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedListingId) {
      loadApplications(selectedListingId);
    } else {
      setApplications([]);
    }
  }, [selectedListingId, loadApplications]);

  /* ---------------------------------------------------------------- */
  /*  Approve / Reject handler                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Sends a PATCH request to update the application status.  Applies an
   * optimistic update so the UI feels instant, then rolls back on
   * failure.
   */
  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    // Prevent duplicate clicks
    if (updatingIds.has(id)) return;

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status } : a)),
    );
    setUpdatingIds((prev) => new Set(prev).add(id));

    try {
      await updateApplicationStatus(id, status);

      toast.success(`Application ${status}`);
    } catch (err: unknown) {
      // Roll back optimistic update
      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "pending" as const } : a)),
      );
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Derived values                                                  */
  /* ---------------------------------------------------------------- */

  const approvedCount = applications.filter(
    (a) => a.status === "approved",
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.status === "rejected",
  ).length;

  /** The listing object for the currently selected listing. */
  const selectedListing = listings.find((l) => l._id === selectedListingId);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-foreground text-center">
          Seller Dashboard
        </h1>

        {/* -------------------------------------------------------- */}
        {/*  Listings loading / error states                         */}
        {/* -------------------------------------------------------- */}

        {listingsLoading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your listings...</span>
          </div>
        )}

        {listingsError && (
          <div className="mt-10 flex flex-col items-center gap-2 text-screening-red">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm">{listingsError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {!listingsLoading && !listingsError && listings.length === 0 && (
          <div className="mt-10 py-12 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm">
              You have no listings yet. Create one to start receiving
              applications.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Listing selector                                        */}
        {/* -------------------------------------------------------- */}

        {!listingsLoading && listings.length > 0 && (
          <>
            {listings.length > 1 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {listings.map((listing) => (
                  <button
                    key={listing._id}
                    onClick={() => setSelectedListingId(listing._id)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedListingId === listing._id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {listing.title}
                  </button>
                ))}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/*  Stat cards                                          */}
            {/* ---------------------------------------------------- */}

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 card-shadow">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-4 w-4" /> Applicants
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  <AnimatedNumber value={applications.length} />
                </p>
              </div>

              <div className="rounded-xl border border-screening-green/20 bg-gradient-to-br from-screening-green/5 to-screening-green/10 p-4 card-shadow">
                <div className="flex items-center gap-2 text-screening-green">
                  <CheckCircle2 className="h-4 w-4" /> Approved
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  <AnimatedNumber value={approvedCount} />
                </p>
              </div>

              <div className="rounded-xl border border-screening-red/20 bg-gradient-to-br from-screening-red/5 to-screening-red/10 p-4 card-shadow">
                <div className="flex items-center gap-2 text-screening-red">
                  <XCircle className="h-4 w-4" /> Rejected
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  <AnimatedNumber value={rejectedCount} />
                </p>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/*  Applications list                                   */}
            {/* ---------------------------------------------------- */}

            {appsLoading && <ApplicationsSkeleton />}

            {appsError && (
              <div className="mt-8 flex flex-col items-center gap-2 text-screening-red">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">{appsError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    selectedListingId &&
                    loadApplications(selectedListingId)
                  }
                >
                  Retry
                </Button>
              </div>
            )}

            {!appsLoading && !appsError && (
              <div className="mt-8 space-y-3">
                {applications.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm">
                      No applicants yet for{" "}
                      {selectedListing
                        ? `"${selectedListing.title}"`
                        : "this listing"}
                      .
                    </p>
                  </div>
                ) : (
                  applications.map((app) => {
                    const isExpanded = expanded === app._id;
                    const dashLen = (app.matchScore / 100) * 264;
                    const isUpdating = updatingIds.has(app._id);

                    return (
                      <div
                        key={app._id}
                        className="overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-card to-card card-shadow"
                      >
                        {/* ---- Row header (always visible) ---- */}
                        <button
                          onClick={() =>
                            setExpanded(isExpanded ? null : app._id)
                          }
                          className="flex w-full items-center justify-between p-4 text-left"
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar initials */}
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm text-white bg-foreground"
                            >
                              {getApplicantInitials(app)}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {getApplicantName(app)}
                                </p>
                                {selectedListing && (
                                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                    {selectedListing.title}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {getApplicantEmail(app)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                app.status === "approved"
                                  ? "bg-screening-green-bg text-screening-green"
                                  : app.status === "rejected"
                                    ? "bg-screening-red-bg text-screening-red"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {app.status}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* ---- Expandable detail panel ---- */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border px-4 pb-4 pt-3">
                                {/* ── FBI Alert Banner ── */}
                                {app.crsData?.fbiMostWanted?.matchFound && (
                                  <div className="mb-4 rounded-lg border border-screening-red/30 bg-screening-red/10 p-3">
                                    <div className="flex items-center gap-2 text-screening-red font-semibold text-sm">
                                      <ShieldAlert className="h-4 w-4" />
                                      FBI Most Wanted Match
                                    </div>
                                    <p className="mt-1 text-xs text-screening-red/80">
                                      {app.crsData.fbiMostWanted.matchCount} result(s) found for "{app.crsData.fbiMostWanted.searchedName}"
                                    </p>
                                    {app.crsData.fbiMostWanted.crimes?.slice(0, 2).map((crime, ci) => (
                                      <div key={ci} className="mt-1.5 rounded bg-screening-red/5 px-2 py-1 text-xs text-foreground">
                                        <span className="font-medium">{crime.name}</span>
                                        {crime.description && (
                                          <span className="text-muted-foreground"> — {crime.description}</span>
                                        )}
                                      </div>
                                    ))}
                                    {(app.crsData.fbiMostWanted.crimes?.length ?? 0) > 2 && (
                                      <p className="mt-1 text-[11px] text-muted-foreground">
                                        +{app.crsData.fbiMostWanted.crimes.length - 2} more result(s)
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-col lg:flex-row items-start gap-6">
                                  {/* ── Animated Circular TrustKey Score Meter ── */}
                                  <div className="flex flex-col items-center self-center lg:self-start">
                                    <div className="relative h-28 w-28">
                                      <svg
                                        viewBox="0 0 100 100"
                                        className="h-full w-full -rotate-90"
                                      >
                                        <circle
                                          cx="50"
                                          cy="50"
                                          r="42"
                                          fill="none"
                                          strokeWidth="8"
                                          className="stroke-muted/30"
                                        />
                                        <motion.circle
                                          cx="50"
                                          cy="50"
                                          r="42"
                                          fill="none"
                                          strokeWidth="8"
                                          strokeLinecap="round"
                                          className={getScoreStrokeClass(app)}
                                          initial={{
                                            strokeDasharray: "0 264",
                                          }}
                                          animate={{
                                            strokeDasharray: `${dashLen} 264`,
                                          }}
                                          transition={{
                                            duration: 1.2,
                                            ease: "easeOut",
                                          }}
                                          key={app._id + "-meter"}
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-display text-2xl font-bold text-foreground">
                                          {app.matchScore}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          / 100
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                                      TrustKey Score
                                    </p>
                                    {app.screenedAt && (
                                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                        <Clock className="h-2.5 w-2.5" />
                                        {new Date(app.screenedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>

                                  {/* ── CRS Screening Data Grid ── */}
                                  <div className="flex-1 w-full">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {/* Credit Score */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <CreditCard className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Credit Score</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          (app.crsData?.creditScore ?? 0) >= 700
                                            ? "text-screening-green"
                                            : (app.crsData?.creditScore ?? 0) >= 600
                                              ? "text-screening-yellow"
                                              : "text-screening-red"
                                        }`}>
                                          {app.crsData?.creditScore ?? "—"}
                                        </p>
                                      </div>

                                      {/* Evictions */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <Home className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Evictions</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          (app.crsData?.evictions ?? 0) === 0
                                            ? "text-screening-green"
                                            : "text-screening-red"
                                        }`}>
                                          {app.crsData?.evictions ?? "—"}
                                        </p>
                                      </div>

                                      {/* Bankruptcies */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <Scale className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Bankruptcies</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          (app.crsData?.bankruptcies ?? 0) === 0
                                            ? "text-screening-green"
                                            : "text-screening-red"
                                        }`}>
                                          {app.crsData?.bankruptcies ?? "—"}
                                        </p>
                                      </div>

                                      {/* Criminal Offenses */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Criminal Offenses</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          (app.crsData?.criminalOffenses ?? 0) === 0
                                            ? "text-screening-green"
                                            : "text-screening-red"
                                        }`}>
                                          {app.crsData?.criminalOffenses ?? "—"}
                                        </p>
                                      </div>

                                      {/* Fraud Risk */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <ShieldAlert className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Fraud Risk</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          (app.crsData?.fraudRiskScore ?? 0) <= 3
                                            ? "text-screening-green"
                                            : "text-screening-red"
                                        }`}>
                                          {app.crsData?.fraudRiskScore != null
                                            ? `${app.crsData.fraudRiskScore}/10`
                                            : "—"}
                                        </p>
                                      </div>

                                      {/* Identity Verified */}
                                      <div className="rounded-lg border border-border bg-card p-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                          <Fingerprint className="h-3.5 w-3.5" />
                                          <span className="text-[11px] font-medium">Identity</span>
                                        </div>
                                        <p className={`mt-1 text-lg font-bold ${
                                          app.crsData?.identityVerified
                                            ? "text-screening-green"
                                            : "text-screening-yellow"
                                        }`}>
                                          {app.crsData?.identityVerified ? "Verified" : "Unverified"}
                                        </p>
                                      </div>
                                    </div>

                                    {/* ── FBI Check Status ── */}
                                    {app.crsData?.fbiMostWanted && !app.crsData.fbiMostWanted.matchFound && (
                                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-screening-green/20 bg-screening-green/5 px-3 py-2">
                                        <ShieldCheck className="h-4 w-4 text-screening-green" />
                                        <span className="text-xs font-medium text-screening-green">
                                          FBI Most Wanted — Clear
                                        </span>
                                      </div>
                                    )}

                                    {/* ── Match Breakdown ── */}
                                    {app.matchBreakdown && Object.keys(app.matchBreakdown).length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                          Screening Breakdown
                                        </p>
                                        <div className="space-y-1">
                                          {Object.entries(app.matchBreakdown)
                                            .filter(([key]) => key !== "fbiMostWanted")
                                            .map(([key, item]) => (
                                            <div
                                              key={key}
                                              className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs"
                                            >
                                              <div className="flex items-center gap-2">
                                                {item.passed ? (
                                                  <CheckCircle2 className="h-3.5 w-3.5 text-screening-green" />
                                                ) : (
                                                  <XCircle className="h-3.5 w-3.5 text-screening-red" />
                                                )}
                                                <span className="capitalize font-medium text-foreground">
                                                  {key === "creditScore"
                                                    ? "Credit Score"
                                                    : key === "bankruptcy"
                                                      ? "Bankruptcy"
                                                      : key === "criminal"
                                                        ? "Criminal"
                                                        : key === "fraud"
                                                          ? "Fraud Risk"
                                                          : key.charAt(0).toUpperCase() + key.slice(1)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground">
                                                  {item.detail}
                                                </span>
                                                {item.maxPoints > 0 && (
                                                  <span className={`font-semibold ${
                                                    item.passed ? "text-screening-green" : "text-screening-red"
                                                  }`}>
                                                    {item.points}/{item.maxPoints}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* ── Approve / Reject buttons ── */}
                                {(app.status === "pending" ||
                                  app.status === "screened") && (
                                  <div className="mt-4 flex gap-2">
                                    <Button
                                      size="sm"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleStatusUpdate(
                                          app._id,
                                          "approved",
                                        )
                                      }
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="mr-1 h-4 w-4" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleStatusUpdate(
                                          app._id,
                                          "rejected",
                                        )
                                      }
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="mr-1 h-4 w-4" />
                                      )}
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
