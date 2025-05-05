const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String },
  phone:      { type: String },
  address:    { type: String },
  // Asociar con el usuario que crea o su compañía
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'User.company' },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);