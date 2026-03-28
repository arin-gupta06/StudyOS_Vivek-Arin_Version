const express = require("express");
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");
const { cache, clearCache } = require("../middleware/cache");

router.get("/", protect, cache(300), getSubjects);
router.post("/", protect, clearCache, createSubject);
router.put("/:id", protect, clearCache, updateSubject);
router.delete("/:id", protect, clearCache, deleteSubject);

module.exports = router;
