const express = require('express');
const router = express.Router();
const timeController = require('../controllers/time.controller');


router.get('/', timeController.getTime);

module.exports = router;
