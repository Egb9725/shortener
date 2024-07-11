const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const shortid = require('shortid');
const QRCode = require('qrcode');
const { URL } = require('../models');
const { ensureAuthenticated } = require('./auth');

router.get('/', ensureAuthenticated, async (req, res) => {
  const urls = await URL.findAll({ where: { user_id: req.user.id } });
  res.render('index', { urls });
});

router.post('/shorten', ensureAuthenticated, async (req, res) => {
  const { long_url } = req.body;
  if (validUrl.isUri(long_url)) {
    const short_url = shortid.generate();
    const qr_code = await QRCode.toDataURL(long_url);

    await URL.create({ long_url, short_url, qr_code, user_id: req.user.id });
    res.redirect('/');
  } else {
    res.status(400).send('Invalid URL');
  }
});

router.get('/:short_url', async (req, res) => {
  const short_url = req.params.short_url;
  const url = await URL.findOne({ where: { short_url } });

  if (url) {
    res.redirect(url.long_url);
  } else {
    res.status(404).send('URL not found');
  }
});

module.exports = router;
