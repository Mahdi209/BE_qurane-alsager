const express = require('express');
const router = express.Router();
const { signup, login, logout, refreshAccessToken,forgetPassword, deleteAdmin, updateAdminName, updateAdminRole, getAllAdmins, updateAdminStatus, resetPassword } = require('../controllers/admin.controller');
const { verifyToken, isSupervisor, isActive} = require('../middleware/Authentication');
const upload = require('../middleware/uploadFile');
// Auth routes
router.post('/signup',upload.single("profile"), signup);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh-token', refreshAccessToken);
router.patch('/forget-password', forgetPassword);

// Admin management routes
router.get('/all', verifyToken, isSupervisor, getAllAdmins);
router.delete('/:id', verifyToken, isSupervisor, deleteAdmin);
router.patch('/:id/name', verifyToken, updateAdminName);
router.patch('/:id/role', verifyToken, isSupervisor, updateAdminRole);
router.patch('/:id/status', verifyToken, isSupervisor, updateAdminStatus);
router.patch('/reset-password', verifyToken, resetPassword);

module.exports = router;
