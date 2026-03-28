const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");

// Local save directory — inside the project root
const DATA_DIR = path.join(__dirname, "..", "..", "StudyOS_Data", "notebooks");

// Ensure the directory exists
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Sanitize an ID so it cannot escape DATA_DIR (no path traversal)
function sanitizeId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 100);
}

// @desc   Save notebook to local filesystem
// @route  POST /api/local-save
router.post("/", protect, (req, res) => {
  try {
    ensureDir();
    const { notebookId, title, blocks, tags } = req.body;
    const id = sanitizeId(notebookId) || `nb_${Date.now()}`;

    // Sanitize title for filename
    const safeName = (title || "Untitled")
      .replace(/[^a-zA-Z0-9_\- ]/g, "")
      .slice(0, 60)
      .trim();

    const fileData = {
      _id: id,
      title: title || "Untitled Document",
      blocks: blocks || [],
      tags: tags || [],
      savedAt: new Date().toISOString(),
      user: req.user?.username || req.user?._id || "unknown",
    };

    const filePath = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");

    // Also save a human-readable .md version
    let markdown = `# ${fileData.title}\n\n`;
    markdown += `> Saved: ${fileData.savedAt}\n\n---\n\n`;
    for (const b of fileData.blocks) {
      if (b.type === "text") {
        // Strip HTML tags for markdown
        const text = (b.html || "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<\/h[1-6]>/gi, "\n\n")
          .replace(/<h[1-6][^>]*>/gi, "## ")
          .replace(/<strong>|<b>/gi, "**")
          .replace(/<\/strong>|<\/b>/gi, "**")
          .replace(/<em>|<i>/gi, "_")
          .replace(/<\/em>|<\/i>/gi, "_")
          .replace(/<[^>]*>/g, "")
          .trim();
        if (text) markdown += text + "\n\n";
      } else if (b.type === "code") {
        markdown += `\`\`\`${(b.language || "").toLowerCase()}\n${b.code || ""}\n\`\`\`\n\n`;
      }
    }
    const mdPath = path.join(DATA_DIR, `${safeName}_${id.slice(-6)}.md`);
    fs.writeFileSync(mdPath, markdown, "utf-8");

    res.json({
      message: "Saved locally",
      savedAt: fileData.savedAt,
    });
  } catch (err) {
    console.error("Local save error:", err);
    res.status(500).json({ message: "Local save failed", error: err.message });
  }
});

// @desc   Load notebook from local filesystem
// @route  GET /api/local-save/:id
router.get("/:id", protect, (req, res) => {
  try {
    ensureDir();
    const filePath = path.join(DATA_DIR, `${sanitizeId(req.params.id)}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Local notebook not found" });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Load error", error: err.message });
  }
});

// @desc   List all locally saved notebooks
// @route  GET /api/local-save
router.get("/", protect, (req, res) => {
  try {
    ensureDir();
    const files = fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const data = JSON.parse(
          fs.readFileSync(path.join(DATA_DIR, f), "utf-8"),
        );
        return {
          _id: data._id,
          title: data.title,
          savedAt: data.savedAt,
          fileName: f,
        };
      })
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "List error", error: err.message });
  }
});

module.exports = router;
