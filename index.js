/*------Importation des modules------ */
const express = require('express');
const shortid = require('shortid');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const { Pool } = require('pg'); // Ajout de la connexion à PostgreSQL

/*------configuration d'express------ */
const app = express();
const port = 3000;

// Configuration de la connexion à la base de données PostgreSQL
const pool = new Pool({
  user: 'votre_utilisateur',
  host: 'votre_hôte',
  database: 'votre_base_de_données',
  password: 'votre_mot_de_passe',
  port: 5432,
});

app.use(express.static('public'));  // Pour servir des fichiers statiques
app.set('view engine', 'ejs');      // Moteur de template EJS
app.use(express.urlencoded({ extended: false }));

// Fonction de validation des URLs
function urlValidations() {
  return [
    body('fullUrl').isURL().withMessage('Veuillez entrer une URL valide'),
    body('shortUrl').notEmpty().withMessage('L\'URL raccourcie ne peut pas être vide.'),
  ];
}

// Afficher les URLs raccourcies
app.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM urls');
    res.render('index', { urls: rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des URLs :', error);
    res.sendStatus(500);
  }
});

// Ajouter une nouvelle URL raccourcie
app.post('/shorten', urlValidations(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const fullUrl = req.body.fullUrl;
  const shortUrl = shortid.generate();
  const qrCodeUrl = await QRCode.toDataURL(`http://localhost:${port}/${shortUrl}`);

  try {
    await pool.query('INSERT INTO urls (full_url, short_url, qr_code) VALUES ($1, $2, $3)', [fullUrl, shortUrl, qrCodeUrl]);
    res.redirect('/');
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'URL :', error);
    res.sendStatus(500);
  }
});

// Redirection vers l'URL originale depuis l'URL raccourcie
app.get('/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  try {
    const { rows } = await pool.query('SELECT full_url FROM urls WHERE short_url = $1', [shortUrl]);
    if (rows.length > 0) {
      res.redirect(rows[0].full_url);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Erreur lors de la redirection :', error);
    res.sendStatus(500);
  }
});

// Supprimer une URL raccourcie
app.delete('/delete/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  try {
    await pool.query('DELETE FROM urls WHERE short_url = $1', [shortUrl]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'URL :', error);
    res.sendStatus(500);
  }
});

// Afficher le formulaire d'édition pour une URL raccourcie
app.get('/edit/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  try {
    const { rows } = await pool.query('SELECT * FROM urls WHERE short_url = $1', [shortUrl]);
    if (rows.length > 0) {
      res.render('edit', { url: rows[0] });
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL :', error);
    res.sendStatus(500);
  }
});

// Mettre à jour une URL raccourcie
app.post('/update/:shortUrl', async (req, res) => {
  const oldShortUrl = req.params.shortUrl;
  const fullUrl = req.body.fullUrl;
  const newShortUrl = req.body.shortUrl;

  try {
    const qrCodeUrl = await QRCode.toDataURL(`http://localhost:${port}/${newShortUrl}`);
    await pool.query('UPDATE urls SET full_url = $1, short_url = $2, qr_code = $3 WHERE short_url = $4', [fullUrl, newShortUrl, qrCodeUrl, oldShortUrl]);
    res.redirect('/');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'URL :', error);
    res.sendStatus(500);
  }
});

// Téléchargement du QR code en image
app.get('/download/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  try {
    const { rows } = await pool.query('SELECT qr_code FROM urls WHERE short_url = $1', [shortUrl]);
    if (rows.length > 0) {
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(rows[0].qr_code.replace('data:image/png;base64,', ''), 'base64'));
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement du QR code :', error);
    res.sendStatus(500);
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log('Le serveur est lancé sur le port 3000');
  console.log(`http://localhost:${port}`);
});