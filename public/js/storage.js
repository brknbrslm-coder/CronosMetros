// ===== API STORAGE MODULE =====
// Tüm veriler sunucudan gelir, localStorage sadece token için kullanılır

const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('cronos_token');
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('cronos_user')); }
    catch { return null; }
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem('cronos_token');
    localStorage.removeItem('cronos_user');
    window.location.href = '/login.html';
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    if (!token) { logout(); return null; }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        ...options
    };

    try {
        const res = await fetch(API_BASE + endpoint, config);
        if (res.status === 401) { logout(); return null; }
        const data = await res.json();
        if (!res.ok) {
            if (typeof showToast === 'function') showToast(data.error || 'Bir hata oluştu', 'error');
            return null;
        }
        return data;
    } catch (err) {
        console.error('API hatası:', err);
        if (typeof showToast === 'function') showToast('Sunucuya bağlanılamadı', 'error');
        return null;
    }
}

// ===== SESSION İŞLEMLERİ =====

async function loadSessions() {
    const data = await apiRequest('/sessions');
    return data ? data.sessions : [];
}

async function addSession(session) {
    return await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });
}

async function deleteSession(id) {
    return await apiRequest('/sessions/' + id, { method: 'DELETE' });
}

// ===== DERS İŞLEMLERİ =====

async function loadSubjects() {
    const data = await apiRequest('/sessions/subjects/list');
    return data ? data.subjects : []; // [{name, color}]
}

async function updateSubjectColor(name, color) {
    return await apiRequest('/sessions/subjects/color', {
        method: 'PUT',
        body: JSON.stringify({ name, color })
    });
}

// ===== KONU İŞLEMLERİ =====

async function loadTopicStats() {
    const data = await apiRequest('/sessions/topics/stats');
    return data ? data.topics : [];
}

// ===== DIŞA / İÇE AKTARMA =====

async function exportData() {
    const data = await apiRequest('/sessions/export/all');
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronosmetros_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== YARDIMCI =====

// Ders rengini bul (cache'li)
let _subjectCache = null;
async function getSubjectColor(subjectName) {
    if (!_subjectCache) _subjectCache = await loadSubjects();
    const found = _subjectCache.find(s => s.name === subjectName);
    return found ? found.color : '#6C63FF';
}

function invalidateSubjectCache() {
    _subjectCache = null;
}
