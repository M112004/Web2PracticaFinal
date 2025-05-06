require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const deliveryNoteRoutes = require('./routes/deliveryNotes');
const errorMiddleware = require('./middlewares/error');

// Swagger UI setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml')); // Asegúrate de tener swagger.yaml en la raíz

const app = express();
app.use(express.json());
connectDB();

// Servir swagger.yaml estático (opcional si quieres acceder directo al YAML)
app.use(express.static(path.join(__dirname)));

// Ruta para Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
    console.log(`🚀 Servidor en http://localhost:${PORT}\n📄 Swagger UI disponible en http://localhost:${PORT}/api-docs`)
  );