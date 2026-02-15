import "@testing-library/jest-dom";

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  isFirebaseConfigured: false,
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth: unknown, _cb: unknown) => vi.fn()),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const React = await import("react");

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) => {
        // Return a forwardRef component for any HTML element (motion.div, motion.img, etc.)
        return React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const {
            initial: _i,
            animate: _a,
            exit: _e,
            transition: _t,
            whileHover: _wh,
            whileTap: _wt,
            variants: _v,
            ...rest
          } = props;
          return React.createElement(prop as string, { ...rest, ref });
        });
      },
    }
  );

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: unknown }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  };
});

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));
