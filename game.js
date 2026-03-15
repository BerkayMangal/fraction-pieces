/* ========================================
   FRACTION PIECES v3 - Enhanced Game Engine
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
  cheese:    { fill: '#ffd54f', stroke: '#f9a825', accent: '#ffb300' },
  olive:     { fill: '#81c784', stroke: '#43a047', accent: '#388e3c' },
  pepperoni: { fill: '#ef5350', stroke: '#c62828', accent: '#d32f2f' }
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
  start: [
    "Let's make a yummy pizza! \u{1F355}",
    "New order coming in! \u{1F4CB}",
    "Pizza time! Look at the order! \u{1F60B}",
    "Ready to cook? Check the order! \u{1F468}\u{200D}\u{1F373}"
  ],
  pickTopping: [
    "Pick a topping first! \u{1F446}",
    "Tap a topping to start! \u{1F447}",
    "Choose your topping! \u{1F60A}"
  ],
  placed: [
    "Nice! Keep going! \u{1F44D}",
    "Yum! More toppings! \u{1F60B}",
    "Looking good! \u{2728}",
    "Great choice! \u{1F31F}"
  ],
  allFilled: [
    "Pizza looks ready! Hit Check! \u{2705}",
    "All slices done! Check it! \u{1F389}",
    "Looks delicious! Time to check! \u{1F60D}"
  ],
  wrong: [
    "Hmm, not quite! Try again! \u{1F914}",
    "Oops! Look at the order card! \u{1F9D0}",
    "Almost! Check the order! \u{1F4CB}"
  ],
  correct: [
    "Perfect pizza! \u{1F389}",
    "You nailed it! \u{1F31F}",
    "Delicious! \u{1F60D}"
  ]
};

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ===== FLOATING BACKGROUND =====
function initFloatingBg() {
  const container = $('floatingBg');
  if (!container) return;
  container.innerHTML = '';
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
    container.appendChild(el);
  }
}

// ===== AUDIO =====
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type = 'sine', vol = 0.13) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}
function sfxPlace() { playTone(500, 0.08); setTimeout(() => playTone(700, 0.1), 60); }
function sfxSelect() { playTone(800, 0.08, 'sine', 0.1); }
function sfxCorrect() {
  playTone(523, 0.12); 
  setTimeout(() => playTone(659, 0.12), 80);
  setTimeout(() => playTone(784, 0.2), 160);
}
function sfxWrong() { playTone(200, 0.25, 'triangle', 0.08); }
function sfxCelebrate() {
  [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.18, 'sine', 0.1), i * 80);
  });
}

// ===== SVG HELPERS =====
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
function slicePath(cx, cy, r, sa, ea) {
  const s = sa * Math.PI / 180, e = ea * Math.PI / 180;
  return `M${cx},${cy} L${cx + r * Math.cos(s)},${cy + r * Math.sin(s)} A${r},${r} 0 0,1 ${cx + r * Math.cos(e)},${cy + r * Math.sin(e)} Z`;
}

// ===== DRAW PIZZA =====
function drawPizza(svg, toppings, cx, cy, r, decos, isOrder = false) {
  svg.innerHTML = '';

  // Shadow
  if (!isOrder) {
    svg.appendChild(svgEl('ellipse', { cx, cy: cy + 6, rx: r + 4, ry: 10, fill: 'rgba(0,0,0,0.06)' }));
  }

  // Crust
  svg.appendChild(svgEl('circle', {
    cx, cy, r: r + (isOrder ? 4 : 10),
    fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 1 : 2.5
  }));
  // Crust highlights
  if (!isOrder) {
    svg.appendChild(svgEl('circle', {
      cx, cy, r: r + 10,
      fill: 'none', stroke: '#e8be7a', 'stroke-width': 1, opacity: '0.5'
    }));
  }

  // Base
  svg.appendChild(svgEl('circle', {
    cx, cy, r,
    fill: '#ffe082', stroke: '#f0c040', 'stroke-width': isOrder ? 0.5 : 1
  }));

  // Slices
  for (let i = 0; i < 4; i++) {
    const top = toppings[i];
    const [sa, ea] = SLICE_ANGLES[i];
    const g = svgEl('g');

    if (top) {
      const col = TOPPING_COLORS[top];
      g.appendChild(svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: col.fill, stroke: col.stroke,
        'stroke-width': isOrder ? 0.5 : 1.5, opacity: '0.88'
      }));
      // Decorations
      decos[i].forEach(pos => {
        if (top === 'cheese') {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 3 : 7, fill: '#ffb300', opacity: '0.55' }));
          g.appendChild(svgEl('circle', { cx: pos.x - (isOrder ? 1 : 2), cy: pos.y - (isOrder ? 1 : 2), r: isOrder ? 1.5 : 3.5, fill: '#fff3c4', opacity: '0.7' }));
        } else if (top === 'olive') {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 4 : 9, fill: '#2e7d32', stroke: '#1b5e20', 'stroke-width': isOrder ? 0.5 : 1 }));
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 1.8 : 4, fill: '#81c784', opacity: '0.45' }));
        } else if (top === 'pepperoni') {
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 4.5 : 10, fill: '#c62828', stroke: '#8e0000', 'stroke-width': isOrder ? 0.5 : 1 }));
          g.appendChild(svgEl('circle', { cx: pos.x, cy: pos.y, r: isOrder ? 2.5 : 5, fill: '#ef5350', opacity: '0.35' }));
          g.appendChild(svgEl('circle', { cx: pos.x - (isOrder?1:3), cy: pos.y - (isOrder?1:3), r: isOrder ? 1 : 2, fill: '#ff8a80', opacity: '0.4' }));
        }
      });
    } else if (!isOrder) {
      g.appendChild(svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: '#ffe8b0', stroke: '#e0c878',
        'stroke-width': 1.5, 'stroke-dasharray': '8 5', opacity: '0.6'
      }));
      // Question mark on empty slice
      const mid = (sa + ea) / 2 * Math.PI / 180;
      const tx = cx + r * 0.55 * Math.cos(mid);
      const ty = cy + r * 0.55 * Math.sin(mid);
      const txt = svgEl('text', {
        x: tx, y: ty + 5,
        'text-anchor': 'middle',
        'font-size': '22', 'font-family': 'Fredoka, sans-serif',
        fill: '#d4b080', opacity: '0.6', 'font-weight': '600'
      });
      txt.textContent = '?';
      g.appendChild(txt);
    }

    // Click target
    if (!isOrder) {
      const hit = svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: 'transparent', cursor: 'pointer',
        class: 'pizza-slice', 'data-slice': i
      });
      hit.addEventListener('click', () => onSliceClick(i));
      g.appendChild(hit);
    }
    svg.appendChild(g);
  }

  // Center
  svg.appendChild(svgEl('circle', {
    cx, cy, r: isOrder ? 3 : 7,
    fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 0.5 : 1.5
  }));

  // Dividers
  for (let i = 0; i < 4; i++) {
    const a = SLICE_ANGLES[i][0] * Math.PI / 180;
    svg.appendChild(svgEl('line', {
      x1: cx, y1: cy,
      x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a),
      stroke: '#c49040', 'stroke-width': isOrder ? 0.8 : 2, opacity: '0.5'
    }));
  }
}

// ===== PROGRESS DOTS =====
function updateProgressDots() {
  const container = $('progressDots');
  container.innerHTML = '';
  for (let i = 0; i < levels.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'prog-dot ' + (i < currentLevel ? 'done' : i === currentLevel ? 'current' : 'future');
    container.appendChild(dot);
  }
}

// ===== SLICE NUMBERS =====
function updateSliceNumbers() {
  const container = $('sliceNumbers');
  container.innerHTML = '';
  const positions = [
    { top: '18%', left: '62%' },
    { top: '62%', left: '62%' },
    { top: '62%', left: '18%' },
    { top: '18%', left: '18%' }
  ];
  for (let i = 0; i < 4; i++) {
    const num = document.createElement('div');
    num.className = 'slice-num';
    num.textContent = i + 1;
    num.style.top = positions[i].top;
    num.style.left = positions[i].left;
    container.appendChild(num);
  }
}

// ===== CHEF SPEECH =====
function chefSay(category) {
  const msg = randomFrom(CHEF_MESSAGES[category]);
  $('chefText').textContent = msg;
  $('chefBubble').style.animation = 'none';
  $('chefBubble').offsetHeight; // reflow
  $('chefBubble').style.animation = 'bubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
}

// ===== TOPPING BAR =====
function buildToppingBar(order) {
  const container = $('toppingChoices');
  container.innerHTML = '';
  const needed = [...new Set(order)];
  needed.forEach(topping => {
    const btn = document.createElement('div');
    btn.className = 'topping-btn';
    btn.dataset.topping = topping;
    btn.innerHTML = `
      <div class="topping-preview preview-${topping}">${TOPPING_EMOJI[topping]}</div>
      <div class="topping-label">${TOPPING_NAMES[topping]}</div>
    `;
    btn.addEventListener('click', () => selectTopping(topping, btn));
    container.appendChild(btn);
  });
}

function selectTopping(topping, btn) {
  selectedTopping = topping;
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  sfxSelect();

  $('toppingTitle').textContent = `Now tap a slice! \u{1F447}`;

  document.querySelectorAll('.pizza-slice').forEach(el => {
    const idx = parseInt(el.dataset.slice);
    el.classList.toggle('highlight', placedToppings[idx] === null);
  });
}

// ===== SLICE CLICK =====
function onSliceClick(index) {
  if (!gameActive) return;

  if (!selectedTopping) {
    $('mainPizza').classList.add('error-shake');
    setTimeout(() => $('mainPizza').classList.remove('error-shake'), 400);
    sfxWrong();
    chefSay('pickTopping');
    return;
  }

  if (placedToppings[index] !== null) {
    placedToppings[index] = null;
  } else {
    placedToppings[index] = selectedTopping;
    sfxPlace();
    chefSay('placed');
  }

  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);

  document.querySelectorAll('.pizza-slice').forEach(el => {
    const idx = parseInt(el.dataset.slice);
    if (idx === index && placedToppings[index] !== null) {
      el.parentElement.classList.add('slice-placed');
      setTimeout(() => el.parentElement.classList.remove('slice-placed'), 400);
    }
    el.classList.toggle('highlight', selectedTopping && placedToppings[idx] === null);
  });

  const allFilled = placedToppings.every(t => t !== null);
  if (allFilled) {
    $('checkBtn').classList.add('visible');
    $('toppingTitle').textContent = 'Pizza ready? Hit Check! \u{2705}';
    chefSay('allFilled');
    selectedTopping = null;
    document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.pizza-slice').forEach(el => el.classList.remove('highlight'));
  } else {
    $('checkBtn').classList.remove('visible');
  }
}

// ===== CHECK PIZZA =====
function checkPizza() {
  if (!gameActive) return;
  const level = levels[currentLevel];
  const correct = level.order.every((t, i) => placedToppings[i] === t);

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
    $('toppingTitle').textContent = 'Check the order card! \u{1F4CB}';
    setTimeout(() => { $('toppingTitle').textContent = 'Pick a topping!'; }, 2500);
  }
}

// ===== FRACTION QUESTION =====
function showFractionQuestion() {
  const level = levels[currentLevel];
  questionAttempts = 0;

  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

  const toppings = Object.keys(counts);
  const interesting = toppings.filter(t => counts[t] !== 4);
  const askAbout = interesting.length > 0 ? randomFrom(interesting) : toppings[0];
  const correctFraction = `${counts[askAbout]}/4`;

  $('questionText').textContent = `What fraction is ${TOPPING_NAMES[askAbout]}?`;
  $('questionEmoji').textContent = TOPPING_EMOJI[askAbout];

  // Draw question pizza
  drawPizza($('questionPizza'), level.order, 100, 100, 80, Q_DECO, true);

  const container = $('answerChoices');
  container.innerHTML = '';
  const shuffled = ['1/4', '2/4', '3/4', '4/4'].sort(() => Math.random() - 0.5);

  shuffled.forEach(frac => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = frac;
    btn.addEventListener('click', () => handleAnswer(btn, frac, correctFraction));
    container.appendChild(btn);
  });

  $('questionOverlay').classList.remove('hidden');
  $('questionOverlay').classList.add('fade-in');
}

function handleAnswer(btn, chosen, correct) {
  if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
  questionAttempts++;

  if (chosen === correct) {
    btn.classList.add('correct');
    sfxCorrect();
    document.querySelectorAll('.answer-btn').forEach(b => b.style.pointerEvents = 'none');
    const stars = questionAttempts === 1 ? 3 : questionAttempts === 2 ? 2 : 1;
    totalStars += stars;
    setTimeout(() => {
      $('questionOverlay').classList.add('hidden');
      showCelebration(stars);
    }, 900);
  } else {
    btn.classList.add('wrong');
    sfxWrong();
    btn.style.pointerEvents = 'none';
    if (questionAttempts >= 3) {
      setTimeout(() => {
        document.querySelectorAll('.answer-btn').forEach(b => {
          if (b.textContent === correct) b.classList.add('correct');
        });
      }, 500);
    }
  }
}

// ===== CELEBRATION =====
function showCelebration(stars) {
  sfxCelebrate();

  const emojis = ['\u{1F389}','\u{1F38A}','\u{1F973}','\u{1F929}'];
  $('celebEmoji').textContent = randomFrom(emojis);

  $('celebStars').textContent = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);

  const texts3 = ['PERFECT! \u{1F31F}', 'INCREDIBLE! \u{1F525}', 'SUPERSTAR! \u{1F680}'];
  const texts2 = ['Great job! \u{1F389}', 'Awesome! \u{1F44F}', 'Fantastic! \u{2728}'];
  const texts1 = ['Good try! \u{1F44D}', 'Nice work! \u{1F60A}', 'Keep going! \u{1F4AA}'];
  $('celebText').textContent = randomFrom(stars === 3 ? texts3 : stars === 2 ? texts2 : texts1);
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
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = (6 + Math.random() * 10) + 'px';
    p.style.height = (6 + Math.random() * 10) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '2px' : '0';
    p.style.setProperty('--delay', (Math.random() * 1) + 's');
    p.style.setProperty('--fall-dur', (2 + Math.random() * 2.5) + 's');
    p.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
    p.style.setProperty('--spin', (Math.random() * 1080) + 'deg');
    container.appendChild(p);
  }
}

function spawnFlyingStars(count) {
  const container = $('flyingStars');
  container.innerHTML = '';
  for (let i = 0; i < count * 3; i++) {
    const s = document.createElement('div');
    s.className = 'flying-star';
    s.textContent = '\u2B50';
    s.style.left = (30 + Math.random() * 40) + '%';
    s.style.top = (40 + Math.random() * 20) + '%';
    s.style.setProperty('--d', (i * 0.12) + 's');
    s.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
    s.style.setProperty('--ty', -(100 + Math.random() * 200) + 'px');
    s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    container.appendChild(s);
  }
}

// ===== LEVEL MANAGEMENT =====
function loadLevel(idx) {
  currentLevel = idx;
  const level = levels[idx];

  selectedTopping = null;
  placedToppings = [null, null, null, null];
  gameActive = true;

  $('levelNum').textContent = idx + 1;
  $('totalStars').textContent = totalStars;
  $('checkBtn').classList.remove('visible');

  updateProgressDots();
  updateSliceNumbers();

  // Order pizza
  drawPizza($('orderPizza'), level.order, 60, 60, 46, ORDER_DECO, true);

  // Order tags
  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const fracContainer = $('orderFractions');
  fracContainer.innerHTML = '';
  Object.entries(counts).forEach(([top, count], i) => {
    const tag = document.createElement('span');
    tag.className = `order-tag ${top}`;
    tag.textContent = `${TOPPING_EMOJI[top]} ${count}/4`;
    tag.style.animationDelay = (i * 0.1) + 's';
    fracContainer.appendChild(tag);
  });

  // Empty pizza
  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);

  buildToppingBar(level.order);
  chefSay('start');
  $('toppingTitle').textContent = 'Pick a topping!';

  $('gameScreen').classList.add('level-enter');
  setTimeout(() => $('gameScreen').classList.remove('level-enter'), 600);
}

function nextLevel() {
  $('celebrationOverlay').classList.add('hidden');
  $('confettiContainer').innerHTML = '';
  $('flyingStars').innerHTML = '';

  if (currentLevel >= levels.length - 1) {
    showGameComplete();
  } else {
    loadLevel(currentLevel + 1);
  }
}

function showGameComplete() {
  const maxStars = levels.length * 3;
  $('finalScore').textContent = `You collected ${totalStars} / ${maxStars} stars!`;

  const row = $('finalStarRow');
  row.innerHTML = '';
  for (let i = 0; i < maxStars; i++) {
    const s = document.createElement('span');
    s.className = 'final-star' + (i >= totalStars ? ' empty' : '');
    s.textContent = '\u2B50';
    s.style.setProperty('--d', (i * 0.05) + 's');
    row.appendChild(s);
  }

  $('completeOverlay').classList.remove('hidden');
  $('completeOverlay').classList.add('fade-in');
  sfxCelebrate();
  setTimeout(sfxCelebrate, 400);
  setTimeout(sfxCelebrate, 800);
  spawnConfetti($('confettiContainer2'));
}

// ===== START / RESTART =====
function startGame() {
  $('startScreen').style.display = 'none';
  $('gameScreen').style.display = 'block';
  currentLevel = 0;
  totalStars = 0;
  loadLevel(0);
}

function restartGame() {
  $('completeOverlay').classList.add('hidden');
  currentLevel = 0;
  totalStars = 0;
  loadLevel(0);
}

function resetPizza() {
  if (!gameActive) return;
  placedToppings = [null, null, null, null];
  selectedTopping = null;
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);
  $('checkBtn').classList.remove('visible');
  $('toppingTitle').textContent = 'Pick a topping!';
  chefSay('start');
  sfxSelect();
}

function showHowToPlay() {
  $('howToPlayOverlay').classList.remove('hidden');
  $('howToPlayOverlay').classList.add('fade-in');
}
function hideHowToPlay() {
  $('howToPlayOverlay').classList.add('hidden');
}

// ===== INIT =====
initFloatingBg();

