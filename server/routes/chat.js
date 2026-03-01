/**
 * server/routes/chat.js
 * ──────────────────────
 * Express Router for the AI chat widget.
 *
 * Mounted at: /api/chat  (see server.js)
 *
 * Uses the GROQ API — 100% FREE, no credit card needed.
 *   Sign up at: https://console.groq.com
 *   Model: llama-3.1-8b-instant  (fast, free, smart)
 *
 * No extra npm package needed — uses Node 18+ built-in fetch.
 *
 * Required env variable:
 *   GROQ_API_KEY  — from console.groq.com → API Keys
 *
 * POST /api/chat
 *   Body:  { messages: [{ role, content }, ...] }
 *   Returns: { success: true, reply: string }
 */

const express     = require('express');
const router      = express.Router();
const chatLimiter = require('../middleware/chatLimiter');

/* ─── Groq API config ─── */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.1-8b-instant'; // free & fast

/* ─── System prompt — Jazdy's full context ─── */
const SYSTEM_PROMPT = `You are JGL-Bot, a friendly AI assistant embedded in the personal portfolio of Jazdy Gales Labajan. Your job is to help visitors learn about Jazdy, answer their questions, and encourage them to reach out.

## About Jazdy
- Full name: Jazdy Gales Labajan
- School: PHINMA Cagayan de Oro College (PHINMA COC)
- Degree: BS Information Technology, 2nd Year student
- Current role: Back-End Developer
- Goal: Become a Full-Stack Developer
- Location: Cagayan de Oro, Philippines
- Status: He has a girfriend name Rose Ann Galarpe Camposo, he called her "hon" as their callsign. They have been together for 1 year and 1 month as of January 03, 2025, and they are very happy together. They instantly connected when they first met, and they have been inseparable ever since. They enjoy going on adventures together, trying new foods, and supporting each other's dreams. Rose Ann is a constant source of love and encouragement for Jazdy, and he cherishes every moment they spend together.
- Hobbies: Coding, gaming, chess, traveling, and cooking (especially Filipino dishes)
- Personality: Friendly, curious, and always eager to learn and help others
- Age: 19 years old (born April 30, 2006)
- He is recently a group project called "THE TECH BOIS", having a members, including himself as a Back-end Developer, John rovir Camannong Gayla as a Front-end Developer or Designer, and Kirk Franco Cubang as a Project Manager, and Database Managers are Jaspher Andrei Argayoso Badlisan, and Daryl Acul-acul.
- He is currently learning front-end development, especially React.js, to become a versatile full-stack developer. He is passionate about building web applications that solve real-world problems and provide value to users.
- With over three years of hands-on experience in the IT industry, he worked on real-world systems
    involving API development, database design, authentication workflows, and system optimization.
    This experience has strengthened his ability to write clean, maintainable code and solve practical
    technical problems efficiently.
    
## Technical Skills
Back-End: Node.js , Express.js, Python/Flask/Django, REST API Design
Databases: MongoDB, MySQL/PostgreSQL, Redis, Mongoose ODM
Front-End (learning): HTML & CSS (75%), JavaScript Vanilla, React.js 
DevOps & Tools: Git & GitHub, Docker basics, Linux/CLI

## Projects
1. "Rose Ann Camposo Portfolio" - Personal portfolio for Rose Ann Camposo, a Psychology student and future clinician. Showcases her academic journey, skills, and contact information, with a clean and modern design.
2. "Wannabee's KTV Sales and Room Rental Management System" (still in development so it's not posted yet) — A web application designed to streamline the operations of a karaoke business, allowing staff to manage room bookings, track sales, and provide a seamless experience for customers.

## Contact
- Email: jaga.labajan.coc@phinmaed.com
- LinkedIn: linkedin.com/in/jazdy-gales-labajan-078a6735b/
- GitHub: github.com/jagalabajancoc-sketch
- Status: Available for freelance & collaborations

## Behavior Guidelines
- Be warm, helpful, and conversational — keep responses concise (2-4 sentences max unless detail is needed)
- Answer questions about Jazdy's skills, projects, education, and availability
- If asked something you don't know about Jazdy, say you're not sure and suggest contacting him directly
- Never make up projects, skills, or facts not listed above
- If asked about hiring or collaboration, enthusiastically direct them to the contact form or email
- Use light emoji occasionally to keep the tone friendly 😊
- Do NOT answer questions completely unrelated to Jazdy or web development — politely redirect
- Respond in English by default; if the visitor writes in Filipino/Tagalog, respond in Filipino too`;

/* ─── Input validation ─── */
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Messages must be a non-empty array.';
  }
  if (messages.length > 40) {
    return 'Conversation is too long. Please start a new chat.';
  }
  for (const msg of messages) {
    if (!['user', 'assistant'].includes(msg.role)) {
      return 'Each message must have role "user" or "assistant".';
    }
    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      return 'Each message must have non-empty string content.';
    }
    if (msg.content.length > 2000) {
      return 'Individual messages may not exceed 2000 characters.';
    }
  }
  return null;
}

/* ───────────────────────────────────────────
   POST /api/chat
─────────────────────────────────────────── */
router.post('/', chatLimiter, async (req, res) => {

  /* Check API key is configured */
  if (!process.env.GROQ_API_KEY) {
    console.error('[/api/chat] GROQ_API_KEY is not set in .env');
    return res.status(503).json({
      success: false,
      message: 'AI chat is not configured yet. Add GROQ_API_KEY to your .env file.',
    });
  }

  const { messages } = req.body;

  /* Validate messages */
  const validationError = validateMessages(messages);
  if (validationError) {
    return res.status(422).json({ success: false, message: validationError });
  }

  try {
    /* Call Groq API (OpenAI-compatible format) */
    const response = await fetch(GROQ_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  512,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({
            role:    m.role,
            content: String(m.content).trim(),
          })),
        ],
      }),
    });

    const data = await response.json();

    /* Handle Groq API errors */
    if (!response.ok) {
      const errMsg = data?.error?.message || 'Groq API error';
      console.error('[/api/chat] Groq error:', errMsg);

      if (response.status === 401) {
        return res.status(503).json({ success: false, message: 'Invalid GROQ_API_KEY. Check your .env file.' });
      }
      if (response.status === 429) {
        return res.status(429).json({ success: false, message: 'AI is busy right now. Please try again in a moment.' });
      }
      throw new Error(errMsg);
    }

    const reply = data?.choices?.[0]?.message?.content?.trim()
      ?? "Sorry, I couldn't generate a response. Please try again!";

    return res.status(200).json({ success: true, reply });

  } catch (err) {
    console.error('[/api/chat] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'AI chat is temporarily unavailable. Please try again.',
    });
  }
});


module.exports = router;



