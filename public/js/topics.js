// ===== TOPICS PAGE =====
async function renderTopics() {
    let topicList = await loadTopicStats();
    const subjects = await loadSubjects();
    if (!topicList) topicList = [];

    const subjectFilter = document.getElementById('topics-subject-filter')?.value || '';
    if (subjectFilter) topicList = topicList.filter(t => t.subject === subjectFilter);

    const stateFilter = document.getElementById('topics-filter-state')?.value || 'all';
    if (stateFilter === 'active') topicList = topicList.filter(t => !t.resolved);
    else if (stateFilter === 'resolved') topicList = topicList.filter(t => t.resolved);

    const sortBy = document.getElementById('topics-sort')?.value || 'count-desc';
    topicList.sort((a, b) => {
        switch (sortBy) {
            case 'count-asc': return a.count - b.count;
            case 'name-asc': return a.name.localeCompare(b.name, 'tr');
            default: return b.count - a.count;
        }
    });

    const summaryEl = document.getElementById('topics-summary');
    const active = topicList.filter(t => !t.resolved);
    const resolved = topicList.filter(t => t.resolved);
    const reWarning = topicList.filter(t => t.resolved && t.resolvedAgain);

    if (topicList.length > 0) {
        const totalErrors = topicList.reduce((a, t) => a + t.count, 0);
        summaryEl.innerHTML = `
            <div class="history-stat"><div class="hs-value hs-accent">${active.length}</div><div class="hs-label">Aktif Sorunlu</div></div>
            <div class="history-stat"><div class="hs-value" style="color:var(--success)">${resolved.length}</div><div class="hs-label">Halletti</div></div>
            <div class="history-stat"><div class="hs-value" style="color:var(--danger)">${totalErrors}</div><div class="hs-label">Toplam Hata</div></div>
            ${reWarning.length > 0 ? `<div class="history-stat"><div class="hs-value" style="color:var(--warning)">⚠ ${reWarning.length}</div><div class="hs-label">Tekrar Hata</div></div>` : ''}`;
    } else { summaryEl.innerHTML = ''; }

    const gridEl = document.getElementById('topics-grid');
    if (topicList.length === 0) {
        gridEl.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><p>Konu kaydı yok</p><span>Kayıt oluştururken yanlış konuları ekleyin</span></div>`;
        return;
    }

    const activeTopics = topicList.filter(t => !t.resolved);
    const resolvedTopics = topicList.filter(t => t.resolved);
    const maxCount = Math.max(...topicList.map(t => t.count), 1);

    function renderTopicCard(t) {
        const pct = Math.round((t.count / maxCount) * 100);
        const color = getSubjectColorFromList(subjects, t.subject);
        const lastDate = t.lastDate ? new Date(t.lastDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';
        const isWarning = t.resolved && t.resolvedAgain;
        const resolvedClass = t.resolved ? 'topic-card--resolved' : '';
        const warningBadge = isWarning ? `<span class="topic-warning-badge" title="Hallettim dedikten sonra tekrar hata yaptın">⚠ Tekrar hata</span>` : '';
        const resolvedBadge = t.resolved ? `<span class="topic-resolved-badge">✓ Halletti</span>` : '';

        return `<div class="topic-card ${resolvedClass}" data-topic="${encodeURIComponent(t.name)}" data-subject="${encodeURIComponent(t.subject || '')}">
            <div class="tc-header">
                <span class="tc-name">${t.name}</span>
                <span class="tc-count">${t.count} hata</span>
            </div>
            <div class="tc-subject" style="color:${color}">${t.subject || ''}</div>
            ${warningBadge}${resolvedBadge}
            <div class="tc-bar"><div class="tc-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="tc-footer">
                <span class="tc-sessions">Son hata: ${lastDate} · ${t.sessionCount} denemede</span>
                <button class="btn-topic-resolve ${t.resolved ? 'btn-topic-unresolve' : ''}" 
                    data-topic="${encodeURIComponent(t.name)}" 
                    data-subject="${encodeURIComponent(t.subject || '')}"
                    data-resolved="${t.resolved ? '1' : '0'}"
                    title="${t.resolved ? 'Hallettim işaretini kaldır' : 'Hallettim olarak işaretle'}">
                    ${t.resolved ? '↩ Geri Al' : '✓ Hallettim'}
                </button>
            </div>
        </div>`;
    }

    let html = '';
    if (activeTopics.length > 0 && stateFilter !== 'resolved') {
        html += activeTopics.map(renderTopicCard).join('');
    }
    if (resolvedTopics.length > 0 && stateFilter !== 'active') {
        if (activeTopics.length > 0 && stateFilter === 'all') {
            html += `<div class="topics-section-header">✓ Halledilenler (${resolvedTopics.length})</div>`;
        }
        html += resolvedTopics.map(renderTopicCard).join('');
    }

    gridEl.innerHTML = html;

    // Hallettim butonları
    gridEl.querySelectorAll('.btn-topic-resolve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const topicName = decodeURIComponent(btn.dataset.topic);
            const subject = decodeURIComponent(btn.dataset.subject);
            const isResolved = btn.dataset.resolved === '1';
            if (isResolved) {
                await unresolveTopic(topicName, subject);
                showToast('İşaret kaldırıldı', 'info');
            } else {
                await resolveTopic(topicName, subject);
                showToast('✓ Halletti olarak işaretlendi', 'success');
            }
            renderTopics();
        });
    });
}
