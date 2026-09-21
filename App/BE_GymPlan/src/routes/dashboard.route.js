const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/dashboard.controller");

router.get("/summary", DashboardController.getSummary);
router.get("/user-growth", DashboardController.getUserGrowth);
router.get("/workout-activity", DashboardController.getWorkoutActivity);
router.get("/exercise-statistics", DashboardController.getExerciseStatistics);
router.get("/recent-users", DashboardController.getRecentUsers);
router.get(
  "/recent-workout-templates",
  DashboardController.getRecentWorkoutTemplates,
);

module.exports = router;
