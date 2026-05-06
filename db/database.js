const { Pool } = require('pg');

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
                security_question TEXT,
                security_answer_hash TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                subject TEXT,
                session_type TEXT DEFAULT 'study',
                template_id TEXT,
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

        // Migration: mevcut tabloya yeni kolonlar
        await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'study'`).catch(() => {});
        await client.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS template_id TEXT`).catch(() => {});
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT`).catch(() => {});
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_hash TEXT`).catch(() => {});

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

        await client.query(`
            CREATE TABLE IF NOT EXISTS exam_subject_results (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                category TEXT,
                total_questions INTEGER,
                correct INTEGER DEFAULT 0,
                wrong INTEGER DEFAULT 0,
                blank INTEGER DEFAULT 0,
                net REAL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                is_builtin BOOLEAN DEFAULT FALSE,
                session_type TEXT NOT NULL DEFAULT 'exam_general',
                subjects JSONB NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS resolved_topics (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                topic_name TEXT NOT NULL,
                subject TEXT,
                resolved_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, topic_name, subject)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                net_coefficient REAL DEFAULT 0.25,
                daily_goal_minutes INTEGER DEFAULT 120,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Indexler
        await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(user_id, date)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_wrong_topics_user ON wrong_topics(user_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_exam_results_session ON exam_subject_results(session_id)").catch(() => {});
        await client.query("CREATE INDEX IF NOT EXISTS idx_exam_results_user ON exam_subject_results(user_id, subject)").catch(() => {});

        console.log('✅ PostgreSQL veritabanı hazır');
    } finally {
        client.release();
    }
}

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

async function dbExec(sql, params = []) {
    await pool.query(sql, params);
}

module.exports = { initDB, pool, dbGet, dbAll, dbRun, dbExec };
