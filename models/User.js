const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  validated:      { type: Boolean, default: false },
  validationCode: { type: String },

  personal: {
    nombre:    String,
    apellidos: String,
    telefono:  String,
    // …otros campos que necesites
  },

  company: {
    nombre:    String,
    direccion: String,
    // …otros campos que necesites
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
