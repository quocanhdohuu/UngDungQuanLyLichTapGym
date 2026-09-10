const express = require('express');
const router = express.Router();

const MusclegroupsController = require('../controllers/musclegroups.controller');

router.get('/', MusclegroupsController.getAll);
router.get('/:groupId', MusclegroupsController.getById);
router.post('/', MusclegroupsController.create);
router.put('/:groupId', MusclegroupsController.update);
router.delete('/:groupId', MusclegroupsController.delete);

module.exports = router;
