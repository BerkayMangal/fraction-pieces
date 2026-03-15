/* ========================================
   FRACTION PIECES - Game Engine
   ======================================== */

// ===== STATE =====
let currentLevel = 0;
let totalStars = 0;
let selectedTopping = null;
let placedToppings = [null, null, null, null];
let questionAttempts = 0;
let gameActive = false;

// ===== DOM REFS =====
const $ = id => document.getElementById(id);

// ===== CONSTANTS =====
const CX = 150, CY = 150, R = 120, CR = 130;

const TOPPING_COLORS = {
  cheese:    { fill: '#ffd54f', stroke: '#f9a825', accent: '#ffb300', dots: '#f0a020' },
  olive:     { fill: '#81c784', stroke: '#43a047', accent: '#388e3c', dots: '#2e7d32' },
  pepperoni: { fill: '#ef5350', stroke: '#c62828', accent: '#d32f2f', dots: '#b71c1c' }
};

const TOPPING_NAMES = {
  cheese: 'Cheese',
  olive: 'Olive',
  pepperoni: 'Pepperoni'
};

// Positions of topping decorations on each slice (relative to 300x300)
const SLICE_DECO = [
  // Slice 0: top-right
  [{ x: 195, y: 85 }, { x: 215, y: 115 }, { x: 185, y: 120 }],
  // Slice 1: bottom-right
  [{ x: 195, y: 195 }, { x: 220, y: 215 }, { x: 190, y: 230 }],
  // Slice 2: bottom-left
  [{ x: 105, y: 195 }, { x: 80, y: 215 }, { x: 110, y: 230 }],
  // Slice 3: top-left
  [{ x: 105, y: 85 }, { x: 80, y: 115 }, { x: 115, y: 120 }]
];

// Same for order pizza (scaled to 120x120, center 60,60, r=48)
const ORDER_DECO = [
  [{ x: 78, y: 35 }, { x: 85, y: 48 }],
  [{ x: 78, y: 75 }, { x: 88, y: 85 }],
  [{ x: 42, y: 75 }, { x: 32, y: 85 }],
  [{ x: 42, y: 35 }, { x: 35, y: 48 }]
];

// ===== AUDIO (Web Audio API) =====
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, dur, type = 'sine', vol = 0.15) {
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

function sfxPlace() { playTone(600, 0.12, 'sine', 0.12); }
function sfxCorrect() {
  playTone(523, 0.15); 
  setTimeout(() => playTone(659, 0.15), 100);
  setTimeout(() => playTone(784, 0.25), 200);
}
function sfxWrong() { playTone(200, 0.3, 'triangle', 0.1); }
function sfxCelebrate() {
  [523, 587, 659, 784, 880].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.12), i * 100);
  });
}
function sfxStar() { playTone(1047, 0.3, 'sine', 0.1); }

// ===== SVG HELPERS =====
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function slicePath(cx, cy, r, startAngle, endAngle) {
  const s = startAngle * Math.PI / 180;
  const e = endAngle * Math.PI / 180;
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
}

// Quarter angles: [top-right, bottom-right, bottom-left, top-left]
const SLICE_ANGLES = [
  [-90, 0], [0, 90], [90, 180], [180, 270]
];

// ===== DRAW PIZZA =====
function drawPizza(svgElement, toppings, cx, cy, r, decoPositions, isOrder = false) {
  svgElement.innerHTML = '';

  // Shadow under pizza
  if (!isOrder) {
    svgElement.appendChild(svgEl('ellipse', {
      cx, cy: cy + 8, rx: r + 6, ry: 12,
      fill: 'rgba(0,0,0,0.08)'
    }));
  }

  // Crust ring
  svgElement.appendChild(svgEl('circle', {
    cx, cy, r: r + (isOrder ? 4 : 8),
    fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 1 : 2
  }));

  // Pizza base (cheese background)
  svgElement.appendChild(svgEl('circle', {
    cx, cy, r,
    fill: '#ffe082', stroke: '#f0c040', 'stroke-width': isOrder ? 0.5 : 1
  }));

  // Draw each slice
  for (let i = 0; i < 4; i++) {
    const topping = toppings[i];
    const [sa, ea] = SLICE_ANGLES[i];
    const g = svgEl('g');

    if (topping) {
      // Filled slice
      const col = TOPPING_COLORS[topping];
      const path = svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: col.fill,
        stroke: col.stroke,
        'stroke-width': isOrder ? 0.5 : 1.5,
        opacity: '0.85'
      });
      g.appendChild(path);

      // Topping decorations
      const deco = decoPositions[i];
      deco.forEach(pos => {
        if (topping === 'cheese') {
          // Cheese bubbles
          g.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: isOrder ? 3 : 7,
            fill: '#ffb300', opacity: '0.6'
          }));
          g.appendChild(svgEl('circle', {
            cx: pos.x - (isOrder ? 1 : 2), cy: pos.y - (isOrder ? 1 : 2),
            r: isOrder ? 1.5 : 3,
            fill: '#ffe082', opacity: '0.8'
          }));
        } else if (topping === 'olive') {
          // Olive circles
          g.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: isOrder ? 4 : 9,
            fill: '#2e7d32', stroke: '#1b5e20', 'stroke-width': isOrder ? 0.5 : 1
          }));
          g.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: isOrder ? 2 : 4,
            fill: '#4caf50', opacity: '0.5'
          }));
        } else if (topping === 'pepperoni') {
          // Pepperoni circles
          g.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: isOrder ? 4.5 : 10,
            fill: '#c62828', stroke: '#8e0000', 'stroke-width': isOrder ? 0.5 : 1
          }));
          g.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: isOrder ? 2.5 : 5,
            fill: '#ef5350', opacity: '0.4'
          }));
        }
      });
    } else if (!isOrder) {
      // Empty slice (dough visible, lighter)
      g.appendChild(svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: '#ffe8b0',
        stroke: '#e0c878',
        'stroke-width': 1.5,
        'stroke-dasharray': '6 4',
        opacity: '0.7'
      }));
    }

    // Click target for game pizza
    if (!isOrder) {
      const hitArea = svgEl('path', {
        d: slicePath(cx, cy, r, sa, ea),
        fill: 'transparent',
        cursor: 'pointer',
        class: 'pizza-slice',
        'data-slice': i
      });
      hitArea.addEventListener('click', () => onSliceClick(i));
      g.appendChild(hitArea);
    }

    svgElement.appendChild(g);
  }

  // Center dot
  svgElement.appendChild(svgEl('circle', {
    cx, cy, r: isOrder ? 3 : 6,
    fill: '#d4a056', stroke: '#b8863a', 'stroke-width': isOrder ? 0.5 : 1
  }));

  // Divider lines
  for (let i = 0; i < 4; i++) {
    const angle = (SLICE_ANGLES[i][0]) * Math.PI / 180;
    svgElement.appendChild(svgEl('line', {
      x1: cx, y1: cy,
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      stroke: '#c49040',
      'stroke-width': isOrder ? 0.8 : 2,
      opacity: '0.6'
    }));
  }
}

// ===== TOPPING PALETTE =====
function buildToppingBar(levelOrder) {
  const container = $('toppingChoices');
  container.innerHTML = '';

  // Find unique toppings needed for this level
  const needed = [...new Set(levelOrder)];

  needed.forEach(topping => {
    const btn = document.createElement('div');
    btn.className = 'topping-btn';
    btn.dataset.topping = topping;
    btn.innerHTML = `
      <div class="topping-preview preview-${topping}"></div>
      <div class="topping-label">${TOPPING_NAMES[topping]}</div>
    `;
    btn.addEventListener('click', () => selectTopping(topping, btn));
    container.appendChild(btn);
  });
}

function selectTopping(topping, btnEl) {
  selectedTopping = topping;
  // Highlight selected
  document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
  sfxPlace();

  // Highlight available (empty) slices
  document.querySelectorAll('.pizza-slice').forEach(el => {
    const idx = parseInt(el.dataset.slice);
    if (placedToppings[idx] === null) {
      el.classList.add('highlight');
    } else {
      el.classList.remove('highlight');
    }
  });
}

// ===== SLICE CLICK =====
function onSliceClick(index) {
  if (!gameActive) return;

  if (!selectedTopping) {
    // Shake to indicate they need to pick a topping first
    const pizza = $('mainPizza');
    pizza.classList.add('error-shake');
    setTimeout(() => pizza.classList.remove('error-shake'), 400);
    sfxWrong();

    $('toppingTitle').textContent = '👆 First pick a topping!';
    setTimeout(() => {
      $('toppingTitle').textContent = 'Tap a topping, then tap a slice!';
    }, 1500);
    return;
  }

  if (placedToppings[index] !== null) {
    // Already placed, remove it
    placedToppings[index] = null;
    sfxPlace();
  } else {
    // Place topping
    placedToppings[index] = selectedTopping;
    sfxPlace();
  }

  // Redraw pizza
  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);

  // Add pop animation to placed slice
  const sliceEls = document.querySelectorAll('.pizza-slice');
  sliceEls.forEach(el => {
    const idx = parseInt(el.dataset.slice);
    if (idx === index && placedToppings[index] !== null) {
      el.parentElement.classList.add('slice-placed');
      setTimeout(() => el.parentElement.classList.remove('slice-placed'), 350);
    }
    // Update highlights
    if (selectedTopping && placedToppings[idx] === null) {
      el.classList.add('highlight');
    } else {
      el.classList.remove('highlight');
    }
  });

  // Show check button when all slices filled
  const allFilled = placedToppings.every(t => t !== null);
  const checkBtn = $('checkBtn');
  if (allFilled) {
    checkBtn.classList.add('visible');
    selectedTopping = null;
    document.querySelectorAll('.topping-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.pizza-slice').forEach(el => el.classList.remove('highlight'));
  } else {
    checkBtn.classList.remove('visible');
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
    // Show fraction question
    setTimeout(() => showFractionQuestion(), 600);
  } else {
    sfxWrong();
    // Shake and show hint
    const pizza = $('mainPizza');
    pizza.classList.add('error-shake');
    setTimeout(() => pizza.classList.remove('error-shake'), 400);

    $('toppingTitle').textContent = 'Not quite! Check the order card 🧾';
    setTimeout(() => {
      $('toppingTitle').textContent = 'Tap a topping, then tap a slice!';
    }, 2000);
  }
}

// ===== FRACTION QUESTION =====
function showFractionQuestion() {
  const level = levels[currentLevel];
  questionAttempts = 0;

  // Count toppings
  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

  // Pick a topping to ask about (prefer non-4 counts for more interesting questions)
  const toppings = Object.keys(counts);
  let askAbout;
  const interesting = toppings.filter(t => counts[t] !== 4);
  if (interesting.length > 0) {
    askAbout = interesting[Math.floor(Math.random() * interesting.length)];
  } else {
    askAbout = toppings[0];
  }

  const correctCount = counts[askAbout];
  const correctFraction = `${correctCount}/4`;

  // Build question
  $('questionText').textContent = `What fraction of the pizza is ${TOPPING_NAMES[askAbout]}?`;

  // Generate answer choices (always include 1/4, 2/4, 3/4, 4/4)
  const allFractions = ['1/4', '2/4', '3/4', '4/4'];
  const choices = allFractions;

  const container = $('answerChoices');
  container.innerHTML = '';

  // Shuffle choices
  const shuffled = [...choices].sort(() => Math.random() - 0.5);

  shuffled.forEach(frac => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = frac;
    btn.addEventListener('click', () => handleAnswer(btn, frac, correctFraction));
    container.appendChild(btn);
  });

  // Show overlay
  $('questionOverlay').classList.remove('hidden');
  $('questionOverlay').classList.add('fade-in');
}

function handleAnswer(btn, chosen, correct) {
  if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;

  questionAttempts++;

  if (chosen === correct) {
    btn.classList.add('correct');
    sfxCorrect();

    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(b => {
      b.style.pointerEvents = 'none';
    });

    // Calculate stars
    const stars = questionAttempts === 1 ? 2 : 1;
    totalStars += stars;

    // Show celebration after a beat
    setTimeout(() => {
      $('questionOverlay').classList.add('hidden');
      showCelebration(stars);
    }, 800);
  } else {
    btn.classList.add('wrong');
    sfxWrong();
    btn.style.pointerEvents = 'none';

    // Highlight correct after 2 wrong attempts
    if (questionAttempts >= 2) {
      setTimeout(() => {
        document.querySelectorAll('.answer-btn').forEach(b => {
          if (b.textContent === correct) b.classList.add('correct');
        });
      }, 600);
    }
  }
}

// ===== CELEBRATION =====
function showCelebration(stars) {
  sfxCelebrate();

  // Stars display
  const starStr = '⭐'.repeat(stars) + (stars < 2 ? '☆'.repeat(2 - stars) : '');
  $('celebStars').textContent = starStr;

  // Text
  const texts = stars === 2
    ? ['Perfect! 🎉', 'Amazing! 🌟', 'Superstar! ✨', 'Incredible! 🔥']
    : ['Good job! 👏', 'Nice work! 💪', 'Well done! 🙌'];
  $('celebText').textContent = texts[Math.floor(Math.random() * texts.length)];

  $('celebSub').textContent = `You earned ${stars} star${stars > 1 ? 's' : ''}!`;

  // Update total stars display
  $('totalStars').textContent = totalStars;

  // Change button text for last level
  if (currentLevel >= levels.length - 1) {
    $('nextBtn').textContent = 'See Results 🏆';
  } else {
    $('nextBtn').textContent = 'Next Level ➜';
  }

  // Show overlay
  $('celebrationOverlay').classList.remove('hidden');
  $('celebrationOverlay').classList.add('fade-in');

  // Spawn confetti
  spawnConfetti();
}

function spawnConfetti() {
  const container = $('confettiContainer');
  container.innerHTML = '';

  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#ff8c00', '#4caf50'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.setProperty('--delay', (Math.random() * 0.8) + 's');
    piece.style.setProperty('--fall-dur', (2 + Math.random() * 2) + 's');
    piece.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    piece.style.setProperty('--spin', (Math.random() * 1080) + 'deg');
    container.appendChild(piece);
  }
}

// ===== LEVEL MANAGEMENT =====
function loadLevel(levelIndex) {
  currentLevel = levelIndex;
  const level = levels[levelIndex];

  // Reset state
  selectedTopping = null;
  placedToppings = [null, null, null, null];
  gameActive = true;

  // Update UI
  $('levelNum').textContent = levelIndex + 1;
  $('totalStars').textContent = totalStars;
  $('checkBtn').classList.remove('visible');

  // Draw order pizza
  drawPizza($('orderPizza'), level.order, 60, 60, 46, ORDER_DECO, true);

  // Order fraction tags
  const counts = {};
  level.order.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const fracContainer = $('orderFractions');
  fracContainer.innerHTML = '';
  Object.entries(counts).forEach(([topping, count]) => {
    const tag = document.createElement('span');
    tag.className = `order-tag ${topping}`;
    tag.textContent = `${count}/4 ${TOPPING_NAMES[topping]}`;
    fracContainer.appendChild(tag);
  });

  // Draw empty game pizza
  drawPizza($('mainPizza'), placedToppings, CX, CY, R, SLICE_DECO, false);

  // Build topping bar
  buildToppingBar(level.order);

  $('toppingTitle').textContent = 'Tap a topping, then tap a slice!';

  // Level enter animation
  $('gameScreen').classList.add('level-enter');
  setTimeout(() => $('gameScreen').classList.remove('level-enter'), 500);
}

function nextLevel() {
  $('celebrationOverlay').classList.add('hidden');
  $('confettiContainer').innerHTML = '';

  if (currentLevel >= levels.length - 1) {
    showGameComplete();
  } else {
    loadLevel(currentLevel + 1);
  }
}

function showGameComplete() {
  const maxStars = levels.length * 2;

  $('finalScore').textContent = `You collected ${totalStars} out of ${maxStars} stars!`;

  // Star row
  const row = $('finalStarRow');
  row.innerHTML = '';
  for (let i = 0; i < maxStars; i++) {
    const s = document.createElement('span');
    s.className = 'final-star' + (i >= totalStars ? ' empty' : '');
    s.textContent = '⭐';
    s.style.setProperty('--d', (i * 0.08) + 's');
    row.appendChild(s);
  }

  $('completeOverlay').classList.remove('hidden');
  $('completeOverlay').classList.add('fade-in');
  sfxCelebrate();
  setTimeout(sfxCelebrate, 500);
  spawnConfetti();
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
  $('confettiContainer').innerHTML = '';
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
  $('toppingTitle').textContent = 'Tap a topping, then tap a slice!';
  sfxPlace();
}

