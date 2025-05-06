// Middleware para errores de validación
exports.validationError = (err, req, res, next) => {
    // Manejar errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      const errors = {};
      
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Error de validación',
        errors
      });
    }
    
    // Si no es un error de validación, pasa al siguiente middleware
    next(err);
  };
  
  // Middleware para errores de duplicados
  exports.duplicateError = (err, req, res, next) => {
    // Manejar errores de clave duplicada en MongoDB (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      
      return res.status(409).json({
        status: 'error',
        code: 409,
        message: `El valor '${value}' para el campo '${field}' ya existe`
      });
    }
    
    // Si no es un error de duplicado, pasa al siguiente middleware
    next(err);
  };
  
  // Middleware para errores de token JWT
  exports.authError = (err, req, res, next) => {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token inválido'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token expirado'
      });
    }
    
    // Si no es un error de autenticación, pasa al siguiente middleware
    next(err);
  };
  
  // Middleware para errores de ID no encontrado
  exports.notFoundError = (err, req, res, next) => {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: `El ID '${err.value}' no es válido`
      });
    }
    
    // Si no es un error de ID, pasa al siguiente middleware
    next(err);
  };
  
  // Middleware para errores no manejados (respuesta genérica)
  exports.genericError = (err, req, res, next) => {
    console.error('Error no manejado:', err);
    
    // En producción no devolvemos detalles del error
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(err.statusCode || 500).json({
      status: 'error',
      code: err.statusCode || 500,
      message: err.message || 'Error interno del servidor',
      ...(isProduction ? {} : { stack: err.stack })
    });
  };
  
  // Middleware para rutas no encontradas
  exports.notFound = (req, res) => {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: `Ruta ${req.originalUrl} no encontrada`
    });
  };