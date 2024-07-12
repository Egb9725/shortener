const qr = require('qrcode');
const { pool } = require('../../config/db');

// Affichage du formulaire de soumission d'URL
exports.getIndex = (req, res) => {
    res.render('index');
};

// Traitement de la soumission du formulaire d'URL
exports.postShorten = async (req, res) => {
    try {
        const originalUrl = req.body.url;
        const shortCode = Math.random().toString(36).substring(2, 8);
        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
        const userId = req.user.id; // Utilisateur connecté

        await pool.query('INSERT INTO urls (short_code, original_url, user_id) VALUES ($1, $2, $3)', [shortCode, originalUrl, userId]);

        const qrCodeUrl = await qr.toDataURL(shortUrl);

        res.render('result', { originalUrl, shortUrl, qrCodeUrl });
    } catch (error) {
        console.error('Erreur lors du traitement de la demande de redirection :', error);
        res.status(500).send('Something went wrong');
    }
};

// Traitement des redirections depuis les URL raccourcies
exports.getRedirect = async (req, res) => {
    try {
        const shortCode = req.params.shortCode;
        const result = await pool.query('SELECT original_url FROM urls WHERE short_code = $1', [shortCode]);

        if (result.rows.length > 0) {
            res.redirect(result.rows[0].original_url);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Erreur lors du traitement de la demande de redirection :', error);
        res.status(500).send('Something went wrong');
    }
};
