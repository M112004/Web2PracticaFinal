const Project = require('../models/Project');

// Crear proyecto
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, client } = req.body;
    // Evitar duplicados por usuario y cliente
    const exists = await Project.findOne({ title, createdBy: req.user._id, client });
    if (exists) return res.status(400).json({ error: 'Proyecto ya existe para este cliente' });

    const projectData = {
      title,
      description,
      client,
      createdBy: req.user._id,
      company: req.user._id  // referenciamos al usuario como empresa
    };
    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error createProject:', err);
    next(err);
  }
};

// Actualizar proyecto
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// Obtener todos proyectos no archivados
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id, isArchived: false });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// Obtener uno por ID
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// Archivar proyecto (soft delete)
exports.archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isArchived: true, archivedAt: Date.now() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// Borrar proyecto (hard delete)
exports.deleteProject = async (req, res, next) => {
  try {
    const result = await Project.deleteOne({ _id: req.params.id, createdBy: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Listar proyectos archivados
exports.getArchivedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id, isArchived: true });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// Restaurar proyecto (desarchivar)
exports.restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isArchived: false, archivedAt: null },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};