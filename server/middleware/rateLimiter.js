/**
 * server/middleware/rateLimiter.js
 * ─────────────────────────────────
 * Exports a pre-configured express-rate-limit instance
 * applied specifically to POST /api/contact.
 *
 * Limits each IP to 10 submissions per 15-minute window.
 */

const rateLimit = require('express-rate-limit');

const contactRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,   // 15 minutes
  max:             10,                // requests per window
  standardHeaders: true,              // Return RateLimit-* headers
  legacyHeaders:   false,             // Disable X-RateLimit-* headers

  message: {
    success: false,
    message: 'Too many messages sent from this IP. Please try again after 15 minutes.',
  },

  // Use X-Forwarded-For header (needed behind proxies like Nginx/Render/Railway)
  // Remove the line below if NOT behind a proxy.
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});

module.exports = contactRateLimiter;