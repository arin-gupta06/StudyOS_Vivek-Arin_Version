const mongoose = require("mongoose");

const NotebookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    default: null,
  },
  subjectName: { type: String, default: "" },
  chapterName: { type: String, default: "" },
  title: { type: String, default: "Untitled Document" },
  content: { type: String, default: "" },
  blocks: { type: mongoose.Schema.Types.Mixed, default: [] },
  tags: [
    {
      label: { type: String },
      bg: { type: String, default: "bg-primary-light" },
      color: { type: String, default: "text-primary" },
    },
  ],
  wordCount: { type: Number, default: 0 },
  isShared: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for optimizing queries on notebooks tied to subjects/users
NotebookSchema.index({ user: 1, subject: 1 });
NotebookSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Notebook", NotebookSchema);
