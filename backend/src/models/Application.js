const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
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
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'screened', 'approved', 'rejected'],
      default: 'pending',
    },
    consentGiven: {
      type: Boolean,
      required: true,
      default: false,
    },
    crsData: {
      creditScore: { type: Number, default: 0 },
      evictions: { type: Number, default: 0 },
      bankruptcies: { type: Number, default: 0 },
      criminalOffenses: { type: Number, default: 0 },
      fraudRiskScore: { type: Number, default: 0 },
      identityVerified: { type: Boolean, default: false },
      requestIds: { type: Object, default: {} },
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchBreakdown: {
      type: Object,
      default: {},
    },
    matchColor: {
      type: String,
      enum: ['green', 'yellow', 'red'],
    },
    mortgageEstimate: {
      homePrice: Number,
      downPayment: Number,
      loanAmount: Number,
      interestRate: Number,
      loanTermYears: Number,
      monthlyPayment: Number,
      totalPaid: Number,
      totalInterest: Number,
    },
    screenedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
applicationSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);