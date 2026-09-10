const express = require('express');
const router = express.Router();

const EquipmentController = require('../controllers/equipment.controller');

router.get('/', EquipmentController.getAll);
router.get('/:equipmentId', EquipmentController.getById);
router.post('/', EquipmentController.create);
router.put('/:equipmentId', EquipmentController.update);
router.delete('/:equipmentId', EquipmentController.delete);

module.exports = router;
