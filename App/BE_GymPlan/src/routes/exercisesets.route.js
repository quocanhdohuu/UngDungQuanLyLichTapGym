const express = require('express');
const router = express.Router();

const ExercisesetsController = require('../controllers/exercisesets.controller');

router.get('/', ExercisesetsController.getAll);
router.get('/:setId', ExercisesetsController.getById);
router.post('/', ExercisesetsController.create);
router.put('/:setId', ExercisesetsController.update);
router.delete('/:setId', ExercisesetsController.delete);

module.exports = router;
