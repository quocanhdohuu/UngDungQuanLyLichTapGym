const express = require('express');
const router = express.Router();

const PerformedexercisesController = require('../controllers/performedexercises.controller');

router.get('/', PerformedexercisesController.getAll);
router.get('/:performedExerciseId', PerformedexercisesController.getById);
router.post('/', PerformedexercisesController.create);
router.put('/:performedExerciseId', PerformedexercisesController.update);
router.delete('/:performedExerciseId', PerformedexercisesController.delete);

module.exports = router;
