const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { cache, clearCache } = require("../middleware/cache");
const {
  getSketches,
  getSketch,
  createSketch,
  updateSketch,
  deleteSketch,
} = require("../controllers/sketchController");

router.use(protect);

router.route("/").get(cache(300), getSketches).post(clearCache, createSketch);
router.route("/:id").get(cache(300), getSketch).put(clearCache, updateSketch).delete(clearCache, deleteSketch);

module.exports = router;
