/**
 * server.js — Application Entry Point
 * ─────────────────────────────────────
 * Wires together:
 *   server/config/db.js          → MongoDB connection
 *   server/routes/contact.js     → POST /api/contact
 *   server/routes/chat.js        → POST /api/chat  (AI chat widget)
 *   public/                      → Static front-end files
 *
 * Environment variables (see .env.example):
 *   MONGODB_URI       — MongoDB connection string
 *   PORT              — HTTP port (default 3000)
 *   ALLOWED_ORIGIN    — CORS allowed origin
 *   NODE_ENV          — 'development' | 'production'
 *   GROQ_API_KEY      — from console.groq.com (FREE AI chat)
 *
 * Usage:
 *   npm start       → node server.js
 *   npm run dev     → nodemon server.js
 */

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const path         = require('path');

const connectDB    = require('./server/config/db');
const contactRoute = require('./server/routes/contact');
const chatRoute    = require('./server/routes/chat');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

/* ══════════════════════════════════════════
   SECURITY MIDDLEWARE
══════════════════════════════════════════ */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.groq.com"],
    },
  },
}));

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  WARNING: GROQ_API_KEY is not set. AI chat will be unavailable.');
}

if (!process.env.ALLOWED_ORIGIN) {
  console.warn('⚠️  WARNING: ALLOWED_ORIGIN is not set. Cross-origin requests will be blocked.');
}

app.use(cors({
  origin:  process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
}));

/* ══════════════════════════════════════════
   BODY PARSING
   Limit raised to 64kb to handle multi-turn
   chat conversation history payloads.
══════════════════════════════════════════ */
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

/* ══════════════════════════════════════════
   STATIC FILES
   Express serves everything inside /public.
   Assets are at /assets/css/styles.css and
   /assets/js/script.js — matching index.html.
══════════════════════════════════════════ */
app.use(express.static(path.join(__dirname, 'public')));

/* ══════════════════════════════════════════
   API ROUTES
══════════════════════════════════════════ */
app.use('/api/contact', contactRoute);
app.use('/api/chat',    chatRoute);   // ← AI chat widget

/* ══════════════════════════════════════════
   SPA FALLBACK
══════════════════════════════════════════ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ══════════════════════════════════════════
   GLOBAL ERROR HANDLER
══════════════════════════════════════════ */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

/* ══════════════════════════════════════════
   START — Connect DB first, then listen
══════════════════════════════════════════ */
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀  Server running     → http://localhost:${PORT}`);
    console.log(`📁  Static files       → ${path.join(__dirname, 'public')}`);
    console.log(`🤖  AI Chat (Groq)     → ${process.env.GROQ_API_KEY ? 'enabled ✅' : '⚠️  GROQ_API_KEY not set — see .env.example'}`);
    console.log(`🌐  NODE_ENV           = ${process.env.NODE_ENV || 'development'}`);
  });
})();