const express = require('express');
const { dbGet, dbAll, dbExec } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Yerleşik şablonlar sunucu tarafında da tanımlı (frontend'deki curriculum.js ile aynı)
const BUILTIN_TEMPLATES = [
    {
        id: 'builtin-tyt-genel', name: 'TYT Genel', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'TYT Türkçe', defaultTotal: 40, category: 'TYT', order: 1 },
            { name: 'TYT Matematik', defaultTotal: 30, category: 'TYT', order: 2 },
            { name: 'TYT Geometri', defaultTotal: 10, category: 'TYT', order: 3 },
            { name: 'TYT Fizik', defaultTotal: 7, category: 'TYT', order: 4 },
            { name: 'TYT Kimya', defaultTotal: 7, category: 'TYT', order: 5 },
            { name: 'TYT Biyoloji', defaultTotal: 6, category: 'TYT', order: 6 },
            { name: 'TYT Tarih', defaultTotal: 5, category: 'TYT', order: 7 },
            { name: 'TYT Coğrafya', defaultTotal: 5, category: 'TYT', order: 8 },
            { name: 'TYT Felsefe', defaultTotal: 5, category: 'TYT', order: 9 },
            { name: 'TYT Din Kültürü', defaultTotal: 5, category: 'TYT', order: 10 },
        ]
    },
    {
        id: 'builtin-ayt-sayisal', name: 'AYT Genel (Sayısal)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'AYT Matematik', defaultTotal: 30, category: 'AYT', order: 1 },
            { name: 'AYT Geometri', defaultTotal: 10, category: 'AYT', order: 2 },
            { name: 'AYT Fizik', defaultTotal: 14, category: 'AYT', order: 3 },
            { name: 'AYT Kimya', defaultTotal: 13, category: 'AYT', order: 4 },
            { name: 'AYT Biyoloji', defaultTotal: 13, category: 'AYT', order: 5 },
        ]
    },
    {
        id: 'builtin-ayt-sozel', name: 'AYT Genel (Sözel)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'AYT Türk Dili ve Edebiyatı', defaultTotal: 24, category: 'AYT', order: 1 },
            { name: 'AYT Tarih-1', defaultTotal: 10, category: 'AYT', order: 2 },
            { name: 'AYT Coğrafya-1', defaultTotal: 6, category: 'AYT', order: 3 },
            { name: 'AYT Tarih-2', defaultTotal: 11, category: 'AYT', order: 4 },
            { name: 'AYT Coğrafya-2', defaultTotal: 11, category: 'AYT', order: 5 },
            { name: 'AYT Felsefe Grubu', defaultTotal: 12, category: 'AYT', order: 6 },
            { name: 'AYT Din Kültürü', defaultTotal: 6, category: 'AYT', order: 7 },
        ]
    },
    {
        id: 'builtin-ayt-ea', name: 'AYT Genel (Eşit Ağırlık)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'AYT Türk Dili ve Edebiyatı', defaultTotal: 24, category: 'AYT', order: 1 },
            { name: 'AYT Tarih-1', defaultTotal: 10, category: 'AYT', order: 2 },
            { name: 'AYT Coğrafya-1', defaultTotal: 6, category: 'AYT', order: 3 },
            { name: 'AYT Matematik', defaultTotal: 30, category: 'AYT', order: 4 },
            { name: 'AYT Geometri', defaultTotal: 10, category: 'AYT', order: 5 },
        ]
    },
    {
        id: 'builtin-yks-tam-sayisal', name: 'YKS Tam (TYT + AYT Sayısal)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'TYT Türkçe', defaultTotal: 40, category: 'TYT', order: 1 },
            { name: 'TYT Matematik', defaultTotal: 30, category: 'TYT', order: 2 },
            { name: 'TYT Geometri', defaultTotal: 10, category: 'TYT', order: 3 },
            { name: 'TYT Fizik', defaultTotal: 7, category: 'TYT', order: 4 },
            { name: 'TYT Kimya', defaultTotal: 7, category: 'TYT', order: 5 },
            { name: 'TYT Biyoloji', defaultTotal: 6, category: 'TYT', order: 6 },
            { name: 'TYT Tarih', defaultTotal: 5, category: 'TYT', order: 7 },
            { name: 'TYT Coğrafya', defaultTotal: 5, category: 'TYT', order: 8 },
            { name: 'TYT Felsefe', defaultTotal: 5, category: 'TYT', order: 9 },
            { name: 'TYT Din Kültürü', defaultTotal: 5, category: 'TYT', order: 10 },
            { name: 'AYT Matematik', defaultTotal: 30, category: 'AYT', order: 11 },
            { name: 'AYT Geometri', defaultTotal: 10, category: 'AYT', order: 12 },
            { name: 'AYT Fizik', defaultTotal: 14, category: 'AYT', order: 13 },
            { name: 'AYT Kimya', defaultTotal: 13, category: 'AYT', order: 14 },
            { name: 'AYT Biyoloji', defaultTotal: 13, category: 'AYT', order: 15 },
        ]
    },
    {
        id: 'builtin-yks-tam-sozel', name: 'YKS Tam (TYT + AYT Sözel)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'TYT Türkçe', defaultTotal: 40, category: 'TYT', order: 1 },
            { name: 'TYT Matematik', defaultTotal: 30, category: 'TYT', order: 2 },
            { name: 'TYT Geometri', defaultTotal: 10, category: 'TYT', order: 3 },
            { name: 'TYT Fizik', defaultTotal: 7, category: 'TYT', order: 4 },
            { name: 'TYT Kimya', defaultTotal: 7, category: 'TYT', order: 5 },
            { name: 'TYT Biyoloji', defaultTotal: 6, category: 'TYT', order: 6 },
            { name: 'TYT Tarih', defaultTotal: 5, category: 'TYT', order: 7 },
            { name: 'TYT Coğrafya', defaultTotal: 5, category: 'TYT', order: 8 },
            { name: 'TYT Felsefe', defaultTotal: 5, category: 'TYT', order: 9 },
            { name: 'TYT Din Kültürü', defaultTotal: 5, category: 'TYT', order: 10 },
            { name: 'AYT Türk Dili ve Edebiyatı', defaultTotal: 24, category: 'AYT', order: 11 },
            { name: 'AYT Tarih-1', defaultTotal: 10, category: 'AYT', order: 12 },
            { name: 'AYT Coğrafya-1', defaultTotal: 6, category: 'AYT', order: 13 },
            { name: 'AYT Tarih-2', defaultTotal: 11, category: 'AYT', order: 14 },
            { name: 'AYT Coğrafya-2', defaultTotal: 11, category: 'AYT', order: 15 },
            { name: 'AYT Felsefe Grubu', defaultTotal: 12, category: 'AYT', order: 16 },
            { name: 'AYT Din Kültürü', defaultTotal: 6, category: 'AYT', order: 17 },
        ]
    },
    {
        id: 'builtin-yks-tam-ea', name: 'YKS Tam (TYT + AYT Eşit Ağırlık)', is_builtin: true,
        session_type: 'exam_general',
        subjects: [
            { name: 'TYT Türkçe', defaultTotal: 40, category: 'TYT', order: 1 },
            { name: 'TYT Matematik', defaultTotal: 30, category: 'TYT', order: 2 },
            { name: 'TYT Geometri', defaultTotal: 10, category: 'TYT', order: 3 },
            { name: 'TYT Fizik', defaultTotal: 7, category: 'TYT', order: 4 },
            { name: 'TYT Kimya', defaultTotal: 7, category: 'TYT', order: 5 },
            { name: 'TYT Biyoloji', defaultTotal: 6, category: 'TYT', order: 6 },
            { name: 'TYT Tarih', defaultTotal: 5, category: 'TYT', order: 7 },
            { name: 'TYT Coğrafya', defaultTotal: 5, category: 'TYT', order: 8 },
            { name: 'TYT Felsefe', defaultTotal: 5, category: 'TYT', order: 9 },
            { name: 'TYT Din Kültürü', defaultTotal: 5, category: 'TYT', order: 10 },
            { name: 'AYT Türk Dili ve Edebiyatı', defaultTotal: 24, category: 'AYT', order: 11 },
            { name: 'AYT Tarih-1', defaultTotal: 10, category: 'AYT', order: 12 },
            { name: 'AYT Coğrafya-1', defaultTotal: 6, category: 'AYT', order: 13 },
            { name: 'AYT Matematik', defaultTotal: 30, category: 'AYT', order: 14 },
            { name: 'AYT Geometri', defaultTotal: 10, category: 'AYT', order: 15 },
        ]
    },
];

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// GET /api/templates
router.get('/', async (req, res) => {
    try {
        const custom = await dbAll('SELECT * FROM templates WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
        const customParsed = custom.map(t => ({
            id: t.id, name: t.name, isBuiltin: false,
            sessionType: t.session_type,
            subjects: typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects,
            createdAt: t.created_at
        }));
        const builtins = BUILTIN_TEMPLATES.map(t => ({ ...t, isBuiltin: true, sessionType: t.session_type }));
        res.json({ templates: [...builtins, ...customParsed] });
    } catch (err) {
        res.status(500).json({ error: 'Şablonlar yüklenemedi.' });
    }
});

// POST /api/templates
router.post('/', async (req, res) => {
    try {
        const { name, subjects, sessionType } = req.body;
        if (!name || !subjects || !Array.isArray(subjects)) return res.status(400).json({ error: 'Geçersiz veri.' });
        const id = generateId();
        await dbExec(
            'INSERT INTO templates (id, user_id, name, is_builtin, session_type, subjects) VALUES ($1,$2,$3,FALSE,$4,$5)',
            [id, req.user.id, name.trim(), sessionType || 'exam_general', JSON.stringify(subjects)]
        );
        res.status(201).json({ message: 'Şablon oluşturuldu.', id });
    } catch (err) {
        res.status(500).json({ error: 'Şablon oluşturulamadı.' });
    }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, subjects } = req.body;
        const t = await dbGet('SELECT id FROM templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        if (!t) return res.status(404).json({ error: 'Şablon bulunamadı.' });
        await dbExec('UPDATE templates SET name=$1, subjects=$2 WHERE id=$3 AND user_id=$4',
            [name.trim(), JSON.stringify(subjects), req.params.id, req.user.id]);
        res.json({ message: 'Şablon güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Güncellenemedi.' });
    }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
    try {
        const t = await dbGet('SELECT id FROM templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        if (!t) return res.status(404).json({ error: 'Şablon bulunamadı.' });
        await dbExec('DELETE FROM templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        res.json({ message: 'Şablon silindi.' });
    } catch (err) {
        res.status(500).json({ error: 'Silinemedi.' });
    }
});

module.exports = router;
