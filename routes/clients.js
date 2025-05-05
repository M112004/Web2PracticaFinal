const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const clientCtrl = require('../controllers/clientController');

router.use(auth);
router.post('/', clientCtrl.createClient);
router.put('/:id', clientCtrl.updateClient);
router.get('/', clientCtrl.getClients);
router.get('/:id', clientCtrl.getClientById);
router.patch('/:id/archive', clientCtrl.archiveClient);
router.delete('/:id', clientCtrl.deleteClient);
router.get('/archived/all', clientCtrl.getArchivedClients);
router.patch('/:id/restore', clientCtrl.restoreClient);

module.exports = router;