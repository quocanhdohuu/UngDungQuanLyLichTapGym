const express = require('express');
const router = express.Router();

const ExerciseconfigsController = require('../controllers/exerciseconfigs.controller');

router.get('/', ExerciseconfigsController.getAll);
router.get('/:configId', ExerciseconfigsController.getById);
router.post('/', ExerciseconfigsController.create);
router.put('/:configId', ExerciseconfigsController.update);
router.delete('/:configId', ExerciseconfigsController.delete);

module.exports = router;
