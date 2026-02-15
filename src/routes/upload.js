const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getPresignedUploadUrl } = require('../services/vultr');

// POST /api/upload/presigned — Get a presigned URL for direct upload to Vultr
router.post('/presigned', verifyToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // Only allow image types
    if (!fileType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const result = await getPresignedUploadUrl(fileName, fileType);
    res.json(result);
  } catch (err) {
    console.error('Presigned URL error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

module.exports = router;
