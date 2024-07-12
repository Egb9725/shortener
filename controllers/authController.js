const passport = require('passport');
const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');

// Affichage du formulaire de connexion
exports.getLogin = (req, res) => {
    res.render('login');
};

// Traitement de la soumission du formulaire de connexion
exports.postLogin = passport.authenticate('local', {
    successRedirect: '/urls',  // Redirection après une connexion réussie
    failureRedirect: '/auth/login',  // Redirection après un échec de connexion
    failureFlash: true,
});

// Affichage du formulaire d'inscription
exports.getRegister = (req, res) => {
    res.render('register');
};

// Traitement de la soumission du formulaire d'inscription
exports.postRegister = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash du mot de passe
        await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).send('Erreur lors de l\'inscription');
    }
};

// Déconnexion de l'utilisateur
exports.getLogout = (req, res) => {
    req.logout();
    res.redirect('/auth/login');
};
