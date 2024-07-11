require('dotenv').config(); 

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const QRCode = require('qrcode');
const crypto = require('crypto');
require('dotenv').config();
require('./config/passport')(passport);

const app = express();

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration de session et Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware d'authentification
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Route pour la page d'accueil
app.get('/', ensureAuthenticated, (req, res) => {
  res.render('index');
});

// Route pour raccourcir une URL
app.post('/shorten', ensureAuthenticated, async (req, res) => {
  const { longUrl } = req.body;
  const shortCode = crypto.randomBytes(4).toString('hex');

  try {
    await pool.query('INSERT INTO urls (long_url, short_url) VALUES ($1, $2)', [longUrl, shortCode]);
    const shortUrl = `http://localhost:${process.env.PORT}/${shortCode}`;
    const qrCode = await QRCode.toDataURL(shortUrl);

    res.render('index', { shortUrl, qrCode });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du raccourcissement de l\'URL');
  }
});

// Route pour rediriger les URLs raccourcies
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const result = await pool.query('SELECT long_url FROM urls WHERE short_url = $1', [shortCode]);

    if (result.rows.length > 0) {
      res.redirect(result.rows[0].long_url);
    } else {
      res.status(404).send('URL non trouvée');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la redirection');
  }
});

// Route pour la page d'inscription
app.get('/register', (req, res) => {
  res.render('register', { message: req.flash('error') });
});

// Route pour l'inscription
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l\'inscription');
  }
});

// Route pour la page de connexion
app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// Route pour la connexion
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

// Route pour la déconnexion
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
