const express = require('express');
const { dbGet, dbAll, dbRun, dbExec } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

router.get('/', async (req, res) => {
    try {
        const sessions = await dbAll('SELECT * FROM sessions WHERE user_id = $1 ORDER BY date DESC, created_at DESC', [req.user.id]);
        const wrongTopics = await dbAll('SELECT * FROM wrong_topics WHERE user_id = $1', [req.user.id]);
        const topicMap = {};
        wrongTopics.forEach(wt => {
            if (!topicMap[wt.session_id]) topicMap[wt.session_id] = [];
            topicMap[wt.session_id].push(wt.topic_name);
        });
        const result = sessions.map(s => ({
            id: s.id, name: s.name, subject: s.subject, date: s.date,
            duration: s.duration, total: s.total_questions, correct: s.correct,
            wrong: s.wrong, blank: s.blank, net: s.net, notes: s.notes,
            wrongTopics: topicMap[s.id] || [], createdAt: s.created_at
        }));
        res.json({ sessions: result });
    } catch (err) {
        console.error('Session listesi hatası:', err);
        res.status(500).json({ error: 'Kayıtlar yüklenemedi.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, subject, date, duration, total, correct, wrong, blank, net, notes, wrongTopics } = req.body;
        if (!name || !subject) return res.status(400).json({ error: 'Kayıt adı ve ders gerekli.' });
        const id = generateId();
        const d = date || new Date().toISOString().slice(0, 10);

        await dbExec(
            'INSERT INTO sessions (id, user_id, name, subject, date, duration, total_questions, correct, wrong, blank, net, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
            [id, req.user.id, name.trim(), subject.trim(), d, duration || 0, total || null, correct || 0, wrong || 0, blank || 0, net || null, notes || null]
        );

        const defaultColors = ['#6C63FF','#00D2FF','#10b981','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6','#f97316','#8b5cf6'];
        const existing = await dbGet('SELECT id FROM subjects WHERE user_id = $1 AND name = $2', [req.user.id, subject.trim()]);
        if (!existing) {
            const countRow = await dbGet('SELECT COUNT(*) as c FROM subjects WHERE user_id = $1', [req.user.id]);
            const color = defaultColors[(countRow ? parseInt(countRow.c) : 0) % defaultColors.length];
            await dbExec('INSERT INTO subjects (user_id, name, color) VALUES ($1, $2, $3)', [req.user.id, subject.trim(), color]);
        }

        if (wrongTopics && Array.isArray(wrongTopics)) {
            for (const topic of wrongTopics) {
                if (topic && topic.trim()) {
                    await dbExec('INSERT INTO wrong_topics (session_id, user_id, subject, topic_name, date) VALUES ($1,$2,$3,$4,$5)',
                        [id, req.user.id, subject.trim(), topic.trim(), d]);
                }
            }
        }
        res.status(201).json({ message: 'Kayıt oluşturuldu!', id });
    } catch (err) {
        console.error('Session oluşturma hatası:', err);
        res.status(500).json({ error: 'Kayıt oluşturulamadı.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const session = await dbGet('SELECT id FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (!session) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
        await dbExec('DELETE FROM wrong_topics WHERE session_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        await dbExec('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Kayıt silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Kayıt silinemedi.' });
    }
});

router.get('/topics/stats', async (req, res) => {
    try {
        const stats = await dbAll(
            'SELECT topic_name, subject, COUNT(*) as count, MAX(date) as last_date FROM wrong_topics WHERE user_id = $1 GROUP BY topic_name, subject ORDER BY count DESC',
            [req.user.id]
        );
        res.json({ topics: stats.map(s => ({ name: s.topic_name, subject: s.subject, count: parseInt(s.count), lastDate: s.last_date, sessionCount: parseInt(s.count) })) });
    } catch (err) {
        res.status(500).json({ error: 'İstatistikler yüklenemedi.' });
    }
});

router.get('/subjects/list', async (req, res) => {
    try {
        const subjects = await dbAll('SELECT name, color FROM subjects WHERE user_id = $1 ORDER BY name', [req.user.id]);
        res.json({ subjects });
    } catch (err) {
        res.status(500).json({ error: 'Ders listesi yüklenemedi.' });
    }
});

router.put('/subjects/color', async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !color || !/^#[0-9a-fA-F]{6}$/.test(color)) return res.status(400).json({ error: 'Geçersiz veri.' });
        const existing = await dbGet('SELECT id FROM subjects WHERE user_id = $1 AND name = $2', [req.user.id, name.trim()]);
        if (existing) {
            await dbExec('UPDATE subjects SET color = $1 WHERE user_id = $2 AND name = $3', [color, req.user.id, name.trim()]);
        } else {
            await dbExec('INSERT INTO subjects (user_id, name, color) VALUES ($1, $2, $3)', [req.user.id, name.trim(), color]);
        }
        res.json({ message: 'Renk güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Renk güncellenemedi.' });
    }
});

router.get('/export/all', async (req, res) => {
    try {
        const sessions = await dbAll('SELECT * FROM sessions WHERE user_id = $1', [req.user.id]);
        const topics = await dbAll('SELECT * FROM wrong_topics WHERE user_id = $1', [req.user.id]);
        const subjects = await dbAll('SELECT name, color FROM subjects WHERE user_id = $1', [req.user.id]);
        res.json({ sessions, wrongTopics: topics, subjects, exportDate: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: 'Dışa aktarma başarısız.' });
    }
});

module.exports = router;
