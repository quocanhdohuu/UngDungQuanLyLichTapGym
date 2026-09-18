const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const {
  uploadExerciseMedia,
  uploadTemporaryExerciseMedia,
  deleteExerciseMediaFile,
} = require("../controllers/exerciseMediaController");

const router = express.Router();

router.post(
  "/exercises/media/upload",
  upload.single("file"),
  uploadTemporaryExerciseMedia,
);
router.delete("/exercises/media", deleteExerciseMediaFile);
router.post(
  "/exercises/:exerciseId/media",
  upload.single("file"),
  uploadExerciseMedia,
);

module.exports = router;
