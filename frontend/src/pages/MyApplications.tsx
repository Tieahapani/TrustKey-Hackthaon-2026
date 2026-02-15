/**
 * My Applications page (buyer view).
 *
 * Displays the current buyer's submitted applications with listing
 * thumbnails, color-coded status badges, circular match-score
 * indicators, CRS data summaries, and a withdraw-with-confirmation
 * flow.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Home,
  Loader2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { fetchMyApplications, withdrawApplication, resolveImageUrl } from "@/lib/api";
import type { Application } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLACEHOLDER =
  "https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Type-guard: true when `listingId` has been populated as an object. */
function isPopulatedListing(
  val: Application["listingId"],
): val is { _id: string; title: string; address: string; city: string; price: number; photos: string[] } {
  return typeof val === "object" && val !== null && "_id" in val;
}

/** Map application status to a Tailwind badge colour scheme. */
function statusBadgeClasses(status: Application["status"]): string {
  switch (status) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "screened":
      return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Pick the correct icon for a given status. */
function StatusIcon({ status }: { status: Application["status"] }) {
  switch (status) {
    case "pending":
      return <Clock className="h-3.5 w-3.5" />;
    case "screened":
      return <Shield className="h-3.5 w-3.5" />;
    case "approved":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "rejected":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

/** Tailwind stroke class for the circular score ring. */
function scoreStrokeClass(color: Application["matchColor"]): string {
  if (color === "green") return "stroke-green-500";
  if (color === "yellow") return "stroke-amber-500";
  return "stroke-red-500";
}

/** Tailwind text class for the numeric score display. */
function scoreTextClass(color: Application["matchColor"]): string {
  if (color === "green") return "text-green-600 dark:text-green-400";
  if (color === "yellow") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/** Format an ISO date string to a readable form. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row animate-pulse">
              <Skeleton className="h-48 w-full sm:h-auto sm:w-48 rounded-none" />
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-4 w-2/5" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Circular match-score indicator                                     */
/* ------------------------------------------------------------------ */

function MatchScoreRing({
  score,
  color,
}: {
  score: number;
  color: Application["matchColor"];
}) {
  const circumference = 2 * Math.PI * 38; // r = 38
  const dashLen = (score / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          strokeWidth="7"
          className="stroke-muted/30"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={scoreStrokeClass(color)}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dashLen} ${circumference}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-bold leading-none ${scoreTextClass(color)}`}>
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function MyApplications() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** The application currently targeted for withdrawal. */
  const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Auth guard                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* ---------------------------------------------------------------- */
  /*  Fetch applications on mount                                      */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyApplications();
        if (!cancelled) setApplications(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load applications";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ---------------------------------------------------------------- */
  /*  Withdraw handler                                                 */
  /* ---------------------------------------------------------------- */

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;

    setWithdrawing(true);
    try {
      await withdrawApplication(withdrawTarget._id);
      setApplications((prev) =>
        prev.filter((a) => a._id !== withdrawTarget._id),
      );
      toast.success("Application withdrawn successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to withdraw application";
      toast.error(message);
    } finally {
      setWithdrawing(false);
      setWithdrawTarget(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render — loading / auth guard                                    */
  /* ---------------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
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
        {/* -------------------------------------------------------- */}
        {/*  Header                                                   */}
        {/* -------------------------------------------------------- */}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Applications
            </h1>
            {!loading && applications.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 text-xs tabular-nums"
              >
                {applications.length}
              </Badge>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Track the status of your submitted rental and purchase applications.
        </p>

        {/* -------------------------------------------------------- */}
        {/*  Loading state                                            */}
        {/* -------------------------------------------------------- */}

        {loading && (
          <div className="mt-8">
            <ApplicationsSkeleton />
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Error state                                              */}
        {/* -------------------------------------------------------- */}

        {!loading && error && (
          <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
            <XCircle className="h-10 w-10 text-red-500/60" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Empty state                                              */}
        {/* -------------------------------------------------------- */}

        {!loading && !error && applications.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Home className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                No applications yet
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven't applied to any listings yet. Browse available
                properties to get started.
              </p>
            </div>
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Browse Listings
              </Link>
            </Button>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Application cards                                        */}
        {/* -------------------------------------------------------- */}

        {!loading && !error && applications.length > 0 && (
          <div className="mt-8 space-y-4">
            <AnimatePresence initial={false}>
              {applications.map((app, index) => {
                const listing = isPopulatedListing(app.listingId)
                  ? app.listingId
                  : null;
                const photo =
                  resolveImageUrl(listing?.photos?.[0]) || PLACEHOLDER;
                const canWithdraw =
                  app.status !== "approved" && app.status !== "rejected";

                return (
                  <motion.div
                    key={app._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                    }}
                  >
                    <Card className="overflow-hidden border-border/60 card-shadow hover:border-primary/20 transition-colors">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Listing thumbnail */}
                          <div className="relative shrink-0 sm:w-48">
                            <img
                              src={photo}
                              alt={listing?.title ?? "Listing"}
                              className="h-48 w-full object-cover sm:h-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER;
                              }}
                            />
                            {listing && (
                              <Link
                                to={`/listing/${listing._id}`}
                                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 hover:bg-black/40 hover:opacity-100 transition-all"
                              >
                                <span className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground shadow">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View Listing
                                </span>
                              </Link>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 flex-col p-5">
                            {/* Top row: title + status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                {listing ? (
                                  <Link
                                    to={`/listing/${listing._id}`}
                                    className="group"
                                  >
                                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                      {listing.title}
                                    </h3>
                                  </Link>
                                ) : (
                                  <h3 className="font-display text-lg font-semibold text-foreground truncate">
                                    Application
                                  </h3>
                                )}
                                {listing && (
                                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground truncate">
                                    <Home className="h-3.5 w-3.5 shrink-0" />
                                    {listing.address}, {listing.city}
                                  </p>
                                )}
                                {listing && (
                                  <p className="mt-1 font-display text-lg font-bold text-secondary">
                                    ${listing.price.toLocaleString()}
                                  </p>
                                )}
                              </div>

                              <Badge
                                variant="outline"
                                className={`shrink-0 gap-1 capitalize ${statusBadgeClasses(app.status)}`}
                              >
                                <StatusIcon status={app.status} />
                                {app.status}
                              </Badge>
                            </div>

                            {/* Middle row: score ring + CRS data */}
                            <div className="mt-4 flex items-center gap-5">
                              <MatchScoreRing
                                score={app.matchScore}
                                color={app.matchColor}
                              />

                              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Credit
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {app.crsData?.creditScore ?? "--"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Evictions
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {app.crsData?.evictions ?? "--"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Bankruptcies
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {app.crsData?.bankruptcies ?? "--"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Criminal
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {app.crsData?.criminalOffenses ?? "--"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Bottom row: date + actions */}
                            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                Applied {formatDate(app.createdAt)}
                              </p>

                              <div className="flex items-center gap-2">
                                {listing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-xs"
                                  >
                                    <Link to={`/listing/${listing._id}`}>
                                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                      View Listing
                                    </Link>
                                  </Button>
                                )}

                                {canWithdraw && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                                    onClick={() => setWithdrawTarget(app)}
                                  >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Withdraw
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Withdraw confirmation dialog                                   */}
      {/* -------------------------------------------------------------- */}

      <AlertDialog
        open={!!withdrawTarget}
        onOpenChange={(open) => {
          if (!open) setWithdrawTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Withdraw Application?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your application
              {withdrawTarget && isPopulatedListing(withdrawTarget.listingId)
                ? ` for "${withdrawTarget.listingId.title}"`
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {withdrawing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
