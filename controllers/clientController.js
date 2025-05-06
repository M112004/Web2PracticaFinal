const Client = require('../models/Client');
const AppError = require('../utils/appError');

// Crear cliente
exports.createClient = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Validar datos requeridos
    if (!name) {
      return next(new AppError('El nombre del cliente es obligatorio', 400));
    }
    
    // Evitar duplicados por usuario o compañía
    const filter = { name, createdBy: req.user._id };
    const exists = await Client.findOne(filter);
    
    if (exists) {
      return next(new AppError('Cliente ya existe para este usuario', 409));
    }

    const clientData = {
      name,
      email,
      phone,
      address,
      createdBy: req.user._id,
      company: req.user.company ? req.user._id : null
    };
    
    const client = await Client.create(clientData);
    
    res.status(201).json({
      status: 'success',
      data: {
        client
      }
    });
  } catch (err) {
    next(err);
  }
};

// Actualizar cliente
exports.updateClient = async (req, res, next) => {
  try {
    // Verificar si hay datos para actualizar
    if (Object.keys(req.body).length === 0) {
      return next(new AppError('No se proporcionaron datos para actualizar', 400));
    }
    
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return next(new AppError('Cliente no encontrado o no tienes permiso para modificarlo', 404));
    }
    
    res.json({
      status: 'success',
      data: {
        client
      }
    });
  } catch (err) {
    next(err);
  }
};

// Listar todos (no archivados)
exports.getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ createdBy: req.user._id, isArchived: false });
    
    res.json({
      status: 'success',
      results: clients.length,
      data: {
        clients
      }
    });
  } catch (err) {
    next(err);
  }
};

// Obtener uno
exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, createdBy: req.user._id });
    
    if (!client) {
      return next(new AppError('Cliente no encontrado o no tienes permiso para verlo', 404));
    }
    
    res.json({
      status: 'success',
      data: {
        client
      }
    });
  } catch (err) {
    next(err);
  }
};

// Archivar (soft delete)
exports.archiveClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isArchived: true, archivedAt: Date.now() },
      { new: true }
    );
    
    if (!client) {
      return next(new AppError('Cliente no encontrado o no tienes permiso para archivarlo', 404));
    }
    
    res.json({
      status: 'success',
      data: {
        client
      }
    });
  } catch (err) {
    next(err);
  }
};

// Borrar (hard delete)
exports.deleteClient = async (req, res, next) => {
  try {
    const result = await Client.deleteOne({ _id: req.params.id, createdBy: req.user._id });
    
    if (result.deletedCount === 0) {
      return next(new AppError('Cliente no encontrado o no tienes permiso para eliminarlo', 404));
    }
    
    res.json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// Listar archivados
exports.getArchivedClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ createdBy: req.user._id, isArchived: true });
    
    res.json({
      status: 'success',
      results: clients.length,
      data: {
        clients
      }
    });
  } catch (err) {
    next(err);
  }
};

// Restaurar (desarchivar)
exports.restoreClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isArchived: false, archivedAt: null },
      { new: true }
    );
    
    if (!client) {
      return next(new AppError('Cliente no encontrado o no tienes permiso para restaurarlo', 404));
    }
    
    res.json({
      status: 'success',
      data: {
        client
      }
    });
  } catch (err) {
    next(err);
  }
};