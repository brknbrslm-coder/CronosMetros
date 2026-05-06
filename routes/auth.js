const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbExec } = require('../db/database');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'cronosmetros_secret_2024';

const SECURITY_QUESTIONS = [
    'İlk evcil hayvanınızın adı neydi?',
    'Annenizin kızlık soyadı nedir?',
    'İlk öğretmeninizin adı neydi?',
    'Doğduğunuz şehir neresidir?',
    'En sevdiğiniz film nedir?',
    'İlk gittiğiniz konser hangi sanatçıydı?',
    'Çocukluk döneminizdeki en iyi arkadaşınızın adı neydi?',
];

// Güvenlik sorularını listele
router.get('/security-questions', (req, res) => {
    res.json({ questions: SECURITY_QUESTIONS });
});

// Kullanıcının güvenlik sorusunu getir (şifre sıfırlama adım 1)
router.get('/security-question', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'Kullanıcı adı gerekli.' });
        const user = await dbGet('SELECT security_question FROM users WHERE username = $1', [username.trim()]);
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        if (!user.security_question) return res.status(400).json({ error: 'Bu hesap için güvenlik sorusu tanımlanmamış.' });
        res.json({ question: user.security_question });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Kayıt
router.post('/register', async (req, res) => {
    try {
        const { username, password, security_question, security_answer } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
        if (username.length < 3) return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı.' });
        if (password.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });

        const existing = await dbGet('SELECT id FROM users WHERE username = $1', [username.trim()]);
        if (existing) return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });

        const hash = await bcrypt.hash(password, 12);
        let answerHash = null;
        if (security_question && security_answer && security_answer.trim()) {
            answerHash = await bcrypt.hash(security_answer.trim().toLowerCase(), 10);
        }

        await dbExec(
            'INSERT INTO users (username, password_hash, security_question, security_answer_hash) VALUES ($1,$2,$3,$4)',
            [username.trim(), hash, security_question || null, answerHash]
        );
        const user = await dbGet('SELECT id, username FROM users WHERE username = $1', [username.trim()]);
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '30d' });
        res.status(201).json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error('Kayıt hatası:', err);
        res.status(500).json({ error: 'Kayıt oluşturulamadı.' });
    }
});

// Giriş
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
        const user = await dbGet('SELECT * FROM users WHERE username = $1', [username.trim()]);
        if (!user) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: 'Giriş yapılamadı.' });
    }
});

// Şifre sıfırlama (güvenlik sorusuyla)
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, security_answer, new_password } = req.body;
        if (!username || !security_answer || !new_password) {
            return res.status(400).json({ error: 'Tüm alanlar gerekli.' });
        }
        if (new_password.length < 6) return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı.' });

        const user = await dbGet('SELECT * FROM users WHERE username = $1', [username.trim()]);
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        if (!user.security_answer_hash) return res.status(400).json({ error: 'Güvenlik sorusu tanımlanmamış.' });

        const match = await bcrypt.compare(security_answer.trim().toLowerCase(), user.security_answer_hash);
        if (!match) return res.status(401).json({ error: 'Güvenlik sorusu cevabı yanlış.' });

        const newHash = await bcrypt.hash(new_password, 12);
        await dbExec('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
        res.json({ message: 'Şifre başarıyla sıfırlandı.' });
    } catch (err) {
        res.status(500).json({ error: 'Şifre sıfırlanamadı.' });
    }
});

module.exports = router;
