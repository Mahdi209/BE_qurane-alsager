const express = require('express');
const router = express.Router();
const filterController  = require('../controllers/filter.controller');

// Define the route for filtering data
router.get('/questions', filterController.getQuestionsByFilter);

module.exports = router;
