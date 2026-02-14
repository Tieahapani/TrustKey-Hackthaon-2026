const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'screened', 'approved', 'rejected'],
    default: 'pending',
  },
  crsData: {
    creditScore: { type: Number, default: 0 },
    income: { type: Number, default: 0 },
    evictions: { type: Number, default: 0 },
    bankruptcies: { type: Number, default: 0 },
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  matchBreakdown: {
    creditScore: {
      passed: { type: Boolean, default: false },
      detail: { type: String, default: '' },
    },
    income: {
      passed: { type: Boolean, default: false },
      detail: { type: String, default: '' },
    },
    evictions: {
      passed: { type: Boolean, default: false },
      detail: { type: String, default: '' },
    },
    bankruptcy: {
      passed: { type: Boolean, default: false },
      detail: { type: String, default: '' },
    },
  },
  matchColor: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'red',
  },
  consentGiven: {
    type: Boolean,
    default: false,
  },
  screenedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Prevent duplicate applications
applicationSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
