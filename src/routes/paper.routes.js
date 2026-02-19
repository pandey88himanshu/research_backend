const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paper.controller');

router.post('/', paperController.createPaper);
router.get('/', paperController.getPapers);
router.get('/analytics', paperController.getAnalytics);

module.exports = router;