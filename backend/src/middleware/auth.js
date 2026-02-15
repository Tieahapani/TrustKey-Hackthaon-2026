const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account: supports base64, file path, or raw JSON string
function loadServiceAccount() {
  // Try base64-encoded value first (most reliable for Vercel)
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 invalid');
    }
  }

  const val = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!val) return null;

  // If it looks like a file path, read from file
  const isPath = val.startsWith('.') || val.startsWith('/') || val.match(/^[A-Za-z]:[\\/]/);
  if (isPath) {
    const resolved = path.resolve(process.cwd(), val);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
    console.warn('FIREBASE_SERVICE_ACCOUNT path not found:', resolved);
    return null;
  }

  // Otherwise treat as raw JSON
  try {
    return JSON.parse(val);
  } catch (e) {
    console.warn('FIREBASE_SERVICE_ACCOUNT invalid JSON');
    return null;
  }
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
    } catch (err) {
      console.warn('Firebase Admin init failed:', err.message);
      admin.initializeApp();
    }
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — auth will not work');
  }
}

/**
 * Middleware: Verify Firebase ID token from Authorization header.
 * Sets req.user = { uid, email } on success.
 */
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    console.error('Token verification failed:', err.code, err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Optional auth — sets req.user if token present, but doesn't block.
 */
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}

module.exports = { verifyToken, optionalAuth };
