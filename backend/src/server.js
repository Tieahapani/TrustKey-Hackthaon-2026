const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow Vercel and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://trustkey-two.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, origin || true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Connect to MongoDB (cached across serverless invocations)
let dbReady = null;
if (process.env.NODE_ENV !== 'test' && process.env.MONGODB_URI) {
  dbReady = mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'test') {
  console.warn('MONGODB_URI not set — running without database');
}

// Ensure DB is connected before handling requests (needed for serverless)
app.use(async (req, res, next) => {
  if (dbReady) await dbReady;
  next();
});

// Routes
const listingsRouter = require('./routes/listings');
const applicationsRouter = require('./routes/applications');
const chatRouter = require('./routes/chat');
const uploadRouter = require('./routes/upload');
const usersRouter = require('./routes/users');

app.use('/api/listings', listingsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasFirebaseIndividual: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
      hasFirebaseJson: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
    },
  });
});

// Start server only when running locally (not on Vercel or in tests)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`HomeScreen API running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
