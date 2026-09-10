const express = require('express');
const router = express.Router();

const ExercisesController = require('../controllers/exercises.controller');

router.get('/', ExercisesController.getAll);
router.get('/:exerciseId', ExercisesController.getById);
router.post('/', ExercisesController.create);
router.put('/:exerciseId', ExercisesController.update);
router.delete('/:exerciseId', ExercisesController.delete);

module.exports = router;
