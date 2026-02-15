/**
 * Global test setup — mocks Firebase Admin and external services.
 * Loaded via jest.config.js `setupFiles` (runs before the test framework).
 */

// Mock firebase-admin before any route/middleware imports
jest.mock('firebase-admin', () => {
  const validTokens = {
    'valid-token-seller1': { uid: 'seller1', email: 'seller@test.com' },
    'valid-token-buyer1': { uid: 'buyer1', email: 'buyer@test.com' },
    'valid-token-buyer2': { uid: 'buyer2', email: 'buyer2@test.com' },
  };

  return {
    apps: [{}], // pretend Firebase is initialized
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    auth: () => ({
      verifyIdToken: jest.fn(async (token) => {
        if (validTokens[token]) return validTokens[token];
        throw new Error('Invalid token');
      }),
    }),
  };
});

// Mock external services
jest.mock('../services/gemini', () => ({
  askAboutProperty: jest.fn(async () => 'This is a great property!'),
}), { virtual: true });

jest.mock('../services/elevenlabs', () => ({
  textToSpeech: jest.fn(async () => {
    const { Readable } = require('stream');
    return Readable.from(Buffer.from('fake-audio'));
  }),
}), { virtual: true });
