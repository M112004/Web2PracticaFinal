const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const multer = require('multer');
const deliveryCtrl = require('../controllers/deliveryNoteController');

// Configuración de multer para manejar archivos
const upload = multer();

router.use(auth);
router.post('/', deliveryCtrl.createDeliveryNote);
router.get('/', deliveryCtrl.getDeliveryNotes);
router.get('/:id', deliveryCtrl.getDeliveryNoteById);
router.get('/pdf/:id', deliveryCtrl.downloadPdf);
router.post('/sign/:id', upload.single('signature'), deliveryCtrl.signDeliveryNote);
router.delete('/:id', deliveryCtrl.deleteDeliveryNote);

module.exports = router;