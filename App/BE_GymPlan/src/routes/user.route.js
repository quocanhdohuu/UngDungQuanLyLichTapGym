const router = require("express").Router();
const User = require("../controllers/user.controller");
const { requireUserSession, ownId } = require("../middlewares/userSessionMiddleware");

router.use(requireUserSession);
router.param("accountId", ownId("accountId"));
router.param("profileId", ownId("profileId"));

router.get("/profile/:accountId", User.getProfile);
router.put("/profile/:profileId", User.updateProfile);
router.get("/:profileId/active-plan", User.getActivePlan);
router.get("/:profileId/today-workout", User.getTodayWorkout);
router.get("/:profileId/progress-summary", User.getProgressSummary);
router.get("/:profileId/personal-records", User.getPersonalRecords);
router.get("/:profileId/workout-history", User.getWorkoutHistory);
router.get("/:profileId/workout-history/:workoutSessionId", User.getWorkoutDetail);

module.exports = router;
