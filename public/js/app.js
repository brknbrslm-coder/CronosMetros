// ===== MAIN APP =====
document.addEventListener('DOMContentLoaded', () => {
    // Auth kontrolü
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    const user = getUser();

    // Kullanıcı adını sidebar'da göster
    const userEl = document.getElementById('sidebar-user');
    if (userEl && user) {
        userEl.textContent = user.username;
    }

    // Navigation
    const navBtns = document.querySelectorAll('.nav-btn[data-page]');
    const pages = document.querySelectorAll('.page');

    function navigateTo(pageId) {
        pages.forEach(p => p.classList.remove('active'));
        navBtns.forEach(b => b.classList.remove('active'));
        const page = document.getElementById('page-' + pageId);
        const btn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (page) page.classList.add('active');
        if (btn) btn.classList.add('active');

        if (pageId === 'history') renderHistory();
        if (pageId === 'analysis') renderAnalysis();
        if (pageId === 'topics') renderTopics();

        document.getElementById('sidebar').classList.remove('open');
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    // Mobile menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Timer controls
    document.getElementById('btn-start').addEventListener('click', startTimer);
    document.getElementById('btn-pause').addEventListener('click', pauseTimer);
    document.getElementById('btn-resume').addEventListener('click', resumeTimer);
    document.getElementById('btn-stop').addEventListener('click', stopTimer);
    document.getElementById('btn-reset').addEventListener('click', resetTimer);

    // Save button -> open modal
    document.getElementById('btn-save-time').addEventListener('click', async () => {
        document.getElementById('saved-duration').textContent = formatDuration(timerState.elapsed);
        document.getElementById('session-date').value = new Date().toISOString().slice(0, 10);
        document.getElementById('session-name').value = '';
        document.getElementById('session-subject').value = '';
        document.getElementById('session-total').value = '';
        document.getElementById('session-correct').value = '';
        document.getElementById('session-wrong').value = '';
        document.getElementById('session-blank').textContent = '0';
        document.getElementById('session-net').textContent = '0.00';
        document.getElementById('session-notes').value = '';
        document.getElementById('wrong-topics-list').innerHTML = '';
        currentWrongTopics = [];
        await populateSubjectFilters();
        await populateTopicSuggestions();
        document.getElementById('modal-save').classList.remove('hidden');
    });

    // Auto-calculate blank and net
    function recalcScores() {
        const total = parseInt(document.getElementById('session-total').value) || 0;
        const correct = parseInt(document.getElementById('session-correct').value) || 0;
        const wrong = parseInt(document.getElementById('session-wrong').value) || 0;
        const blank = Math.max(0, total - correct - wrong);
        const net = correct - (wrong * 0.25);
        document.getElementById('session-blank').textContent = blank;
        document.getElementById('session-net').textContent = net.toFixed(2);
    }

    document.getElementById('session-total').addEventListener('input', recalcScores);
    document.getElementById('session-correct').addEventListener('input', recalcScores);
    document.getElementById('session-wrong').addEventListener('input', recalcScores);

    // Wrong topics tag input
    let currentWrongTopics = [];

    document.getElementById('wrong-topic-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !currentWrongTopics.includes(val)) {
                currentWrongTopics.push(val);
                renderWrongTopicTags();
            }
            e.target.value = '';
        }
    });

    function renderWrongTopicTags() {
        const container = document.getElementById('wrong-topics-list');
        container.innerHTML = currentWrongTopics.map((t, i) =>
            `<span class="tag">${t}<button class="tag-remove" data-idx="${i}">&times;</button></span>`
        ).join('');
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                currentWrongTopics.splice(parseInt(btn.dataset.idx), 1);
                renderWrongTopicTags();
            });
        });
    }

    // Save modal close/cancel
    document.getElementById('modal-save-close').addEventListener('click', () => {
        document.getElementById('modal-save').classList.add('hidden');
    });
    document.getElementById('modal-save-cancel').addEventListener('click', () => {
        document.getElementById('modal-save').classList.add('hidden');
    });

    // Save confirm
    document.getElementById('modal-save-confirm').addEventListener('click', async () => {
        const name = document.getElementById('session-name').value.trim();
        const subject = document.getElementById('session-subject').value.trim();
        if (!name) { showToast('Kayıt adı gerekli!', 'error'); return; }
        if (!subject) { showToast('Ders seçimi gerekli!', 'error'); return; }

        const total = parseInt(document.getElementById('session-total').value) || undefined;
        const correct = parseInt(document.getElementById('session-correct').value) || 0;
        const wrong = parseInt(document.getElementById('session-wrong').value) || 0;
        const blank = total !== undefined ? Math.max(0, total - correct - wrong) : undefined;
        const net = total !== undefined ? correct - (wrong * 0.25) : undefined;

        const session = {
            name, subject,
            date: document.getElementById('session-date').value || new Date().toISOString().slice(0, 10),
            duration: timerState.elapsed,
            total, correct, wrong, blank, net,
            wrongTopics: [...currentWrongTopics],
            notes: document.getElementById('session-notes').value.trim()
        };

        const result = await addSession(session);
        if (result) {
            document.getElementById('modal-save').classList.add('hidden');
            resetTimer();
            invalidateSubjectCache();
            await populateSubjectFilters();
            showToast('Kayıt başarıyla oluşturuldu!', 'success');
        }
    });

    // Detail modal close
    document.getElementById('modal-detail-close').addEventListener('click', () => {
        document.getElementById('modal-detail').classList.add('hidden');
    });
    document.getElementById('detail-close-btn').addEventListener('click', () => {
        document.getElementById('modal-detail').classList.add('hidden');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    // Filters
    document.getElementById('filter-subject').addEventListener('change', renderHistory);
    document.getElementById('filter-sort').addEventListener('change', renderHistory);
    document.getElementById('filter-search').addEventListener('input', renderHistory);
    document.getElementById('analysis-subject').addEventListener('change', renderAnalysis);
    document.getElementById('analysis-period').addEventListener('change', renderAnalysis);
    document.getElementById('topics-subject-filter').addEventListener('change', renderTopics);
    document.getElementById('topics-sort').addEventListener('change', renderTopics);

    // Export
    document.getElementById('btn-export-data').addEventListener('click', async () => {
        await exportData();
        showToast('Veriler dışa aktarıldı', 'success');
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            logout();
        }
    });

    // Init
    populateSubjectFilters();
    updateDisplay();
    showToast(`Hoş geldin, ${user ? user.username : ''}! 👋`, 'info');
});
