/**
 * Tests for the /api/chat routes (AI property Q&A and TTS).
 *
 * Both Gemini (askAboutProperty) and ElevenLabs (textToSpeech) are mocked
 * globally in setup.js.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const { createTestUser, seedListing } = require('../db');

describe('/api/chat', () => {
  let listing;

  beforeEach(async () => {
    const seller = await createTestUser();
    listing = await seedListing(seller._id);
  });

  // ─── POST /api/chat ──────────────────────────────────────────────────────

  describe('POST /api/chat', () => {
    it('returns 400 when listingId is missing', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ question: 'How many bedrooms?' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when question is missing', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ listingId: listing._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 404 when listing does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/chat')
        .send({ listingId: fakeId.toString(), question: 'Tell me about this place' });
      expect(res.status).toBe(404);
    });

    it('returns 200 with an answer from the mocked Gemini service', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ listingId: listing._id.toString(), question: 'Is it pet friendly?' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(typeof res.body.answer).toBe('string');
      // The mock returns 'This is a great property!'
      expect(res.body.answer).toBe('This is a great property!');
    });
  });

  // ─── POST /api/chat/tts ──────────────────────────────────────────────────

  describe('POST /api/chat/tts', () => {
    it('returns 400 when text is missing', async () => {
      const res = await request(app)
        .post('/api/chat/tts')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 200 with audio content from the mocked ElevenLabs service', async () => {
      const res = await request(app)
        .post('/api/chat/tts')
        .send({ text: 'Hello, welcome to your new home.' });
      expect(res.status).toBe(200);
      // The mock returns Buffer.from('fake-audio')
      expect(res.headers['content-type']).toMatch(/audio/);
      expect(res.body).toBeDefined();
    });
  });
});
