const router = require("express").Router();
const User = require("../controllers/user.controller");
const { requireUserSession, ownId } = require("../middlewares/userSessionMiddleware");

router.use(requireUserSession);
router.param("accountId", ownId("accountId"));
router.param("profileId", ownId("profileId"));

router.get("/profile/:accountId", User.getProfile);
router.put("/profile/:profileId", User.updateProfile);
router.put("/profile/:accountId/change-password", User.changePassword);
router.get("/:profileId/active-plan", User.getActivePlan);
router.post("/:profileId/apply-plan", User.applyPlan);
router.get("/:profileId/today-workout", User.getTodayWorkout);
router.get("/:profileId/progress-summary", User.getProgressSummary);
router.get("/:profileId/personal-records", User.getPersonalRecords);
router.get("/:profileId/workout-history", User.getWorkoutHistory);
router.get("/:profileId/workout-history/:workoutSessionId", User.getWorkoutDetail);
router.get("/:profileId/body-metrics", User.getBodyMetrics);
router.get("/:profileId/exercises/:exerciseId/previous-performance", User.getPreviousPerformance);

router.get("/:profileId/active-session", User.getActiveSession);
router.post("/:profileId/plans", User.createCustomPlan);

// Workout session routes
router.post("/:profileId/workout-sessions", User.startWorkoutSession);
router.post("/:profileId/workout-sessions/:workoutSessionId/exercises", User.addPerformedExercise);
router.put("/:profileId/workout-sessions/:workoutSessionId/complete", User.completeWorkoutSession);
router.put("/:profileId/workout-sessions/:workoutSessionId/cancel", User.cancelWorkoutSession);

// Performed exercise & set routes
router.put("/:profileId/performed-exercises/:performedExerciseId/complete", User.completePerformedExercise);
router.post("/:profileId/performed-exercises/:performedExerciseId/sets", User.addExerciseSet);
router.put("/:profileId/exercise-sets/:setId", User.updateExerciseSet);
router.delete("/:profileId/exercise-sets/:setId", User.deleteExerciseSet);

module.exports = router;
