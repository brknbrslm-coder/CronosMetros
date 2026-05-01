// ===== HISTORY PAGE =====
async function renderHistory() {
    let sessions = await loadSessions();
    const subjects = await loadSubjects();
    if (!sessions) sessions = [];

    // Filter
    const subjectFilter = document.getElementById('filter-subject').value;
    if (subjectFilter) sessions = sessions.filter(s => s.subject === subjectFilter);

    const search = document.getElementById('filter-search').value.toLowerCase();
    if (search) sessions = sessions.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.subject && s.subject.toLowerCase().includes(search)) ||
        (s.notes && s.notes.toLowerCase().includes(search))
    );

    // Sort
    const sort = document.getElementById('filter-sort').value;
    sessions.sort((a, b) => {
        switch (sort) {
            case 'date-asc': return new Date(a.date) - new Date(b.date);
            case 'date-desc': return new Date(b.date) - new Date(a.date);
            case 'net-desc': return (b.net || 0) - (a.net || 0);
            case 'net-asc': return (a.net || 0) - (b.net || 0);
            case 'duration-desc': return (b.duration || 0) - (a.duration || 0);
            case 'duration-asc': return (a.duration || 0) - (b.duration || 0);
            default: return new Date(b.date) - new Date(a.date);
        }
    });

    // Stats
    const statsEl = document.getElementById('history-stats');
    if (sessions.length > 0) {
        const totalTime = sessions.reduce((a, s) => a + (s.duration || 0), 0);
        const withNet = sessions.filter(s => s.net !== undefined && s.net !== null);
        const avgNet = withNet.length > 0 ? (withNet.reduce((a, s) => a + s.net, 0) / withNet.length).toFixed(2) : '-';
        statsEl.innerHTML = `
            <div class="history-stat"><div class="hs-value hs-accent">${sessions.length}</div><div class="hs-label">Kayıt</div></div>
            <div class="history-stat"><div class="hs-value hs-cyan">${formatDuration(totalTime)}</div><div class="hs-label">Toplam Süre</div></div>
            <div class="history-stat"><div class="hs-value hs-green">${avgNet}</div><div class="hs-label">Ort. Net</div></div>`;
    } else { statsEl.innerHTML = ''; }

    // List
    const listEl = document.getElementById('history-list');
    if (sessions.length === 0) {
        listEl.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Kayıt bulunamadı</p><span>Filtreleri değiştirmeyi deneyin</span></div>`;
        return;
    }

    listEl.innerHTML = sessions.map(s => {
        const netClass = s.net > 0 ? 'positive' : s.net < 0 ? 'negative' : '';
        const netText = s.net !== undefined && s.net !== null ? `Net: ${s.net.toFixed(2)}` : '';
        const dateStr = s.date ? new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const color = getSubjectColorFromList(subjects, s.subject);
        return `<div class="history-card" data-id="${s.id}">
            <div class="hc-left">
                <div class="hc-name">${s.name}</div>
                <div class="hc-meta">
                    ${s.subject ? `<span class="hc-subject" style="background:${color}22;color:${color};border:1px solid ${color}44">${s.subject}</span>` : ''}
                    <span>📅 ${dateStr}</span>
                    ${s.correct !== undefined ? `<span>✓${s.correct} ✕${s.wrong || 0} ○${s.blank || 0}</span>` : ''}
                </div>
            </div>
            <div class="hc-right">
                <div class="hc-duration">${formatDuration(s.duration || 0)}</div>
                ${netText ? `<div class="hc-net ${netClass}">${netText}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.history-card').forEach(card => {
        card.addEventListener('click', () => showSessionDetail(card.dataset.id, sessions, subjects));
    });
}

function showSessionDetail(id, sessions, subjects) {
    const s = sessions.find(x => x.id === id);
    if (!s) return;

    document.getElementById('detail-title').textContent = s.name;
    const dateStr = s.date ? new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const color = getSubjectColorFromList(subjects, s.subject);

    let html = `<div class="detail-grid">
        <div class="detail-item"><div class="di-label">Ders</div><div class="di-value" style="color:${color}">${s.subject || '-'}</div></div>
        <div class="detail-item"><div class="di-label">Tarih</div><div class="di-value">${dateStr}</div></div>
        <div class="detail-item"><div class="di-label">Süre</div><div class="di-value" style="color:var(--accent-secondary)">${formatDuration(s.duration || 0)}</div></div>
        <div class="detail-item"><div class="di-label">Net</div><div class="di-value" style="color:var(--accent-primary)">${s.net !== undefined && s.net !== null ? s.net.toFixed(2) : '-'}</div></div>`;

    if (s.total !== undefined && s.total !== null) {
        html += `<div class="detail-item"><div class="di-label">Toplam Soru</div><div class="di-value">${s.total}</div></div>
        <div class="detail-item"><div class="di-label">Doğru</div><div class="di-value" style="color:var(--success)">${s.correct || 0}</div></div>
        <div class="detail-item"><div class="di-label">Yanlış</div><div class="di-value" style="color:var(--danger)">${s.wrong || 0}</div></div>
        <div class="detail-item"><div class="di-label">Boş</div><div class="di-value">${s.blank || 0}</div></div>`;
    }

    if (s.wrongTopics && s.wrongTopics.length > 0) {
        html += `<div class="detail-item full-width"><div class="di-label">Yanlış Konular</div>
            <div class="detail-topics">${s.wrongTopics.map(t => `<span class="tag">${t}</span>`).join('')}</div></div>`;
    }
    if (s.notes) {
        html += `<div class="detail-item full-width"><div class="di-label">Notlar</div><div class="di-value" style="font-size:0.9rem;font-weight:400;line-height:1.6">${s.notes}</div></div>`;
    }
    html += '</div>';

    document.getElementById('detail-body').innerHTML = html;
    document.getElementById('modal-detail').classList.remove('hidden');

    document.getElementById('detail-delete').onclick = async () => {
        if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteSession(id);
            document.getElementById('modal-detail').classList.add('hidden');
            await renderHistory();
            showToast('Kayıt silindi', 'success');
        }
    };
}
