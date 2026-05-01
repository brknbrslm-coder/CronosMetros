const express = require('express');
const bcrypt = require('bcryptjs');
const { dbGet, dbRun } = require('../db/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

function validateInput(username, password) {
    if (!username || typeof username !== 'string') return 'Kullanıcı adı gerekli.';
    if (!password || typeof password !== 'string') return 'Şifre gerekli.';
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) return 'Kullanıcı adı 3-30 karakter olmalı.';
    if (!/^[a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]+$/.test(trimmed)) return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.';
    if (password.length < 6 || password.length > 100) return 'Şifre 6-100 karakter olmalı.';
    return null;
}

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const error = validateInput(username, password);
        if (error) return res.status(400).json({ error });

        const existing = await dbGet('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
        if (existing) return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış.' });

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await dbRun('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username.trim(), hash]);

        const token = generateToken(result.lastInsertRowid, username.trim());
        res.status(201).json({
            message: 'Hesap oluşturuldu!',
            token,
            user: { id: result.lastInsertRowid, username: username.trim() }
        });
    } catch (err) {
        console.error('Kayıt hatası:', err);
        res.status(500).json({ error: 'Hesap oluşturulamadı.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

        const user = await dbGet('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
        if (!user) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        const token = generateToken(user.id, user.username);
        res.json({ message: 'Giriş başarılı!', token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error('Giriş hatası:', err);
        res.status(500).json({ error: 'Giriş yapılamadı.' });
    }
});

const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
