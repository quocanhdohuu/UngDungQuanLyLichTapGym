const express = require('express');
const router = express.Router();

const GymuserworkoutplansController = require('../controllers/gymuserworkoutplans.controller');

router.get('/', GymuserworkoutplansController.getAll);
router.get('/:profileId', GymuserworkoutplansController.getById);
router.post('/', GymuserworkoutplansController.create);
router.put('/:profileId', GymuserworkoutplansController.update);
router.delete('/:profileId', GymuserworkoutplansController.delete);

module.exports = router;
