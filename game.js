/* ========================================
   FRACTION PIECES v4 - Full Audio Edition
   ======================================== */

// ===== STATE =====
let currentLevel = 0;
let totalStars = 0;
let selectedTopping = null;
let placedToppings = [null, null, null, null];
let questionAttempts = 0;
let gameActive = false;

const $ = id => document.getElementById(id);

// ===== CONSTANTS =====
const CX = 150, CY = 150, R = 120;

const TOPPING_COLORS = {
  cheese:    { fill: '#ffd54f', stroke: '#f9a825' },
  olive:     { fill: '#81c784', stroke: '#43a047' },
  pepperoni: { fill: '#ef5350', stroke: '#c62828' }
};
const TOPPING_EMOJI = { cheese: '\u{1F9C0}', olive: '\u{1FAD2}', pepperoni: '\u{1F355}' };
const TOPPING_NAMES = { cheese: 'Cheese', olive: 'Olive', pepperoni: 'Pepperoni' };

const SLICE_DECO = [
  [{ x: 195, y: 85 }, { x: 215, y: 115 }, { x: 185, y: 120 }],
  [{ x: 195, y: 195 }, { x: 220, y: 215 }, { x: 190, y: 230 }],
  [{ x: 105, y: 195 }, { x: 80, y: 215 }, { x: 110, y: 230 }],
  [{ x: 105, y: 85 }, { x: 80, y: 115 }, { x: 115, y: 120 }]
];
const ORDER_DECO = [
  [{ x: 78, y: 35 }, { x: 85, y: 48 }],
  [{ x: 78, y: 75 }, { x: 88, y: 85 }],
  [{ x: 42, y: 75 }, { x: 32, y: 85 }],
  [{ x: 42, y: 35 }, { x: 35, y: 48 }]
];
const Q_DECO = [
  [{ x: 130, y: 56 }, { x: 143, y: 76 }, { x: 123, y: 80 }],
  [{ x: 130, y: 130 }, { x: 147, y: 143 }, { x: 127, y: 153 }],
  [{ x: 70, y: 130 }, { x: 53, y: 143 }, { x: 73, y: 153 }],
  [{ x: 70, y: 56 }, { x: 53, y: 76 }, { x: 77, y: 80 }]
];
const SLICE_ANGLES = [[-90, 0], [0, 90], [90, 180], [180, 270]];

const CHEF_MESSAGES = {
  start: ["Let's make a yummy pizza! \u{1F355}","New order! \u{1F4CB}","Pizza time! \u{1F60B}","Ready to cook? \u{1F468}\u{200D}\u{1F373}"],
  pickTopping: ["Pick a topping first! \u{1F446}","Tap a topping! \u{1F447}","Choose your topping! \u{1F60A}"],
  placed: ["Nice! Keep going! \u{1F44D}","Yum! \u{1F60B}","Looking good! \u{2728}","Great choice! \u{1F31F}"],
  allFilled: ["Hit Check! \u{2705}","All done! Check it! \u{1F389}","Looks delicious! \u{1F60D}"],
  wrong: ["Not quite! Try again! \u{1F914}","Oops! Check the order! \u{1F9D0}","Almost! \u{1F4CB}"],
  correct: ["Perfect pizza! \u{1F389}","You nailed it! \u{1F31F}","Delicious! \u{1F60D}"]
};

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// =============================================
// AUDIO ENGINE
// =============================================
let audioCtx = null;
let sfxEnabled = true;
let musicEnabled = true;
let musicInterval = null;
let musicGain = null;
let currentBeat = 0;

function initAudio() {
  if (audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.08;
  musicGain.connect(audioCtx.destination);
  return audioCtx;
}

function ensureAudio() {
  const ctx = initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// --- Basic tone with envelope ---
function tone(freq, dur, type, vol, dest) {
  const ctx = audioCtx;
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol || 0.12, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(g);
  g.connect(dest || ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

// --- Noise burst (for splat/pop sounds) ---
function noiseBurst(dur, vol) {
  const ctx = audioCtx;
  if (!ctx) return;
  const bufSize = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(vol || 0.08, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 1200;
  filt.Q.value = 0.8;
  src.connect(filt);
  filt.connect(g);
  g.connect(ctx.destination);
  src.start(now);
  src.stop(now + dur);
}

// --- Chord (multiple tones) ---
function chord(freqs, dur, type, vol) {
  freqs.forEach(f => tone(f, dur, type, (vol || 0.06) / freqs.length));
}

// ===== SOUND EFFECTS =====
function sfxSelect() {
  if (!sfxEnabled || !audioCtx) return;
  tone(880, 0.08, 'sine', 0.08);
  tone(1100, 0.06, 'sine', 0.05);
}

function sfxPlace() {
  if (!sfxEnabled || !audioCtx) return;
  // Cartoon "plop" = quick pitch drop + noise
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
  noiseBurst(0.06, 0.06);
}

function sfxCorrect() {
  if (!sfxEnabled || !audioCtx) return;
  // Happy ascending arpeggio
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => {
      tone(f, 0.2, 'sine', 0.1);
      tone(f * 1.5, 0.15, 'triangle', 0.04);
    }, i * 100);
  });
}

function sfxWrong() {
  if (!sfxEnabled || !audioCtx) return;
  // Descending "womp womp"
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(350, now);
  osc.frequency.linearRampToValueAtTime(180, now + 0.35);
  g.gain.setValueAtTime(0.12, now);
  g.gain.linearRampToValueAtTime(0.08, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
  // Second womp
  setTimeout(() => {
    if (!audioCtx) return;
    const o2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    const n2 = audioCtx.currentTime;
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(280, n2);
    o2.frequency.linearRampToValueAtTime(120, n2 + 0.4);
    g2.gain.setValueAtTime(0.1, n2);
    g2.gain.exponentialRampToValueAtTime(0.001, n2 + 0.5);
    o2.connect(g2);
    g2.connect(audioCtx.destination);
    o2.start(n2);
    o2.stop(n2 + 0.5);
  }, 250);
}

function sfxCelebrate() {
  if (!sfxEnabled || !audioCtx) return;
  // Fanfare! Major chord arpeggiate then resolve
  const melody = [523, 523, 659, 784, 659, 784, 1047];
  const durs =   [0.1, 0.1, 0.1, 0.15, 0.1, 0.15, 0.4];
  let t = 0;
  melody.forEach((f, i) => {
    setTimeout(() => {
      tone(f, durs[i] + 0.15, 'sine', 0.1);
      tone(f * 0.5, durs[i] + 0.1, 'triangle', 0.04);
      if (i === melody.length - 1) {
        // Final chord
        chord([1047, 1318, 1568], 0.5, 'sine', 0.08);
      }
    }, t);
    t += durs[i] * 1000;
  });
}

function sfxStar() {
  if (!sfxEnabled || !audioCtx) return;
  // Sparkle
  tone(1500, 0.1, 'sine', 0.06);
  setTimeout(() => tone(2000, 0.15, 'sine', 0.05), 60);
  setTimeout(() => tone(2500, 0.2, 'sine', 0.04), 120);
  noiseBurst(0.04, 0.03);
}

function sfxButton() {
  if (!sfxEnabled || !audioCtx) return;
  tone(700, 0.05, 'sine', 0.06);
}

// ===== BACKGROUND MUSIC =====
// A cheerful 8-bar pizzeria loop in C major
const MELODY_NOTES = [
  // Bar 1-2: C major theme
  523, 587, 659, 587, 523, 0, 440, 494,
  523, 0, 659, 0, 784, 659, 523, 0,
  // Bar 3-4: F major
  698, 659, 587, 523, 587, 0, 698, 784,
  880, 784, 698, 0, 659, 587, 523, 0,
  // Bar 5-6: G major answer
  784, 698, 659, 587, 659, 0, 784, 880,
  784, 0, 659, 0, 587, 523, 494, 0,
  // Bar 7-8: Resolve to C
  523, 587, 659, 784, 880, 784, 659, 523,
  587, 0, 523, 0, 0, 0, 0, 0
];

const BASS_NOTES = [
  // Simple bass following chord roots
  131, 0, 0, 0, 131, 0, 0, 0,
  131, 0, 0, 0, 165, 0, 0, 0,
  175, 0, 0, 0, 175, 0, 0, 0,
  175, 0, 0, 0, 165, 0, 0, 0,
  196, 0, 0, 0, 196, 0, 0, 0,
  196, 0, 0, 0, 165, 0, 0, 0,
  131, 0, 0, 0, 165, 0, 0, 0,
  131, 0, 131, 0, 0, 0, 0, 0
];

function playMusicBeat() {
  if (!musicEnabled || !audioCtx || !musicGain) return;
  
  const idx = currentBeat % MELODY_NOTES.length;
  const melNote = MELODY_NOTES[idx];
  const bassNote = BASS_NOTES[idx];
  
  if (melNote > 0) {
    tone(melNote, 0.18, 'sine', 0.06, musicGain);
    tone(melNote, 0.12, 'triangle', 0.02, musicGain);
  }
  if (bassNote > 0) {
    tone(bassNote, 0.25, 'triangle', 0.05, musicGain);
  }
  
  currentBeat++;
}

function startMusic() {
  if (!musicEnabled) return;
  ensureAudio();
  stopMusic();
  currentBeat = 0;
  if (musicGain) musicGain.gain.value = 0.08;
  musicInterval = setInterval(playMusicBeat, 200); // 150 BPM (200ms per 16th note)
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  const btn = $('musicBtn');
  btn.classList.toggle('on', musicEnabled);
  btn.classList.toggle('off', !musicEnabled);
  btn.innerHTML = musicEnabled ? '&#9834;' : '&#9835;';
  if (musicEnabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

function toggleSfx() {
  sfxEnabled = !sfxEnabled;
  const btn = $('sfxBtn');
  btn.classList.toggle('on', sfxEnabled);
  btn.classList.toggle('off', !sfxEnabled);
  btn.innerHTML = sfxEnabled ? '&#128264;' : '&#128263;';
}

// =============================================
// FLOATING BACKGROUND
// =============================================
function initFloatingBg() {
  const c = $('floatingBg');
  if (!c) return;
  c.innerHTML = '';
  const items = ['\u{1F355}','\u{1F9C0}','\u{1FAD2}','\u2B50','\u{1F525}','\u{1F345}','\u{1F952}','\u{1F374}'];
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = items[i % items.length];
    el.style.left = (Math.random() * 100) + '%';
    el.style.fontSize = (18 + Math.random() * 16) + 'px';
    el.style.setProperty('--dur', (10 + Math.random() * 15) + 's');
    el.style.setProperty('--delay', (Math.random() * 10) + 's');
    el.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    c.appendChild(el);
  }
}

// =============================================
// SVG PIZZA DRAWING
// =============================================
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function slicePath(cx, cy, r, sa, ea) {
  const s = sa * Math.PI / 180, e = ea * Math.PI / 180;
  return `M${cx},${cy} L${cx+r*Math.cos(s)},${cy+r*Math.sin(s)} A${r},${r} 0 0,1 ${cx+r*Math.cos(e)},${cy+r*Math.sin(e)} Z`;
}

function drawPizza(svg, toppings, cx, cy, r, decos, isOrder) {
  svg.innerHTML = '';
  if (!isOrder) svg.appendChild(svgEl('ellipse', { cx, cy: cy+6, rx: r+4, ry: 10, fill: 'rgba(0,0,0,0.06)' }));
  svg.appendChild(svgEl('circle', { cx, cy, r: r + (isOrder ? 4 : 10), fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 1 : 2.5 }));
  if (!isOrder) svg.appendChild(svgEl('circle', { cx, cy, r: r+10, fill: 'none', stroke: '#e8be7a', 'stroke-width': 1, opacity: '0.5' }));
  svg.appendChild(svgEl('circle', { cx, cy, r, fill: '#ffe082', stroke: '#f0c040', 'stroke-width': isOrder ? 0.5 : 1 }));

  for (let i = 0; i < 4; i++) {
    const top = toppings[i];
    const [sa, ea] = SLICE_ANGLES[i];
    const g = svgEl('g');

    if (top) {
      const col = TOPPING_COLORS[top];
      g.appendChild(svgEl('path', { d: slicePath(cx,cy,r,sa,ea), fill: col.fill, stroke: col.stroke, 'stroke-width': isOrder ? 0.5 : 1.5, opacity: '0.88' }));
      decos[i].forEach(pos => {
        if (top === 'cheese') {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 3 : 7, fill: '#ffb300', opacity: '0.55' }));
          g.appendChild(svgEl('circle', { cx: pos.x-(isOrder?1:2), cy: pos.y-(isOrder?1:2), r: isOrder ? 1.5 : 3.5, fill: '#fff3c4', opacity: '0.7' }));
        } else if (top === 'olive') {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 4 : 9, fill: '#2e7d32', stroke: '#1b5e20', 'stroke-width': isOrder ? 0.5 : 1 }));
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 1.8 : 4, fill: '#81c784', opacity: '0.45' }));
        } else {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 4.5 : 10, fill: '#c62828', stroke: '#8e0000', 'stroke-width': isOrder ? 0.5 : 1 }));
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 2.5 : 5, fill: '#ef5350', opacity: '0.35' }));
          g.appendChild(svgEl('circle', { cx: pos.x-(isOrder?1:3), cy: pos.y-(isOrder?1:3), r: isOrder ? 1 : 2, fill: '#ff8a80', opacity: '0.4' }));
        }
      });
    } else if (!isOrder) {
      g.appendChild(svgEl('path', { d: slicePath(cx,cy,r,sa,ea), fill: '#ffe8b0', stroke: '#e0c878', 'stroke-width': 1.5, 'stroke-dasharray': '8 5', opacity: '0.6' }));
      const mid = (sa+ea)/2 * Math.PI / 180;
      const txt = svgEl('text', { x: cx+r*0.55*Math.cos(mid), y: cy+r*0.55*Math.sin(mid)+5, 'text-anchor': 'middle', 'font-size': '22', 'font-family': 'Fredoka,sans-serif', fill: '#d4b080', opacity: '0.6', 'font-weight': '600' });
      txt.textContent = '?';
      g.appendChild(txt);
    }

    if (!isOrder) {
      const hit = svgEl('path', { d: slicePath(cx,cy,r,sa,ea), fill: 'transparent', cursor: 'pointer', class: 'pizza-slice', 'data-slice': i });
      hit.addEventListener('click', () => onSliceClick(i));
      g.appendChild(hit);
    }
    svg.appendChild(g);
  }

  svg.appendChild(svgEl('circle', { cx, cy, r: isOrder ? 3 : 7, fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 0.5 : 1.5 }));
  for (let i = 0; i < 4; i++) {
    const a = SLICE_ANGLES[i][0] * Math.PI / 180;
    svg.appendChild(svgEl('line', { x1: cx, y1: cy, x2: cx+r*Math.cos(a), y2: cy+r*Math.sin(a), stroke: '#c49040', 'stroke-width': isOrder ? 0.8 : 2, opacity: '0.5' }));
  }
}

// =============================================
// UI HELPERS
// =============================================
function updateProgressDots() {
  const c = $('progressDots');
  c.innerHTML = '';
  for (let i = 0; i < levels.length; i++) {
    const d = document.createElement('div');
    d.className = 'prog-dot ' + (i < currentLevel ? 'done' : i === currentLevel ? 'current' : 'future');
    c.appendChild(d);
  }
}

function updateSliceNumbers() {
  const c = $('sliceNumbers');
  c.innerHTML = '';
  const pos = [{top:'18%',left:'62%'},{top:'62%',left:'62%'},{top:'62%',left:'18%'},{top:'18%',left:'18%'}];
  for (let i = 0; i < 4; i++) {
    const n = document.createElement('div');
    n.className = 'slice-num';
    n.textContent = i + 1;
    n.style.top = pos[i].top;
    n.style.left = pos[i].left;
    c.appendChild(n);
  }
}

function chefSay(cat) {
  $('chefText').textContent = randomFrom(CHEF_MESSAGES[cat]);
  $('chefBubble').style.animation = 'none';
  $('chefBubble').offsetHeight;
  $('chefBubble').style.animation = 'bubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
}

function buildToppingBar(order) {
  const c = $('toppingChoices');
  c.innerHTML = '';
  [...new Set(order)].forEach(top => {
    const btn = document.createElement('div');
    btn.className = 'topping-btn';
    btn.dataset.topping = top;
    btn.innerHTML = `<div class="topping-preview preview-${top}">${TOPPING_EMOJI[top]}</div><div class="topping-label">${TOPPING_NAMES[top]}</div>`;
    btn.addEventListener('click', () => selectTopping(top, btn));
    c.appendChild(btn);
  });
}

// =============================================
// GAME LOGIC
// =============================================
function selectTopping(top, btn) {
  selectedTopping = top;
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  sfxSelect();
  $('toppingTitle').textContent = 'Now tap a slice! \u{1F447}';
  document.querySelectorAll('.pizza-slice').forEach(el => {
    el.classList.toggle('highlight', placedToppings[parseInt(el.dataset.slice)] === null);
  });
}

function onSliceClick(i) {
  if (!gameActive) return;
  if (!selectedTopping) {
    $('mainPizza').classList.add('error-shake');
    setTimeout(() => $('mainPizza').classList.remove('error-shake'), 400);
    sfxWrong();
    chefSay('pickTopping');
    return;
  }
  if (placedToppings[i] !== null) { placedToppings[i] = null; }
  else { placedToppings[i] = selectedTopping; sfxPlace(); chefSay('placed'); }

  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);

  document.querySelectorAll('.pizza-slice').forEach(el => {
    const idx = parseInt(el.dataset.slice);
    if (idx === i && placedToppings[i] !== null) {
      el.parentElement.classList.add('slice-placed');
      setTimeout(() => el.parentElement.classList.remove('slice-placed'), 400);
    }
    el.classList.toggle('highlight', selectedTopping && placedToppings[idx] === null);
  });

  if (placedToppings.every(t => t !== null)) {
    $('checkBtn').classList.add('visible');
    $('toppingTitle').textContent = 'Hit Check! \u{2705}';
    chefSay('allFilled');
    selectedTopping = null;
    document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.pizza-slice').forEach(el => el.classList.remove('highlight'));
  } else {
    $('checkBtn').classList.remove('visible');
  }
}

function checkPizza() {
  if (!gameActive) return;
  sfxButton();
  const correct = levels[currentLevel].order.every((t, i) => placedToppings[i] === t);
  if (correct) {
    sfxCorrect();
    gameActive = false;
    chefSay('correct');
    setTimeout(() => showFractionQuestion(), 700);
  } else {
    sfxWrong();
    $('mainPizza').classList.add('error-shake');
    setTimeout(() => $('mainPizza').classList.remove('error-shake'), 400);
    chefSay('wrong');
    $('toppingTitle').textContent = 'Check the order! \u{1F4CB}';
    setTimeout(() => { $('toppingTitle').textContent = 'Pick a topping!'; }, 2500);
  }
}

// =============================================
// FRACTION QUESTION
// =============================================
function showFractionQuestion() {
  const level = levels[currentLevel];
  questionAttempts = 0;
  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const toppings = Object.keys(counts);
  const interesting = toppings.filter(t => counts[t] !== 4);
  const ask = interesting.length > 0 ? randomFrom(interesting) : toppings[0];
  const correctFrac = `${counts[ask]}/4`;

  $('questionText').textContent = `What fraction is ${TOPPING_NAMES[ask]}?`;
  $('questionEmoji').textContent = TOPPING_EMOJI[ask];
  drawPizza($('questionPizza'), level.order, 100, 100, 80, Q_DECO, true);

  const c = $('answerChoices');
  c.innerHTML = '';
  ['1/4','2/4','3/4','4/4'].sort(() => Math.random()-0.5).forEach(frac => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = frac;
    btn.addEventListener('click', () => handleAnswer(btn, frac, correctFrac));
    c.appendChild(btn);
  });

  // Pause music during question
  stopMusic();
  $('questionOverlay').classList.remove('hidden');
  $('questionOverlay').classList.add('fade-in');
}

function handleAnswer(btn, chosen, correct) {
  if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
  questionAttempts++;
  sfxButton();
  if (chosen === correct) {
    btn.classList.add('correct');
    sfxCorrect();
    document.querySelectorAll('.answer-btn').forEach(b => b.style.pointerEvents = 'none');
    const stars = questionAttempts === 1 ? 3 : questionAttempts === 2 ? 2 : 1;
    totalStars += stars;
    setTimeout(() => { $('questionOverlay').classList.add('hidden'); showCelebration(stars); }, 900);
  } else {
    btn.classList.add('wrong');
    sfxWrong();
    btn.style.pointerEvents = 'none';
    if (questionAttempts >= 3) {
      setTimeout(() => {
        document.querySelectorAll('.answer-btn').forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
      }, 500);
    }
  }
}

// =============================================
// CELEBRATION
// =============================================
function showCelebration(stars) {
  sfxCelebrate();
  for (let i = 0; i < stars; i++) setTimeout(sfxStar, 500 + i * 300);

  $('celebEmoji').textContent = randomFrom(['\u{1F389}','\u{1F38A}','\u{1F973}','\u{1F929}']);
  $('celebStars').textContent = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);

  const t3 = ['PERFECT! \u{1F31F}','INCREDIBLE! \u{1F525}','SUPERSTAR! \u{1F680}'];
  const t2 = ['Great job! \u{1F389}','Awesome! \u{1F44F}','Fantastic! \u{2728}'];
  const t1 = ['Good try! \u{1F44D}','Nice work! \u{1F60A}','Keep going! \u{1F4AA}'];
  $('celebText').textContent = randomFrom(stars === 3 ? t3 : stars === 2 ? t2 : t1);
  $('celebSub').textContent = `+${stars} star${stars > 1 ? 's' : ''}!`;

  $('totalStars').textContent = totalStars;
  $('starCount').classList.add('star-earned');
  setTimeout(() => $('starCount').classList.remove('star-earned'), 600);

  $('nextBtn').textContent = currentLevel >= levels.length - 1 ? 'See Results \u{1F3C6}' : 'Next Level \u{27A1}';
  $('celebrationOverlay').classList.remove('hidden');
  $('celebrationOverlay').classList.add('fade-in');
  spawnConfetti($('confettiContainer'));
  spawnFlyingStars(stars);
}

function spawnConfetti(container) {
  container.innerHTML = '';
  const colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#ff8c00','#4caf50','#e056fd'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left = Math.random()*100+'vw';
    p.style.width = (6+Math.random()*10)+'px';
    p.style.height = (6+Math.random()*10)+'px';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.borderRadius = Math.random()>0.5?'50%':Math.random()>0.5?'2px':'0';
    p.style.setProperty('--delay', (Math.random()*1)+'s');
    p.style.setProperty('--fall-dur', (2+Math.random()*2.5)+'s');
    p.style.setProperty('--drift', (Math.random()*100-50)+'px');
    p.style.setProperty('--spin', (Math.random()*1080)+'deg');
    container.appendChild(p);
  }
}

function spawnFlyingStars(count) {
  const c = $('flyingStars');
  c.innerHTML = '';
  for (let i = 0; i < count * 3; i++) {
    const s = document.createElement('div');
    s.className = 'flying-star';
    s.textContent = '\u2B50';
    s.style.left = (30+Math.random()*40)+'%';
    s.style.top = (40+Math.random()*20)+'%';
    s.style.setProperty('--d', (i*0.12)+'s');
    s.style.setProperty('--tx', (Math.random()*200-100)+'px');
    s.style.setProperty('--ty', -(100+Math.random()*200)+'px');
    s.style.setProperty('--rot', (Math.random()*720-360)+'deg');
    c.appendChild(s);
  }
}

// =============================================
// LEVEL MANAGEMENT
// =============================================
function loadLevel(idx) {
  currentLevel = idx;
  const level = levels[idx];
  selectedTopping = null;
  placedToppings = [null,null,null,null];
  gameActive = true;
  $('levelNum').textContent = idx + 1;
  $('totalStars').textContent = totalStars;
  $('checkBtn').classList.remove('visible');
  updateProgressDots();
  updateSliceNumbers();
  drawPizza($('orderPizza'), level.order, 60, 60, 46, ORDER_DECO, true);

  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t]||0)+1; });
  const fc = $('orderFractions');
  fc.innerHTML = '';
  Object.entries(counts).forEach(([top, count], i) => {
    const tag = document.createElement('span');
    tag.className = `order-tag ${top}`;
    tag.textContent = `${TOPPING_EMOJI[top]} ${count}/4`;
    tag.style.animationDelay = (i*0.1)+'s';
    fc.appendChild(tag);
  });

  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);
  buildToppingBar(level.order);
  chefSay('start');
  $('toppingTitle').textContent = 'Pick a topping!';
  $('gameScreen').classList.add('level-enter');
  setTimeout(() => $('gameScreen').classList.remove('level-enter'), 600);

  // Resume music
  if (musicEnabled && audioCtx) startMusic();
}

function nextLevel() {
  sfxButton();
  $('celebrationOverlay').classList.add('hidden');
  $('confettiContainer').innerHTML = '';
  $('flyingStars').innerHTML = '';
  if (currentLevel >= levels.length - 1) showGameComplete();
  else loadLevel(currentLevel + 1);
}

function showGameComplete() {
  stopMusic();
  const maxStars = levels.length * 3;
  $('finalScore').textContent = `You collected ${totalStars} / ${maxStars} stars!`;
  const row = $('finalStarRow');
  row.innerHTML = '';
  for (let i = 0; i < maxStars; i++) {
    const s = document.createElement('span');
    s.className = 'final-star' + (i >= totalStars ? ' empty' : '');
    s.textContent = '\u2B50';
    s.style.setProperty('--d', (i*0.05)+'s');
    row.appendChild(s);
  }
  $('completeOverlay').classList.remove('hidden');
  $('completeOverlay').classList.add('fade-in');
  sfxCelebrate();
  setTimeout(sfxCelebrate, 400);
  setTimeout(sfxCelebrate, 800);
  spawnConfetti($('confettiContainer2'));
}

// =============================================
// START / RESTART
// =============================================
function startGame() {
  ensureAudio();
  $('startScreen').style.display = 'none';
  $('gameScreen').style.display = 'block';
  currentLevel = 0;
  totalStars = 0;
  loadLevel(0);
  startMusic();
}

function restartGame() {
  sfxButton();
  $('completeOverlay').classList.add('hidden');
  currentLevel = 0;
  totalStars = 0;
  loadLevel(0);
}

function resetPizza() {
  if (!gameActive) return;
  sfxSelect();
  placedToppings = [null,null,null,null];
  selectedTopping = null;
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);
  $('checkBtn').classList.remove('visible');
  $('toppingTitle').textContent = 'Pick a topping!';
  chefSay('start');
}

function showHowToPlay() { sfxButton(); $('howToPlayOverlay').classList.remove('hidden'); $('howToPlayOverlay').classList.add('fade-in'); }
function hideHowToPlay() { sfxButton(); $('howToPlayOverlay').classList.add('hidden'); }

// ===== INIT =====
initFloatingBg();

