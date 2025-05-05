const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived:  { type: Boolean, default: false },
  archivedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
