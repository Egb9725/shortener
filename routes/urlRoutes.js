const express = require('express');
const router = express.Router();
const { createShortUrl, redirectToLongUrl } = require('../controllers/urlController');

router.get('/', (req, res) => {
  res.render('home', { shortUrl: req.query.shortUrl });
});

router.post('/shorten', createShortUrl);
router.get('/:shortUrl', redirectToLongUrl);

module.exports = router;