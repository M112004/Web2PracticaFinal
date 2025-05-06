const AppError = require('../utils/appError');

// Middleware para validar los campos requeridos en una solicitud
exports.validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return next(new AppError(`Campos requeridos faltantes: ${missingFields.join(', ')}`, 400));
    }
    
    next();
  };
};

// Middleware para validar IDs de MongoDB (formato válido)
exports.validateMongoId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError(`ID inválido: ${id}`, 400));
    }
    
    next();
  };
};

// Middleware para validar formato de email
exports.validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];
    
    if (!email) {
      // Si no hay email, simplemente continuamos
      return next();
    }
    
    // Expresión regular para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return next(new AppError(`Formato de email inválido: ${email}`, 400));
    }
    
    next();
  };
};

// Middleware para validar contraseñas
exports.validatePassword = (fieldName = 'password', minLength = 6) => {
  return (req, res, next) => {
    const password = req.body[fieldName];
    
    if (!password) {
      return next(new AppError(`La contraseña es requerida`, 400));
    }
    
    if (password.length < minLength) {
      return next(new AppError(`La contraseña debe tener al menos ${minLength} caracteres`, 400));
    }
    
    next();
  };
};

// Middleware para validar números de teléfono
exports.validatePhone = (fieldName = 'phone') => {
  return (req, res, next) => {
    const phone = req.body[fieldName];
    
    if (!phone) {
      // Si no hay teléfono, simplemente continuamos
      return next();
    }
    
    // Expresión regular para validar números de teléfono (formato internacional)
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    
    if (!phoneRegex.test(phone)) {
      return next(new AppError(`Formato de teléfono inválido: ${phone}`, 400));
    }
    
    next();
  };
};