const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const bagageController = require('../controllers/bagageController');

// Agent scan (doit être avant /:bagage_id/*)
router.post('/scan', authenticateToken, bagageController.scanBagage);

// PMR
router.get('/', authenticateToken, bagageController.listMyBagages);
router.post('/', authenticateToken, bagageController.createBagage);
router.get('/:bagage_id/timeline', authenticateToken, bagageController.getTimeline);

module.exports = router;
