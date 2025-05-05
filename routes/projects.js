const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const projectCtrl = require('../controllers/projectController');

router.use(auth);
router.post('/', projectCtrl.createProject);
router.put('/:id', projectCtrl.updateProject);
router.get('/', projectCtrl.getProjects);
router.get('/:id', projectCtrl.getProjectById);
router.patch('/:id/archive', projectCtrl.archiveProject);
router.delete('/:id', projectCtrl.deleteProject);
router.get('/archived/all', projectCtrl.getArchivedProjects);
router.patch('/:id/restore', projectCtrl.restoreProject);

module.exports = router;