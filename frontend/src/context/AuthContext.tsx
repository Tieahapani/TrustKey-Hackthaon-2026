import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from '@/lib/firebase';
import api from '@/lib/api';

interface UserProfile {
  _id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller';
  phone: string;
}

interface AuthContextType {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string, name: string, role: 'buyer' | 'seller') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user) {
          try {
            const res = await api.get('/api/users/me');
            setProfile(res.data);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Auth listener failed:', err);
      setLoading(false);
    }
  }, []);

  const register = async (email: string, password: string, name: string, role: 'buyer' | 'seller') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await cred.user.getIdToken();
    const res = await api.post('/api/users/register', { name, role });
    setProfile(res.data);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.getIdToken();
    const res = await api.get('/api/users/me');
    setProfile(res.data);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
