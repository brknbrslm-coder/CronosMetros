const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== GÜVENLİK =====
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting — brute force koruması
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 20, // 15 dk'da max 20 deneme
    message: { error: 'Çok fazla deneme yaptınız. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 100, // 1 dk'da max 100 istek
    message: { error: 'Çok fazla istek gönderildi. Lütfen bekleyin.' }
});

// ===== VERİTABANI & SUNUCU BAŞLAT =====
async function start() {
    await initDB();

    // ===== ROTALAR =====
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/sessions', apiLimiter, sessionRoutes);

    // ===== STATİK DOSYALAR =====
    app.use(express.static(path.join(__dirname, 'public')));

    // SPA fallback
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'Endpoint bulunamadı' });
        }
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // ===== HATA YÖNETİMİ =====
    app.use((err, req, res, next) => {
        console.error('Sunucu hatası:', err.message);
        res.status(500).json({ error: 'Sunucu hatası oluştu' });
    });

    app.listen(PORT, () => {
        console.log(`\n🕐 CronosMetros sunucusu çalışıyor: http://localhost:${PORT}\n`);
    });
}

start().catch(err => {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
});
