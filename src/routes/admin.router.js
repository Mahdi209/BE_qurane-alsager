const express = require('express');
const router = express.Router();
const { signup, login,getAllAdminsForFilter, logout, refreshAccessToken,forgetPassword, deleteAdmin, updateAdminName, updateAdminRole, getAllAdmins, updateAdminStatus, resetPassword } = require('../controllers/admin.controller');
const { verifyToken, isAdminOrSupervisor,isSupervisor, isActive} = require('../middleware/Authentication');
const upload = require('../middleware/uploadFile');

router.post('/signup', isAdminOrSupervisor, upload.single("profile"), signup);
router.post('/login', login);
router.post('/refresh-token', refreshAccessToken);
router.patch('/forget-password', forgetPassword);

router.use(verifyToken, isActive);
router.get('/getAllUserForFilter', getAllAdminsForFilter);
router.patch('/:id/name', updateAdminName);
router.patch('/reset-password', resetPassword);
router.post('/logout', logout);

router.use(isSupervisor);
router.get('/all', getAllAdmins);
router.delete('/:id', deleteAdmin);
router.patch('/:id/role', updateAdminRole);
router.patch('/:id/status', updateAdminStatus);



module.exports = router;
