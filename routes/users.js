const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userCtrl = require('../controllers/userController');
const validate = require('../middlewares/validation');

// Rutas públicas con validación
router.post(
  '/register', 
  validate.validateRequiredFields(['email', 'password']),
  validate.validateEmail(),
  validate.validatePassword(),
  userCtrl.register
);

router.post(
  '/login', 
  validate.validateRequiredFields(['email', 'password']),
  userCtrl.login
);

router.post(
  '/password-reset/request', 
  validate.validateRequiredFields(['email']),
  validate.validateEmail(),
  userCtrl.requestPasswordReset
);

router.post(
  '/password-reset/reset',
  validate.validateRequiredFields(['token', 'newPassword']),
  validate.validatePassword('newPassword'),
  userCtrl.resetPassword
);

router.post(
  '/invitation/accept',
  validate.validateRequiredFields(['email', 'inviteCode', 'password']),
  validate.validateEmail(),
  validate.validatePassword(),
  userCtrl.acceptInvitation
);

// Rutas protegidas (requieren autenticación)
router.use(auth);

router.put(
  '/validation',
  validate.validateRequiredFields(['code']),
  userCtrl.validateEmail
);

router.put('/', userCtrl.updatePersonalData);

router.patch('/company', userCtrl.updateCompanyData);

router.put(
  '/password',
  validate.validateRequiredFields(['currentPassword', 'newPassword']),
  validate.validatePassword('newPassword'),
  userCtrl.changePassword
);

router.post(
  '/invite',
  validate.validateRequiredFields(['email']),
  validate.validateEmail(),
  userCtrl.inviteUser
);

router.delete('/soft', userCtrl.softDeleteUser);
router.delete('/hard', userCtrl.hardDeleteUser);
router.get('/profile', userCtrl.getProfile);

module.exports = router;