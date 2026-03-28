const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { cache, clearCache } = require("../middleware/cache");

router.get("/", protect, cache(300), getTasks);
router.post("/", protect, clearCache, createTask);
router.put("/:id", protect, clearCache, updateTask);
router.delete("/:id", protect, clearCache, deleteTask);

module.exports = router;
