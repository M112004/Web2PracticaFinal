const mongoose = require('mongoose');

const DeliveryNoteSchema = new mongoose.Schema({
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      type: { type: String, enum: ['hours', 'material'], required: true },
      description: String,
      quantity: Number,
      unitPrice: Number,
      person: String,
      hours: Number
    }
  ],
  isSigned:     { type: Boolean, default: false },
  signatureIpfs: String,
  pdfIpfs:      String,
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliveryNote', DeliveryNoteSchema);