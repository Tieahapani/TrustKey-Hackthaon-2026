/**
 * ApplicationForm — Tambo-rendered component for applying to a listing via chat.
 *
 * When a buyer asks to apply through the AI chat, Tambo renders this form
 * instead of a text response. It collects the 4 required fields and submits
 * the application through the existing API.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitApplication, fetchMyApplications } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface ApplicationFormProps {
  listingId: string;
  listingTitle: string;
}

export default function ApplicationForm({ listingId, listingTitle }: ApplicationFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ lastName: "", firstName: "", dob: "", email: "" });
  const [state, setState] = useState<"form" | "loading" | "success" | "already_applied">("form");
  const [error, setError] = useState("");

  // Check if user already applied to this listing
  useEffect(() => {
    if (!user) return;
    fetchMyApplications()
      .then((apps) => {
        const applied = apps.some((a: any) => {
          const lid = typeof a.listingId === "object" ? a.listingId._id : a.listingId;
          return lid === listingId;
        });
        if (applied) setState("already_applied");
      })
      .catch(() => {});
  }, [user, listingId]);

  const handleApply = async () => {
    if (!user) {
      setError("Please sign in to apply.");
      return;
    }

    setState("loading");
    setError("");

    try {
      await submitApplication({
        listingId,
        consent: true,
        buyerInfo: {
          firstName: form.firstName,
          lastName: form.lastName,
          dob: form.dob,
          email: form.email,
        },
      });
      setState("success");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Application failed. Please try again.";
      setError(msg);
      setState("form");
    }
  };

  const isValid = form.lastName && form.firstName && form.dob && form.email;

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 shadow-sm">
      <AnimatePresence mode="wait">
        {state === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Apply for {listingTitle}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                By applying, you consent to a soft credit check via CRS Credit API. This won't affect your credit score.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Date of Birth</label>
                <input
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  placeholder="MM/DD/YYYY"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              By applying, you consent to a soft credit check. This won't affect your credit score.
            </p>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleApply}
                disabled={!isValid}
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}

        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Running credit screening...</p>
          </motion.div>
        )}

        {(state === "success" || state === "already_applied") && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 text-center py-4"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {state === "already_applied" ? "Already Applied" : "Application Submitted"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {state === "already_applied"
                ? "You have already applied to this listing. The seller will review your application and get back to you."
                : "Your application has been submitted and screened. The seller will review it and get back to you."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
