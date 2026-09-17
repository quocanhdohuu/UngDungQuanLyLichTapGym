const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const {
  uploadExerciseMedia,
} = require("../controllers/exerciseMediaController");

const router = express.Router();

router.post("/exercises/:exerciseId/media",upload.single("file"),uploadExerciseMedia,);

module.exports = router;
