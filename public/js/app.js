// ===== MAIN APP =====
document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

    const user = getUser();
    const userEl = document.getElementById('sidebar-user');
    if (userEl && user) userEl.textContent = user.username;

    // Net katsayısını yükle
    await getNetCoefficient();

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
        if (pageId === 'settings') renderSettingsPage();
        document.getElementById('sidebar').classList.remove('open');
    }

    navBtns.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.page)));

    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) mobileBtn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Timer controls
    document.getElementById('btn-start')?.addEventListener('click', startTimer);
    document.getElementById('btn-pause')?.addEventListener('click', pauseTimer);
    document.getElementById('btn-resume')?.addEventListener('click', resumeTimer);
    document.getElementById('btn-stop')?.addEventListener('click', stopTimer);
    document.getElementById('btn-reset')?.addEventListener('click', resetTimer);

    // ===== KAYIT MODAL =====
    let currentWrongTopics = [];
    let currentExamSubjects = [];
    let editingSessionId = null;

    // Modal açma yardımcısı
    async function openSaveModal(prefillDuration, sessionToEdit = null) {
        editingSessionId = sessionToEdit ? sessionToEdit.id : null;
        currentWrongTopics = sessionToEdit ? [...(sessionToEdit.wrongTopics || [])] : [];
        currentExamSubjects = sessionToEdit ? [...(sessionToEdit.examSubjects || [])] : [];

        // Tarih
        const dateEl = document.getElementById('session-date');
        if (dateEl) dateEl.value = sessionToEdit ? sessionToEdit.date : new Date().toISOString().slice(0, 10);

        // Kayıt adı
        const nameEl = document.getElementById('session-name');
        if (nameEl) nameEl.value = sessionToEdit ? sessionToEdit.name : '';

        // Notlar
        const notesEl = document.getElementById('session-notes');
        if (notesEl) notesEl.value = sessionToEdit ? (sessionToEdit.notes || '') : '';

        // Süre
        fillDurationInputs(sessionToEdit ? sessionToEdit.duration : (prefillDuration || 0));

        // Session type
        const typeEl = document.getElementById('session-type');
        if (typeEl) typeEl.value = sessionToEdit ? (sessionToEdit.sessionType || 'study') : 'study';

        // Şablonları yükle
        await loadTemplatesIntoSelect();

        // Tipi ayarla ve formu güncelle
        handleSessionTypeChange();

        // Eğer düzenleme ise mevcut verileri doldur
        if (sessionToEdit) {
            const subjectEl = document.getElementById('session-subject');
            if (subjectEl && sessionToEdit.subject) subjectEl.value = sessionToEdit.subject;

            // Branş denemesinde dropdown'a da ata
            if (sessionToEdit.sessionType === 'exam_branch') {
                const branchSel = document.getElementById('branch-subject-select');
                if (branchSel && sessionToEdit.subject) branchSel.value = sessionToEdit.subject;
                updateTopicSuggestionsFromBranch();
            }

            if (sessionToEdit.sessionType !== 'exam_general') {
                const totalEl = document.getElementById('session-total');
                const correctEl = document.getElementById('session-correct');
                const wrongEl = document.getElementById('session-wrong');
                if (totalEl) totalEl.value = sessionToEdit.total || '';
                if (correctEl) correctEl.value = sessionToEdit.correct || '';
                if (wrongEl) wrongEl.value = sessionToEdit.wrong || '';
                recalcScores();
            } else {
                renderExamSubjectsTable();
            }
        }

        renderWrongTopicTags();
        document.getElementById('modal-save').classList.remove('hidden');
    }

    // Kayıt butonu (zamanlayıcıdan)
    document.getElementById('btn-save-time')?.addEventListener('click', () => openSaveModal(timerState.elapsed));

    // Hızlı kayıt (zamanlayıcısız)
    document.getElementById('btn-quick-save')?.addEventListener('click', () => openSaveModal(0));

    // Session type değişince form güncelle
    document.getElementById('session-type')?.addEventListener('change', handleSessionTypeChange);

    // Branş seçilince konu önerileri güncelle
    document.getElementById('branch-subject-select')?.addEventListener('change', updateTopicSuggestionsFromBranch);

    function handleSessionTypeChange() {
        const type = document.getElementById('session-type')?.value || 'study';
        const singleSubjectSection = document.getElementById('single-subject-section');
        const examSection = document.getElementById('exam-section');
        const scoreSection = document.getElementById('score-section');
        const wrongTopicsSection = document.getElementById('wrong-topics-section');
        const studySubjectGroup = document.getElementById('study-subject-group');
        const branchSubjectGroup = document.getElementById('branch-subject-group');

        if (type === 'exam_general') {
            singleSubjectSection?.classList.add('hidden');
            examSection?.classList.remove('hidden');
            scoreSection?.classList.add('hidden');
            wrongTopicsSection?.classList.add('hidden');
            if (currentExamSubjects.length === 0) renderExamSubjectsTable();
        } else {
            singleSubjectSection?.classList.remove('hidden');
            examSection?.classList.add('hidden');
            scoreSection?.classList.remove('hidden');
            wrongTopicsSection?.classList.remove('hidden');

            if (type === 'exam_branch') {
                studySubjectGroup?.classList.add('hidden');
                branchSubjectGroup?.classList.remove('hidden');
                // Branch subject değişince konu önerilerini güncelle
                updateTopicSuggestionsFromBranch();
            } else {
                studySubjectGroup?.classList.remove('hidden');
                branchSubjectGroup?.classList.add('hidden');
                populateSubjectInput();
            }
        }
    }

    // Ders autocomplete (study modu)
    async function populateSubjectInput() {
        const subjects = await loadSubjects();
        const datalist = document.getElementById('subject-datalist');
        if (datalist) {
            datalist.innerHTML = subjects.map(s => `<option value="${s.name}">`).join('');
        }
        // Konu önerilerini wire et
        const subjectEl = document.getElementById('session-subject');
        if (subjectEl && !subjectEl._topicWired) {
            subjectEl.addEventListener('change', updateTopicSuggestions);
            subjectEl.addEventListener('input', updateTopicSuggestions);
            subjectEl._topicWired = true;
        }
        updateTopicSuggestions();
    }

    // Branch select değişince konu önerilerini güncelle
    function updateTopicSuggestionsFromBranch() {
        const subject = document.getElementById('branch-subject-select')?.value || '';
        fillTopicDatalist(subject);
    }

    // Seçili derse göre topic-datalist'i doldur
    function fillTopicDatalist(subject) {
        const suggestions = typeof getTopicSuggestions === 'function' ? getTopicSuggestions(subject) : [];
        const datalist = document.getElementById('topic-datalist');
        if (datalist) {
            datalist.innerHTML = suggestions.map(t => `<option value="${t}">`).join('');
        }
    }

    function updateTopicSuggestions() {
        const subject = document.getElementById('session-subject')?.value || '';
        fillTopicDatalist(subject);
    }

    // Şablon seçimini yükleti — türe göre filtreli
    async function loadTemplatesIntoSelect() {
        const type = document.getElementById('session-type')?.value || 'study';
        const templates = await loadTemplates();
        const sel = document.getElementById('template-select');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Şablon Seç veya Manuel --</option>';
        // Genel deneme için sadece exam_general şablonları göster
        const filtered = templates.filter(t => t.sessionType === 'exam_general');
        filtered.forEach(t => {
            sel.innerHTML += `<option value="${t.id}" data-builtin="${t.isBuiltin}">${t.isBuiltin ? '⭐ ' : ''}${t.name}</option>`;
        });
        sel._templates = templates;
    }

    // Şablon seçilince satırları doldur
    document.getElementById('template-select')?.addEventListener('change', async function() {
        const sel = this;
        const tid = sel.value;
        if (!tid) return;
        const templates = sel._templates || await loadTemplates();
        const tmpl = templates.find(t => t.id === tid);
        if (!tmpl) return;
        currentExamSubjects = tmpl.subjects.map(s => ({
            subject: s.name, category: s.category || '',
            total: s.defaultTotal || '', correct: '', wrong: '', blank: '', net: ''
        }));
        renderExamSubjectsTable();
    });

    // Ders satırı ekle butonu
    document.getElementById('btn-add-exam-row')?.addEventListener('click', () => {
        currentExamSubjects.push({ subject: '', category: '', total: '', correct: '', wrong: '', blank: '', net: '' });
        renderExamSubjectsTable();
    });

    // Net hesaplama
    function recalcScores() {
        const total = parseInt(document.getElementById('session-total')?.value) || 0;
        const correct = parseInt(document.getElementById('session-correct')?.value) || 0;
        const wrong = parseInt(document.getElementById('session-wrong')?.value) || 0;
        const blank = Math.max(0, total - correct - wrong);
        const net = calcNet(correct, wrong);
        const blankEl = document.getElementById('session-blank');
        const netEl = document.getElementById('session-net');
        if (blankEl) blankEl.textContent = blank;
        if (netEl) netEl.textContent = net.toFixed(2);
    }

    document.getElementById('session-total')?.addEventListener('input', recalcScores);
    document.getElementById('session-correct')?.addEventListener('input', recalcScores);
    document.getElementById('session-wrong')?.addEventListener('input', recalcScores);

    // Exam subjects tablosu
    function renderExamSubjectsTable() {
        const tbody = document.getElementById('exam-subjects-tbody');
        if (!tbody) return;
        const subjects = typeof YKS_CURRICULUM !== 'undefined'
            ? [...YKS_CURRICULUM.tytSubjects, ...YKS_CURRICULUM.aytSubjects]
            : [];
        const datalistOpts = subjects.map(s => `<option value="${s}">`).join('');

        tbody.innerHTML = currentExamSubjects.map((row, i) => {
            const net = (parseFloat(row.correct) || 0) - ((parseFloat(row.wrong) || 0) * (_netCoefficient || 0.25));
            return `<tr data-idx="${i}">
                <td><input type="text" class="exam-subject-input" list="exam-subject-datalist-${i}" value="${row.subject}" placeholder="Ders" data-field="subject" data-idx="${i}">
                <datalist id="exam-subject-datalist-${i}">${datalistOpts}</datalist></td>
                <td><input type="number" class="exam-num-input" value="${row.total}" min="0" placeholder="-" data-field="total" data-idx="${i}"></td>
                <td><input type="number" class="exam-num-input" value="${row.correct}" min="0" placeholder="0" data-field="correct" data-idx="${i}"></td>
                <td><input type="number" class="exam-num-input" value="${row.wrong}" min="0" placeholder="0" data-field="wrong" data-idx="${i}"></td>
                <td class="exam-blank">${row.total ? Math.max(0, (parseInt(row.total)||0)-(parseInt(row.correct)||0)-(parseInt(row.wrong)||0)) : '-'}</td>
                <td class="exam-net ${net > 0 ? 'positive' : net < 0 ? 'negative' : ''}">${(parseInt(row.correct) || parseInt(row.wrong)) ? net.toFixed(2) : '-'}</td>
                <td><button class="btn-remove-exam-row" data-idx="${i}" title="Sil">×</button></td>
            </tr>`;
        }).join('');

        // Event delegation
        tbody.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', function() {
                const idx = parseInt(this.dataset.idx);
                const field = this.dataset.field;
                currentExamSubjects[idx][field] = this.value;
                if (field === 'correct' || field === 'wrong' || field === 'total') {
                    // Satırı güncelle
                    const row = currentExamSubjects[idx];
                    const net = (parseFloat(row.correct) || 0) - ((parseFloat(row.wrong) || 0) * (_netCoefficient || 0.25));
                    const tr = tbody.querySelector(`tr[data-idx="${idx}"]`);
                    if (tr) {
                        const blankTd = tr.querySelector('.exam-blank');
                        const netTd = tr.querySelector('.exam-net');
                        if (blankTd && row.total) blankTd.textContent = Math.max(0, (parseInt(row.total)||0)-(parseInt(row.correct)||0)-(parseInt(row.wrong)||0));
                        if (netTd) { netTd.textContent = (parseInt(row.correct)||parseInt(row.wrong)) ? net.toFixed(2) : '-'; }
                    }
                }
                if (field === 'subject') {
                    // Kategoriyi otomatik belirle
                    currentExamSubjects[idx].category = getSubjectCategory ? (getSubjectCategory(this.value) || '') : '';
                }
            });
        });

        tbody.querySelectorAll('.btn-remove-exam-row').forEach(btn => {
            btn.addEventListener('click', function() {
                currentExamSubjects.splice(parseInt(this.dataset.idx), 1);
                renderExamSubjectsTable();
            });
        });
    }

    // Yanlış konu tag
    document.getElementById('wrong-topic-input')?.addEventListener('keydown', (e) => {
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
        if (!container) return;
        container.innerHTML = currentWrongTopics.map((t, i) =>
            `<span class="tag">${t}<button class="tag-remove" data-idx="${i}">×</button></span>`
        ).join('');
        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                currentWrongTopics.splice(parseInt(btn.dataset.idx), 1);
                renderWrongTopicTags();
            });
        });
    }

    // Modal kapat
    document.getElementById('modal-save-close')?.addEventListener('click', () => document.getElementById('modal-save').classList.add('hidden'));
    document.getElementById('modal-save-cancel')?.addEventListener('click', () => document.getElementById('modal-save').classList.add('hidden'));

    // Kaydet / Güncelle
    document.getElementById('modal-save-confirm')?.addEventListener('click', async () => {
        const name = document.getElementById('session-name')?.value.trim();
        if (!name) { showToast('Kayıt adı gerekli!', 'error'); return; }

        const type = document.getElementById('session-type')?.value || 'study';
        // Branş denemesinde subject branch-select'ten gelir
        let subject;
        if (type === 'exam_branch') {
            subject = document.getElementById('branch-subject-select')?.value;
        } else {
            subject = document.getElementById('session-subject')?.value.trim();
        }
        if (type !== 'exam_general' && !subject) { showToast('Ders seçimi gerekli!', 'error'); return; }

        const duration = getDurationFromInputs();
        const date = document.getElementById('session-date')?.value || new Date().toISOString().slice(0, 10);
        const notes = document.getElementById('session-notes')?.value.trim();

        let sessionData;

        if (type === 'exam_general') {
            const filled = currentExamSubjects.filter(r => r.subject.trim());
            if (filled.length === 0) { showToast('En az bir ders satırı gerekli!', 'error'); return; }
            const enriched = filled.map(r => ({
                ...r,
                blank: r.total ? Math.max(0, (parseInt(r.total)||0)-(parseInt(r.correct)||0)-(parseInt(r.wrong)||0)) : null,
                net: calcNet(parseInt(r.correct)||0, parseInt(r.wrong)||0),
            }));
            const templateId = document.getElementById('template-select')?.value || null;
            sessionData = { name, sessionType: type, templateId, date, duration, notes, examSubjects: enriched, netCoefficient: _netCoefficient };
        } else {
            const total = parseInt(document.getElementById('session-total')?.value) || undefined;
            const correct = parseInt(document.getElementById('session-correct')?.value) || 0;
            const wrong = parseInt(document.getElementById('session-wrong')?.value) || 0;
            const blank = total !== undefined ? Math.max(0, total - correct - wrong) : undefined;
            const net = (total !== undefined || correct || wrong) ? calcNet(correct, wrong) : undefined;
            sessionData = { name, subject, sessionType: type, date, duration, total, correct, wrong, blank, net, notes, wrongTopics: [...currentWrongTopics], netCoefficient: _netCoefficient };
        }

        let result;
        if (editingSessionId) {
            result = await updateSession(editingSessionId, sessionData);
        } else {
            result = await addSession(sessionData);
        }

        if (result) {
            document.getElementById('modal-save').classList.add('hidden');
            if (!editingSessionId) resetTimer();
            invalidateSubjectCache();
            await populateSubjectFilters();
            const msg = editingSessionId ? 'Kayıt güncellendi!' : 'Kayıt oluşturuldu!';
            showToast(msg, 'success');
            editingSessionId = null;
            if (document.getElementById('page-history')?.classList.contains('active')) renderHistory();
        }
    });

    // ===== DETAY MODAL =====
    document.getElementById('modal-detail-close')?.addEventListener('click', () => document.getElementById('modal-detail').classList.add('hidden'));
    document.getElementById('detail-close-btn')?.addEventListener('click', () => document.getElementById('modal-detail').classList.add('hidden'));

    // Overlay tıklamayla kapat
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    // Detay modalında "Düzenle" butonu
    document.getElementById('detail-edit-btn')?.addEventListener('click', async () => {
        const s = window._currentDetailSession;
        if (!s) { showToast('Oturum verisi bulunamadı, lütfen sayfayı yenileyin.', 'error'); return; }
        document.getElementById('modal-detail').classList.add('hidden');
        await openSaveModal(s.duration, s);
    });

    // ===== FİLTRELER =====
    document.getElementById('filter-subject')?.addEventListener('change', renderHistory);
    document.getElementById('filter-sort')?.addEventListener('change', renderHistory);
    document.getElementById('filter-search')?.addEventListener('input', renderHistory);
    document.getElementById('analysis-subject')?.addEventListener('change', renderAnalysis);
    document.getElementById('analysis-period')?.addEventListener('change', renderAnalysis);
    document.getElementById('topics-subject-filter')?.addEventListener('change', renderTopics);
    document.getElementById('topics-sort')?.addEventListener('change', renderTopics);
    document.getElementById('topics-filter-state')?.addEventListener('change', renderTopics);

    // ===== EXPORT =====
    document.getElementById('btn-export-data')?.addEventListener('click', async () => {
        await exportData();
        showToast('Veriler dışa aktarıldı', 'success');
    });

    // ===== LOGOUT =====
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) logout();
    });

    // ===== INIT =====
    await populateSubjectFilters();
    updateDisplay();
    updateTimerButtons('idle');
    initSettingsListeners();
    showToast(`Hoş geldin, ${user ? user.username : ''}! 👋`, 'info');
});
