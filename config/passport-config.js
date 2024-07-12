const LocalStrategy = require('passport-local').Strategy;
const { pool } = require('./db');
const bcrypt = require('bcrypt');

function initialize(passport) {
    const authenticateUser = async (username, password, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Mot de passe incorrect' });
                }
            } else {
                return done(null, false, { message: 'Utilisateur non trouvé' });
            }
        } catch (err) {
            return done(err);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                return done(null, result.rows[0]);
            } else {
                return done(new Error('Utilisateur non trouvé'), null);
            }
        } catch (err) {
            return done(err, null);
        }
    });
}

module.exports = initialize;
