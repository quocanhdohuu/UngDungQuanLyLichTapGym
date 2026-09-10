const express = require('express');
const router = express.Router();

const AdminsController = require('../controllers/admins.controller');

router.get('/', AdminsController.getAll);
router.get('/:accountId', AdminsController.getById);
router.post('/', AdminsController.create);
router.put('/:accountId', AdminsController.update);
router.delete('/:accountId', AdminsController.delete);

module.exports = router;
