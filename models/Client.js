const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String },
  phone:      { type: String },
  address:    { type: String },
  // Asociar con el usuario que crea y opcionalmente con la compañía del usuario
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
