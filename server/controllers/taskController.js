const Task = require("../models/Task");

// @desc   Get tasks grouped by status
// @route  GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    const grouped = {
      todo: tasks.filter((t) => t.status === "todo"),
      inProgress: tasks.filter((t) => t.status === "inProgress"),
      completed: tasks.filter((t) => t.status === "completed"),
    };
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Create a task
// @route  POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, progress, dueDate } =
      req.body;
    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      status: status || "todo",
      priority: priority || "Medium",
      progress: progress || 0,
      dueDate,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a task (status, progress, etc)
// @route  PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a task
// @route  DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
