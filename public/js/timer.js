// ===== TIMER MODULE =====
let timerState = { running: false, paused: false, startTime: 0, elapsed: 0, pausedAt: 0, interval: null, laps: [] };

function formatTime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0'), ms: String(cs).padStart(2, '0') };
}

function formatDuration(ms) {
    const t = formatTime(ms);
    return `${t.h}:${t.m}:${t.s}`;
}

function updateDisplay() {
    const t = formatTime(timerState.elapsed);
    document.getElementById('timer-hours').textContent = t.h;
    document.getElementById('timer-minutes').textContent = t.m;
    document.getElementById('timer-seconds').textContent = t.s;
    document.getElementById('timer-ms').textContent = '.' + t.ms;

    // Ring progress (full rotation every 60 seconds)
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
    timerState = { running: false, paused: false, startTime: 0, elapsed: 0, pausedAt: 0, interval: null, laps: [] };
    updateDisplay();
    updateTimerButtons('idle');
    document.getElementById('lap-list').innerHTML = '';
    document.getElementById('lap-section').classList.add('hidden');
}

function updateTimerButtons(state) {
    const $ = id => document.getElementById(id);
    const show = el => el.classList.remove('hidden');
    const hide = el => el.classList.add('hidden');

    const start = $('btn-start'), pause = $('btn-pause'), resume = $('btn-resume');
    const stop = $('btn-stop'), reset = $('btn-reset'), save = $('btn-save-time');

    [start, pause, resume, stop, reset, save].forEach(hide);

    switch (state) {
        case 'idle': show(start); break;
        case 'running': show(pause); show(stop); break;
        case 'paused': show(resume); show(stop); show(reset); break;
        case 'stopped': show(reset); show(save); break;
    }
}
