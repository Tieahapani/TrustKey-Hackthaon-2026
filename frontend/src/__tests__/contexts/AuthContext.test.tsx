import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

// The firebase mock is already set up in setup.ts, import the mocked functions
import * as firebaseModule from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "@/lib/firebase";

// Mock the api module
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/lib/api";

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** Helper to set up a logged-in user via the login() function. */
async function loginUser(
  result: { current: ReturnType<typeof useAuth> },
  profile = {
    _id: "u1",
    firebaseUid: "fb1",
    email: "test@test.com",
    name: "Test",
    phone: "",
  }
) {
  (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { getIdToken: vi.fn().mockResolvedValue("token") },
  });
  mockApi.get.mockResolvedValue({ data: profile });

  await act(async () => {
    await result.current.login("test@test.com", "password123");
  });
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: onAuthStateChanged calls callback with null (no user)
    (onAuthStateChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (_auth: unknown, cb: (user: unknown) => void) => {
        cb(null);
        return vi.fn(); // unsubscribe
      }
    );
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    // Suppress console.error from React during this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
    spy.mockRestore();
  });

  it("AuthProvider renders children", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // If this doesn't throw, children are rendered
    expect(result.current).toBeDefined();
  });

  it("initial loading becomes false after auth state resolves", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("user is null initially when no firebase user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login calls signInWithEmailAndPassword", async () => {
    (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("token") },
    });

    const mockProfile = {
      _id: "u1",
      firebaseUid: "fb1",
      email: "test@test.com",
      name: "Test",
      phone: "",
    };
    mockApi.get.mockResolvedValue({ data: mockProfile });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login("test@test.com", "password123");
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalled();
  });

  it("logout calls signOut and clears user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Log in to get a user
    await loginUser(result);

    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("isAuthenticated is true when user is set", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Log in to get a user
    await loginUser(result);

    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login throws and does not set user when profile fetch fails", async () => {
    (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("token") },
    });

    // Profile fetch returns null (no backend user) — the catch inside
    // fetchProfile returns null, so login sees profile=null and calls signOut.
    mockApi.get.mockRejectedValue(new Error("not found"));

    (signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let loginError: Error | undefined;
    await act(async () => {
      try {
        await result.current.login("test@test.com", "password123");
      } catch (err) {
        loginError = err as Error;
      }
    });

    expect(loginError).toBeDefined();
    expect(loginError?.message).toBe("Account not found. Please register first.");
    expect(signOut).toHaveBeenCalled();
  });
});
