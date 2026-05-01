const { Pool } = require('pg');

// Render.com DATABASE_URL'i otomatik sağlar
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                subject TEXT NOT NULL,
                date TEXT NOT NULL,
                duration INTEGER DEFAULT 0,
                total_questions INTEGER,
                correct INTEGER,
                wrong INTEGER,
                blank INTEGER,
                net REAL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS wrong_topics (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                date TEXT NOT NULL
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#6C63FF',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, name)
            )
        `);

        // Indexler
        await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(user_id, date)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_wrong_topics_user ON wrong_topics(user_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id)").catch(() => {});

        console.log('✅ PostgreSQL veritabanı hazır');
    } finally {
        client.release();
    }
}

// Helper fonksiyonlar
async function dbGet(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
}

async function dbAll(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
}

async function dbRun(sql, params = []) {
    const result = await pool.query(sql + ' RETURNING *', params);
    const row = result.rows[0];
    return { lastInsertRowid: row ? row.id : null };
}

// INSERT için RETURNING olmadan çalışan versiyon
async function dbExec(sql, params = []) {
    await pool.query(sql, params);
}

module.exports = { initDB, pool, dbGet, dbAll, dbRun, dbExec };
