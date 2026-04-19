const express = require('express');
const router = express.Router();
const { triggerAlert, getAlerts, getAlertById, updateAlertStatus } = require('../controllers/alertController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/trigger', protect, triggerAlert);
router.get('/', protect, getAlerts);
router.get('/:id', protect, getAlertById);
router.put('/:id/status', protect, authorizeRoles('security', 'admin'), updateAlertStatus);

module.exports = router;