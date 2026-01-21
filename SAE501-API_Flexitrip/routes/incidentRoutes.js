const express = require('express');
const router = express.Router();
const { createIncident, getActiveIncidents, getIncidentById, updateIncident, addRerouteOptions, deleteIncident } = require('../controllers/incidentController');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, createIncident);
router.get('/active', authenticateToken, getActiveIncidents);
router.get('/:id', authenticateToken, getIncidentById);
router.put('/:id', authenticateToken, updateIncident);
router.post('/:id/reroute', authenticateToken, addRerouteOptions);
router.delete('/:id', authenticateToken, deleteIncident);

module.exports = router;
