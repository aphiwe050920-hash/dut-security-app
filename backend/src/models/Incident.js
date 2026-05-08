const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
    },
    category: {
      type: String,
      enum: [
        'theft',
        'assault',
        'fire',
        'medical',
        'vandalism',
        'suspicious_activity',
        'other',
      ],
      default: 'other',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    aiPriorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    linkedAlert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      default: null,
    },
    isAnonymous: {
  type: Boolean,
  default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', IncidentSchema);