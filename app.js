// Importation des modules nécessaires
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const { pool } = require('./config/db');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // Dossier pour les fichiers statiques comme styles.css

// Configuration du moteur de rendu EJS
app.set('view engine', 'ejs');

// Configuration de la connexion à la base de données PostgreSQL
// Utilisez le pool de connexions exporté depuis db.js
const pool = require('./config/db').pool;

// Configuration de session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Import de la configuration de Passport
require('./config/passport-config');

// Middleware pour vérifier si l'utilisateur est authentifié
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

// Routes
const indexRouter = require('./app/routes/index');
const authRouter = require('./app/routes/authRoutes');
const urlRouter = require('./app/routes/urlRoutes');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/urls', isAuthenticated, urlRouter); // Protéger les routes des URLs

// Démarrage du serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
