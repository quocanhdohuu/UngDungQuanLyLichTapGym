const express = require('express');
const router = express.Router();

const LoginsessionsController = require('../controllers/loginsessions.controller');

router.get('/', LoginsessionsController.getAll);
router.get('/:loginSessionId', LoginsessionsController.getById);
router.post('/', LoginsessionsController.create);
router.put('/:loginSessionId', LoginsessionsController.update);
router.delete('/:loginSessionId', LoginsessionsController.delete);

module.exports = router;
