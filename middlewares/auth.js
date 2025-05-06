const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clase personalizada para errores de autenticación
class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

module.exports = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    
    // Verificar si el header existe y tiene el formato correcto
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthError('Token no proporcionado', 401);
    }

    const token = header.split(' ')[1];
    
    // Verificar el token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(payload.id);
    
    // Verificar si el usuario existe y no está eliminado
    if (!user) {
      throw new AuthError('Usuario no encontrado', 401);
    }
    
    if (user.isDeleted) {
      throw new AuthError('Usuario desactivado', 403);
    }
    
    // Verificar si el email está validado (excepto para la ruta de validación)
    if (!user.validated && !req.originalUrl.includes('/validation')) {
      throw new AuthError('Email no validado', 403);
    }
    
    // Si todo está bien, adjuntar el usuario a la solicitud
    req.user = user;
    next();
  } catch (err) {
    // Si es un error de JWT, pasar al middleware de errores
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(err);
    }
    
    // Si es un error de autenticación personalizado, responder directamente
    if (err.name === 'AuthError') {
      return res.status(err.statusCode).json({ 
        status: 'error',
        code: err.statusCode,
        message: err.message 
      });
    }
    
    // Cualquier otro error
    next(err);
  }
};