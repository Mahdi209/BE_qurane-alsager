const express = require('express');
const router = express.Router();
const { searchByIdAndType } = require('../controllers/search.controller');
const {verifyToken} = require('../middleware/Authentication');
// Route to search by id and type
router.get('/:type/:id',verifyToken, searchByIdAndType);

module.exports = router;
