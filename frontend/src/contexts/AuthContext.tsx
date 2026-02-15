/**
 * Authentication context — wraps Firebase Auth and syncs with the backend
 * user profile stored in MongoDB.
 *
 * Provides: user state, login, register, logout.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { User as FirebaseUser } from "firebase/auth";
import {
  auth,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "@/lib/firebase";
import api from "@/lib/api";

/** Backend user profile (from MongoDB) */
export interface UserProfile {
  _id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone: string;
}

/** Shape exposed by useAuth() */
interface AuthContextType {
  user: { id: string; email: string; name: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Flag to suppress the onAuthStateChanged listener during register/login.
   * This prevents the listener from calling /api/users/me before the
   * register() function has finished creating the backend profile.
   */
  const suppressListenerRef = useRef(false);

  /** Fetch the backend profile for the current Firebase user. */
  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const { data } = await api.get<UserProfile>("/api/users/me");
      return data;
    } catch {
      return null;
    }
  }, []);

  /** Map a backend profile to the lightweight UI user object. */
  const toUser = (p: UserProfile) => ({
    id: p._id,
    email: p.email,
    name: p.name,
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        // Skip if register/login is handling the profile fetch
        if (suppressListenerRef.current) return;

        if (fbUser) {
          const profile = await fetchProfile();
          setUser(profile ? toUser(profile) : null);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      suppressListenerRef.current = true;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchProfile();
        if (profile) {
          setUser(toUser(profile));
          setLoading(false);
        } else {
          await signOut(auth);
          throw new Error("Account not found. Please register first.");
        }
      } finally {
        suppressListenerRef.current = false;
      }
    },
    [fetchProfile]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ) => {
      suppressListenerRef.current = true;
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        const { data } = await api.post<UserProfile>("/api/users/register", {
          name,
        });
        setUser(toUser(data));
        setLoading(false);
      } catch (err) {
        // If backend registration fails, clean up the Firebase user
        if (auth.currentUser) {
          await signOut(auth);
        }
        throw err;
      } finally {
        suppressListenerRef.current = false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    signOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — must be used inside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
