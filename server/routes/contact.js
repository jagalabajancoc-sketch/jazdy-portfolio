/**
 * server/routes/contact.js
 * ─────────────────────────
 * Express Router for the contact form API.
 *
 * Mounted at:  /api/contact  (see server.js)
 * Methods:
 *   POST /api/contact   — validate → save to MongoDB → respond
 *   GET  /api/contact   — health check (development only)
 *
 * Imported modules:
 *   ../../server/models/Contact     — Mongoose model
 *   ../../server/middleware/rateLimiter — IP rate limiting
 */

const express         = require('express');
const router          = express.Router();
const crypto          = require('crypto');
const Contact = require('../models/Contact');  
const contactLimiter  = require('../middleware/rateLimiter');

/* ─── Shared server-side validation helper ─── */
function validateContactPayload(body) {
  const { name, email, subject, message, rating } = body;
  const errors = [];

  if (!name    || String(name).trim().length    < 2)   errors.push('Name must be at least 2 characters.');
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) errors.push('A valid email address is required.');
  if (!subject || String(subject).trim().length < 3)   errors.push('Subject must be at least 3 characters.');
  if (!message || String(message).trim().length < 10)  errors.push('Message must be at least 10 characters.');

  if (rating !== undefined && rating !== null && rating !== '') {
    const r = parseInt(rating, 10);
    if (isNaN(r) || r < 1 || r > 5) errors.push('Rating must be a number between 1 and 5.');
  }

  return errors;
}

/* ───────────────────────────────────────────
   POST /api/contact
   Body (JSON):
     { name, email, subject, message, rating? }
   Response 201:
     { success: true, message: string }
   Response 422 / 500:
     { success: false, message: string, errors?: string[] }
─────────────────────────────────────────── */
router.post('/', contactLimiter, async (req, res) => {
  try {
    /* 1 — Validate input */
    const errors = validateContactPayload(req.body);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    /* 2 — Sanitise & parse */
    const { name, email, subject, message, rating } = req.body;
    const parsedRating = rating ? parseInt(rating, 10) : null;

    /* 3 — Persist to MongoDB */
    const doc = await Contact.create({
      name:    String(name).trim(),
      email:   String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      rating:  parsedRating,
      ip:      crypto.createHmac('sha256', process.env.IP_HASH_SALT || 'default-ip-salt').update(req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').digest('hex'),
    });

    /* 4 — Success response */
    return res.status(201).json({
      success: true,
      message: "Message received! I'll get back to you soon.",
      id:      doc._id,        // optional: can be removed if you don't need it on client
    });

  } catch (err) {
    /* Mongoose validation error (schema-level) */
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors)[0]?.message || 'Validation failed.';
      return res.status(422).json({ success: false, message: msg });
    }

    /* Duplicate key (if unique index is ever added) */
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate submission detected.' });
    }

    console.error('[POST /api/contact] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
});

/* ─── GET /api/contact — dev health check ─── */
router.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  res.json({ success: true, message: 'Contact API is up.' });
});


module.exports = router;

