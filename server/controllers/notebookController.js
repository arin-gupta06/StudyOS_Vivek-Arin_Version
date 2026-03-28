const Notebook = require("../models/Notebook");

// @desc   Get all notebooks for user
// @route  GET /api/notebooks
exports.getNotebooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default limit 20
    const skip = (page - 1) * limit;

    const notebooks = await Notebook.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json(notebooks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get single notebook by ID
// @route  GET /api/notebooks/:id
exports.getNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();
    if (!notebook)
      return res.status(404).json({ message: "Notebook not found" });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get a shared notebook (any authenticated user with the link)
// @route  GET /api/notebooks/shared/:id
exports.getSharedNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      isShared: true,
    });
    if (!notebook)
      return res.status(404).json({ message: "Shared notebook not found" });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a shared notebook (any authenticated user with the link)
// @route  PUT /api/notebooks/shared/:id
exports.updateSharedNotebook = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.blocks && Array.isArray(req.body.blocks)) {
      let total = 0;
      for (const b of req.body.blocks) {
        if (b.type === "text") {
          const t = (b.html || "").replace(/<[^>]*>/g, " ").trim();
          total += t ? t.split(/\s+/).length : 0;
        } else if (b.type === "code") {
          const t = (b.code || "").trim();
          total += t ? t.split(/\s+/).length : 0;
        }
      }
      updateData.wordCount = total;
    }
    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, isShared: true },
      updateData,
      { new: true },
    );
    if (!notebook)
      return res.status(404).json({ message: "Shared notebook not found" });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Toggle share on a notebook
// @route  PUT /api/notebooks/:id/share
exports.toggleShare = async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notebook)
      return res.status(404).json({ message: "Notebook not found" });
    notebook.isShared = true;
    await notebook.save();
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get notebook by subject + chapter combo
// @route  GET /api/notebooks/chapter?subjectId=xxx&chapterName=yyy
exports.getByChapter = async (req, res) => {
  try {
    const { subjectId, chapterName } = req.query;
    let notebook = await Notebook.findOne({
      user: req.user._id,
      subject: subjectId,
      chapterName,
    });

    // Auto-create if it doesn't exist yet
    if (!notebook) {
      const Subject = require("../models/Subject");
      const subject = await Subject.findById(subjectId);
      notebook = await Notebook.create({
        user: req.user._id,
        subject: subjectId,
        subjectName: subject ? subject.name : "",
        chapterName,
        title: `${chapterName} Notes`,
        content: "",
        blocks: [{ id: Date.now().toString(36), type: "text", html: "" }],
        tags: subject
          ? [
              {
                label: subject.name,
                bg: "bg-primary-light",
                color: "text-primary",
              },
              { label: "Notes", bg: "bg-purple-100", color: "text-purple-500" },
            ]
          : [],
      });
    }

    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Create a notebook
// @route  POST /api/notebooks
exports.createNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.create({
      user: req.user._id,
      ...req.body,
    });
    res.status(201).json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a notebook (content save, title, tags, etc.)
// @route  PUT /api/notebooks/:id
exports.updateNotebook = async (req, res) => {
  try {
    // Calculate word count from blocks or content
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.blocks && Array.isArray(req.body.blocks)) {
      let total = 0;
      for (const b of req.body.blocks) {
        if (b.type === "text") {
          const t = (b.html || "").replace(/<[^>]*>/g, " ").trim();
          total += t ? t.split(/\s+/).length : 0;
        } else if (b.type === "code") {
          const t = (b.code || "").trim();
          total += t ? t.split(/\s+/).length : 0;
        }
      }
      updateData.wordCount = total;
    } else if (req.body.content !== undefined) {
      const text = req.body.content.replace(/<[^>]*>/g, " ").trim();
      updateData.wordCount = text ? text.split(/\s+/).length : 0;
    }

    const notebook = await Notebook.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true },
    );
    if (!notebook)
      return res.status(404).json({ message: "Notebook not found" });
    res.json(notebook);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Bulk delete notebooks
// @route  POST /api/notebooks/bulk-delete
exports.bulkDeleteNotebooks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No notebook IDs provided" });
    }
    const result = await Notebook.deleteMany({
      _id: { $in: ids },
      user: req.user._id,
    });
    res.json({ message: `${result.deletedCount} notebook(s) deleted`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete all notebooks for user
// @route  DELETE /api/notebooks/all
exports.deleteAllNotebooks = async (req, res) => {
  try {
    const result = await Notebook.deleteMany({ user: req.user._id });
    res.json({ message: `${result.deletedCount} notebook(s) deleted`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a notebook
// @route  DELETE /api/notebooks/:id
exports.deleteNotebook = async (req, res) => {
  try {
    const notebook = await Notebook.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!notebook)
      return res.status(404).json({ message: "Notebook not found" });
    res.json({ message: "Notebook deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
