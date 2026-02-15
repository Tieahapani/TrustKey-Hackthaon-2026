import { describe, it, expect, vi, beforeEach } from "vitest";
import { render as customRender, screen } from "../test-utils";
import { render as rtlRender } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
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
      });
    });

    it("shows Log In and Sign Up buttons", () => {
      customRender(<Navbar />);
      expect(screen.getAllByText("Log In").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Sign Up").length).toBeGreaterThanOrEqual(1);
    });

    it("does not show Log Out button", () => {
      customRender(<Navbar />);
      expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
    });

    it("renders the TrustKey brand", () => {
      customRender(<Navbar />);
      expect(screen.getByText("TrustKey")).toBeInTheDocument();
    });

    it("shows Buy and Sell toggle buttons", () => {
      customRender(<Navbar />);
      // Both desktop and mobile toggles exist
      const buyButtons = screen.getAllByText("Buy");
      const sellButtons = screen.getAllByText("Sell");
      expect(buyButtons.length).toBeGreaterThanOrEqual(1);
      expect(sellButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("authenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", name: "John Doe" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
      });
    });

    it("shows user name", () => {
      customRender(<Navbar />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows Log Out button", () => {
      customRender(<Navbar />);
      expect(screen.getAllByText("Log Out").length).toBeGreaterThanOrEqual(1);
    });

    it("does not show Log In button when authenticated", () => {
      customRender(<Navbar />);
      expect(screen.queryByText("Log In")).not.toBeInTheDocument();
    });

    it("does not show Sign Up button when authenticated", () => {
      customRender(<Navbar />);
      expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
    });
  });

  describe("buy mode navigation links", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", name: "Jane" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
      });
    });

    it("shows My Applications link in buy mode", () => {
      customRender(<Navbar />);
      expect(screen.getAllByText("My Applications").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("sell mode navigation links", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: "u1", email: "test@test.com", name: "Seller Jane" },
        isAuthenticated: true,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
      });
    });

    /** Helper to render Navbar at /dashboard so it starts in sell view */
    const renderAtDashboard = () =>
      rtlRender(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Navbar />
        </MemoryRouter>
      );

    it("shows Dashboard link in sell mode", () => {
      renderAtDashboard();
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    });

    it("shows New Listing link in sell mode", () => {
      renderAtDashboard();
      expect(screen.getAllByText("New Listing").length).toBeGreaterThanOrEqual(1);
    });

    it("shows My Listings link in sell mode", () => {
      renderAtDashboard();
      expect(screen.getAllByText("My Listings").length).toBeGreaterThanOrEqual(1);
    });
  });
});
