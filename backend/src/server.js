const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow Vercel and localhost
const allowedOrigins = [
  'http://localhost:5173',
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB (cached across serverless invocations)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not set — running without database');
}

// Start server only when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`HomeScreen API running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
