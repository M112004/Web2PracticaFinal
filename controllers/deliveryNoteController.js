const DeliveryNote = require('../models/DeliveryNote');
const Project = require('../models/Project');
const User = require('../models/User');
const Client = require('../models/Client');
const PDFDocument = require('pdfkit');
const streamBuffers = require('stream-buffers');
const stream = require('stream');
const axios = require('axios'); // Añadir axios para realizar peticiones HTTP

// Pinata SDK import
const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);

// Crear albarán
exports.createDeliveryNote = async (req, res, next) => {
  try {
    const { project, items } = req.body;
    
    // Validar que el proyecto existe y pertenece al usuario
    const proj = await Project.findOne({ _id: project, createdBy: req.user._id });
    if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const dn = await DeliveryNote.create({ 
      project, 
      items, 
      createdBy: req.user._id 
    });
    
    res.status(201).json(dn);
  } catch (err) {
    console.error('Error en createDeliveryNote:', err);
    next(err);
  }
};

// Listar albaranes
exports.getDeliveryNotes = async (req, res, next) => {
  try {
    const dns = await DeliveryNote.find({ createdBy: req.user._id });
    res.json(dns);
  } catch (err) { 
    console.error('Error en getDeliveryNotes:', err);
    next(err); 
  }
};

// Obtener uno con populate
exports.getDeliveryNoteById = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate({ 
        path: 'project', 
        populate: { 
          path: 'client', 
          populate: { 
            path: 'createdBy' 
          } 
        } 
      })
      .populate('createdBy');
      
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    res.json(dn);
  } catch (err) { 
    console.error('Error en getDeliveryNoteById:', err);
    next(err); 
  }
};

// Función auxiliar para descargar una imagen desde una URL
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
  } catch (error) {
    console.error('Error al descargar la imagen:', error);
    throw error;
  }
}

// Generar o descargar PDF
exports.downloadPdf = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });

    // Si ya existe el PDF en IPFS, redirigir a él
    if (dn.pdfIpfs) return res.redirect(dn.pdfIpfs);

    // Crear nuevo PDF
    const doc = new PDFDocument();
    const bufferStream = new streamBuffers.WritableStreamBuffer();
    doc.pipe(bufferStream);

    // Contenido del PDF
    doc.fontSize(20).text(`Albarán ${dn._id}`, { align: 'center' });
    doc.moveDown();
    
    const user = await User.findById(dn.createdBy);
    doc.text(`Usuario: ${user.email}`);
    
    const project = await Project.findById(dn.project).populate('client');
    doc.text(`Cliente: ${project.client.name}`);
    doc.text(`Proyecto: ${project.title}`);
    doc.moveDown();

    // Detalles de los items
    dn.items.forEach(item => {
      if (item.type === 'hours') {
        doc.text(`Horas: ${item.person} - ${item.hours}h a ${item.unitPrice}€/h`);
      } else {
        doc.text(`Material: ${item.description} - ${item.quantity} uds a ${item.unitPrice}€/ud`);
      }
    });

    // Si está firmado, añadir la firma
    if (dn.isSigned && dn.signatureIpfs) {
      try {
        // Descargar la imagen de firma desde IPFS
        const signatureImageBuffer = await downloadImage(dn.signatureIpfs);
        
        doc.moveDown().text('Firmado:', { underline: true });
        // Añadir la imagen usando el buffer descargado
        doc.image(signatureImageBuffer, { width: 150 });
      } catch (imgErr) {
        console.error('Error al incluir la firma:', imgErr);
        // Si hay error con la imagen, al menos mencionar que está firmado
        doc.moveDown().text('Documento firmado electrónicamente');
      }
    }
    
    // Finalizar el documento
    doc.end();

    // Esperar a que el documento se complete
    bufferStream.on('finish', async () => {
      try {
        const pdfBuffer = bufferStream.getContents();
        
        // Convertir buffer a un formato que Pinata pueda usar
        const readableStream = new stream.Readable();
        readableStream.push(pdfBuffer);
        readableStream.push(null);
        
        // Subir a IPFS
        const result = await pinata.pinFileToIPFS(readableStream, { 
          pinataMetadata: { name: `albaran-${dn._id}` } 
        });
        
        // Guardar la URL del PDF en la base de datos
        dn.pdfIpfs = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
        await dn.save();
        
        // Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
      } catch (pinataErr) {
        console.error('Error al subir a Pinata:', pinataErr);
        // Si falla la subida a IPFS, al menos enviar el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.send(bufferStream.getContents());
      }
    });
  } catch (err) { 
    console.error('Error en downloadPdf:', err);
    next(err); 
  }
};

// Firmar albarán
exports.signDeliveryNote = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    if (dn.isSigned) return res.status(400).json({ error: 'Ya está firmado' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se ha proporcionado una imagen de firma' });
    }

    // Convertir el buffer a un Readable Stream que Pinata pueda usar
    const readableStream = new stream.Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null); // Indica el fin del stream

    // Subir la firma a IPFS
    try {
      const result = await pinata.pinFileToIPFS(readableStream, { 
        pinataMetadata: { 
          name: `sig-${dn._id}` 
        },
        pinataOptions: {
          cidVersion: 0
        }
      });
      
      dn.signatureIpfs = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      dn.isSigned = true;
      await dn.save();
      
      res.json({ success: true, signatureUrl: dn.signatureIpfs });
    } catch (pinataErr) {
      console.error('Error al subir firma a Pinata:', pinataErr);
      res.status(500).json({ error: 'Error al subir la firma' });
    }
  } catch (err) { 
    console.error('Error en signDeliveryNote:', err);
    next(err); 
  }
};

// Borrar albarán
exports.deleteDeliveryNote = async (req, res, next) => {
  try {
    const dn = await DeliveryNote.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!dn) return res.status(404).json({ error: 'Albarán no encontrado' });
    if (dn.isSigned) return res.status(400).json({ error: 'No se puede borrar un albarán firmado' });
    
    await dn.deleteOne();
    res.json({ success: true });
  } catch (err) { 
    console.error('Error en deleteDeliveryNote:', err);
    next(err); 
  }
};