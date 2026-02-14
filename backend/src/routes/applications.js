const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { pullComprehensiveReport, calculateMatchScore } = require('../services/crs');

// POST /api/applications — Buyer applies to a listing (triggers comprehensive CRS screening)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can apply' });
    }

    const { listingId, consent, monthlyIncome } = req.body;

    // Validate required fields
    if (!listingId || !consent) {
      return res.status(400).json({ error: 'listingId and consent are required' });
    }

    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({ 
        error: 'monthlyIncome is required and must be a positive number' 
      });
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

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🏠 NEW APPLICATION: ${listing.title}`);
    console.log(`👤 Applicant: ${user.name} (${user.email})`);
    console.log(`💰 Type: ${listing.listingType.toUpperCase()}`);
    console.log(`💵 Price: $${listing.price.toLocaleString()}`);
    console.log(`💼 Stated Monthly Income: $${monthlyIncome.toLocaleString()}`);
    console.log(`${'='.repeat(70)}`);

    // Run comprehensive screening: fraud + identity + credit + criminal + eviction
    const crsData = await pullComprehensiveReport({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Build criteria object for matcher
    const criteria = {
      minCreditScore: listing.screeningCriteria.minCreditScore || 0,
      minIncomeMultiplier: listing.screeningCriteria.minIncomeMultiplier || 0,
      noEvictions: listing.screeningCriteria.noEvictions || false,
      noBankruptcy: listing.screeningCriteria.noBankruptcy || false,
      noCriminal: listing.screeningCriteria.noCriminal || false,
    };

    // Calculate match score with self-reported income
    const matchResult = calculateMatchScore(
      crsData,
      criteria,
      monthlyIncome,        // Self-reported monthly income
      listing.price,        // Monthly rent OR home price
      listing.listingType   // 'rent' or 'sale'
    );

    const { matchScore, matchBreakdown, matchColor, mortgageEstimate } = matchResult;

    console.log(`\n📊 SCREENING RESULTS (5 Products):`);
    console.log(`   Credit Score: ${crsData.creditScore}`);
    console.log(`   Evictions: ${crsData.evictions}`);
    console.log(`   Bankruptcies: ${crsData.bankruptcies}`);
    console.log(`   Criminal Offenses: ${crsData.criminalOffenses}`);
    console.log(`   Fraud Risk: ${crsData.fraudRiskScore}/10`);
    console.log(`   Identity Verified: ${crsData.identityVerified}`);
    
    if (mortgageEstimate) {
      console.log(`\n🏡 MORTGAGE ESTIMATE (for sale):`);
      console.log(`   Home Price: $${mortgageEstimate.homePrice.toLocaleString()}`);
      console.log(`   Down Payment (20%): $${mortgageEstimate.downPayment.toLocaleString()}`);
      console.log(`   Loan Amount: $${mortgageEstimate.loanAmount.toLocaleString()}`);
      console.log(`   Monthly Payment: $${mortgageEstimate.monthlyPayment.toLocaleString()}`);
      console.log(`   Interest Rate: ${mortgageEstimate.interestRate}%`);
      console.log(`   Loan Term: ${mortgageEstimate.loanTermYears} years`);
    }
    
    console.log(`\n🎯 MATCH SCORE: ${matchScore}% (${matchColor.toUpperCase()})`);
    console.log(`${'='.repeat(70)}\n`);

    // Save application with income data
    const application = await Application.create({
      listingId,
      buyerId: user._id,
      monthlyIncome: monthlyIncome,  // Save self-reported income
      status: 'screened',
      crsData,
      matchScore,
      matchBreakdown,
      matchColor,
      mortgageEstimate: mortgageEstimate || undefined,  // Only for sales
      consentGiven: true,
      screenedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      application,
      message: 'Application submitted successfully'
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already applied to this listing' });
    }
    console.error('❌ Apply error:', err);
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
      .sort({ matchScore: -1 }) // Highest match first
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
      .populate('listingId', 'title address city price photos listingType')
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

    console.log(`✅ Application ${status}: ${user.name} for ${listing.title}`);

    res.json(application);
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;