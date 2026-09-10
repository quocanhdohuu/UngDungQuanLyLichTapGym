const express = require('express');
const router = express.Router();

const ExercisemusclegroupsController = require('../controllers/exercisemusclegroups.controller');

router.get('/', ExercisemusclegroupsController.getAll);
router.get('/:exerciseMuscleGroupId', ExercisemusclegroupsController.getById);
router.post('/', ExercisemusclegroupsController.create);
router.put('/:exerciseMuscleGroupId', ExercisemusclegroupsController.update);
router.delete('/:exerciseMuscleGroupId', ExercisemusclegroupsController.delete);

module.exports = router;
