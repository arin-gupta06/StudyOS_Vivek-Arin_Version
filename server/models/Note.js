const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["Work", "Study", "Personal"],
    default: "Personal",
  },
  label: { type: String },
  title: { type: String },
  type: {
    type: String,
    enum: ["checklist", "bullets", "text", "quote", "flashcard"],
    default: "text",
  },
  body: { type: String },
  author: { type: String },
  items: { type: mongoose.Schema.Types.Mixed }, // Array of { text, done } for checklist or strings for bullets
  pinned: { type: Boolean, default: false },
  color: { type: String, default: "emerald" },

  // Spaced Repetition (Anki logic) fields
  isFlashcard: { type: Boolean, default: false },
  nextReviewDate: { type: Date, default: Date.now },
  interval: { type: Number, default: 0 },         // in days
  easeFactor: { type: Number, default: 2.5 },     // starting ease factor
  repetitions: { type: Number, default: 0 },      // number of successful reviews

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Note", NoteSchema);
