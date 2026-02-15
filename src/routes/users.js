const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// POST /api/users/register — Create user profile after Firebase signup
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, role, phone } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ error: 'Role must be buyer or seller' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (user) {
      return res.json(user);
    }

    user = await User.create({
      firebaseUid: req.user.uid,
      email: req.user.email,
      name,
      role,
      phone: phone || '',
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /api/users/me — Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found — please register first' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
