const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Ensure uploads directory exists (use /tmp on Vercel — read-only filesystem)
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', '..', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // Read-only filesystem — uploads will use presigned URLs instead
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/upload/images — Upload one or more images directly
router.post('/images', verifyToken, upload.array('photos', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Build absolute URLs so the frontend can display them regardless of origin
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const urls = req.files.map((f) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ urls });
});

// Keep presigned route as fallback (Vultr)
try {
  const { getPresignedUploadUrl } = require('../services/vultr');

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
} catch {
  // Vultr service not available — presigned route disabled
}

module.exports = router;
