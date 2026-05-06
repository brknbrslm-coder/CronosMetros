// ===== API STORAGE MODULE =====
const API_BASE = '/api';

function getToken() { return localStorage.getItem('cronos_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('cronos_user')); } catch { return null; } }
function isLoggedIn() { return !!getToken(); }
function logout() {
    localStorage.removeItem('cronos_token');
    localStorage.removeItem('cronos_user');
    window.location.href = '/login.html';
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    if (!token) { logout(); return null; }
    const config = {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        if (typeof showToast === 'function') showToast('Sunucuya bağlanılamadı', 'error');
        return null;
    }
}

// ===== SESSION =====
async function loadSessions() {
    const data = await apiRequest('/sessions');
    return data ? data.sessions : [];
}
async function addSession(session) {
    return await apiRequest('/sessions', { method: 'POST', body: JSON.stringify(session) });
}
async function updateSession(id, session) {
    return await apiRequest('/sessions/' + id, { method: 'PUT', body: JSON.stringify(session) });
}
async function deleteSession(id) {
    return await apiRequest('/sessions/' + id, { method: 'DELETE' });
}

// ===== POOLED DATA (Analiz için) =====
async function loadPooledData() {
    const data = await apiRequest('/sessions/analysis/pooled');
    return data || { sessions: [], examResults: [] };
}

// ===== DERSLER =====
async function loadSubjects() {
    const data = await apiRequest('/sessions/subjects/list');
    return data ? data.subjects : [];
}
async function updateSubjectColor(name, color) {
    return await apiRequest('/sessions/subjects/color', { method: 'PUT', body: JSON.stringify({ name, color }) });
}
async function renameSubject(oldName, newName) {
    return await apiRequest('/sessions/subjects/rename', { method: 'PUT', body: JSON.stringify({ oldName, newName }) });
}
async function deleteSubject(name) {
    return await apiRequest('/sessions/subjects/' + encodeURIComponent(name), { method: 'DELETE' });
}

// ===== KONULAR =====
async function loadTopicStats() {
    const data = await apiRequest('/sessions/topics/stats');
    return data ? data.topics : [];
}
async function resolveTopic(topicName, subject) {
    return await apiRequest('/sessions/topics/resolve', { method: 'POST', body: JSON.stringify({ topicName, subject }) });
}
async function unresolveTopic(topicName, subject) {
    return await apiRequest('/sessions/topics/resolve', { method: 'DELETE', body: JSON.stringify({ topicName, subject }) });
}

// ===== ŞABLONLAR =====
async function loadTemplates() {
    const data = await apiRequest('/templates');
    return data ? data.templates : [];
}
async function createTemplate(template) {
    return await apiRequest('/templates', { method: 'POST', body: JSON.stringify(template) });
}
async function updateTemplate(id, template) {
    return await apiRequest('/templates/' + id, { method: 'PUT', body: JSON.stringify(template) });
}
async function deleteTemplate(id) {
    return await apiRequest('/templates/' + id, { method: 'DELETE' });
}

// ===== AYARLAR =====
async function loadSettings() {
    const data = await apiRequest('/settings');
    return data || { netCoefficient: 0.25, dailyGoalMinutes: 120 };
}
async function saveSettings(settings) {
    return await apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) });
}
async function changePassword(currentPassword, newPassword) {
    return await apiRequest('/settings/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
}
async function changeUsername(newUsername) {
    return await apiRequest('/settings/username', { method: 'PUT', body: JSON.stringify({ newUsername }) });
}
async function updateSecurityQuestion(security_question, security_answer) {
    return await apiRequest('/settings/security-question', { method: 'PUT', body: JSON.stringify({ security_question, security_answer }) });
}

// ===== DIŞA AKTARMA =====
async function exportData() {
    const data = await apiRequest('/sessions/export/all');
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronosmetros_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== YARDIMCI =====
let _subjectCache = null;
async function getSubjectColor(subjectName) {
    if (!_subjectCache) _subjectCache = await loadSubjects();
    const found = _subjectCache.find(s => s.name === subjectName);
    return found ? found.color : '#6C63FF';
}
function invalidateSubjectCache() { _subjectCache = null; }

function getSubjectColorFromList(subjects, name) {
    if (!subjects || !name) return '#6C63FF';
    const found = subjects.find(s => s.name === name);
    return found ? found.color : '#6C63FF';
}

async function populateSubjectFilters() {
    const subjects = await loadSubjects();
    const selects = ['filter-subject', 'analysis-subject', 'topics-subject-filter'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value;
        el.innerHTML = '<option value="">Tüm Dersler</option>';
        subjects.forEach(s => {
            el.innerHTML += `<option value="${s.name}">${s.name}</option>`;
        });
        if (val) el.value = val;
    });
    return subjects;
}

// Net katsayısı (settings'ten gelir, cache)
let _netCoefficient = 0.25;
async function getNetCoefficient() {
    const s = await loadSettings();
    _netCoefficient = s.netCoefficient || 0.25;
    return _netCoefficient;
}
function calcNet(correct, wrong, coef) {
    coef = coef || _netCoefficient || 0.25;
    return (correct || 0) - ((wrong || 0) * coef);
}
