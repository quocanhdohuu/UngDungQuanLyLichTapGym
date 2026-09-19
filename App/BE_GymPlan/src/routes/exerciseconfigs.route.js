const express = require("express");
const router = express.Router();

const ExerciseconfigsController = require("../controllers/exerciseconfigs.controller");

router.post("/day/:dayId", ExerciseconfigsController.addWithProcedure);
router.put(
  "/:configId/procedure",
  ExerciseconfigsController.updateWithProcedure,
);
router.get("/", ExerciseconfigsController.getAll);
router.get("/:configId", ExerciseconfigsController.getById);
router.post("/", ExerciseconfigsController.create);
router.put("/:configId", ExerciseconfigsController.updateWithProcedure);
router.delete("/:configId", ExerciseconfigsController.delete);

module.exports = router;
