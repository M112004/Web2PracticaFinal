const Client = require('../models/Client');

// Crear cliente
exports.createClient = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const exists = await Client.findOne({ name, createdBy: req.user._id });
    if (exists) return res.status(400).json({ error: 'Cliente ya existe' });

    const client = await Client.create({
      name,
      email,
      phone,
      address,
      createdBy: req.user._id,
      company: req.user.company
    });

    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

// Actualizar cliente
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    next(err);
  }
};

// Listar todos (no archivados)
exports.getClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ createdBy: req.user._id, isArchived: false });
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

// Obtener uno
exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
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
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

// Borrar (hard delete)
exports.deleteClient = async (req, res, next) => {
  try {
    const result = await Client.deleteOne({ _id: req.params.id, createdBy: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Listar archivados
exports.getArchivedClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ createdBy: req.user._id, isArchived: true });
    res.json(clients);
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
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};
