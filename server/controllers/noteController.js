const Note = require("../models/Note");

// @desc   Get all notes for user
// @route  GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default limit 50, fast chunks
    const skip = (page - 1) * limit;

    const notes = await Note.find({ user: req.user._id })
      .sort({ pinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
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
// @desc   Review a flashcard
// @route  POST /api/notes/:id/review
exports.reviewFlashcard = async (req, res) => {
  try {
    const { quality } = req.body; // 1=Again, 3=Hard, 4=Good, 5=Easy
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) return res.status(404).json({ message: "Note not found" });

    let { interval, easeFactor, repetitions } = note;
    let q = quality || 4; // default Good

    if (q < 3) {
      // Failed (Again or Hard)
      repetitions = 0;
      interval = 1;
    } else {
      // Success (Hard, Good, Easy)
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    note.interval = interval;
    note.easeFactor = easeFactor;
    note.repetitions = repetitions;
    note.nextReviewDate = nextReviewDate;
    
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};