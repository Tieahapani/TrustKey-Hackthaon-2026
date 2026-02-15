/**
 * Tests for the /api/upload routes.
 */
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../server');
const { createTestUser, getAuthHeader } = require('../db');

describe('/api/upload', () => {
  // Create a tiny valid PNG buffer for testing (1x1 pixel)
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );

  let tempFilePath;

  beforeEach(async () => {
    await createTestUser(); // seller1
    // Write temp image file to disk for upload tests
    const tmpDir = path.join(__dirname, '..', '..', '..', 'uploads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    tempFilePath = path.join(tmpDir, 'test-upload.png');
    fs.writeFileSync(tempFilePath, tinyPng);
  });

  afterEach(() => {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  describe('POST /api/upload/images', () => {
    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .attach('photos', tempFilePath);
      expect(res.status).toBe(401);
    });

    it('returns 400 when no files are attached', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .set(getAuthHeader('valid-token-seller1'));
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns URLs for uploaded images', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .set(getAuthHeader('valid-token-seller1'))
        .attach('photos', tempFilePath);
      expect(res.status).toBe(200);
      expect(res.body.urls).toBeDefined();
      expect(Array.isArray(res.body.urls)).toBe(true);
      expect(res.body.urls.length).toBe(1);
      expect(res.body.urls[0]).toMatch(/^\/uploads\//);
    });

    it('handles multiple file uploads', async () => {
      const tempFilePath2 = path.join(path.dirname(tempFilePath), 'test-upload2.png');
      fs.writeFileSync(tempFilePath2, tinyPng);

      const res = await request(app)
        .post('/api/upload/images')
        .set(getAuthHeader('valid-token-seller1'))
        .attach('photos', tempFilePath)
        .attach('photos', tempFilePath2);

      // Clean up second temp file
      if (fs.existsSync(tempFilePath2)) fs.unlinkSync(tempFilePath2);

      expect(res.status).toBe(200);
      expect(res.body.urls.length).toBe(2);
    });

    it('returns uploaded file paths that start with /uploads/', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .set(getAuthHeader('valid-token-seller1'))
        .attach('photos', tempFilePath);
      expect(res.status).toBe(200);
      for (const url of res.body.urls) {
        expect(url).toMatch(/^\/uploads\/.+/);
      }
    });

    it('preserves the file extension of the uploaded image', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .set(getAuthHeader('valid-token-seller1'))
        .attach('photos', tempFilePath);
      expect(res.status).toBe(200);
      expect(res.body.urls[0]).toMatch(/\.png$/);
    });
  });
});
