// ===== ANALYSIS PAGE — Havuzlama Destekli =====
let chartInstances = {};

function destroyCharts() {
    Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
    chartInstances = {};
}

// Analiz filtre dropdown'ını doldur
async function populateAnalysisFilter() {
    const sel = document.getElementById('analysis-subject');
    if (!sel) return;
    const current = sel.value;

    sel.innerHTML = '<option value="">TÜMÜ</option>';

    // Havuzlanmış gruplar
    if (typeof YKS_CURRICULUM !== 'undefined') {
        const aliases = YKS_CURRICULUM.poolingAliases;
        sel.innerHTML += '<optgroup label="── TYT+AYT Havuzu ──">';
        Object.keys(aliases).forEach(alias => {
            sel.innerHTML += `<option value="pool:${alias}">${alias} (TYT+AYT)</option>`;
        });
        sel.innerHTML += '</optgroup>';

        sel.innerHTML += '<optgroup label="── Sadece TYT ──">';
        YKS_CURRICULUM.tytSubjects.forEach(s => {
            sel.innerHTML += `<option value="tyt:${s}">${s}</option>`;
        });
        sel.innerHTML += '</optgroup>';

        sel.innerHTML += '<optgroup label="── Sadece AYT ──">';
        YKS_CURRICULUM.aytSubjects.forEach(s => {
            sel.innerHTML += `<option value="ayt:${s}">${s}</option>`;
        });
        sel.innerHTML += '</optgroup>';
    }

    // Kullanıcının custom dersleri
    const subjects = await loadSubjects();
    const knownSubjects = typeof YKS_CURRICULUM !== 'undefined'
        ? [...YKS_CURRICULUM.tytSubjects, ...YKS_CURRICULUM.aytSubjects]
        : [];
    const customSubjects = subjects.filter(s => !knownSubjects.includes(s.name));
    if (customSubjects.length > 0) {
        sel.innerHTML += '<optgroup label="── Diğer Dersler ──">';
        customSubjects.forEach(s => {
            sel.innerHTML += `<option value="custom:${s.name}">${s.name}</option>`;
        });
        sel.innerHTML += '</optgroup>';
    }

    if (current) sel.value = current;
}

async function renderAnalysis() {
    await populateAnalysisFilter();

    // Tüm veriyi çek
    const [allSessions, pooledData, subjects] = await Promise.all([
        loadSessions(),
        loadPooledData(),
        loadSubjects()
    ]);

    const filterVal = document.getElementById('analysis-subject')?.value || '';
    const period = document.getElementById('analysis-period')?.value || 'all';

    // Dönem filtresi
    let cutoff = null;
    if (period !== 'all') {
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(period));
    }

    function withinPeriod(dateStr) {
        if (!cutoff) return true;
        return new Date(dateStr) >= cutoff;
    }

    // Filtreye göre veri toplama
    let filteredSessions = [];   // study + exam_branch kayıtları (tek net)
    let filteredExamRows = [];   // genel deneme satırları

    if (!filterVal) {
        // TÜMÜ — study/branch oturumları + genel denemenin TÜM satırları
        filteredSessions = (allSessions || []).filter(s => s.sessionType !== 'exam_general' && withinPeriod(s.date));
        filteredExamRows = (pooledData.examResults || []).filter(r => withinPeriod(r.date));
    } else {
        const [mode, value] = filterVal.split(':');

        if (mode === 'pool') {
            // TYT+AYT havuzu
            const alias = YKS_CURRICULUM.poolingAliases[value];
            if (!alias) return;
            const tytNames = Array.isArray(alias.tyt) ? alias.tyt : [alias.tyt];
            const aytNames = Array.isArray(alias.ayt) ? alias.ayt : [alias.ayt];
            const allNames = [...tytNames, ...aytNames];
            filteredSessions = (allSessions || []).filter(s => s.sessionType !== 'exam_general' && allNames.includes(s.subject) && withinPeriod(s.date));
            filteredExamRows = (pooledData.examResults || []).filter(r => allNames.includes(r.subject) && withinPeriod(r.date));

        } else if (mode === 'tyt') {
            // Sadece TYT
            filteredSessions = (allSessions || []).filter(s => s.sessionType !== 'exam_general' && s.subject === value && withinPeriod(s.date));
            filteredExamRows = (pooledData.examResults || []).filter(r => r.subject === value && withinPeriod(r.date));

        } else if (mode === 'ayt') {
            // Sadece AYT
            filteredSessions = (allSessions || []).filter(s => s.sessionType !== 'exam_general' && s.subject === value && withinPeriod(s.date));
            filteredExamRows = (pooledData.examResults || []).filter(r => r.subject === value && withinPeriod(r.date));

        } else if (mode === 'custom') {
            filteredSessions = (allSessions || []).filter(s => s.sessionType !== 'exam_general' && s.subject === value && withinPeriod(s.date));
            filteredExamRows = (pooledData.examResults || []).filter(r => r.subject === value && withinPeriod(r.date));
        }
    }

    // Net değeri olan tüm data noktaları (birleşik)
    const netPoints = [
        ...filteredSessions.filter(s => s.net !== null && s.net !== undefined).map(s => ({
            date: s.date, net: parseFloat(s.net), name: s.name, subject: s.subject || 'Çalışma'
        })),
        ...filteredExamRows.filter(r => r.net !== null && r.net !== undefined).map(r => ({
            date: r.date, net: parseFloat(r.net), name: r.session_name || r.subject, subject: r.subject
        }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Süre toplamı
    const totalTime = [
        ...filteredSessions.map(s => s.duration || 0),
        ...filteredExamRows.map(r => r.duration || 0)
    ].reduce((a, b) => a + b, 0);

    const withNet = netPoints;
    const avgNet = withNet.length > 0 ? (withNet.reduce((a, p) => a + p.net, 0) / withNet.length).toFixed(1) : '0';
    const bestNet = withNet.length > 0 ? Math.max(...withNet.map(p => p.net)).toFixed(1) : '0';
    const totalSessions = filteredSessions.length + (new Set(filteredExamRows.map(r => r.session_id)).size);

    const h = Math.floor(totalTime / 3600000), m = Math.floor((totalTime % 3600000) / 60000);
    const timeStr = h > 0 ? `${h}s ${m}dk` : `${m}dk`;

    document.querySelector('#stat-total-sessions .stat-value').textContent = totalSessions;
    document.querySelector('#stat-total-time .stat-value').textContent = timeStr;
    document.querySelector('#stat-avg-net .stat-value').textContent = avgNet;
    document.querySelector('#stat-best-net .stat-value').textContent = bestNet;

    destroyCharts();
    const noData = netPoints.length === 0 && filteredSessions.length === 0;

    ['no-data-net','no-data-dist','no-data-score','no-data-duration'].forEach(id => {
        document.getElementById(id)?.classList.toggle('hidden', !noData);
    });
    if (noData) return;

    const chartText = '#94a3b8', chartGrid = 'rgba(148, 163, 184, 0.1)';
    const defaultScales = {
        x: { grid: { color: chartGrid }, ticks: { color: chartText, font: { size: 11 } } },
        y: { grid: { color: chartGrid }, ticks: { color: chartText, font: { size: 11 } }, beginAtZero: true }
    };

    // Net Trendi
    if (netPoints.length > 0) {
        chartInstances.net = new Chart(document.getElementById('chart-net-progress'), {
            type: 'line',
            data: {
                labels: netPoints.map(p => new Date(p.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })),
                datasets: [{
                    label: 'Net', data: netPoints.map(p => p.net),
                    borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.1)',
                    borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6C63FF'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: defaultScales, plugins: { legend: { display: false } } }
        });
    }

    // Ders Dağılımı
    const subjectCounts = {};
    filteredSessions.forEach(s => { const k = s.subject || 'Diğer'; subjectCounts[k] = (subjectCounts[k] || 0) + 1; });
    filteredExamRows.forEach(r => { subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1; });
    const pieColors = Object.keys(subjectCounts).map(n => getSubjectColorFromList(subjects, n));

    chartInstances.dist = new Chart(document.getElementById('chart-subject-dist'), {
        type: 'doughnut',
        data: { labels: Object.keys(subjectCounts), datasets: [{ data: Object.values(subjectCounts), backgroundColor: pieColors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartText, padding: 12 } } } }
    });

    // Doğru/Yanlış/Boş Breakdown
    const withScores = [...filteredSessions.filter(s => s.total), ...filteredExamRows.filter(r => r.total_questions)];
    if (withScores.length > 0) {
        const labels = withScores.map(s => (s.name || s.subject || '').slice(0, 12) + (((s.name||'').length > 12) ? '…' : ''));
        chartInstances.score = new Chart(document.getElementById('chart-score-breakdown'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Doğru', data: withScores.map(s => s.correct || 0), backgroundColor: '#10b981' },
                    { label: 'Yanlış', data: withScores.map(s => s.wrong || 0), backgroundColor: '#ef4444' },
                    { label: 'Boş', data: withScores.map(s => s.blank || 0), backgroundColor: 'rgba(148,163,184,0.4)' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false,
                scales: { ...defaultScales, x: { ...defaultScales.x, stacked: true }, y: { ...defaultScales.y, stacked: true } },
                plugins: { legend: { labels: { color: chartText } } } }
        });
    }

    // Süre Grafiği
    const durationData = filteredSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (durationData.length > 0) {
        chartInstances.duration = new Chart(document.getElementById('chart-duration-progress'), {
            type: 'bar',
            data: {
                labels: durationData.map(s => new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })),
                datasets: [{ label: 'Süre (dk)', data: durationData.map(s => Math.round((s.duration || 0) / 60000)),
                    backgroundColor: 'rgba(0,210,255,0.3)', borderColor: '#00D2FF', borderWidth: 1.5, borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: defaultScales, plugins: { legend: { display: false } } }
        });
    }
}
