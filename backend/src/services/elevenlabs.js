const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set');
    }
    client = new ElevenLabsClient({ apiKey });
  }
  return client;
}

/**
 * Convert text to speech using ElevenLabs API.
 * Returns a readable stream of audio data.
 * @param {string} text - Text to convert to speech
 * @returns {ReadableStream} Audio stream (mp3)
 */
async function textToSpeech(text) {
  const elevenlabs = getClient();
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah

  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_flash_v2_5',
    output_format: 'mp3_44100_128',
  });

  return audio;
}

module.exports = { textToSpeech };
