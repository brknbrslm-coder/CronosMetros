// ===== TOPICS PAGE =====
async function renderTopics() {
    let topicList = await loadTopicStats();
    const subjects = await loadSubjects();
    if (!topicList) topicList = [];

    const subjectFilter = document.getElementById('topics-subject-filter').value;
    if (subjectFilter) topicList = topicList.filter(t => t.subject === subjectFilter);

    const sortBy = document.getElementById('topics-sort').value;
    topicList.sort((a, b) => {
        switch (sortBy) {
            case 'count-desc': return b.count - a.count;
            case 'count-asc': return a.count - b.count;
            case 'name-asc': return a.name.localeCompare(b.name, 'tr');
            default: return b.count - a.count;
        }
    });

    const summaryEl = document.getElementById('topics-summary');
    if (topicList.length > 0) {
        const totalErrors = topicList.reduce((a, t) => a + t.count, 0);
        const worst = topicList[0];
        summaryEl.innerHTML = `
            <div class="history-stat"><div class="hs-value hs-accent">${topicList.length}</div><div class="hs-label">Farklı Konu</div></div>
            <div class="history-stat"><div class="hs-value" style="color:var(--danger)">${totalErrors}</div><div class="hs-label">Toplam Hata</div></div>
            <div class="history-stat"><div class="hs-value" style="color:var(--warning)">${worst.name}</div><div class="hs-label">En Çok Hata</div></div>`;
    } else { summaryEl.innerHTML = ''; }

    const gridEl = document.getElementById('topics-grid');
    if (topicList.length === 0) {
        gridEl.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><p>Henüz konu kaydı yok</p><span>Kayıt oluştururken yanlış konuları ekleyin</span></div>`;
        return;
    }

    const maxCount = Math.max(...topicList.map(t => t.count));

    gridEl.innerHTML = topicList.map(t => {
        const pct = Math.round((t.count / maxCount) * 100);
        const color = getSubjectColorFromList(subjects, t.subject);
        const lastDate = t.lastDate ? new Date(t.lastDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';
        return `<div class="topic-card">
            <div class="tc-header">
                <span class="tc-name">${t.name}</span>
                <span class="tc-count">${t.count} hata</span>
            </div>
            <div class="tc-subject" style="color:${color}">${t.subject}</div>
            <div class="tc-bar"><div class="tc-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="tc-sessions">Son hata: ${lastDate} · ${t.sessionCount} denemede</div>
        </div>`;
    }).join('');
}
