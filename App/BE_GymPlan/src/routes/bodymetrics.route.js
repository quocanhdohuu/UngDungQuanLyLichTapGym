const express = require('express');
const router = express.Router();

const BodymetricsController = require('../controllers/bodymetrics.controller');

router.get('/', BodymetricsController.getAll);
router.get('/:metricId', BodymetricsController.getById);
router.post('/', BodymetricsController.create);
router.put('/:metricId', BodymetricsController.update);
router.delete('/:metricId', BodymetricsController.delete);

module.exports = router;
