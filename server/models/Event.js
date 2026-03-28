const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  type: {
    type: String,
    enum: ["Quiz", "Exam", "Assignment", "Reminder"],
    default: "Quiz",
  },
  date: { type: Date, required: true },
  time: { type: String, default: "" },
  reminder: { type: Boolean, default: false },
  reminderMinutes: { type: Number, default: 30 },
  createdAt: { type: Date, default: Date.now },
});

// Index for quicker chronological retrieval of events per user
EventSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Event", EventSchema);
