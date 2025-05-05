const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerification, sendPasswordReset, sendInvitation } = require('../utils/mailer');
const crypto = require('crypto');

// Registro
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y password son requeridos' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();

    const user = await User.create({
      email,
      password: hashed,
      validationCode: code,
    });

    await sendVerification(email, code);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

// Validar email
exports.validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (req.user.validationCode !== code)
      return res.status(400).json({ error: 'Código incorrecto' });

    req.user.validated = true;
    req.user.validationCode = null;
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });
    if (!user.validated)
      return res.status(403).json({ error: 'Email no validado' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

// Actualizar datos personales
exports.updatePersonalData = async (req, res, next) => {
  try {
    req.user.personal = req.body;
    await req.user.save();
    res.json({ success: true, personal: req.user.personal });
  } catch (err) {
    next(err);
  }
};

// Actualizar datos de compañía
exports.updateCompanyData = async (req, res, next) => {
  try {
    req.user.company = req.body;
    await req.user.save();
    res.json({ success: true, company: req.user.company });
  } catch (err) {
    next(err);
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    
    // Hashear nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    req.user.password = hashed;
    await req.user.save();
    
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

// Solicitar recuperación de contraseña
exports.requestPasswordReset = async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({ success: true, message: 'Si el email existe, recibirás un correo con instrucciones' });
      }
      
      // Generar token para resetear contraseña
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetExpires = Date.now() + 3600000; // 1 hora
      
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();
      
      // Enviar email con el token
      await sendPasswordReset(email, resetToken);
      
      // Para desarrollo: devolver también el token en la respuesta
      res.json({ 
        success: true, 
        message: 'Se ha enviado un correo con instrucciones',
        // Solo devolver esto en desarrollo, eliminar en producción:
        devInfo: { 
          resetToken,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
        }
      });
    } catch (err) {
      next(err);
    }
  };

// Resetear contraseña con token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    
    // Hashear nueva contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña y limpiar token
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    next(err);
  }
};

// Invitar a otro usuario como parte de la compañía
exports.inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Generar código de invitación
    const inviteCode = crypto.randomBytes(20).toString('hex');
    
    // Crear usuario pendiente de aceptar invitación
    const user = await User.create({
      email,
      password: inviteCode, // Temporal, se actualizará cuando el usuario acepte la invitación
      validated: false,
      invitedBy: req.user._id,
      inviteCode,
      company: req.user.company
    });
    
    // Enviar email de invitación
    await sendInvitation(email, inviteCode, req.user.email);
    
    res.status(201).json({ success: true, message: 'Invitación enviada correctamente' });
  } catch (err) {
    next(err);
  }
};

// Aceptar invitación
exports.acceptInvitation = async (req, res, next) => {
  try {
    const { email, inviteCode, password } = req.body;
    
    const user = await User.findOne({ email, inviteCode });
    if (!user) {
      return res.status(400).json({ error: 'Invitación inválida' });
    }
    
    // Hashear nueva contraseña
    const hashed = await bcrypt.hash(password, 10);
    
    // Actualizar usuario
    user.password = hashed;
    user.inviteCode = undefined;
    user.validated = true;
    await user.save();
    
    // Generar token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

// Soft delete (marcar como eliminado)
exports.softDeleteUser = async (req, res, next) => {
  try {
    req.user.isDeleted = true;
    req.user.deletedAt = Date.now();
    await req.user.save();
    
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (err) {
    next(err);
  }
};

// Hard delete (eliminar completamente)
exports.hardDeleteUser = async (req, res, next) => {
  try {
    await User.deleteOne({ _id: req.user._id });
    
    res.json({ success: true, message: 'Usuario eliminado permanentemente' });
  } catch (err) {
    next(err);
  }
};

// Obtener información del usuario actual
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -validationCode -resetPasswordToken -resetPasswordExpires -inviteCode');
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};