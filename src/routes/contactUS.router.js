const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactUS.controller');
const {verifyToken} = require("../middleware/Authentication");


router.post('/', contactController.createContact);
router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.put('/:id',verifyToken, contactController.updateContact);
router.put('/:id/read',verifyToken, contactController.makeIsRead);

router.delete('/:id',verifyToken, contactController.deleteContact);

module.exports = router;
