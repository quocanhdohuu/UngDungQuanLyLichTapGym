const express = require('express');
const router = express.Router();

const GymusersController = require('../controllers/gymusers.controller');

router.get('/', GymusersController.getAll);
router.get('/:profileId', GymusersController.getById);
router.post('/', GymusersController.create);
router.put('/:profileId', GymusersController.update);
router.delete('/:profileId', GymusersController.delete);

module.exports = router;
