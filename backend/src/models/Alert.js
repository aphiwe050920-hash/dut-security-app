const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['panic', 'fire', 'medical', 'suspicious', 'general'],
      default: 'panic',
    },
    message: {
      type: String,
      default: 'Emergency alert triggered',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'resolved', 'false_alarm'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    aiPriorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);