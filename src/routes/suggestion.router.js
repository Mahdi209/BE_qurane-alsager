const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestion.controller');
const {verifyToken} = require("../middleware/Authentication");


router.post('/', suggestionController.createSuggestion);
router.get('/',verifyToken, suggestionController.getAllSuggestions);
router.get('/:id', verifyToken,suggestionController.getSuggestionById);
router.put('/:id',verifyToken , suggestionController.updateSuggestion);
router.put('/:id/copy', verifyToken ,suggestionController.makeIsCopySuggestion);

router.delete('/:id',verifyToken ,suggestionController.deleteSuggestion);

module.exports = router;
