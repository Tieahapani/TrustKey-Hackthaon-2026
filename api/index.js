// Vercel serverless entry point — wraps the Express app with error catching
let app;
try {
  app = require('../src/server');
} catch (err) {
  // If the server fails to load, return the error as a response
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server failed to load',
      message: err.message,
      stack: err.stack,
    });
  };
  return;
}

module.exports = app;
