const mongoose = require("mongoose");

const FocusSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, required: true, default: Date.now },
  endedAt: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // in seconds
  status: {
    type: String,
    enum: ["active", "paused", "completed"],
    default: "active",
  },
  pausedDuration: { type: Number, default: 0 }, // total paused seconds
  lastPausedAt: { type: Date, default: null },
});

// Index to quickly fetch a user's completed focus sessions or active sessions
FocusSessionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("FocusSession", FocusSessionSchema);
