// ===== UTILS =====
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);





// ===== NAVIGATION =====
$$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', e => {
        e.preventDefault();
        $$('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.target;
        $$('.tool-section').forEach(s => s.classList.remove('active'));
        setTimeout(() => $(target)?.classList.add('active'), 30);
        // Show/hide top bar mode tabs
        $('typing-mode-tabs').style.display = target === 'typing-section' ? 'flex' : 'none';
    });
});

// ===== SETTINGS =====
let soundOn = false, caretStyle = 'line', fontSize = 22;
function toggleSound() {
    soundOn = !soundOn;
    [$('sound-toggle-side'), $('sound-toggle-2')].forEach(b => b?.classList.toggle('active-toggle', soundOn));
    const sideIcon = $('sound-icon-side');
    if (sideIcon) {
        sideIcon.textContent = soundOn ? 'volume_up' : 'volume_off';
        sideIcon.classList.toggle('text-primary-fixed-dim', soundOn);
    }
    
    // Initialize AudioContext on user interaction to prevent browser blocking
    if (soundOn) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playClick(); // Play a test click
    }
}
function setCaretStyle(style) {
    caretStyle = style;
    $$('.caret-btn').forEach(b => b.classList.toggle('active-caret', b.dataset.caret === style));
    renderText();
}
function setFontSize(val) {
    fontSize = val; $('font-size-label').textContent = val + 'px';
    $('typing-text').style.fontSize = val + 'px';
}

// ===== WORD BANKS =====
const wordBanks = {
    easy: ['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','man','new','now','old','see','two','way','who','did','its','let','put','say','she','too','use','that','with','have','this','will','your','from','they','know','want','been','good','much','some','time','very','when','come','here','just','like','long','make','many','over','such','take','than','them','well','were'],
    medium: ['about','after','again','against','along','another','around','because','before','between','change','children','different','every','found','great','hand','large','learn','letter','move','must','never','number','often','picture','place','point','right','should','small','sound','spell','still','study','their','these','things','think','three','through','together','under','until','where','which','while','world','would','write','years'],
    hard: ['architecture','asynchronous','authentication','blockchain','chromosome','circumference','collaborative','comprehension','configuration','cryptographic','cylindrical','demonstration','deteriorating','extraordinary','infrastructure','initialization','instantaneous','interpretation','juxtaposition','metamorphosis','microprocessor','multithreading','nomenclature','orchestration','perpendicular','pharmaceutical','philosophical','predominantly','procrastination','psychological','questionnaire','reconnaissance','simultaneously','sophisticated','subconscious','thermodynamics','unprecedented','vulnerability','zygomorphic']
};

const quotes = {
    easy: [
        "The quick brown fox jumps over the lazy dog.",
        "To be or not to be, that is the question.",
        "All that glitters is not gold."
    ],
    medium: [
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
        "In the middle of difficulty lies opportunity. Every challenge is a chance to grow stronger.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts."
    ],
    hard: [
        "The architecture of modern distributed systems relies on robust asynchronous operations and sophisticated memory management strategies that ensure optimal performance.",
        "Cryptographic algorithms leverage mathematical complexity to authenticate users and protect sensitive data from unauthorized interception across encrypted communication channels.",
        "Quantum computing interfaces utilize superposition and entanglement phenomena to solve computationally intractable problems at unprecedented speeds beyond classical limitations."
    ]
};

// ===== TYPING STATE =====
let testType = 'time', testAmount = 15, usePunct = false, useNums = false;
let difficulty = 'medium', caretMode = 'line';
let typingActive = false, timeLeft = 0, totalTime = 0, timer = null;
let charIndex = 0, mistakes = 0, wordCount = 0;
let wpmHistory = [], startTime = null, lastText = '';
let customText = '';

// ===== MODE SWITCHING =====
$$('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.type-btn').forEach(b => b.classList.remove('active-type'));
        btn.classList.add('active-type');
        testType = btn.dataset.type;
        $('time-selector').classList.toggle('hidden', testType !== 'time');
        $('words-selector').classList.toggle('hidden', testType !== 'words');
        $('custom-input-area').classList.toggle('hidden', testType !== 'custom');
        $('quote-selector').classList.toggle('hidden', testType !== 'quote');
        if (testType !== 'custom') restartTest();
    });
});

$$('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('#time-selector,#words-selector')?.querySelectorAll('.amount-btn')
            .forEach(b => b.classList.remove('active-amount'));
        btn.classList.add('active-amount');
        testAmount = parseInt(btn.dataset.val);
        restartTest();
    });
});

$('toggle-punct').addEventListener('click', () => {
    usePunct = !usePunct;
    $('toggle-punct').classList.toggle('active-option', usePunct);
    restartTest();
});
$('toggle-nums').addEventListener('click', () => {
    useNums = !useNums;
    $('toggle-nums').classList.toggle('active-option', useNums);
    restartTest();
});

$$('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.diff-btn').forEach(b => b.classList.remove('active-diff'));
        btn.classList.add('active-diff');
        difficulty = btn.dataset.diff;
        restartTest();
    });
});

// ===== TEXT GENERATION =====
const punct = [',','.',';',':','!','?'];
const nums = ['1','2','3','4','5','6','7','8','9','0'];

function addExtras(word) {
    if (useNums && Math.random() < 0.15) return nums[Math.floor(Math.random()*nums.length)] + word;
    if (usePunct && Math.random() < 0.2) return word + punct[Math.floor(Math.random()*punct.length)];
    return word;
}

function generateText() {
    if (testType === 'custom') return customText || 'Please enter your custom text above.';
    if (testType === 'quote') {
        const list = quotes[difficulty];
        return list[Math.floor(Math.random() * list.length)];
    }
    const bank = wordBanks[difficulty] || wordBanks.medium;
    const count = testType === 'words' ? testAmount : 80;
    let words = [];
    for (let i = 0; i < count; i++) {
        let w = bank[Math.floor(Math.random() * bank.length)];
        words.push(addExtras(w));
    }
    return words.join(' ');
}

// ===== RENDER TEXT =====
function renderText() {
    const text = lastText;
    const el = $('typing-text');
    el.innerHTML = '';
    el.style.fontSize = fontSize + 'px';
    [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char' + (i === 0 ? ` current caret-${caretStyle}` : '');
        span.textContent = ch;
        el.appendChild(span);
    });
}

// ===== INIT TEST =====
function initTest() {
    typingActive = false;
    clearInterval(timer);
    charIndex = 0; mistakes = 0; wordCount = 0;
    wpmHistory = []; startTime = null;
    timeLeft = testType === 'time' ? testAmount : 0;
    totalTime = testAmount;

    // UI reset
    $('wpm-val').textContent = '000';
    $('raw-val').textContent = '000';
    $('acc-val').textContent = '100%';
    $('stat-label').textContent = testType === 'time' ? 'TIMER' : testType === 'words' ? 'WORDS' : 'TIME';
    $('timer-val').textContent = testType === 'time' ? timeLeft + 's' : '—';

    if (testType === 'custom' && !customText) {
        $('custom-input-area').classList.remove('hidden');
        $('typing-text').innerHTML = '<span style="color:#849495;font-size:14px">Enter your custom text above and click START.</span>';
        return;
    }

    lastText = generateText();
    renderText();
    $('hidden-input').value = '';
    $('hidden-input').focus();
}

function restartTest() { initTest(); }
function nextTest() { lastText = generateText(); renderText(); $('hidden-input').value = ''; charIndex = 0; }

function setCustomText() {
    customText = $('custom-text-input').value.trim();
    if (!customText) return;
    $('custom-input-area').classList.add('hidden');
    initTest();
}

// ===== TYPING INPUT =====
$('typing-area').addEventListener('click', () => $('hidden-input').focus());

$('hidden-input').addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); restartTest(); return; }
    if (e.key === 'Escape') { e.preventDefault(); initTest(); return; }
});

$('hidden-input').addEventListener('input', e => {
    const chars = $('typing-text').querySelectorAll('.char');
    const typed = e.target.value;

    if (!typingActive && typed.length > 0) {
        typingActive = true;
        startTime = performance.now();
        if (testType === 'time') startTimer();
    }

    charIndex = typed.length;

    // Classify chars
    chars.forEach((ch, i) => {
        ch.className = 'char';
        if (i < typed.length) {
            ch.classList.add(typed[i] === ch.textContent ? 'correct' : 'incorrect');
        }
        if (i === typed.length) ch.classList.add('current', `caret-${caretStyle}`);
    });

    // Count mistakes
    let err = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] !== chars[i]?.textContent) err++;
    mistakes = err;

    const elapsed = (performance.now() - (startTime || performance.now())) / 1000 / 60;
    const net = Math.max(0, ((typed.length / 5) - mistakes) / Math.max(elapsed, 0.001));
    const raw = (typed.length / 5) / Math.max(elapsed, 0.001);
    const acc = typed.length > 0 ? Math.round(((typed.length - mistakes) / typed.length) * 100) : 100;

    $('wpm-val').textContent = Math.round(net).toString().padStart(3,'0');
    $('raw-val').textContent = Math.round(raw).toString().padStart(3,'0');
    $('acc-val').textContent = acc + '%';

    if (testType !== 'time') {
        const secs = ((performance.now() - startTime) / 1000).toFixed(1);
        $('timer-val').textContent = secs + 's';
    }

    // Play sound
    if (soundOn && typed.length > charIndex - 1) playClick();

    // Words mode: check if done
    if (testType === 'words') {
        const words = lastText.split(' ');
        const typedWords = typed.split(' ');
        if (typedWords.length > words.length || (typedWords.length === words.length && typed.endsWith(' '))) {
            endTest();
        }
    }

    // Extend text if near end (time mode)
    if (testType === 'time' && typed.length >= chars.length - 10) {
        const extra = generateText();
        [...extra].forEach(ch => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            $('typing-text').appendChild(span);
        });
        lastText += ' ' + extra;
    }
});

// ===== TIMER =====
function startTimer() {
    timer = setInterval(() => {
        if (!typingActive) return;
        timeLeft--;
        $('timer-val').textContent = timeLeft + 's';

        // Record WPM every second
        const typed = $('hidden-input').value;
        const elapsed = (totalTime - timeLeft) / 60;
        const wpm = Math.round(((typed.length / 5) - mistakes) / Math.max(elapsed, 0.001));
        wpmHistory.push(Math.max(0, wpm));

        if (timeLeft <= 0) endTest();
    }, 1000);
}

// ===== SOUND =====
let audioCtx = null;
function playClick() {
    if (!soundOn) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'square'; // Sounds more like a mechanical click
        osc.frequency.setValueAtTime(150 + Math.random() * 50, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.03);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.03);
    } catch(e) { console.error("Audio error:", e); }
}

// ===== END TEST =====
function endTest() {
    clearInterval(timer);
    typingActive = false;

    const typed = $('hidden-input').value;
    const totalSec = testType === 'time' ? totalTime : (performance.now() - startTime) / 1000;
    const elapsed = totalSec / 60;
    const net = Math.max(0, Math.round(((typed.length / 5) - mistakes) / Math.max(elapsed, 0.001)));
    const raw = Math.round((typed.length / 5) / Math.max(elapsed, 0.001));
    const acc = typed.length > 0 ? Math.round(((typed.length - mistakes) / typed.length) * 100) : 100;

    // Consistency = stddev of wpmHistory
    let consistency = 100;
    if (wpmHistory.length > 1) {
        const mean = wpmHistory.reduce((a,b)=>a+b,0)/wpmHistory.length;
        const variance = wpmHistory.reduce((a,b)=>a+(b-mean)**2,0)/wpmHistory.length;
        consistency = Math.max(0, Math.round(100 - Math.sqrt(variance)));
    }

    // Rating
    let rating = 'BEGINNER', msg = 'Keep practicing!';
    if (net >= 120) { rating = 'LEGENDARY'; msg = 'You are a typing god!'; }
    else if (net >= 100) { rating = 'MASTER'; msg = 'Exceptional speed!'; }
    else if (net >= 80) { rating = 'ELITE'; msg = 'Outstanding performance!'; }
    else if (net >= 60) { rating = 'SKILLED'; msg = 'Great typing speed!'; }
    else if (net >= 40) { rating = 'AVERAGE'; msg = 'Keep improving!'; }

    // Fill modal
    $('result-rating').textContent = rating;
    $('result-rank-msg').textContent = msg;
    $('res-wpm').textContent = net.toString().padStart(3,'0');
    $('res-raw').textContent = raw.toString().padStart(3,'0');
    $('res-acc').textContent = acc + '%';
    $('res-consistency').textContent = consistency + '%';
    $('res-errors').textContent = mistakes;
    $('res-chars').textContent = typed.length;
    $('res-time').textContent = Math.round(totalSec) + 's';

    // Draw WPM chart
    drawChart(wpmHistory.length ? wpmHistory : [net]);

    // Save to history
    saveHistory({ wpm: net, raw, acc, consistency, errors: mistakes, chars: typed.length, time: Math.round(totalSec), mode: testType, amount: testAmount, rating });

    // Show modal
    $('result-overlay').classList.add('show');

    // Confetti
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 }, colors: ['#00dbe7','#ffffff','#00f2ff'] });
}

// ===== WPM CHART =====
function drawChart(data) {
    const canvas = $('wpm-chart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 80 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth, h = 80;
    ctx.clearRect(0,0,w,h);

    const max = Math.max(...data, 1);
    const step = w / (data.length - 1 || 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(58,73,75,0.5)'; ctx.lineWidth = 1;
    [0.25,0.5,0.75].forEach(f => {
        ctx.beginPath(); ctx.moveTo(0, h*f); ctx.lineTo(w, h*f); ctx.stroke();
    });

    // Fill
    ctx.beginPath();
    data.forEach((v,i) => { const x=i*step, y=h-(v/max)*h*0.9-4; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = 'rgba(0,219,231,0.08)'; ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v,i) => { const x=i*step, y=h-(v/max)*h*0.9-4; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle = '#00dbe7'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    data.forEach((v,i) => {
        const x=i*step, y=h-(v/max)*h*0.9-4;
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
        ctx.fillStyle='#00dbe7'; ctx.fill();
    });
}

// ===== HISTORY =====
function saveHistory(entry) {
    const history = JSON.parse(localStorage.getItem('speedlab_history') || '[]');
    entry.date = new Date().toLocaleString();
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem('speedlab_history', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('speedlab_history') || '[]');
    const el = $('history-list');
    if (!history.length) {
        el.innerHTML = '<div class="font-mono text-outline text-sm text-center py-10">No sessions recorded yet.</div>';
        return;
    }
    el.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <div class="flex items-center gap-4">
                <div class="font-orbitron text-2xl text-primary-fixed-dim w-16">${h.wpm}</div>
                <div>
                    <div class="font-mono text-xs text-on-surface">${h.rating} · ${h.mode.toUpperCase()} ${h.amount}</div>
                    <div class="font-mono text-[10px] text-outline mt-1">${h.date}</div>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div><div class="font-mono text-[9px] text-outline">ACC</div><div class="font-mono text-sm text-on-surface">${h.acc}%</div></div>
                <div><div class="font-mono text-[9px] text-outline">RAW</div><div class="font-mono text-sm text-on-surface">${h.raw}</div></div>
                <div><div class="font-mono text-[9px] text-outline">ERR</div><div class="font-mono text-sm text-red-400">${h.errors}</div></div>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('Clear all history?')) { localStorage.removeItem('speedlab_history'); loadHistory(); }
}

// Load history when that tab is opened
$$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => { if (tab.dataset.target === 'history-section') loadHistory(); });
});

// ===== CLOSE RESULT =====
function closeResult() {
    $('result-overlay').classList.remove('show');
    restartTest();
}
function restartSameTest() {
    $('result-overlay').classList.remove('show');
    lastText = generateText();
    renderText();
    $('hidden-input').value = '';
    charIndex = 0;
    typingActive = false;
    clearInterval(timer);
    timeLeft = testType === 'time' ? testAmount : 0;
    $('timer-val').textContent = testType === 'time' ? timeLeft + 's' : '—';
    $('wpm-val').textContent = '000';
    $('raw-val').textContent = '000';
    $('acc-val').textContent = '100%';
    wpmHistory = []; startTime = null; mistakes = 0;
    $('hidden-input').focus();
}

// ===== NETWORK TEST =====
const circle = $('progress-circle');
const circ = 2 * Math.PI * 88;
circle.style.strokeDasharray = circ;
circle.style.strokeDashoffset = circ;

function setProgress(pct) {
    circle.style.strokeDashoffset = circ - (pct/100) * circ;
}

$('btn-start-speed').addEventListener('click', async () => {
    const btn = $('btn-start-speed');
    btn.disabled = true;
    $('internet-results').classList.add('opacity-0');
    $('internet-results').classList.remove('opacity-100');
    $('speed-val').textContent = '0.0';
    setProgress(0);
    try {
        $('phase-name').textContent = 'PING'; $('phase-status').textContent = 'MEASURING LATENCY...';
        const ping = await measurePing();
        $('res-ping').textContent = ping; setProgress(33);

        $('phase-name').textContent = 'DOWNLOAD'; $('phase-status').textContent = 'STREAMING 5MB PACKET...';
        const down = await measureDownload();
        $('res-down').textContent = down; setProgress(66);

        $('phase-name').textContent = 'UPLOAD'; $('phase-status').textContent = 'UPLOADING BLOB...';
        const up = await measureUpload();
        $('res-up').textContent = up; setProgress(100);

        $('phase-name').textContent = 'COMPLETE'; $('phase-status').textContent = 'ANALYSIS FINALIZED';
        $('internet-results').classList.remove('opacity-0'); $('internet-results').classList.add('opacity-100');
        btn.textContent = 'RE-RUN ANALYSIS';
    } catch(e) {
        $('phase-name').textContent = 'ERROR'; $('phase-status').textContent = 'CONNECTION INTERRUPTED';
    } finally { btn.disabled = false; }
});

async function measurePing() {
    let total = 0;
    for (let i = 0; i < 4; i++) {
        const t = performance.now();
        await fetch('https://www.google.com/favicon.ico', { mode:'no-cors', cache:'no-store' });
        total += performance.now() - t;
        await new Promise(r => setTimeout(r, 100));
    }
    const val = Math.round(total/4);
    $('speed-val').textContent = val; return val;
}

async function measureDownload() {
    const url = 'https://speed.cloudflare.com/__down?bytes=5000000';
    const start = performance.now();
    const res = await fetch(url, { cache:'no-store' });
    const reader = res.body.getReader();
    let bytes = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        const mbps = (bytes*8)/((performance.now()-start)/1000*1e6);
        $('speed-val').textContent = mbps.toFixed(1);
    }
    return ((bytes*8)/((performance.now()-start)/1000*1e6)).toFixed(1);
}

async function measureUpload() {
    const data = new Uint8Array(1e6);
    const start = performance.now();
    await fetch('https://httpbin.org/post', { method:'POST', body:data, cache:'no-store' });
    const mbps = (1e6*8)/((performance.now()-start)/1000*1e6);
    $('speed-val').textContent = mbps.toFixed(1);
    return mbps.toFixed(1);
}

// ===== INIT =====
initTest();
