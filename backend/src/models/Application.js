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
    buyerInfo: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      dob: { type: String, default: '' },
      email: { type: String, default: '' },
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
      fbiMostWanted: {
        matchFound: { type: Boolean, default: false },
        matchCount: { type: Number, default: 0 },
        searchedName: { type: String, default: '' },
        crimes: [{
          name: { type: String, default: '' },
          description: { type: String, default: '' },
          subjects: [{ type: String }],
          warningMessage: { type: String, default: null },
          url: { type: String, default: null },
        }],
      },
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
    totalPoints: {
      type: Number,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      default: 0,
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
