const express = require("express");
const router = express.Router();
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  reviewFlashcard,
} = require("../controllers/noteController");
const { protect } = require("../middleware/authMiddleware");
const { cache, clearCache } = require("../middleware/cache");

router.get("/", protect, cache(300), getNotes);
router.post("/", protect, clearCache, createNote);
router.put("/:id", protect, clearCache, updateNote);
router.delete("/:id", protect, clearCache, deleteNote);
router.post("/:id/review", protect, clearCache, reviewFlashcard);

module.exports = router;
