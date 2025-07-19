const express = require('express');
const router = express.Router();
const opLogController = require('../controllers/opLog.controller');
const { verifyToken } = require('../middleware/Authentication');

router.use(verifyToken);
router.get('/',opLogController.getLogs);

module.exports = router;
