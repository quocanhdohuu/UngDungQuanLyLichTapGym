const express = require('express');
const router = express.Router();

const AccountsController = require('../controllers/accounts.controller');

router.get('/', AccountsController.getAll);
router.get('/:accountId', AccountsController.getById);
router.post('/', AccountsController.create);
router.put('/:accountId', AccountsController.update);
router.delete('/:accountId', AccountsController.delete);

module.exports = router;
