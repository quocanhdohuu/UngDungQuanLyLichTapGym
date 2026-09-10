const express = require('express');
const router = express.Router();

const ExerciseequipmentController = require('../controllers/exerciseequipment.controller');

router.get('/', ExerciseequipmentController.getAll);
router.get('/:exerciseId', ExerciseequipmentController.getById);
router.post('/', ExerciseequipmentController.create);
router.put('/:exerciseId', ExerciseequipmentController.update);
router.delete('/:exerciseId', ExerciseequipmentController.delete);

module.exports = router;
