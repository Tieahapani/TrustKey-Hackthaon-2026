const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { askAboutProperty } = require('../services/gemini');
const { textToSpeech } = require('../services/elevenlabs');
const { Readable } = require('stream');

// POST /api/chat — Ask AI about a property listing
router.post('/', async (req, res) => {
  try {
    const { listingId, question } = req.body;

    if (!listingId || !question) {
      return res.status(400).json({ error: 'listingId and question are required' });
    }

    const listing = await Listing.findById(listingId).lean();
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get AI answer from Gemini
    const answer = await askAboutProperty(listing, question);

    res.json({ answer });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// POST /api/chat/tts — Convert text to speech (ElevenLabs)
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const audioStream = await textToSpeech(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Handle both ReadableStream and Node Readable
    if (audioStream instanceof Readable) {
      audioStream.pipe(res);
    } else if (audioStream[Symbol.asyncIterator]) {
      for await (const chunk of audioStream) {
        res.write(chunk);
      }
      res.end();
    } else {
      // Buffer response
      const buffer = Buffer.from(await audioStream.arrayBuffer());
      res.send(buffer);
    }
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

module.exports = router;
