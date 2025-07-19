const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyToken, isSupervisor} = require('../middleware/Authentication');

router.use(verifyToken);

router.post('/',isSupervisor, roleController.create);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);

module.exports = router;
