const DeliveryNote = require('../models/DeliveryNote');
const Project = require('../models/Project');
const User = require('../models/User');
const Client = require('../models/Client');
const PDFDocument = require('pdfkit');
const streamBuffers = require('stream-buffers');

// Pinata SDK import
const pinataSDK = require('@pinata/sdk').default || require('@pinata/sdk');
const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);

// Crear albarán
exports.createDeliveryNote = async (req, res, next) => {
  try {
    const { project, items } = req.body;
    const proj = await Project.findOne({ _id: project, createdBy: req.user._id });
    if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const dn = await DeliveryNote.create({ project, items, createdBy: req.user._id });
    res.status(201).json(dn);
  } catch (err) {
    next(err);
  }
};

// Listar albaranes
exports.getDeliveryNotes = async (req, res, next) => {
  try {
    const dns = await DeliveryNote.find({ createdBy: req.user._id });
    res.json(dns);
  } catch (err) { next(err); }
};

// Obtener uno con populate
exports.getDeliveryNoteById = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate({ path: 'project', populate: { path: 'client', populate: { path: 'createdBy' } } })
      .populate('createdBy');
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    res.json(dn);
  } catch (err) { next(err); }
};

// Generar o descargar PDF
exports.downloadPdf = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });

    if (dn.pdfIpfs) return res.redirect(dn.pdfIpfs);

    const doc = new PDFDocument();
    const bufferStream = new streamBuffers.WritableStreamBuffer();
    doc.pipe(bufferStream);

    doc.fontSize(20).text(`Albarán ${dn._id}`, { align: 'center' });
    doc.moveDown();
    const user = await User.findById(dn.createdBy);
    doc.text(`Usuario: ${user.email}`);
    const project = await Project.findById(dn.project).populate('client');
    doc.text(`Cliente: ${project.client.name}`);
    doc.text(`Proyecto: ${project.title}`);
    doc.moveDown();

    dn.items.forEach(item => {
      if (item.type === 'hours') doc.text(`Horas: ${item.person} - ${item.hours}h a ${item.unitPrice}€/h`);
      else doc.text(`Material: ${item.description} - ${item.quantity} uds a ${item.unitPrice}€/ud`);
    });

    if (dn.isSigned && dn.signatureIpfs) {
      doc.moveDown().text('Firmado:', { underline: true });
      doc.image(dn.signatureIpfs, { width: 150 });
    }
    doc.end();

    bufferStream.on('finish', async () => {
      const pdfBuffer = bufferStream.getContents();
      const result = await pinata.pinFileToIPFS(pdfBuffer, { pinataMetadata: { name: `albaran-${dn._id}` } });
      dn.pdfIpfs = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      await dn.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    });
  } catch (err) { next(err); }
};

// Firmar albarán
exports.signDeliveryNote = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    if (dn.isSigned) return res.status(400).json({ error: 'Ya está firmado' });

    const result = await pinata.pinFileToIPFS(req.file.buffer, { pinataMetadata: { name: `sig-${dn._id}` } });
    dn.signatureIpfs = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    dn.isSigned = true;
    await dn.save();
    res.json({ success: true, signatureUrl: dn.signatureIpfs });
  } catch (err) { next(err); }
};

// Borrar albarán
exports.deleteDeliveryNote = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    if (dn.isSigned) return res.status(400).json({ error: 'No se puede borrar un albarán firmado' });
    await dn.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
};

// src/routes/deliveryNotes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const multer = require('multer');
const deliveryCtrl = require('../controllers/deliveryNoteController');
const upload = multer();

router.use(auth);
router.post('/', deliveryCtrl.createDeliveryNote);
router.get('/', deliveryCtrl.getDeliveryNotes);
router.get('/:id', deliveryCtrl.getDeliveryNoteById);
router.get('/pdf/:id', deliveryCtrl.downloadPdf);
router.post('/sign/:id', upload.single('signature'), deliveryCtrl.signDeliveryNote);
router.delete('/:id', deliveryCtrl.deleteDeliveryNote);

module.exports = router;