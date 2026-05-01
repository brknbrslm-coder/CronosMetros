// ===== ANALYSIS PAGE =====
let chartInstances = {};

function destroyCharts() {
    Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
    chartInstances = {};
}

async function renderAnalysis() {
    let sessions = await loadSessions();
    const subjects = await loadSubjects();
    if (!sessions) sessions = [];

    const subjectFilter = document.getElementById('analysis-subject').value;
    if (subjectFilter) sessions = sessions.filter(s => s.subject === subjectFilter);

    const period = document.getElementById('analysis-period').value;
    if (period !== 'all') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(period));
        sessions = sessions.filter(s => new Date(s.date) >= cutoff);
    }

    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalTime = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const withNet = sessions.filter(s => s.net !== undefined && s.net !== null);
    const avgNet = withNet.length > 0 ? (withNet.reduce((a, s) => a + s.net, 0) / withNet.length).toFixed(1) : '0';
    const bestNet = withNet.length > 0 ? Math.max(...withNet.map(s => s.net)).toFixed(1) : '0';
    const h = Math.floor(totalTime / 3600000);
    const m = Math.floor((totalTime % 3600000) / 60000);
    const timeStr = h > 0 ? `${h}s ${m}dk` : `${m}dk`;

    document.querySelector('#stat-total-sessions .stat-value').textContent = sessions.length;
    document.querySelector('#stat-total-time .stat-value').textContent = timeStr;
    document.querySelector('#stat-avg-net .stat-value').textContent = avgNet;
    document.querySelector('#stat-best-net .stat-value').textContent = bestNet;

    destroyCharts();
    const noSessions = sessions.length === 0;

    document.getElementById('no-data-net').classList.toggle('hidden', !noSessions);
    document.getElementById('no-data-dist').classList.toggle('hidden', !noSessions);
    document.getElementById('no-data-score').classList.toggle('hidden', !noSessions);
    document.getElementById('no-data-duration').classList.toggle('hidden', !noSessions);

    if (noSessions) return;

    const chartText = '#94a3b8';
    const chartGrid = 'rgba(148, 163, 184, 0.1)';
    const defaultScales = {
        x: { grid: { color: chartGrid }, ticks: { color: chartText, font: { size: 11 } } },
        y: { grid: { color: chartGrid }, ticks: { color: chartText, font: { size: 11 } }, beginAtZero: true }
    };

    // Net Progress
    if (withNet.length > 0) {
        chartInstances.net = new Chart(document.getElementById('chart-net-progress'), {
            type: 'line',
            data: {
                labels: withNet.map(s => new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })),
                datasets: [{
                    label: 'Net', data: withNet.map(s => s.net),
                    borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.1)',
                    borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6C63FF'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: defaultScales, plugins: { legend: { display: false } } }
        });
    }

    // Subject Distribution — ders renkleriyle
    const subjectCounts = {};
    sessions.forEach(s => { const k = s.subject || 'Diğer'; subjectCounts[k] = (subjectCounts[k] || 0) + 1; });
    const pieColors = Object.keys(subjectCounts).map(name => getSubjectColorFromList(subjects, name));

    chartInstances.dist = new Chart(document.getElementById('chart-subject-dist'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(subjectCounts),
            datasets: [{ data: Object.values(subjectCounts), backgroundColor: pieColors, borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartText, padding: 12 } } } }
    });

    // Score Breakdown
    const withScores = sessions.filter(s => s.total !== undefined && s.total !== null);
    if (withScores.length > 0) {
        chartInstances.score = new Chart(document.getElementById('chart-score-breakdown'), {
            type: 'bar',
            data: {
                labels: withScores.map(s => s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name),
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

    // Duration
    chartInstances.duration = new Chart(document.getElementById('chart-duration-progress'), {
        type: 'bar',
        data: {
            labels: sessions.map(s => new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })),
            datasets: [{ label: 'Süre (dk)', data: sessions.map(s => Math.round((s.duration || 0) / 60000)),
                backgroundColor: 'rgba(0,210,255,0.3)', borderColor: '#00D2FF', borderWidth: 1.5, borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: defaultScales, plugins: { legend: { display: false } } }
    });
}
