const express = require('express');
const { dbGet, dbAll, dbExec } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const DEFAULT_COLORS = ['#6C63FF','#00D2FF','#10b981','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6','#f97316','#8b5cf6'];

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// Oturumu zengin veriyle çek (helper)
async function enrichSession(s, topicMap, examMap) {
    return {
        id: s.id, name: s.name, subject: s.subject,
        sessionType: s.session_type || 'study',
        templateId: s.template_id,
        date: s.date, duration: s.duration,
        total: s.total_questions, correct: s.correct,
        wrong: s.wrong, blank: s.blank, net: s.net,
        notes: s.notes, createdAt: s.created_at,
        wrongTopics: topicMap[s.id] || [],
        examSubjects: examMap[s.id] || [],
    };
}

// GET /api/sessions
router.get('/', async (req, res) => {
    try {
        const sessions = await dbAll('SELECT * FROM sessions WHERE user_id=$1 ORDER BY date DESC, created_at DESC', [req.user.id]);
        const wrongTopics = await dbAll('SELECT * FROM wrong_topics WHERE user_id=$1', [req.user.id]);
        const examResults = await dbAll('SELECT * FROM exam_subject_results WHERE user_id=$1 ORDER BY session_id, sort_order', [req.user.id]);

        const topicMap = {};
        wrongTopics.forEach(wt => {
            if (!topicMap[wt.session_id]) topicMap[wt.session_id] = [];
            topicMap[wt.session_id].push(wt.topic_name);
        });

        const examMap = {};
        examResults.forEach(er => {
            if (!examMap[er.session_id]) examMap[er.session_id] = [];
            examMap[er.session_id].push({
                subject: er.subject, category: er.category,
                total: er.total_questions, correct: er.correct,
                wrong: er.wrong, blank: er.blank, net: er.net,
                order: er.sort_order
            });
        });

        const result = await Promise.all(sessions.map(s => enrichSession(s, topicMap, examMap)));
        res.json({ sessions: result });
    } catch (err) {
        console.error('Session listesi hatası:', err);
        res.status(500).json({ error: 'Kayıtlar yüklenemedi.' });
    }
});

// POST /api/sessions
router.post('/', async (req, res) => {
    try {
        const { name, subject, sessionType, templateId, date, duration,
            total, correct, wrong, blank, net, notes, wrongTopics, examSubjects } = req.body;

        if (!name) return res.status(400).json({ error: 'Kayıt adı gerekli.' });
        const type = sessionType || 'study';
        if (type !== 'exam_general' && !subject) return res.status(400).json({ error: 'Ders seçimi gerekli.' });
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Oturum geçersiz, lütfen tekrar giriş yapın.' });

        const id = generateId();
        const d = date || new Date().toISOString().slice(0, 10);

        await dbExec(
            `INSERT INTO sessions (id, user_id, name, subject, session_type, template_id, date, duration,
             total_questions, correct, wrong, blank, net, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [id, req.user.id, name.trim(), subject ? subject.trim() : null, type, templateId || null,
             d, duration || 0, total || null, correct || 0, wrong || 0, blank || 0, net || null, notes || null]
        );

        // Subjects renk kaydı (hem tek hem çoklu kayıt için)
        const subjectsToColor = type === 'exam_general' && Array.isArray(examSubjects)
            ? [...new Set(examSubjects.map(es => es.subject))]
            : subject ? [subject.trim()] : [];

        for (const subName of subjectsToColor) {
            const existing = await dbGet('SELECT id FROM subjects WHERE user_id=$1 AND name=$2', [req.user.id, subName]);
            if (!existing) {
                const countRow = await dbGet('SELECT COUNT(*) as c FROM subjects WHERE user_id=$1', [req.user.id]);
                const color = DEFAULT_COLORS[(countRow ? parseInt(countRow.c) : 0) % DEFAULT_COLORS.length];
                await dbExec('INSERT INTO subjects (user_id, name, color) VALUES ($1,$2,$3)', [req.user.id, subName, color]);
            }
        }

        // Exam subject results (genel deneme)
        if (type === 'exam_general' && Array.isArray(examSubjects)) {
            for (let i = 0; i < examSubjects.length; i++) {
                const es = examSubjects[i];
                if (!es.subject) continue;
                const esNet = es.correct - (es.wrong * (parseFloat(req.body.netCoefficient) || 0.25));
                await dbExec(
                    `INSERT INTO exam_subject_results (session_id, user_id, subject, category, total_questions, correct, wrong, blank, net, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [id, req.user.id, es.subject, es.category || null,
                     es.total || null, es.correct || 0, es.wrong || 0,
                     es.blank || 0, esNet, i]
                );
            }
        }

        // Wrong topics
        if (Array.isArray(wrongTopics)) {
            for (const topic of wrongTopics) {
                if (topic && topic.trim()) {
                    await dbExec(
                        'INSERT INTO wrong_topics (session_id, user_id, subject, topic_name, date) VALUES ($1,$2,$3,$4,$5)',
                        [id, req.user.id, subject ? subject.trim() : 'Genel', topic.trim(), d]
                    );
                }
            }
        }

        res.status(201).json({ message: 'Kayıt oluşturuldu!', id });
    } catch (err) {
        console.error('Session oluşturma hatası:', err.message);
        res.status(500).json({ error: 'Kayıt oluşturulamadı: ' + err.message });
    }
});

// PUT /api/sessions/:id (Düzenleme)
router.put('/:id', async (req, res) => {
    try {
        const session = await dbGet('SELECT id, session_type FROM sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        if (!session) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

        const { name, subject, date, duration, total, correct, wrong, blank, net, notes, wrongTopics, examSubjects } = req.body;

        await dbExec(
            `UPDATE sessions SET name=$1, subject=$2, date=$3, duration=$4, total_questions=$5,
             correct=$6, wrong=$7, blank=$8, net=$9, notes=$10 WHERE id=$11 AND user_id=$12`,
            [name.trim(), subject ? subject.trim() : null, date, duration || 0,
             total || null, correct || 0, wrong || 0, blank || 0, net || null, notes || null,
             req.params.id, req.user.id]
        );

        // Wrong topics güncelle
        await dbExec('DELETE FROM wrong_topics WHERE session_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        if (Array.isArray(wrongTopics)) {
            for (const topic of wrongTopics) {
                if (topic && topic.trim()) {
                    await dbExec(
                        'INSERT INTO wrong_topics (session_id, user_id, subject, topic_name, date) VALUES ($1,$2,$3,$4,$5)',
                        [req.params.id, req.user.id, subject ? subject.trim() : 'Genel', topic.trim(), date]
                    );
                }
            }
        }

        // Exam subjects güncelle (genel deneme)
        if (session.session_type === 'exam_general' && Array.isArray(examSubjects)) {
            await dbExec('DELETE FROM exam_subject_results WHERE session_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
            for (let i = 0; i < examSubjects.length; i++) {
                const es = examSubjects[i];
                if (!es.subject) continue;
                const esNet = (es.correct || 0) - ((es.wrong || 0) * (parseFloat(req.body.netCoefficient) || 0.25));
                await dbExec(
                    `INSERT INTO exam_subject_results (session_id, user_id, subject, category, total_questions, correct, wrong, blank, net, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [req.params.id, req.user.id, es.subject, es.category || null,
                     es.total || null, es.correct || 0, es.wrong || 0,
                     es.blank || 0, esNet, i]
                );
            }
        }

        res.json({ message: 'Kayıt güncellendi.' });
    } catch (err) {
        console.error('Güncelleme hatası:', err);
        res.status(500).json({ error: 'Kayıt güncellenemedi.' });
    }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
    try {
        const session = await dbGet('SELECT id FROM sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        if (!session) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
        await dbExec('DELETE FROM wrong_topics WHERE session_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        await dbExec('DELETE FROM exam_subject_results WHERE session_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        await dbExec('DELETE FROM sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        res.json({ message: 'Kayıt silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Kayıt silinemedi.' });
    }
});

// GET /api/sessions/topics/stats
router.get('/topics/stats', async (req, res) => {
    try {
        const stats = await dbAll(
            `SELECT topic_name, subject, COUNT(*) as count, MAX(date) as last_date,
             COUNT(DISTINCT session_id) as session_count
             FROM wrong_topics WHERE user_id=$1
             GROUP BY topic_name, subject ORDER BY count DESC`,
            [req.user.id]
        );
        const resolved = await dbAll('SELECT topic_name, subject FROM resolved_topics WHERE user_id=$1', [req.user.id]);
        const resolvedSet = new Set(resolved.map(r => `${r.topic_name}::${r.subject || ''}`));

        res.json({
            topics: stats.map(s => ({
                name: s.topic_name, subject: s.subject,
                count: parseInt(s.count), lastDate: s.last_date,
                sessionCount: parseInt(s.session_count),
                resolved: resolvedSet.has(`${s.topic_name}::${s.subject || ''}`),
                resolvedAgain: resolvedSet.has(`${s.topic_name}::${s.subject || ''}`) && parseInt(s.count) > 1
            }))
        });
    } catch (err) {
        res.status(500).json({ error: 'İstatistikler yüklenemedi.' });
    }
});

// POST /api/sessions/topics/resolve
router.post('/topics/resolve', async (req, res) => {
    try {
        const { topicName, subject } = req.body;
        if (!topicName) return res.status(400).json({ error: 'Konu adı gerekli.' });
        await dbExec(
            `INSERT INTO resolved_topics (user_id, topic_name, subject) VALUES ($1,$2,$3)
             ON CONFLICT (user_id, topic_name, subject) DO NOTHING`,
            [req.user.id, topicName, subject || '']
        );
        res.json({ message: 'Konu halletti olarak işaretlendi.' });
    } catch (err) {
        res.status(500).json({ error: 'İşaretlenemedi.' });
    }
});

// DELETE /api/sessions/topics/resolve
router.delete('/topics/resolve', async (req, res) => {
    try {
        const { topicName, subject } = req.body;
        await dbExec('DELETE FROM resolved_topics WHERE user_id=$1 AND topic_name=$2 AND subject=$3',
            [req.user.id, topicName, subject || '']);
        res.json({ message: 'İşaret kaldırıldı.' });
    } catch (err) {
        res.status(500).json({ error: 'İşaret kaldırılamadı.' });
    }
});

// GET /api/sessions/analysis/pooled — havuzlama için birleşik veri
router.get('/analysis/pooled', async (req, res) => {
    try {
        // Tüm session'lar (study + exam_branch)
        const sessions = await dbAll(
            `SELECT id, name, subject, session_type, template_id, date, duration, correct, wrong, blank, net
             FROM sessions WHERE user_id=$1 AND session_type != 'exam_general'`, [req.user.id]
        );
        // Genel denemelerden exam_subject_results
        const examResults = await dbAll(
            `SELECT esr.subject, esr.category, esr.correct, esr.wrong, esr.blank, esr.net, esr.total_questions,
             s.date, s.name as session_name, s.id as session_id, s.duration
             FROM exam_subject_results esr
             JOIN sessions s ON s.id = esr.session_id
             WHERE esr.user_id=$1`, [req.user.id]
        );
        res.json({ sessions, examResults });
    } catch (err) {
        res.status(500).json({ error: 'Veri yüklenemedi.' });
    }
});

// GET /api/sessions/subjects/list
router.get('/subjects/list', async (req, res) => {
    try {
        const subjects = await dbAll('SELECT name, color FROM subjects WHERE user_id=$1 ORDER BY name', [req.user.id]);
        res.json({ subjects });
    } catch (err) {
        res.status(500).json({ error: 'Ders listesi yüklenemedi.' });
    }
});

// PUT /api/sessions/subjects/color
router.put('/subjects/color', async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !color || !/^#[0-9a-fA-F]{6}$/.test(color)) return res.status(400).json({ error: 'Geçersiz veri.' });
        const existing = await dbGet('SELECT id FROM subjects WHERE user_id=$1 AND name=$2', [req.user.id, name.trim()]);
        if (existing) {
            await dbExec('UPDATE subjects SET color=$1 WHERE user_id=$2 AND name=$3', [color, req.user.id, name.trim()]);
        } else {
            await dbExec('INSERT INTO subjects (user_id, name, color) VALUES ($1,$2,$3)', [req.user.id, name.trim(), color]);
        }
        res.json({ message: 'Renk güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Renk güncellenemedi.' });
    }
});

// PUT /api/sessions/subjects/rename
router.put('/subjects/rename', async (req, res) => {
    try {
        const { oldName, newName } = req.body;
        if (!oldName || !newName) return res.status(400).json({ error: 'Gerekli alanlar eksik.' });
        await dbExec('UPDATE subjects SET name=$1 WHERE user_id=$2 AND name=$3', [newName.trim(), req.user.id, oldName.trim()]);
        await dbExec('UPDATE sessions SET subject=$1 WHERE user_id=$2 AND subject=$3', [newName.trim(), req.user.id, oldName.trim()]);
        await dbExec('UPDATE wrong_topics SET subject=$1 WHERE user_id=$2 AND subject=$3', [newName.trim(), req.user.id, oldName.trim()]);
        await dbExec('UPDATE exam_subject_results SET subject=$1 WHERE user_id=$2 AND subject=$3', [newName.trim(), req.user.id, oldName.trim()]);
        res.json({ message: 'Ders adı güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Güncellenemedi.' });
    }
});

// DELETE /api/sessions/subjects/:name
router.delete('/subjects/:name', async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);
        await dbExec('DELETE FROM subjects WHERE user_id=$1 AND name=$2', [req.user.id, name]);
        res.json({ message: 'Ders silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Silinemedi.' });
    }
});

// GET /api/sessions/export/all
router.get('/export/all', async (req, res) => {
    try {
        const sessions = await dbAll('SELECT * FROM sessions WHERE user_id=$1', [req.user.id]);
        const topics = await dbAll('SELECT * FROM wrong_topics WHERE user_id=$1', [req.user.id]);
        const subjects = await dbAll('SELECT name, color FROM subjects WHERE user_id=$1', [req.user.id]);
        const examResults = await dbAll('SELECT * FROM exam_subject_results WHERE user_id=$1', [req.user.id]);
        res.json({ sessions, wrongTopics: topics, subjects, examResults, exportDate: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: 'Dışa aktarma başarısız.' });
    }
});

module.exports = router;
