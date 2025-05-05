const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userCtrl = require('../controllers/userController');

// OnBoarding
router.post('/register', userCtrl.register);
router.put('/validation', auth, userCtrl.validateEmail);
router.post('/login', userCtrl.login);
router.put('/', auth, userCtrl.updatePersonalData);
router.patch('/company', auth, userCtrl.updateCompanyData);

module.exports = router;
