const express = require('express');
const router = express.Router();
const { addAppLink, getAppLink, getLastAppLink, updateAppLink } = require('../controllers/appLink.controller');
const { verifyToken } = require('../middleware/Authentication');

// Routes that require authentication

router.get('/', getAppLink);
router.get('/latest', getLastAppLink);

router.use(verifyToken);
router.post('/', addAppLink);
router.put('/:id', updateAppLink);

module.exports = router;
