const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token no proporcionado' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.isDeleted) throw new Error();
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
