const express = require('express');
const router = express.Router();

const ExercisemediaController = require('../controllers/exercisemedia.controller');

router.get('/', ExercisemediaController.getAll);
router.get('/:mediaId', ExercisemediaController.getById);
router.post('/', ExercisemediaController.create);
router.put('/:mediaId', ExercisemediaController.update);
router.delete('/:mediaId', ExercisemediaController.delete);

module.exports = router;
