const Subject = require("../models/Subject");

// @desc   Get all subjects for user
// @route  GET /api/subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Create a subject
// @route  POST /api/subjects
exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create({ user: req.user._id, ...req.body });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a subject
// @route  PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true },
    );
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a subject
// @route  DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
