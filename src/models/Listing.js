const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  listingType: {
    type: String,
    enum: ['rent', 'sale'],
    required: true,
  },
  photos: {
    type: [String],
    default: [],
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  sqft: {
    type: Number,
    default: 0,
  },
  amenities: {
    type: [String],
    default: [],
  },
  propertyDetails: {
    type: String,
    default: '',
  },
  screeningCriteria: {
    minCreditScore: { type: Number, default: 0 },
    noEvictions: { type: Boolean, default: false },
    noBankruptcy: { type: Boolean, default: false },
    noCriminal: { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Text index for search
listingSchema.index({ title: 'text', city: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
