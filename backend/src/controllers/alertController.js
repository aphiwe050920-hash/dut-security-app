const Alert = require('../models/Alert');
const { calculateAIPriority } = require('../utils/aiPrioritizer');
const { broadcastAlert } = require('../utils/socketManager');

// @desc    Trigger panic/emergency alert
// @route   POST /api/alerts/trigger
const triggerAlert = async (req, res) => {
  try {
    const { type, message, location } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const aiScore = calculateAIPriority({ type, message });

    const alert = await Alert.create({
      triggeredBy: req.user._id,
      type: type || 'panic',
      message: message || 'Emergency alert triggered',
      location,
      aiPriorityScore: aiScore,
      priority: aiScore >= 80 ? 'critical' : aiScore >= 60 ? 'high' : aiScore >= 40 ? 'medium' : 'low',
    });

    await alert.populate('triggeredBy', 'name email role');

    // Broadcast via Socket.IO
    broadcastAlert(alert);

    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all alerts
// @route   GET /api/alerts
const getAlerts = async (req, res) => {
  try {
    const { status, priority, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const alerts = await Alert.find(filter)
      .populate('triggeredBy', 'name email role')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single alert
// @route   GET /api/alerts/:id
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('triggeredBy', 'name email role')
      .populate('respondedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update alert status
// @route   PUT /api/alerts/:id/status
const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = new Date();
      alert.respondedBy = req.user._id;
    }

    await alert.save();
    res.status(200).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { triggerAlert, getAlerts, getAlertById, updateAlertStatus };