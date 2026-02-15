import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../test-utils";
import Index from "@/pages/Index";
import type { Listing } from "@/lib/api";

// Use vi.hoisted so this is available inside vi.mock factories
const { mockFetchListings } = vi.hoisted(() => ({
  mockFetchListings: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchListings: (...args: unknown[]) => mockFetchListings(...args),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

const mockListings: Listing[] = [
  {
    _id: "l1",
    title: "Downtown Loft",
    description: "A modern loft",
    price: 3000,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    city: "Austin",
    state: "TX",
    address: "100 Main St",
    listingType: "rent",
    photos: ["https://example.com/1.jpg"],
    amenities: [],
    propertyDetails: "",
    screeningCriteria: {
      minCreditScore: 600,
      noEvictions: true,
      noBankruptcy: true,
      noCriminal: true,
      noFraud: true,
    },
    sellerId: "s1",
    status: "active",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    _id: "l2",
    title: "Beach House",
    description: "A beautiful beach house",
    price: 500000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2000,
    city: "Miami",
    state: "FL",
    address: "200 Ocean Dr",
    listingType: "sale",
    photos: ["https://example.com/2.jpg"],
    amenities: [],
    propertyDetails: "",
    screeningCriteria: {
      minCreditScore: 700,
      noEvictions: true,
      noBankruptcy: true,
      noCriminal: true,
      noFraud: true,
    },
    sellerId: "s2",
    status: "active",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

describe("Index page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchListings.mockResolvedValue(mockListings);
  });

  it("renders 'Find Your Perfect Home' heading", async () => {
    render(<Index />);
    expect(screen.getByText("Find Your Perfect Home")).toBeInTheDocument();
  });

  it("shows listing cards after fetch", async () => {
    render(<Index />);
    await waitFor(() => {
      expect(screen.getByText("Downtown Loft")).toBeInTheDocument();
      expect(screen.getByText("Beach House")).toBeInTheDocument();
    });
  });

  it("shows 'No listings found' when fetch returns empty", async () => {
    mockFetchListings.mockResolvedValue([]);
    render(<Index />);
    await waitFor(() => {
      expect(screen.getByText("No listings found")).toBeInTheDocument();
    });
  });

  it("renders filter buttons (All, Rent, Buy)", async () => {
    render(<Index />);
    // "All" appears in both the listing type filter and city filter pills,
    // so use getAllByText and verify at least one exists for each label.
    expect(screen.getAllByText("All").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
  });

  it("renders city filter pills", async () => {
    render(<Index />);
    expect(screen.getByText("Austin")).toBeInTheDocument();
    expect(screen.getByText("Portland")).toBeInTheDocument();
    expect(screen.getByText("Miami")).toBeInTheDocument();
    expect(screen.getByText("Denver")).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Charlotte")).toBeInTheDocument();
  });

  it("displays hero subtext", () => {
    render(<Index />);
    expect(
      screen.getByText(
        /AI-powered screening, instant credit checks, and a smart assistant/
      )
    ).toBeInTheDocument();
  });
});
