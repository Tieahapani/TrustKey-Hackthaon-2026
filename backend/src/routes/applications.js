const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { pullCreditReport, calculateMatchScore } = require('../services/crs');

// POST /api/applications — Buyer applies to a listing (triggers CRS screening)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can apply' });
    }

    const { listingId, consent, buyerInfo } = req.body;

    if (!listingId || !consent) {
      return res.status(400).json({ error: 'listingId and consent are required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check for existing application
    const existing = await Application.findOne({ listingId, buyerId: user._id });
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this listing' });
    }

    // Pull credit report from CRS
    const crsData = await pullCreditReport(buyerInfo || {});

    // Calculate match score against seller's criteria
    const criteria = {
      ...listing.screeningCriteria.toObject(),
      rentAmount: listing.listingType === 'rent' ? listing.price : 0,
    };
    const { matchScore, matchBreakdown, matchColor } = calculateMatchScore(crsData, criteria);

    const application = await Application.create({
      listingId,
      buyerId: user._id,
      status: 'screened',
      crsData,
      matchScore,
      matchBreakdown,
      matchColor,
      consentGiven: true,
      screenedAt: new Date(),
    });

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already applied to this listing' });
    }
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/applications/listing/:listingId — Seller views applicants for their listing
router.get('/listing/:listingId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const listing = await Listing.findById(req.params.listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (!user || listing.sellerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view these applicants' });
    }

    const applications = await Application.find({ listingId: req.params.listingId })
      .populate('buyerId', 'name email phone')
      .sort({ matchScore: -1 })
      .lean();

    res.json(applications);
  } catch (err) {
    console.error('Get applicants error:', err);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// GET /api/applications/mine — Buyer sees their own applications
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const applications = await Application.find({ buyerId: user._id })
      .populate('listingId', 'title address city price photos')
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PATCH /api/applications/:id/status — Seller approves/rejects an applicant
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the seller owns the listing
    const listing = await Listing.findById(application.listingId);
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || !listing || listing.sellerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    application.status = status;
    await application.save();
    res.json(application);
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
