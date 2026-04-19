const express = require('express');
const router = express.Router();
const { createIncident, getIncidents, getIncidentById, updateIncident } = require('../controllers/incidentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, createIncident);
router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentById);
router.put('/:id', protect, authorizeRoles('security', 'admin'), updateIncident);

module.exports = router;