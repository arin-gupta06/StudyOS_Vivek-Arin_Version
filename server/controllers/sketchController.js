const Sketch = require("../models/Sketch");

/* GET /api/sketches  — all sketches for user (gallery) */
exports.getSketches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default limit 20
    const skip = (page - 1) * limit;

    const sketches = await Sketch.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title thumbnail width height createdAt updatedAt")
      .skip(skip)
      .limit(limit)
      .lean();
    res.json(sketches);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* GET /api/sketches/:id  — single sketch with full data */
exports.getSketch = async (req, res) => {
  try {
    const sketch = await Sketch.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();
    if (!sketch) return res.status(404).json({ message: "Sketch not found" });
    res.json(sketch);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* POST /api/sketches  — create new sketch */
exports.createSketch = async (req, res) => {
  try {
    const { title, dataUrl, thumbnail, width, height } = req.body;
    const sketch = await Sketch.create({
      user: req.user._id,
      title: title || "Untitled Sketch",
      dataUrl: dataUrl || "",
      thumbnail: thumbnail || "",
      width: width || 1920,
      height: height || 1080,
    });
    res.status(201).json(sketch);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* PUT /api/sketches/:id  — update sketch */
exports.updateSketch = async (req, res) => {
  try {
    const sketch = await Sketch.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!sketch) return res.status(404).json({ message: "Sketch not found" });

    const { title, dataUrl, thumbnail, width, height } = req.body;
    if (title !== undefined) sketch.title = title;
    if (dataUrl !== undefined) sketch.dataUrl = dataUrl;
    if (thumbnail !== undefined) sketch.thumbnail = thumbnail;
    if (width !== undefined) sketch.width = width;
    if (height !== undefined) sketch.height = height;
    sketch.updatedAt = Date.now();

    await sketch.save();
    res.json(sketch);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* DELETE /api/sketches/:id */
exports.deleteSketch = async (req, res) => {
  try {
    const sketch = await Sketch.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!sketch) return res.status(404).json({ message: "Sketch not found" });
    res.json({ message: "Sketch deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
