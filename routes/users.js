const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userCtrl = require('../controllers/userController');

// Rutas públicas
router.post('/register', userCtrl.register);
router.post('/login', userCtrl.login);
router.post('/password-reset/request', userCtrl.requestPasswordReset);
router.post('/password-reset/reset', userCtrl.resetPassword);
router.post('/invitation/accept', userCtrl.acceptInvitation);

// Rutas protegidas (requieren autenticación)
router.use(auth);
router.put('/validation', userCtrl.validateEmail);
router.put('/', userCtrl.updatePersonalData);
router.patch('/company', userCtrl.updateCompanyData);
router.put('/password', userCtrl.changePassword);
router.post('/invite', userCtrl.inviteUser);
router.delete('/soft', userCtrl.softDeleteUser);
router.delete('/hard', userCtrl.hardDeleteUser);
router.get('/profile', userCtrl.getProfile);

module.exports = router;