const express = require('express');
const router = express.Router();
const { getDeletion } = require('../controllers/deletion.controller');
const { verifyToken} = require('../middleware/Authentication');

router.get('/', verifyToken, getDeletion);

module.exports = router;
