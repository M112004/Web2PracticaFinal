const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerification } = require('../utils/mailer');

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
