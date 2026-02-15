import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../test-utils";
import MyApplications from "@/pages/MyApplications";
import type { Application } from "@/lib/api";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockUseAuth, mockNavigate, mockFetchMyApplications, mockWithdrawApplication } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
  mockFetchMyApplications: vi.fn(),
  mockWithdrawApplication: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    fetchMyApplications: (...args: unknown[]) =>
      mockFetchMyApplications(...args),
    withdrawApplication: (...args: unknown[]) =>
      mockWithdrawApplication(...args),
  };
});

const makeApplication = (overrides: Partial<Application> = {}): Application => ({
  _id: "app-1",
  listingId: {
    _id: "lst-1",
    title: "Downtown Condo",
    address: "100 Main St",
    city: "Austin",
    price: 2500,
    photos: ["https://example.com/photo.jpg"],
  } as unknown as string,
  buyerId: "buyer-1",
  status: "pending",
  crsData: {
    creditScore: 720,
    evictions: 0,
    bankruptcies: 0,
    criminalRecords: 0,
    fraudFlag: false,
  },
  matchScore: 82,
  matchBreakdown: {},
  matchColor: "green",
  buyerInfo: {
    firstName: "John",
    lastName: "Doe",
    dob: "1990-05-15",
    email: "john@test.com",
  },
  consentGiven: true,
  screenedAt: "2025-01-02T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

describe("MyApplications page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMyApplications.mockResolvedValue([]);
    mockWithdrawApplication.mockResolvedValue({});
  });

  it("shows loading state initially", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    // Keep promise pending
    mockFetchMyApplications.mockReturnValue(new Promise(() => {}));

    render(<MyApplications />);
    // The heading should be present
    expect(screen.getByText("My Applications")).toBeInTheDocument();
  });

  it("shows empty state when no applications", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(screen.getByText("No applications yet")).toBeInTheDocument();
    });
  });

  it("renders application cards with listing title", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([makeApplication()]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(screen.getByText("Downtown Condo")).toBeInTheDocument();
    });
  });

  it("shows status badges", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([
      makeApplication({ status: "pending" }),
    ]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
  });

  it("shows Withdraw button for pending applications", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([
      makeApplication({ status: "pending" }),
    ]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /withdraw/i })
      ).toBeInTheDocument();
    });
  });

  it("does not show Withdraw button for approved applications", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([
      makeApplication({ status: "approved" }),
    ]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /withdraw/i })
    ).not.toBeInTheDocument();
  });

  it("renders Browse Listings link in empty state", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "u1", role: "buyer", name: "John", email: "j@t.com" },
    });
    mockFetchMyApplications.mockResolvedValue([]);

    render(<MyApplications />);
    await waitFor(() => {
      expect(screen.getByText("Browse Listings")).toBeInTheDocument();
    });
  });
});
