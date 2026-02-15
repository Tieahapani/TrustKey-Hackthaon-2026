const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { uploadFile, getPresignedUploadUrl } = require('../services/vultr');

// Use memory storage — files go to Vultr, not disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/upload/images — Upload images to Vultr Object Storage
router.post('/images', verifyToken, upload.array('photos', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const urls = await Promise.all(
      req.files.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype))
    );
    res.json({ urls });
  } catch (err) {
    console.error('Vultr upload error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// POST /api/upload/presigned — Get a presigned URL for direct client upload
router.post('/presigned', verifyToken, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }
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
