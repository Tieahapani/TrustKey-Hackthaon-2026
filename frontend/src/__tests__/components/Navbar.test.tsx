import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "../test-utils";
import Navbar from "@/components/Navbar";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockLogout, mockSwitchRole } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockSwitchRole: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unauthenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        switchRole: mockSwitchRole,
      });
    });

    it("shows Log In and Sign Up buttons", () => {
      render(<Navbar />);
      expect(screen.getAllByText("Log In").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Sign Up").length).toBeGreaterThanOrEqual(1);
    });

    it("does not show Log Out button", () => {
      render(<Navbar />);
      expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
    });

    it("renders the TrustKey brand", () => {
      render(<Navbar />);
      expect(screen.getByText("TrustKey")).toBeInTheDocument();
    });

    it("shows Buyer and Seller toggle buttons", () => {
      render(<Navbar />);
      // Both desktop and mobile toggles exist
      const buyerButtons = screen.getAllByText("Buyer");
      const sellerButtons = screen.getAllByText("Seller");
      expect(buyerButtons.length).toBeGreaterThanOrEqual(1);
      expect(sellerButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("authenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", role: "buyer", name: "John Doe" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        switchRole: mockSwitchRole,
      });
    });

    it("shows user name", () => {
      render(<Navbar />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows Log Out button", () => {
      render(<Navbar />);
      expect(screen.getAllByText("Log Out").length).toBeGreaterThanOrEqual(1);
    });

    it("does not show Log In button when authenticated", () => {
      render(<Navbar />);
      expect(screen.queryByText("Log In")).not.toBeInTheDocument();
    });

    it("does not show Sign Up button when authenticated", () => {
      render(<Navbar />);
      expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
    });
  });

  describe("buyer mode navigation links", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", role: "buyer", name: "Jane" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        switchRole: mockSwitchRole,
      });
    });

    it("shows My Applications link in buyer mode", () => {
      render(<Navbar />);
      expect(screen.getAllByText("My Applications").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("seller mode navigation links", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", role: "seller", name: "Seller Jane" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        switchRole: mockSwitchRole,
      });
    });

    it("shows Dashboard link in seller mode", () => {
      render(<Navbar />);
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    });

    it("shows New Listing link in seller mode", () => {
      render(<Navbar />);
      expect(screen.getAllByText("New Listing").length).toBeGreaterThanOrEqual(1);
    });

    it("shows My Listings link in seller mode", () => {
      render(<Navbar />);
      expect(screen.getAllByText("My Listings").length).toBeGreaterThanOrEqual(1);
    });
  });
});
