const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["todo", "inProgress", "completed"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  progress: { type: Number, default: 0 },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Compound indexes for faster querying by user & status, or user & dueDate
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model("Task", TaskSchema);
