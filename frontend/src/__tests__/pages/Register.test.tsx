import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Register from "@/pages/Register";

// Use vi.hoisted so these are available inside vi.mock factories
const { mockRegister, mockNavigate } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Register page", () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    mockRegister.mockResolvedValue(undefined);
  });

  it("renders Full Name input", () => {
    render(<Register />);
    expect(screen.getByPlaceholderText("Jane Doe")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<Register />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<Register />);
    expect(
      screen.getByPlaceholderText("Min. 6 characters")
    ).toBeInTheDocument();
  });

  it("shows error on empty submit", async () => {
    const user = userEvent.setup();
    render(<Register />);

    await user.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();
    });
  });

  it("shows error for short password", async () => {
    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Min. 6 characters"), {
      target: { value: "12345" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });
  });

  it("calls register with email, password, name on valid submit", async () => {
    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Min. 6 characters"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "john@test.com",
        "password123",
        "John Doe"
      );
    });
  });

  it("shows email-already-in-use error", async () => {
    mockRegister.mockRejectedValueOnce({ code: "auth/email-already-in-use" });

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText("Jane Doe"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Min. 6 characters"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists.")
      ).toBeInTheDocument();
    });
  });

  it("has link to /login", () => {
    render(<Register />);
    const link = screen.getByText("Sign in");
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });
});
