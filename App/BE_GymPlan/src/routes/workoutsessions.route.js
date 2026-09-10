const express = require('express');
const router = express.Router();

const WorkoutsessionsController = require('../controllers/workoutsessions.controller');

router.get('/', WorkoutsessionsController.getAll);
router.get('/:workoutSessionId', WorkoutsessionsController.getById);
router.post('/', WorkoutsessionsController.create);
router.put('/:workoutSessionId', WorkoutsessionsController.update);
router.delete('/:workoutSessionId', WorkoutsessionsController.delete);

module.exports = router;
