// Vercel serverless function entry point
// This file is required by vercel.json but the actual handler is in src/server.js
// Vercel will detect the VERCEL env var and use the exported handler
module.exports = require('../src/server');

