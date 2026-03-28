const mongoose = require("mongoose");

const ChapterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    progress: { type: Number, default: 0 },
    tasks: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
  },
  { _id: false },
);

const SubjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  icon: { type: String, default: "📚" },
  color: { type: String, default: "from-indigo-500 to-purple-500" },
  bgLight: { type: String, default: "bg-indigo-500/10" },
  textColor: { type: String, default: "text-indigo-400" },
  borderColor: { type: String, default: "border-indigo-500/20" },
  progress: { type: Number, default: 0 },
  totalChapters: { type: Number, default: 0 },
  completedChapters: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  studyHours: { type: Number, default: 0 },
  lastStudied: { type: String, default: "Never" },
  status: {
    type: String,
    enum: [
      "in-progress",
      "needs-attention",
      "almost-done",
      "completed",
      "not-started",
    ],
    default: "not-started",
  },
  chapters: [ChapterSchema],
  createdAt: { type: Date, default: Date.now },
});

// Index to optimize queries for a user's subjects
SubjectSchema.index({ user: 1 });

module.exports = mongoose.model("Subject", SubjectSchema);
