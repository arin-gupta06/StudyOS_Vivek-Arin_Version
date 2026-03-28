const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { cache, clearCache } = require("../middleware/cache");
const {
  getNotebooks,
  getNotebook,
  getByChapter,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  bulkDeleteNotebooks,
  deleteAllNotebooks,
  getSharedNotebook,
  updateSharedNotebook,
  toggleShare,
} = require("../controllers/notebookController");

router.get("/", protect, cache(300), getNotebooks);
router.post("/bulk-delete", protect, clearCache, bulkDeleteNotebooks);
router.delete("/all", protect, clearCache, deleteAllNotebooks);
router.get("/chapter", protect, cache(300), getByChapter);
router.get("/shared/:id", cache(300), getSharedNotebook);
router.put("/shared/:id", clearCache, updateSharedNotebook);
router.get("/:id", protect, cache(300), getNotebook);
router.post("/", protect, clearCache, createNotebook);
router.put("/:id/share", protect, clearCache, toggleShare);
router.put("/:id", protect, clearCache, updateNotebook);
router.delete("/:id", protect, clearCache, deleteNotebook);

module.exports = router;
