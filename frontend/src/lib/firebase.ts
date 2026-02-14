import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Fail fast if env is missing (avoids "api-key-not-valid" from demo placeholder)
if (!apiKey || apiKey === 'demo-key' || !apiKey.startsWith('AIza')) {
  console.error(
    '[Firebase] VITE_FIREBASE_API_KEY is missing or invalid. ' +
    'Set it in frontend/.env (local) or Vercel → Settings → Environment Variables, then redeploy.'
  );
}

const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: authDomain || '',
  projectId: projectId || '',
};

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.error('Firebase init failed:', err);
  app = initializeApp(firebaseConfig, 'fallback');
  auth = getAuth(app);
}

/** True if Firebase config looks valid (API key set and not placeholder). */
export const isFirebaseConfigured =
  Boolean(apiKey && apiKey !== 'demo-key' && apiKey.startsWith('AIza'));

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

export type { User };
