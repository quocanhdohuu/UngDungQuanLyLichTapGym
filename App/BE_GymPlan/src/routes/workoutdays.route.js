const express = require("express");
const router = express.Router();

const WorkoutdaysController = require("../controllers/workoutdays.controller");

router.post("/plan/:planId", WorkoutdaysController.addWithProcedure);
router.put("/:dayId/procedure", WorkoutdaysController.updateWithProcedure);
router.get("/", WorkoutdaysController.getAll);
router.get("/:dayId", WorkoutdaysController.getById);
router.post("/", WorkoutdaysController.create);
router.put("/:dayId", WorkoutdaysController.update);
router.delete("/:dayId", WorkoutdaysController.delete);

module.exports = router;
