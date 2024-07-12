const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const initializePassport = require('./config/passport-config');  // Ajustez le chemin

const { pool } = require('./config/db');
const bcrypt = require('bcrypt');
const app = express();

initializePassport(passport);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get('/', checkAuthenticated, async (req, res) => {
    const result = await pool.query('SELECT * FROM urls WHERE user_id = $1', [req.user.id]);
    res.render('index', { user: req.user, urls: result.rows });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [req.body.username, hashedPassword]
        );
        res.redirect('/login');
    } catch (err) {
        res.redirect('/register');
    }
});

app.post('/shorten', checkAuthenticated, async (req, res) => {
    const shortUrl = generateShortUrl();
    await pool.query(
        'INSERT INTO urls (original_url, short_url, user_id) VALUES ($1, $2, $3)',
        [req.body.original_url, shortUrl, req.user.id]
    );
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

function generateShortUrl() {
    return Math.random().toString(36).substring(2, 8);
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
