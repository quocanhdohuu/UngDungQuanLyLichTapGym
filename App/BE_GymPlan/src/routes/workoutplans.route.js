const express = require("express");
const router = express.Router();

const WorkoutplansController = require("../controllers/workoutplans.controller");
const { requireUserSession } = require("../middlewares/userSessionMiddleware");
const User = require("../models/user.model");

router.get("/recommendations", requireUserSession, async (req, res) => {
  try {
    const result = await User.getRecommendations(req.userSession.profileId);
    return res.json({ data: result });
  } catch (error) {
    const status = error.statusCode || (error.sqlState === "45000" ? 400 : 500);
    return res.status(status).json({
      message: status === 500 ? "Không thể tải gợi ý lịch tập. Vui lòng thử lại."
        : error.sqlMessage || error.message,
    });
  }
});

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
