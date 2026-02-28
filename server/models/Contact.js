/**
 * server/models/Contact.js
 * ─────────────────────────
 * Mongoose schema + model for contact form submissions.
 *
 * Collection: contacts
 * Fields:
 *   name       {String}  required, trimmed, max 120 chars
 *   email      {String}  required, trimmed, lowercased, validated
 *   subject    {String}  required, trimmed, max 200 chars
 *   message    {String}  required, trimmed, max 5 000 chars
 *   rating     {Number}  optional, 1–5
 *   createdAt  {Date}    auto-set on creation
 *   ip         {String}  stored for abuse prevention, hidden from queries
 */

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required.'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [120, 'Name may not exceed 120 characters.'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required.'],
      trim:      true,
      lowercase: true,
      maxlength: [254, 'Email address is too long.'],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address.',
      ],
    },

    subject: {
      type:      String,
      required:  [true, 'Subject is required.'],
      trim:      true,
      minlength: [3, 'Subject must be at least 3 characters.'],
      maxlength: [200, 'Subject may not exceed 200 characters.'],
    },

    message: {
      type:      String,
      required:  [true, 'Message is required.'],
      trim:      true,
      minlength: [10, 'Message must be at least 10 characters.'],
      maxlength: [5000, 'Message may not exceed 5 000 characters.'],
    },

    rating: {
      type:    Number,
      min:     [1, 'Rating must be at least 1.'],
      max:     [5, 'Rating may not exceed 5.'],
      default: null,
    },

    createdAt: {
      type:    Date,
      default: Date.now,
      index:   true,          // allows efficient sorting/querying by date
    },

    ip: {
      type:   String,
      trim:   true,
      select: false,          // never returned by default queries
    },
  },
  {
    collection: 'contacts',
    versionKey: false,        // removes __v field
  }
);

module.exports = mongoose.model('Contact', contactSchema);