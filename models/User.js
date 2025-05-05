const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  validated:      { type: Boolean, default: false },
  validationCode: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  inviteCode: { type: String },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  personal: {
    nombre:    String,
    apellidos: String,
    telefono:  String,
  },

  company: {
    nombre:    String,
    direccion: String,
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);