import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../test-utils";
import Dashboard from "@/pages/Dashboard";
import type { Listing, Application } from "@/lib/api";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockUseAuth, mockFetchMyListings, mockFetchApplications, mockUpdateApplicationStatus } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFetchMyListings: vi.fn(),
  mockFetchApplications: vi.fn(),
  mockUpdateApplicationStatus: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchMyListings: (...args: unknown[]) => mockFetchMyListings(...args),
    fetchApplications: (...args: unknown[]) => mockFetchApplications(...args),
    updateApplicationStatus: (...args: unknown[]) =>
      mockUpdateApplicationStatus(...args),
  };
});

const mockListing: Listing = {
  _id: "lst-1",
  title: "Test Property",
  description: "A test property",
  price: 2000,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 1000,
  city: "Austin",
  state: "TX",
  address: "123 Test St",
  listingType: "rent",
  photos: [],
  amenities: [],
  propertyDetails: "",
  screeningCriteria: {
    minCreditScore: 600,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
    noFraud: true,
  },
  sellerId: "seller-1",
  status: "active",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const mockApplication: Application = {
  _id: "app-1",
  listingId: "lst-1",
  buyerId: { _id: "b1", name: "Jane Smith", email: "jane@test.com", phone: "555-1234" },
  status: "pending",
  crsData: {
    creditScore: 720,
    evictions: 0,
    bankruptcies: 0,
    criminalRecords: 0,
    fraudFlag: false,
  },
  matchScore: 85,
  matchBreakdown: {},
  matchColor: "green",
  buyerInfo: { firstName: "Jane", lastName: "Smith", dob: "1990-01-01", email: "jane@test.com" },
  consentGiven: true,
  screenedAt: "2025-01-02T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
};

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMyListings.mockResolvedValue([]);
    mockFetchApplications.mockResolvedValue([]);
    mockUpdateApplicationStatus.mockResolvedValue({});
  });

  it("redirects to /login when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(<Dashboard />);
    const nav = screen.getByTestId("navigate");
    expect(nav).toHaveAttribute("data-to", "/login");
  });

  it("shows loading state while listings load", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    // Keep the promise pending
    mockFetchMyListings.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);
    expect(screen.getByText("Loading your listings...")).toBeInTheDocument();
  });

  it("shows Seller Dashboard heading", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([]);

    render(<Dashboard />);
    expect(screen.getByText("Seller Dashboard")).toBeInTheDocument();
  });

  it("shows empty state when no listings", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([]);

    render(<Dashboard />);
    await waitFor(() => {
      expect(
        screen.getByText(/You have no listings yet/)
      ).toBeInTheDocument();
    });
  });

  it("renders listing data when available", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([mockListing]);
    mockFetchApplications.mockResolvedValue([mockApplication]);

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("renders stat cards with label text", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([mockListing]);
    mockFetchApplications.mockResolvedValue([mockApplication]);

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Applicants")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });
  });

  it("renders applicant email", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([mockListing]);
    mockFetchApplications.mockResolvedValue([mockApplication]);

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("jane@test.com")).toBeInTheDocument();
    });
  });

  it("shows no applicants message when applications list is empty", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "seller", name: "Seller", email: "s@t.com" },
    });
    mockFetchMyListings.mockResolvedValue([mockListing]);
    mockFetchApplications.mockResolvedValue([]);

    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/No applicants yet/)).toBeInTheDocument();
    });
  });
});
