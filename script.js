// ===== UNIFIED SCRIPT =====

// === AUDIO SYNTH ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (typeof soundEnabled === 'undefined' || !soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'type') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    }
}

let lastInputLength = 0;

// === NAVIGATION ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.dataset.page;
        navigateTo(page);
    });
});

document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        navigateTo(page);
    });
});

function navigateTo(page) {
    // Update sidebar
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active-nav'));
    const sideBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (sideBtn) sideBtn.classList.add('active-nav');

    // Update bottom nav
    document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active-nav'));
    const bottomBtn = document.querySelector(`.bottom-nav-btn[data-page="${page}"]`);
    if (bottomBtn) bottomBtn.classList.add('active-nav');

    // Show page
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`page-${page}`);
    if (section) section.classList.add('active');
}

// === GREETING ===
const hours = new Date().getHours();
const greetingEl = document.getElementById('greeting-text');
if (greetingEl) {
    if (hours < 12) greetingEl.innerHTML = 'Good Morning, Alex';
    else if (hours < 18) greetingEl.innerHTML = 'Good Afternoon, Alex';
    else greetingEl.innerHTML = 'Good Evening, Alex';
}

// === TYPING TEST ===
let typingActive = false;
let typingTimer = null;
let timeLeft = 0;
let typedChars = 0;
let mistakes = 0;
let startTime = null;
let testDuration = 30; // default

const typingTexts = [
    "The quick brown fox jumps over the lazy dog while the sun sets behind the glowing neon skyscrapers of the digital city. Accuracy is the key to velocity, and every keystroke counts toward your ultimate master ranking in the world of high-octane competitive typing.",
    "In the realm of digital mastery, every keystroke is a step toward perfection. The fusion of mind and machine creates a symphony of precision and speed that defines the modern era of human computer interaction.",
    "Typing is not just about speed, it is about the seamless connection between thought and expression. When your fingers dance across the keys, you are translating the language of your mind into the digital world."
];

function getRandomText() {
    return typingTexts[Math.floor(Math.random() * typingTexts.length)];
}

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => {
            b.className = 'px-md py-xs rounded-full text-label-md font-label-md bg-surface-variant/50 border border-white/5 hover:bg-surface-variant transition-all mode-btn';
        });
        btn.className = 'px-md py-xs rounded-full text-label-md font-label-md bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(0,210,255,0.3)] mode-btn';
        testDuration = parseInt(btn.dataset.mode);
        resetTypingTest();
    });
});

function initTypingTest() {
    lastInputLength = 0;
    const textEl = document.getElementById('typing-text');
    const input = document.getElementById('typing-input-hidden');
    if (!textEl || !input) return;

    const text = getRandomText();
    textEl.innerHTML = '';
    [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = i === 0 ? 'char-current' : 'char-pending';
        span.textContent = ch;
        span.dataset.index = i;
        textEl.appendChild(span);
    });

    input.value = '';
    typedChars = 0;
    mistakes = 0;
    typingActive = false;
    timeLeft = testDuration;
    startTime = null;

    document.getElementById('typing-timer').textContent = `00:${testDuration.toString().padStart(2, '0')}`;
    document.getElementById('live-wpm').textContent = '0';
    document.getElementById('live-acc').textContent = '100%';
    document.getElementById('live-errors').textContent = '0';
    document.getElementById('typing-progress').style.width = '100%';

    clearInterval(typingTimer);

    // Focus input
    setTimeout(() => input.focus(), 100);
}

// Typing area click to focus
document.getElementById('typing-area')?.addEventListener('click', () => {
    document.getElementById('typing-input-hidden')?.focus();
});

// Input handler
document.getElementById('typing-input-hidden')?.addEventListener('input', function (e) {
    if (!typingActive) {
        typingActive = true;
        startTime = Date.now();
        startTypingTimer();
    }

    const val = this.value;
    const chars = document.querySelectorAll('#typing-text span');

    const isBackspace = val.length < lastInputLength;
    if (!isBackspace && val.length > 0 && val.length <= chars.length) {
        if (val[val.length - 1] === chars[val.length - 1].textContent) {
            playSound('type');
        } else {
            playSound('error');
        }
    }
    lastInputLength = val.length;

    // Process each character
    typedChars = val.length;
    mistakes = 0;

    chars.forEach((ch, i) => {
        ch.className = 'char-pending';
        if (i < val.length) {
            if (val[i] === ch.textContent) {
                ch.className = 'char-correct';
            } else {
                ch.className = 'char-incorrect';
                mistakes++;
            }
        }
        if (i === val.length) ch.className = 'char-current';
    });

    // Update live stats
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    const wpm = elapsed > 0 ? Math.round((typedChars / 5) / elapsed) : 0;
    const acc = typedChars > 0 ? Math.round(((typedChars - mistakes) / typedChars) * 100) : 100;

    document.getElementById('live-wpm').textContent = wpm;
    document.getElementById('live-acc').textContent = acc + '%';
    document.getElementById('live-errors').textContent = mistakes;

    // Check if completed
    if (val.length >= chars.length) {
        endTypingTest();
    }
});

function startTypingTimer() {
    clearInterval(typingTimer);
    typingTimer = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById('typing-timer').textContent = `0${mins}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('typing-progress').style.width = `${(timeLeft / testDuration) * 100}%`;

        if (timeLeft <= 0) endTypingTest();
    }, 1000);
}

function endTypingTest() {
    clearInterval(typingTimer);
    typingActive = false;

    const val = document.getElementById('typing-input-hidden').value;
    const totalChars = val.length;
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    const wpm = elapsed > 0 ? Math.round((totalChars / 5) / elapsed) : 0;
    const acc = totalChars > 0 ? Math.round(((totalChars - mistakes) / totalChars) * 100) : 100;

    // Show results
    document.getElementById('result-wpm').textContent = wpm;
    document.getElementById('result-rank').textContent = getRankText(wpm, acc);
    document.getElementById('result-accuracy').textContent = acc + '%';
    document.getElementById('result-words').textContent = Math.round(totalChars / 5);
    document.getElementById('result-errors').textContent = mistakes;
    document.getElementById('result-time').textContent = testDuration + 's';

    // Update circular gauge
    const gauge = document.querySelector('.circular-gauge');
    if (gauge) gauge.style.background = `conic-gradient(from 0deg, #00f0ff ${acc}%, transparent ${acc}%)`;

    // Generate chart
    const chart = document.getElementById('result-chart');
    if (chart) {
        chart.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const height = 30 + Math.random() * 60;
            const bar = document.createElement('div');
            bar.className = 'flex-1 bg-primary/30 rounded-t-sm transition-all duration-500';
            bar.style.height = `${height}%`;
            bar.style.setProperty('--delay', `${i * 100}ms`);
            chart.appendChild(bar);
        }
        setTimeout(() => {
            chart.querySelectorAll('div').forEach(bar => {
                bar.classList.remove('bg-primary/30');
                bar.classList.add('bg-primary/50');
            });
        }, 500);
    }

    // Update dashboard stats
    updateDashboardStats(wpm, acc);

    // Save to history
    saveToHistory(wpm, acc, mistakes, totalChars);

    navigateTo('results');
}

function getRankText(wpm, acc) {
    if (wpm >= 100) return 'Faster than 99% of typists';
    if (wpm >= 80) return 'Faster than 90% of typists';
    if (wpm >= 60) return 'Faster than 70% of typists';
    if (wpm >= 40) return 'Faster than 50% of typists';
    return 'Keep practicing to improve!';
}

function resetTypingTest() { initTypingTest(); }

function updateDashboardStats(wpm, acc) {
    const bestEl = document.getElementById('dash-best-wpm');
    if (bestEl) {
        const current = parseInt(bestEl.textContent);
        if (wpm > current) bestEl.textContent = wpm;
    }
    const accEl = document.getElementById('dash-avg-acc');
    if (accEl) accEl.textContent = acc + '%';
    const testsEl = document.getElementById('dash-total-tests');
    if (testsEl) {
        const count = parseInt(testsEl.textContent) + 1;
        testsEl.textContent = count;
    }
}

function saveToHistory(wpm, acc, errors, chars) {
    const history = JSON.parse(localStorage.getItem('typemaster_history') || '[]');
    history.unshift({ wpm, acc, errors, chars, time: testDuration, date: new Date().toLocaleString() });
    if (history.length > 20) history.pop();
    localStorage.setItem('typemaster_history', JSON.stringify(history));
    updateRecentActivity(history);
}

function updateRecentActivity(history) {
    const container = document.getElementById('dash-recent-activity');
    if (!container || !history.length) return;
    container.innerHTML = history.slice(0, 3).map(h => `
    <div class="glass-card p-sm rounded-lg flex items-center justify-between">
      <div class="flex items-center gap-sm">
        <div class="h-10 w-10 rounded-md bg-tertiary/20 flex items-center justify-center text-tertiary">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <div>
          <div class="font-label-md text-label-md text-on-surface">Classic Mode</div>
          <div class="font-label-sm text-label-sm text-on-surface-variant">${h.date}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-label-md text-label-md text-primary">${h.wpm} WPM</div>
        <div class="font-label-sm text-label-sm text-on-surface-variant">${h.acc}% Acc</div>
      </div>
    </div>
  `).join('');
}

// === SPEED TEST ===
let speedTesting = false;

async function startSpeedTest() {
    if (speedTesting) return;
    speedTesting = true;

    const gauge = document.querySelector('.speed-gauge');
    const speedMain = document.getElementById('speed-main');
    const speedDown = document.getElementById('speed-down');
    const speedUp = document.getElementById('speed-up');
    const speedPing = document.getElementById('speed-ping');
    const btnText = document.getElementById('speed-btn-text');

    if (btnText) btnText.textContent = 'TESTING...';
    if (speedMain) speedMain.textContent = "0";
    if (speedDown) speedDown.innerHTML = `0 <span class="text-sm font-normal">Mb/s</span>`;
    if (speedUp) speedUp.innerHTML = `0 <span class="text-sm font-normal">Mb/s</span>`;
    if (speedPing) speedPing.innerHTML = `0 <span class="text-sm font-normal">ms</span>`;
    if (gauge) gauge.style.strokeDashoffset = 440;

    let targetPing = 0;
    let targetSpeed = 0;
    let targetUp = 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
        // 1. Ping Test
        let pingStart = performance.now();
        await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store', signal: controller.signal });
        let pingTime = performance.now() - pingStart;
        
        pingStart = performance.now();
        await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store', signal: controller.signal });
        let pingTime2 = performance.now() - pingStart;
        
        targetPing = Math.round((pingTime + pingTime2) / 2);
        if (speedPing) speedPing.innerHTML = `${targetPing} <span class="text-sm font-normal">ms</span>`;
        if (gauge) gauge.style.strokeDashoffset = 440 - (440 * 0.1); 
        
        // 2. Download Test (5MB)
        const dlSize = 5 * 1024 * 1024;
        const dlStart = performance.now();
        const dlResponse = await fetch(`https://speed.cloudflare.com/__down?bytes=${dlSize}`, { cache: 'no-store', signal: controller.signal });
        await dlResponse.arrayBuffer(); 
        const dlEnd = performance.now();
        
        const dlDuration = (dlEnd - dlStart) / 1000; 
        const dlBps = (dlSize * 8) / dlDuration; 
        targetSpeed = (dlBps / 1000000).toFixed(1);
        
        if (speedDown) speedDown.innerHTML = `${targetSpeed} <span class="text-sm font-normal">Mb/s</span>`;
        if (speedMain) speedMain.textContent = Math.round(targetSpeed);
        if (gauge) gauge.style.strokeDashoffset = 440 - (440 * 0.6);
        
        // 3. Upload Test (2MB)
        const ulSize = 2 * 1024 * 1024;
        const ulData = new Uint8Array(ulSize);
        for (let i = 0; i < ulSize; i += 4096) ulData[i] = Math.random() * 255;
        
        const ulStart = performance.now();
        await fetch('https://speed.cloudflare.com/__up', {
            method: 'POST',
            body: ulData,
            headers: { 'Content-Type': 'application/octet-stream' },
            signal: controller.signal
        });
        const ulEnd = performance.now();
        
        const ulDuration = (ulEnd - ulStart) / 1000; 
        const ulBps = (ulSize * 8) / ulDuration; 
        targetUp = (ulBps / 1000000).toFixed(1); 
        
        if (speedUp) speedUp.innerHTML = `${targetUp} <span class="text-sm font-normal">Mb/s</span>`;
        if (gauge) gauge.style.strokeDashoffset = 0; 
        
    } catch (e) {
        console.error("Speed test failed:", e);
        if (speedDown) speedDown.innerHTML = `Err <span class="text-sm font-normal">Mb/s</span>`;
        if (speedUp) speedUp.innerHTML = `Err <span class="text-sm font-normal">Mb/s</span>`;
        if (speedPing) speedPing.innerHTML = `Err <span class="text-sm font-normal">ms</span>`;
    } finally {
        clearTimeout(timeoutId);
        if (btnText) btnText.textContent = 'START TEST';
        speedTesting = false;
    }
}

// === SETTINGS TOGGLES ===
let soundEnabled = localStorage.getItem('speedlab_sound') !== 'false';
let darkModeEnabled = localStorage.getItem('speedlab_dark') !== 'false';

function updateSoundUI() {
    const icon = document.querySelector('#sound-toggle .material-symbols-outlined');
    if (icon) icon.textContent = soundEnabled ? 'volume_up' : 'volume_off';
    
    const track = document.getElementById('sound-effects-track');
    const knob = document.getElementById('sound-effects-knob');
    if (track && knob) {
        if (soundEnabled) {
            track.className = 'w-11 h-5 bg-primary-container/30 rounded-full relative p-0.5 transition-colors';
            knob.className = 'w-4 h-4 bg-primary rounded-full absolute right-0.5 transition-all shadow-[0_0_8px_rgba(0,240,255,1)]';
        } else {
            track.className = 'w-11 h-5 bg-surface-container-high rounded-full relative p-0.5 transition-colors';
            knob.className = 'w-4 h-4 bg-on-surface-variant rounded-full absolute left-0.5 transition-all';
        }
    }
}

function updateDarkModeUI() {
    if (darkModeEnabled) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    const track = document.getElementById('dark-mode-track');
    const knob = document.getElementById('dark-mode-knob');
    if (track && knob) {
        if (darkModeEnabled) {
            track.className = 'w-11 h-5 bg-primary-container/30 rounded-full relative p-0.5 transition-colors';
            knob.className = 'w-4 h-4 bg-primary rounded-full absolute right-0.5 transition-all shadow-[0_0_8px_rgba(0,240,255,1)]';
        } else {
            track.className = 'w-11 h-5 bg-surface-container-high rounded-full relative p-0.5 transition-colors';
            knob.className = 'w-4 h-4 bg-on-surface-variant rounded-full absolute left-0.5 transition-all';
        }
    }
}

document.getElementById('sound-toggle')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('speedlab_sound', soundEnabled);
    updateSoundUI();
});

document.getElementById('sound-effects-toggle')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('speedlab_sound', soundEnabled);
    updateSoundUI();
});

document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    darkModeEnabled = !darkModeEnabled;
    localStorage.setItem('speedlab_dark', darkModeEnabled);
    updateDarkModeUI();
});

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    updateSoundUI();
    updateDarkModeUI();
    navigateTo('dashboard');
    initTypingTest();

    // Load history
    const history = JSON.parse(localStorage.getItem('typemaster_history') || '[]');
    updateRecentActivity(history);

    // Load dashboard stats from localStorage
    const stats = JSON.parse(localStorage.getItem('typemaster_stats') || '{"best":0,"total":0}');
    const bestEl = document.getElementById('dash-best-wpm');
    if (bestEl) bestEl.textContent = stats.best || 85;
    const testsEl = document.getElementById('dash-total-tests');
    if (testsEl) testsEl.textContent = stats.total || 142;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') resetTypingTest();
    if (e.key === 'Tab') { e.preventDefault(); resetTypingTest(); }
});

// === LOGOUT ===
document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm("Kya aap waqai logout karna chahte hain? Aapka sara data aur settings clear ho jayengi.")) {
        localStorage.clear();
        location.reload();
    }
});