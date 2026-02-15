/**
 * Axios API client with Firebase auth token injection.
 *
 * All endpoints mirror the Express backend at /api/*.
 * The request interceptor automatically attaches the current user's
 * Firebase ID token so protected routes work transparently.
 */
import axios from "axios";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
});

// Attach Firebase ID token to every outgoing request
api.interceptors.request.use(async (config) => {
  if (isFirebaseConfigured && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token retrieval failed — request proceeds unauthenticated
    }
  }
  return config;
});

/* ------------------------------------------------------------------ */
/*  Type definitions — aligned with backend Mongoose schemas          */
/* ------------------------------------------------------------------ */

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  city: string;
  state: string;
  address: string;
  listingType: "rent" | "sale";
  photos: string[];
  amenities: string[];
  propertyDetails: string;
  screeningCriteria: {
    minCreditScore: number;
    noEvictions: boolean;
    noBankruptcy: boolean;
    noCriminal: boolean;
    noFraud: boolean;
  };
  sellerId:
    | { _id: string; name: string; email: string; phone: string }
    | string;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface FbiMostWanted {
  matchFound: boolean;
  matchCount: number;
  searchedName: string;
  crimes: {
    name: string;
    description: string;
    subjects: string[];
    warningMessage: string | null;
    url: string | null;
  }[];
}

export interface CrsData {
  creditScore: number;
  evictions: number;
  bankruptcies: number;
  criminalOffenses: number;
  fraudRiskScore: number;
  identityVerified: boolean;
  fbiMostWanted: FbiMostWanted;
  requestIds: Record<string, string>;
}

export interface MatchBreakdownItem {
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface Application {
  _id: string;
  listingId: string;
  buyerId:
    | { _id: string; name: string; email: string; phone: string }
    | string;
  status: "pending" | "screened" | "approved" | "rejected";
  crsData: CrsData;
  matchScore: number;
  matchBreakdown: Record<string, MatchBreakdownItem>;
  matchColor: "green" | "yellow" | "red";
  totalPoints: number;
  earnedPoints: number;
  buyerInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
  };
  consentGiven: boolean;
  screenedAt: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                       */
/* ------------------------------------------------------------------ */

/** Fetch all active listings with optional filters. */
export const fetchListings = (params?: Record<string, string | number>) =>
  api.get<Listing[]>("/api/listings", { params }).then((r) => r.data);

/** Fetch a single listing by ID (includes populated seller). */
export const fetchListing = (id: string) =>
  api.get<Listing>(`/api/listings/${id}`).then((r) => r.data);

/** Fetch the current seller's own listings. */
export const fetchMyListings = () =>
  api.get<Listing[]>("/api/listings/seller/mine").then((r) => r.data);

/** Create a new listing (seller only). */
export const createListing = (data: Partial<Listing>) =>
  api.post<Listing>("/api/listings", data).then((r) => r.data);

/** Submit a buyer application with consent + personal info. */
export const submitApplication = (data: {
  listingId: string;
  consent: boolean;
  buyerInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
  };
}) => api.post<Application>("/api/applications", data).then((r) => r.data);

/** Fetch all applications for a given listing (seller only). */
export const fetchApplications = (listingId: string) =>
  api
    .get<Application[]>(`/api/applications/listing/${listingId}`)
    .then((r) => r.data);

/** Update application status (seller approves / rejects). */
export const updateApplicationStatus = (
  id: string,
  status: "approved" | "rejected"
) =>
  api
    .patch<Application>(`/api/applications/${id}/status`, { status })
    .then((r) => r.data);

/** Ask the AI property assistant a question. */
export const chatWithAI = (listingId: string, question: string) =>
  api
    .post<{ answer: string }>("/api/chat", { listingId, question })
    .then((r) => r.data);

/** Convert text to speech (returns audio blob). */
export const textToSpeech = (text: string) =>
  api
    .post("/api/chat/tts", { text }, { responseType: "blob" })
    .then((r) => r.data as Blob);

/** Update an existing listing (seller only). */
export const updateListing = (id: string, data: Partial<Listing>) =>
  api.put<Listing>(`/api/listings/${id}`, data).then((r) => r.data);

/** Delete a listing (seller only). */
export const deleteListing = (id: string) =>
  api.delete(`/api/listings/${id}`).then((r) => r.data);

/** Fetch the current buyer's own applications. */
export const fetchMyApplications = () =>
  api.get<Application[]>("/api/applications/mine").then((r) => r.data);

/** Withdraw (delete) a buyer's own application. */
export const withdrawApplication = (id: string) =>
  api.delete(`/api/applications/${id}`).then((r) => r.data);

/** Upload images directly to the backend. Returns array of URLs. */
export const uploadImages = (files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append("photos", f));
  return api
    .post<{ urls: string[] }>("/api/upload/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    })
    .then((r) => r.data.urls);
};

/** Get a presigned upload URL for Vultr object storage. */
export const getPresignedUrl = (fileName: string, fileType: string) =>
  api
    .post<{ uploadUrl: string; fileUrl: string; key: string }>(
      "/api/upload/presigned",
      { fileName, fileType }
    )
    .then((r) => r.data);

export default api;
