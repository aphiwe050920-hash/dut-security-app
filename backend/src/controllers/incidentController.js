const Incident = require('../models/Incident');
const { calculateAIPriority } = require('../utils/aiPrioritizer');

// @desc    Create incident report
// @route   POST /api/incidents
const createIncident = async (req, res) => {
  try {
    const { title, description, category, location, images, linkedAlert } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ message: 'Title, description and location are required' });
    }

    const aiScore = calculateAIPriority({ type: category, message: description });

    const incident = await Incident.create({
      reportedBy: req.user._id,
      title,
      description,
      category: category || 'other',
      location,
      images: images || [],
      aiPriorityScore: aiScore,
      priority: aiScore >= 80 ? 'critical' : aiScore >= 60 ? 'high' : aiScore >= 40 ? 'medium' : 'low',
      linkedAlert: linkedAlert || null,
    });

    await incident.populate('reportedBy', 'name email role');
    res.status(201).json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all incidents
// @route   GET /api/incidents
const getIncidents = async (req, res) => {
  try {
    const { status, category, priority, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.status(200).json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident status
// @route   PUT /api/incidents/:id
const updateIncident = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (status) incident.status = status;
    if (assignedTo) incident.assignedTo = assignedTo;
    if (status === 'resolved') incident.resolvedAt = new Date();

    await incident.save();
    res.status(200).json({ success: true, incident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createIncident, getIncidents, getIncidentById, updateIncident };