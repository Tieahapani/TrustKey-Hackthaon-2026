import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Login from "@/pages/Login";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockLogin, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    loading: false,
    register: vi.fn(),
    logout: vi.fn(),
    switchRole: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Login page", () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    mockLogin.mockResolvedValue(undefined);
  });

  it("renders email input", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<Login />);
    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();
  });

  it("renders Sign In button", () => {
    render(<Login />);
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows error on empty form submit", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const button = screen.getByRole("button", { name: /sign in/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();
    });
  });

  it("calls login on valid submit", async () => {
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
    });
  });

  it("shows error message on auth failure", async () => {
    mockLogin.mockRejectedValueOnce({ code: "auth/wrong-password" });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Invalid email or password.")
      ).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    // Make login never resolve to keep loading state
    mockLogin.mockReturnValue(new Promise(() => {}));

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /signing in/i })
      ).toBeDisabled();
    });
  });

  it("has link to /register", () => {
    render(<Login />);
    const link = screen.getByText("Sign up");
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });
});
