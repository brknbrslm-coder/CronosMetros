const jwt = require('jsonwebtoken');

// Güvenli secret key — production'da env variable kullanılmalı
const JWT_SECRET = process.env.JWT_SECRET || 'cronosmetros_secret_2024';
const JWT_EXPIRES_IN = '30d';

function generateToken(userId, username) {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Oturum gerekli. Lütfen giriş yapın.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Eski tokenlar 'userId', yeni tokenlar 'id' alanını kullanıyor — her ikisini dene
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Geçersiz token yapısı. Lütfen tekrar giriş yapın.' });
        }
        req.user = { id: userId, username: decoded.username };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Oturum süresi doldu. Tekrar giriş yapın.' });
        }
        return res.status(403).json({ error: 'Geçersiz oturum.' });
    }
}

module.exports = { generateToken, authenticateToken, JWT_SECRET };
