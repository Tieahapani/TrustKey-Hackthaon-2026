const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// GET /api/listings — Browse all active listings (public)
router.get('/', async (req, res) => {
  try {
    const { city, minPrice, maxPrice, bedrooms, listingType, search } = req.query;

    const filter = { status: 'active' };

    if (city) filter.city = new RegExp(city, 'i');
    if (listingType) filter.listingType = listingType;
    if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email')
      .lean();

    res.json(listings);
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/listings/seller/mine — Get listings for logged-in seller
// NOTE: This must come BEFORE /:id to avoid "seller" being treated as an ID
router.get('/seller/mine', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can view their listings' });
    }

    const listings = await Listing.find({ sellerId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(listings);
  } catch (err) {
    console.error('Get seller listings error:', err);
    res.status(500).json({ error: 'Failed to fetch seller listings' });
  }
});

// GET /api/listings/:id — Single listing detail (public)
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'name email phone')
      .lean();

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// POST /api/listings — Create listing (seller only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create listings' });
    }

    const listing = await Listing.create({
      ...req.body,
      sellerId: user._id,
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// PUT /api/listings/:id — Update listing (owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (!user || listing.sellerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    Object.assign(listing, req.body);
    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// DELETE /api/listings/:id — Delete listing (owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (!user || listing.sellerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
