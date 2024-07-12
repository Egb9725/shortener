const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const qr = require('qrcode');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
    res.render('index');
});

function generateShortCode() {
    return Math.random().toString(36).substring(2, 8);
}

app.post('/shorten', async (req, res) => {
    try {
        const originalUrl = req.body.url;
        const shortCode = generateShortCode();
        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
        
        await pool.query('INSERT INTO urls (short_code, original_url) VALUES ($1, $2)', [shortCode, originalUrl]);

        const qrCodeUrl = await qr.toDataURL(shortUrl);

        res.render('result', { originalUrl, shortUrl, qrCodeUrl });
    } catch (error) {
        console.error('Erreur lors du traitement de la demande de redirection', error);
        res.status(500).send('Something went wrong');
    }
});

app.get('/:shortCode', async (req, res) => {
    try {
        const shortCode = req.params.shortCode;
        const result = await pool.query('SELECT original_url FROM urls WHERE short_code = $1', [shortCode]);
        
        if (result.rows.length > 0) {
            res.redirect(result.rows[0].original_url);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Erreur lors du traitement de la demande de redirection :', error);
        res.status(500).send('Something went wrong');
    }
});
