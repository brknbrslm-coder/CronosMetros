const express = require('express');
const { dbGet, dbAll, dbExec } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/settings
router.get('/', async (req, res) => {
    try {
        let settings = await dbGet('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
        if (!settings) {
            await dbExec('INSERT INTO user_settings (user_id) VALUES ($1)', [req.user.id]);
            settings = { net_coefficient: 0.25, daily_goal_minutes: 120 };
        }
        res.json({ netCoefficient: settings.net_coefficient, dailyGoalMinutes: settings.daily_goal_minutes });
    } catch (err) {
        res.status(500).json({ error: 'Ayarlar yüklenemedi.' });
    }
});

// PUT /api/settings
router.put('/', async (req, res) => {
    try {
        const { netCoefficient, dailyGoalMinutes } = req.body;
        const coef = parseFloat(netCoefficient);
        if (isNaN(coef) || coef <= 0 || coef > 1) return res.status(400).json({ error: 'Geçersiz net katsayısı.' });
        await dbExec(`
            INSERT INTO user_settings (user_id, net_coefficient, daily_goal_minutes, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id) DO UPDATE SET net_coefficient=$2, daily_goal_minutes=$3, updated_at=NOW()
        `, [req.user.id, coef, parseInt(dailyGoalMinutes) || 120]);
        res.json({ message: 'Ayarlar kaydedildi.' });
    } catch (err) {
        res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
    }
});

// PUT /api/settings/password
router.put('/password', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Tüm alanlar gerekli.' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı.' });
        const user = await dbGet('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Mevcut şifre yanlış.' });
        const hash = await bcrypt.hash(newPassword, 12);
        await dbExec('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
        res.json({ message: 'Şifre güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Şifre güncellenemedi.' });
    }
});

// PUT /api/settings/username
router.put('/username', async (req, res) => {
    try {
        const { newUsername } = req.body;
        if (!newUsername || newUsername.trim().length < 3) return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı.' });
        const existing = await dbGet('SELECT id FROM users WHERE username = $1 AND id != $2', [newUsername.trim(), req.user.id]);
        if (existing) return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
        await dbExec('UPDATE users SET username = $1 WHERE id = $2', [newUsername.trim(), req.user.id]);
        res.json({ message: 'Kullanıcı adı güncellendi.', newUsername: newUsername.trim() });
    } catch (err) {
        res.status(500).json({ error: 'Kullanıcı adı güncellenemedi.' });
    }
});

// PUT /api/settings/security-question
router.put('/security-question', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { security_question, security_answer } = req.body;
        if (!security_question || !security_answer) return res.status(400).json({ error: 'Soru ve cevap gerekli.' });
        const answerHash = await bcrypt.hash(security_answer.trim().toLowerCase(), 10);
        await dbExec('UPDATE users SET security_question=$1, security_answer_hash=$2 WHERE id=$3',
            [security_question, answerHash, req.user.id]);
        res.json({ message: 'Güvenlik sorusu güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Güncellenemedi.' });
    }
});

module.exports = router;
