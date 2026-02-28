/**
 * server/middleware/chatLimiter.js
 * ─────────────────────────────────
 * Rate limiter specific to POST /api/chat.
 * Limits each IP to 30 messages per 10-minute window
 * to prevent API key abuse.
 */

const rateLimit = require('express-rate-limit');

const chatRateLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,  // 10 minutes
  max:             30,               // 30 messages per window
  standardHeaders: true,
  legacyHeaders:   false,

  message: {
    success: false,
    message: 'Too many messages sent. Please wait a few minutes before chatting again.',
  },

  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});

module.exports = chatRateLimiter;