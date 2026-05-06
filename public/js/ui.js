// ===== UI HELPERS =====
function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// getSubjectColorFromList storage.js'te de tanımlı, burada override edilmez
function getSubjectColorFromList(subjects, subjectName) {
    if (!subjects || !subjectName) return '#6C63FF';
    const found = subjects.find(s => s.name === subjectName);
    return found ? found.color : '#6C63FF';
}
