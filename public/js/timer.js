// ===== TIMER MODULE =====
let timerState = { running: false, paused: false, startTime: 0, elapsed: 0, pausedAt: 0, interval: null };

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0'), ms: String(cs).padStart(2, '0') };
}

function formatDuration(ms) {
    if (!ms || ms < 0) return '00:00:00';
    const t = formatTime(ms);
    return `${t.h}:${t.m}:${t.s}`;
}

// ms → {h,m,s} ayrıştır
function msToHMS(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return { h, m, s };
}

// {h,m,s} → ms
function hmsToMs(h, m, s) {
    return ((parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0)) * 1000;
}

function updateDisplay() {
    const t = formatTime(timerState.elapsed);
    const hEl = document.getElementById('timer-hours');
    const mEl = document.getElementById('timer-minutes');
    const sEl = document.getElementById('timer-seconds');
    const msEl = document.getElementById('timer-ms');
    if (hEl) hEl.textContent = t.h;
    if (mEl) mEl.textContent = t.m;
    if (sEl) sEl.textContent = t.s;
    if (msEl) msEl.textContent = '.' + t.ms;

    const progress = (timerState.elapsed % 60000) / 60000;
    const circumference = 2 * Math.PI * 130;
    const offset = circumference * (1 - progress);
    const ring = document.getElementById('timer-ring-progress');
    if (ring) ring.style.strokeDashoffset = offset;
}

function startTimer() {
    timerState.running = true;
    timerState.paused = false;
    timerState.startTime = Date.now() - timerState.elapsed;
    timerState.interval = setInterval(() => {
        timerState.elapsed = Date.now() - timerState.startTime;
        updateDisplay();
    }, 30);
    updateTimerButtons('running');
}

function pauseTimer() {
    timerState.paused = true;
    timerState.running = false;
    clearInterval(timerState.interval);
    updateTimerButtons('paused');
}

function resumeTimer() {
    timerState.paused = false;
    timerState.running = true;
    timerState.startTime = Date.now() - timerState.elapsed;
    timerState.interval = setInterval(() => {
        timerState.elapsed = Date.now() - timerState.startTime;
        updateDisplay();
    }, 30);
    updateTimerButtons('running');
}

function stopTimer() {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.paused = false;
    updateTimerButtons('stopped');
}

function resetTimer() {
    clearInterval(timerState.interval);
    timerState = { running: false, paused: false, startTime: 0, elapsed: 0, pausedAt: 0, interval: null };
    updateDisplay();
    updateTimerButtons('idle');
    const lapSection = document.getElementById('lap-section');
    if (lapSection) lapSection.classList.add('hidden');
    const lapList = document.getElementById('lap-list');
    if (lapList) lapList.innerHTML = '';
}

function updateTimerButtons(state) {
    const $ = id => document.getElementById(id);
    const show = el => el && el.classList.remove('hidden');
    const hide = el => el && el.classList.add('hidden');

    const start = $('btn-start'), pause = $('btn-pause'), resume = $('btn-resume');
    const stop = $('btn-stop'), reset = $('btn-reset'), save = $('btn-save-time');
    const quickSave = $('btn-quick-save');

    [start, pause, resume, stop, reset, save, quickSave].forEach(hide);

    switch (state) {
        case 'idle': show(start); show(quickSave); break;
        case 'running': show(pause); show(stop); break;
        case 'paused': show(resume); show(stop); show(reset); break;
        case 'stopped': show(reset); show(save); break;
    }
}

// Modal'daki süre input'larını timer değeriyle doldur
function fillDurationInputs(ms) {
    const { h, m, s } = msToHMS(ms || 0);
    const hEl = document.getElementById('duration-h');
    const mEl = document.getElementById('duration-m');
    const sEl = document.getElementById('duration-s');
    if (hEl) hEl.value = h;
    if (mEl) mEl.value = m;
    if (sEl) sEl.value = s;
}

// Modal'daki süre input'larından ms al
function getDurationFromInputs() {
    const h = document.getElementById('duration-h')?.value || 0;
    const m = document.getElementById('duration-m')?.value || 0;
    const s = document.getElementById('duration-s')?.value || 0;
    return hmsToMs(h, m, s);
}
