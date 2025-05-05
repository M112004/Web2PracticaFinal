require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user');

const app = express();
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api/user', userRoutes);

// Manejador global de errores (opcional)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Algo falló en el servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
