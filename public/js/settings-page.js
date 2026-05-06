// ===== SETTINGS PAGE =====
async function renderSettingsPage() {
    const settings = await loadSettings();
    const subjects = await loadSubjects();
    const templates = await loadTemplates();

    // Net katsayısı
    const coefEl = document.getElementById('settings-net-coef');
    if (coefEl) coefEl.value = settings.netCoefficient || 0.25;

    const coefPreset = document.getElementById('settings-coef-preset');
    if (coefPreset) {
        const c = parseFloat(settings.netCoefficient || 0.25);
        if (c === 0.25) coefPreset.value = '0.25';
        else if (Math.abs(c - 1/3) < 0.001) coefPreset.value = '0.333';
        else coefPreset.value = 'custom';
    }

    // Günlük hedef
    const goalEl = document.getElementById('settings-daily-goal');
    if (goalEl) goalEl.value = settings.dailyGoalMinutes || 120;

    // Ders listesi
    renderSubjectList(subjects);

    // Şablon listesi
    renderTemplateList(templates);
}

function renderSubjectList(subjects) {
    const container = document.getElementById('settings-subjects-list');
    if (!container) return;
    if (subjects.length === 0) {
        container.innerHTML = '<p class="settings-empty">Henüz ders kaydı yok.</p>';
        return;
    }
    container.innerHTML = subjects.map(s => `
        <div class="settings-subject-row" data-name="${encodeURIComponent(s.name)}">
            <div class="ssj-color" style="background:${s.color}" data-name="${encodeURIComponent(s.name)}"></div>
            <span class="ssj-name">${s.name}</span>
            <input type="text" class="ssj-rename-input hidden" value="${s.name}" placeholder="Yeni isim">
            <div class="ssj-actions">
                <button class="btn-ssj-rename" data-name="${encodeURIComponent(s.name)}" title="Yeniden Adlandır">✏</button>
                <button class="btn-ssj-delete" data-name="${encodeURIComponent(s.name)}" title="Sil">🗑</button>
            </div>
        </div>
    `).join('');

    // Renk tıklama
    container.querySelectorAll('.ssj-color').forEach(el => {
        el.style.cursor = 'pointer';
        el.title = 'Renk değiştir';
        el.addEventListener('click', () => {
            const name = decodeURIComponent(el.dataset.name);
            const picker = document.createElement('input');
            picker.type = 'color';
            picker.value = el.style.background;
            picker.style.position = 'fixed';
            picker.style.opacity = 0;
            document.body.appendChild(picker);
            picker.click();
            picker.addEventListener('change', async () => {
                await updateSubjectColor(name, picker.value);
                invalidateSubjectCache();
                showToast('Renk güncellendi', 'success');
                picker.remove();
                const subs = await loadSubjects();
                renderSubjectList(subs);
            });
            picker.addEventListener('blur', () => picker.remove());
        });
    });

    // Yeniden adlandırma
    container.querySelectorAll('.btn-ssj-rename').forEach(btn => {
        btn.addEventListener('click', async () => {
            const name = decodeURIComponent(btn.dataset.name);
            const row = btn.closest('.settings-subject-row');
            const nameSpan = row.querySelector('.ssj-name');
            const input = row.querySelector('.ssj-rename-input');
            if (input.classList.contains('hidden')) {
                input.classList.remove('hidden');
                nameSpan.classList.add('hidden');
                btn.textContent = '✓';
                input.focus();
                input.select();
            } else {
                const newName = input.value.trim();
                if (newName && newName !== name) {
                    const result = await renameSubject(name, newName);
                    if (result) {
                        invalidateSubjectCache();
                        showToast('Ders adı güncellendi', 'success');
                        await populateSubjectFilters();
                        const subs = await loadSubjects();
                        renderSubjectList(subs);
                    }
                } else {
                    input.classList.add('hidden');
                    nameSpan.classList.remove('hidden');
                    btn.textContent = '✏';
                }
            }
        });
    });

    // Silme
    container.querySelectorAll('.btn-ssj-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const name = decodeURIComponent(btn.dataset.name);
            if (!confirm(`"${name}" dersini silmek istediğinize emin misiniz?\nBu işlem sadece ders tanımını siler, kayıtlarınız silinmez.`)) return;
            await deleteSubject(name);
            invalidateSubjectCache();
            showToast('Ders silindi', 'info');
            const subs = await loadSubjects();
            renderSubjectList(subs);
        });
    });
}

function renderTemplateList(templates) {
    const container = document.getElementById('settings-templates-list');
    if (!container) return;
    const custom = templates.filter(t => !t.isBuiltin);
    const builtin = templates.filter(t => t.isBuiltin);

    let html = '<div class="settings-template-section"><h4>⭐ Yerleşik Şablonlar</h4>';
    html += builtin.map(t => `
        <div class="settings-template-row">
            <span class="str-name">${t.name}</span>
            <span class="str-count">${t.subjects.length} ders</span>
        </div>
    `).join('');
    html += '</div>';

    if (custom.length > 0) {
        html += '<div class="settings-template-section"><h4>👤 Özel Şablonlarım</h4>';
        html += custom.map(t => `
            <div class="settings-template-row">
                <span class="str-name">${t.name}</span>
                <span class="str-count">${t.subjects.length} ders</span>
                <button class="btn-str-delete" data-id="${t.id}" title="Şablonu sil">🗑</button>
            </div>
        `).join('');
        html += '</div>';
    } else {
        html += '<div class="settings-template-section"><h4>👤 Özel Şablonlarım</h4><p class="settings-empty">Henüz özel şablon yok.</p></div>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.btn-str-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Bu şablonu silmek istiyor musunuz?')) return;
            await deleteTemplate(btn.dataset.id);
            showToast('Şablon silindi', 'info');
            const tmpl = await loadTemplates();
            renderTemplateList(tmpl);
        });
    });
}

// Settings event listeners (çağır: app.js init'te)
function initSettingsListeners() {
    // Net katsayısı preset
    document.getElementById('settings-coef-preset')?.addEventListener('change', function() {
        const custom = document.getElementById('settings-net-coef');
        if (this.value !== 'custom') {
            if (custom) custom.value = this.value;
        }
    });

    // Ayarları kaydet
    document.getElementById('btn-save-general-settings')?.addEventListener('click', async () => {
        const coef = parseFloat(document.getElementById('settings-net-coef')?.value);
        const goal = parseInt(document.getElementById('settings-daily-goal')?.value) || 120;
        if (isNaN(coef) || coef <= 0 || coef > 1) { showToast('Geçersiz net katsayısı (0-1 arası)', 'error'); return; }
        const result = await saveSettings({ netCoefficient: coef, dailyGoalMinutes: goal });
        if (result) {
            _netCoefficient = coef;
            showToast('Ayarlar kaydedildi', 'success');
        }
    });

    // Şifre değiştir
    document.getElementById('btn-change-password')?.addEventListener('click', async () => {
        const cur = document.getElementById('settings-current-pass')?.value;
        const newP = document.getElementById('settings-new-pass')?.value;
        const conf = document.getElementById('settings-confirm-pass')?.value;
        if (!cur || !newP) { showToast('Tüm alanları doldurun', 'error'); return; }
        if (newP !== conf) { showToast('Yeni şifreler eşleşmiyor', 'error'); return; }
        const result = await changePassword(cur, newP);
        if (result) {
            showToast('Şifre güncellendi', 'success');
            ['settings-current-pass','settings-new-pass','settings-confirm-pass'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
    });

    // Kullanıcı adı değiştir
    document.getElementById('btn-change-username')?.addEventListener('click', async () => {
        const newU = document.getElementById('settings-new-username')?.value.trim();
        if (!newU) { showToast('Yeni kullanıcı adı girin', 'error'); return; }
        const result = await changeUsername(newU);
        if (result) {
            const user = getUser();
            if (user) {
                user.username = result.newUsername;
                localStorage.setItem('cronos_user', JSON.stringify(user));
            }
            const userEl = document.getElementById('sidebar-user');
            if (userEl) userEl.textContent = result.newUsername;
            showToast('Kullanıcı adı güncellendi', 'success');
            document.getElementById('settings-new-username').value = '';
        }
    });

    // Güvenlik sorusu güncelle
    document.getElementById('btn-update-security-q')?.addEventListener('click', async () => {
        const q = document.getElementById('settings-security-q')?.value;
        const a = document.getElementById('settings-security-a')?.value.trim();
        if (!q || !a) { showToast('Soru ve cevap gerekli', 'error'); return; }
        const result = await updateSecurityQuestion(q, a);
        if (result) {
            showToast('Güvenlik sorusu güncellendi', 'success');
            document.getElementById('settings-security-a').value = '';
        }
    });

    // Güvenlik sorusu dropdown'ını doldur
    const sqSel = document.getElementById('settings-security-q');
    if (sqSel && typeof SECURITY_QUESTIONS !== 'undefined') {
        SECURITY_QUESTIONS.forEach(q => {
            sqSel.innerHTML += `<option value="${q}">${q}</option>`;
        });
    }

    // Dışa aktar
    document.getElementById('btn-export-settings')?.addEventListener('click', async () => {
        await exportData();
        showToast('Veriler dışa aktarıldı', 'success');
    });

    // Tüm veriyi sil
    document.getElementById('btn-delete-all-data')?.addEventListener('click', async () => {
        if (!confirm('TÜM kayıtlarınız, dersleriniz ve konu verileriniz silinecek. Geri alınamaz!\n\nDevam etmek istiyor musunuz?')) return;
        if (!confirm('Emin misiniz? Bu işlem geri alınamaz.')) return;
        showToast('Bu özellik yakında eklenecek', 'info');
    });
}

const SECURITY_QUESTIONS = [
    'İlk evcil hayvanınızın adı neydi?',
    'Annenizin kızlık soyadı nedir?',
    'İlk öğretmeninizin adı neydi?',
    'Doğduğunuz şehir neresidir?',
    'En sevdiğiniz film nedir?',
    'İlk gittiğiniz konser hangi sanatçıydı?',
    'Çocukluk döneminizdeki en iyi arkadaşınızın adı neydi?',
];
