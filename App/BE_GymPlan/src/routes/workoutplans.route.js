const express = require("express");
const router = express.Router();

const WorkoutplansController = require("../controllers/workoutplans.controller");

router.get("/templates", WorkoutplansController.getTemplates);
router.get("/:planId/detail", WorkoutplansController.getDetail);
router.post("/procedure", WorkoutplansController.createWithProcedure);
router.put("/:planId/procedure", WorkoutplansController.updateWithProcedure);
router.get("/", WorkoutplansController.getAll);
router.get("/:planId", WorkoutplansController.getById);
router.post("/", WorkoutplansController.create);
router.put("/:planId", WorkoutplansController.update);
router.delete("/:planId", WorkoutplansController.delete);

module.exports = router;
