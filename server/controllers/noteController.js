const Note = require("../models/Note");

// @desc   Get all notes for user
// @route  GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      pinned: -1,
      updatedAt: -1,
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Create a note
// @route  POST /api/notes
exports.createNote = async (req, res) => {
  try {
    const note = await Note.create({ user: req.user._id, ...req.body });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a note
// @route  PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true },
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a note
// @route  DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
