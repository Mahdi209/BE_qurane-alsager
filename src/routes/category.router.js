const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middleware/Authentication');
const {
    canCreateCategory,
    canReadCategory,
    canUpdateCategory,
    canDeleteCategory
} = require('../middleware/rolePermissions');

router.get('/mobile', categoryController.getCategoriesForMobile);
router.get('/App', categoryController.getCategoriesForApp);
router.get('/Platform', categoryController.getCategoriesForPlatform);

router.use(verifyToken);

router.post('/', canCreateCategory, categoryController.create);
router.get('/', canReadCategory, categoryController.getAll);
router.get('/:id', canReadCategory, categoryController.getById);
router.put('/:id', canUpdateCategory, categoryController.update);
router.delete('/:id', canDeleteCategory, categoryController.delete);
router.patch('/restore/:id', canUpdateCategory, categoryController.restore);

module.exports = router;
