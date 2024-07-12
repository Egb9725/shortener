const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// Route pour afficher le formulaire de soumission d'URL
router.get('/', urlController.getIndex);

// Route pour traiter la soumission du formulaire d'URL
router.post('/shorten', urlController.postShorten);

// Route pour gérer les redirections depuis les URL raccourcies
router.get('/:shortCode', urlController.getRedirect);

module.exports = router;
