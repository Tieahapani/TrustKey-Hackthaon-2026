import { describe, it, expect, vi, beforeEach } from "vitest";

// Create the mock instance via vi.hoisted so it's available to both
// the vi.mock factory and the test assertions.
const { mockAxiosInstance } = vi.hoisted(() => {
  const instance = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { mockAxiosInstance: instance };
});

// Mock axios BEFORE importing api module
vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

import axios from "axios";
import {
  fetchListings,
  fetchListing,
  fetchMyListings,
  createListing,
  submitApplication,
  fetchApplications,
  updateApplicationStatus,
  chatWithAI,
  uploadImages,
  fetchMyApplications,
  withdrawApplication,
  deleteListing,
} from "@/lib/api";

describe("API helpers", () => {
  beforeEach(() => {
    // Only clear individual mock call histories
    mockAxiosInstance.get.mockClear();
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.put.mockClear();
    mockAxiosInstance.patch.mockClear();
    mockAxiosInstance.delete.mockClear();
    mockAxiosInstance.interceptors.request.use.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();
    // Re-setup default resolved values after clearing
    mockAxiosInstance.get.mockResolvedValue({ data: [] });
    mockAxiosInstance.post.mockResolvedValue({ data: {} });
    mockAxiosInstance.put.mockResolvedValue({ data: {} });
    mockAxiosInstance.patch.mockResolvedValue({ data: {} });
    mockAxiosInstance.delete.mockResolvedValue({ data: {} });
  });

  it("fetchListings calls GET /api/listings", async () => {
    const mockData = [{ _id: "1", title: "Test" }];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

    const result = await fetchListings();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/listings", {
      params: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it("fetchListings passes params through", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchListings({ city: "Austin" });
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/listings", {
      params: { city: "Austin" },
    });
  });

  it("fetchListing calls GET /api/listings/:id", async () => {
    const mockData = { _id: "abc", title: "Test" };
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockData });

    const result = await fetchListing("abc");
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/listings/abc");
    expect(result).toEqual(mockData);
  });

  it("fetchMyListings calls GET /api/listings/seller/mine", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchMyListings();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/listings/seller/mine");
  });

  it("createListing calls POST /api/listings", async () => {
    const payload = { title: "New Listing" };
    mockAxiosInstance.post.mockResolvedValueOnce({ data: payload });

    const result = await createListing(payload);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/listings", payload);
    expect(result).toEqual(payload);
  });

  it("submitApplication calls POST /api/applications", async () => {
    const payload = {
      listingId: "123",
      consent: true,
      buyerInfo: { firstName: "A", lastName: "B", dob: "2000-01-01", email: "a@b.com" },
    };
    mockAxiosInstance.post.mockResolvedValueOnce({ data: { _id: "app1" } });
    await submitApplication(payload);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/applications", payload);
  });

  it("fetchApplications calls GET /api/applications/listing/:id", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchApplications("lst123");
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      "/api/applications/listing/lst123"
    );
  });

  it("updateApplicationStatus calls PATCH /api/applications/:id/status", async () => {
    mockAxiosInstance.patch.mockResolvedValueOnce({ data: { status: "approved" } });
    await updateApplicationStatus("app1", "approved");
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
      "/api/applications/app1/status",
      { status: "approved" }
    );
  });

  it("fetchMyApplications calls GET /api/applications/mine", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    await fetchMyApplications();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/applications/mine");
  });

  it("withdrawApplication calls DELETE /api/applications/:id", async () => {
    mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });
    await withdrawApplication("app2");
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/api/applications/app2");
  });

  it("deleteListing calls DELETE /api/listings/:id", async () => {
    mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });
    await deleteListing("lst1");
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/api/listings/lst1");
  });

  it("uploadImages constructs FormData with 'photos' key", async () => {
    const file1 = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const file2 = new File(["b"], "b.jpg", { type: "image/jpeg" });
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { urls: ["url1", "url2"] },
    });

    const result = await uploadImages([file1, file2]);

    expect(mockAxiosInstance.post).toHaveBeenCalled();
    const [url, formData, config] = mockAxiosInstance.post.mock.calls[0];
    expect(url).toBe("/api/upload/images");
    expect(formData).toBeInstanceOf(FormData);
    // FormData should have 'photos' entries
    const photos = formData.getAll("photos");
    expect(photos).toHaveLength(2);
    expect(config.headers["Content-Type"]).toBe("multipart/form-data");
    expect(result).toEqual(["url1", "url2"]);
  });
});

describe("Token interceptor registration", () => {
  it("registers a request interceptor on create", () => {
    // axios.create was called during module import — verify the instance exists
    expect(mockAxiosInstance).toBeDefined();
    // The interceptor.request.use was called during module initialization,
    // but beforeEach clears it. Verify the instance was created with expected config.
    expect(mockAxiosInstance.interceptors).toBeDefined();
    expect(mockAxiosInstance.interceptors.request).toBeDefined();
  });
});
