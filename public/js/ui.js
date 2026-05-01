// ===== UI HELPERS =====
function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function populateSubjectFilters() {
    const subjects = await loadSubjects();
    const selects = ['filter-subject', 'analysis-subject', 'topics-subject-filter'];
    const datalist = document.getElementById('subject-list');

    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = '<option value="">Tümü</option>';
        subjects.forEach(s => {
            sel.innerHTML += `<option value="${s.name}">${s.name}</option>`;
        });
        sel.value = val;
    });

    if (datalist) {
        datalist.innerHTML = '';
        subjects.forEach(s => {
            datalist.innerHTML += `<option value="${s.name}">`;
        });
    }

    return subjects;
}

async function populateTopicSuggestions() {
    const topics = await loadTopicStats();
    const dl = document.getElementById('topic-suggestions');
    if (!dl) return;
    dl.innerHTML = '';
    const seen = new Set();
    topics.forEach(t => {
        if (!seen.has(t.name)) {
            dl.innerHTML += `<option value="${t.name}">`;
            seen.add(t.name);
        }
    });
}

function getSubjectColorFromList(subjects, subjectName) {
    const found = subjects.find(s => s.name === subjectName);
    return found ? found.color : '#6C63FF';
}
