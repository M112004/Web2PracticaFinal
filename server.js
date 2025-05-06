require('dotenv').config();
const express = require('express');
const path = require('path');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const deliveryNoteRoutes = require('./routes/deliveryNotes');
const errorMiddleware = require('./middlewares/error');

const app = express();
app.use(express.json());

// Rutas de API
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// Middleware para rutas no encontradas
app.use(errorMiddleware.notFound);

// Middlewares de errores - orden importante
app.use(errorMiddleware.validationError);
app.use(errorMiddleware.duplicateError);
app.use(errorMiddleware.authError);
app.use(errorMiddleware.notFoundError);
app.use(errorMiddleware.genericError);

module.exports = app;