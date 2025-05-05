require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const deliveryNoteRoutes = require('./routes/deliveryNotes');

const app = express();
app.use(express.json());
connectDB();

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error general:', err);
  res.status(500).json({ error: 'Algo falló en el servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));