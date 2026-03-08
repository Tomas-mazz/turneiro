/**
 * Vercel serverless entry point.
 * Build must run first (npm run build) so that ../dist/app.js exists.
 */
const app = require('../dist/app.js').default
module.exports = app
