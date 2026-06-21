/* ========================================
   MATH CHALLENGE — Kumon-style mastery ladder.
   Tiny progressive steps in simple English (with read-aloud),
   mastery-gated, rewarding stars into the shop economy.
   Additive layer; reuses drawPizza / sfx / speak / awardStars.
   ======================================== */

const LS_MATH = 'fp_math';   // { passed: { stageId: bestCorrect } }
const LS_WEEK = 'fp_week';   // { id, earned, claimed }
const MATH_Q = 6;            // questions per worksheet
const MATH_PASS = 5;         // need this many right to master

// ---- number words for read-aloud (English learning) ----
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
function nw(n) { return NUMW[n] !== undefined ? NUMW[n] : ('' + n); }
function rand(n) { return Math.floor(Math.random() * n); }
function shuffle(a) { return a.sort(() => Math.random() - 0.5); }

function numChoices(ans, lo, hi) {
  const set = new Set([ans]);
  let g = 0;
  while (set.size < 3 && g++ < 60) {
    let v = ans + (rand(5) - 2);
    if (v < lo) v = lo; if (v > hi) v = hi;
    set.add(v);
  }
  let v = lo; while (set.size < 3) set.add(v++);
  return shuffle([...set]);
}
function emojiRow(em, n) {
  let s = '<div class="m-emojis">';
  for (let i = 0; i < n; i++) s += '<span>' + em + '</span>';
  return s + '</div>';
}

// ---- the ladder: each stage generates fresh randomized questions ----
const MATH_STAGES = [
  { id: 'A1', lvl: 'A', title: 'Count to 5', gen: () => { const n = 1 + rand(5); return { prompt: 'How many?', say: 'How many?', visual: emojiRow('\u{1F355}', n), choices: numChoices(n, 1, 6), answer: n }; } },
  { id: 'A2', lvl: 'A', title: 'Count to 10', gen: () => { const n = 1 + rand(10); return { prompt: 'How many?', say: 'How many?', visual: emojiRow('\u{1F9C0}', n), choices: numChoices(n, 1, 11), answer: n }; } },
  { id: 'B1', lvl: 'B', title: 'Add to 5', gen: () => { const a = 1 + rand(4); const b = 1 + rand(5 - a); return { prompt: a + ' + ' + b + ' = ?', say: nw(a) + ' plus ' + nw(b), visual: emojiRow('\u{1F355}', a) + '<div class="m-op">+</div>' + emojiRow('\u{1F345}', b), choices: numChoices(a + b, 1, 10), answer: a + b }; } },
  { id: 'B2', lvl: 'B', title: 'Add to 10', gen: () => { const a = 1 + rand(8); const b = 1 + rand(Math.max(1, 10 - a)); return { prompt: a + ' + ' + b + ' = ?', say: nw(a) + ' plus ' + nw(b), choices: numChoices(a + b, 1, 16), answer: a + b }; } },
  { id: 'C1', lvl: 'C', title: 'Take away to 5', gen: () => { const a = 2 + rand(4); const b = 1 + rand(a - 1); return { prompt: a + ' - ' + b + ' = ?', say: nw(a) + ' take away ' + nw(b), choices: numChoices(a - b, 0, 8), answer: a - b }; } },
  { id: 'C2', lvl: 'C', title: 'Take away to 10', gen: () => { const a = 3 + rand(8); const b = 1 + rand(a - 1); return { prompt: a + ' - ' + b + ' = ?', say: nw(a) + ' take away ' + nw(b), choices: numChoices(a - b, 0, 11), answer: a - b }; } },
  { id: 'D1', lvl: 'D', title: 'Which is more?', gen: () => { let x = 1 + rand(10), y = 1 + rand(10); while (y === x) y = 1 + rand(10); return { prompt: 'Which is more?', say: 'Which is more?', choices: shuffle([x, y]), answer: Math.max(x, y), big: true }; } },
  { id: 'D2', lvl: 'D', title: 'Which is less?', gen: () => { let x = 1 + rand(10), y = 1 + rand(10); while (y === x) y = 1 + rand(10); return { prompt: 'Which is less?', say: 'Which is less?', choices: shuffle([x, y]), answer: Math.min(x, y), big: true }; } },
  { id: 'E1', lvl: 'E', title: 'Count in 2s', gen: () => { const s = 2 * (1 + rand(3)); const seq = [s, s + 2, s + 4]; return { prompt: seq.join(', ') + ', ?', say: 'What comes next?', choices: numChoices(s + 6, 2, 18), answer: s + 6 }; } },
  { id: 'E2', lvl: 'E', title: 'Groups of', gen: () => { const g = 2 + rand(2); const k = 2 + rand(2); let v = ''; for (let i = 0; i < g; i++) v += emojiRow('\u{1F355}', k); return { prompt: g + ' groups of ' + k, say: nw(g) + ' groups of ' + nw(k), visual: v, choices: numChoices(g * k, 2, 12), answer: g * k }; } },
  { id: 'F1', lvl: 'F', title: 'Half of it', gen: () => { const m = 2 * (1 + rand(5)); return { prompt: 'Half of ' + m + ' = ?', say: 'Half of ' + nw(m), visual: emojiRow('\u{1F355}', m), choices: numChoices(m / 2, 1, 10), answer: m / 2 }; } },
  { id: 'F2', lvl: 'F', title: 'Pizza fractions', gen: () => { const d = [2, 3, 4][rand(3)]; const n = 1 + rand(d - 1); const opts = new Set([n + '/' + d]); while (opts.size < 3) { const nn = 1 + rand(d); opts.add(nn + '/' + d); } return { prompt: 'What fraction is filled?', say: 'What fraction is filled?', pizza: { n: n, d: d }, choices: shuffle([...opts]), answer: n + '/' + d }; } },
  { id: 'G1', lvl: 'G', title: 'What comes next?', gen: () => { const step = [1, 2, 5, 10][rand(4)]; const s = 1 + rand(5); const seq = [s, s + step, s + 2 * step]; return { prompt: seq.join(', ') + ', ?', say: 'What comes next?', choices: numChoices(s + 3 * step, 1, 40), answer: s + 3 * step }; } }
];

// ---- persistence ----
function loadMath() { try { return JSON.parse(localStorage.getItem(LS_MATH)) || { passed: {} }; } catch (e) { return { passed: {} }; } }
let mathData = loadMath();
function persistMath() { try { localStorage.setItem(LS_MATH, JSON.stringify(mathData)); } catch (e) {} }
function stageUnlocked(i) { return i === 0 || (mathData.passed[MATH_STAGES[i - 1].id] || 0) >= MATH_PASS; }
function mathPassedCount() { return Object.keys(mathData.passed).filter(k => mathData.passed[k] >= MATH_PASS).length; }

// ---- ladder screen ----
function renderLadder() {
  document.getElementById('mathWalletL').textContent = wallet;
  const box = document.getElementById('mathLadder');
  box.innerHTML = '';
  MATH_STAGES.forEach((st, i) => {
    const best = mathData.passed[st.id] || 0;
    const unlocked = stageUnlocked(i);
    const passed = best >= MATH_PASS;
    const row = document.createElement('button');
    row.className = 'math-stage' + (unlocked ? '' : ' locked') + (passed ? ' passed' : '');
    const stars = passed ? (best >= MATH_Q ? 3 : best >= MATH_PASS + 1 ? 2 : 1) : 0;
    row.innerHTML =
      '<span class="ms-lvl">' + st.lvl + '</span>' +
      '<span class="ms-title">' + st.title + '</span>' +
      '<span class="ms-stars">' + (unlocked ? ('⭐'.repeat(stars) + '☆'.repeat(3 - stars)) : '\u{1F512}') + '</span>';
    if (unlocked) row.onclick = () => startStage(i);
    box.appendChild(row);
  });
}
function showMath() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  renderLadder();
  const ov = document.getElementById('mathOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in'); ov.scrollTop = 0;
}
function hideMath() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('mathOverlay').classList.add('hidden');
}

// ---- worksheet session ----
let mathSession = null;
function startStage(i) {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  mathSession = { idx: i, stage: MATH_STAGES[i], q: 0, correct: 0 };
  document.getElementById('mathOverlay').classList.add('hidden');
  const ov = document.getElementById('mathSessionOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
  renderMathQ();
}
function renderMathQ() {
  const s = mathSession;
  document.getElementById('mathStageTitle').textContent = s.stage.lvl + ' · ' + s.stage.title;
  document.getElementById('mathProgress').textContent = 'Q ' + (s.q + 1) + ' / ' + MATH_Q;
  document.getElementById('mathFeedback').textContent = '';
  const cur = s.stage.gen();
  s.cur = cur;
  document.getElementById('mathPrompt').textContent = cur.prompt;
  const vis = document.getElementById('mathVisual');
  vis.innerHTML = '';
  if (cur.pizza) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'mathPizza'); svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('width', '110'); svg.setAttribute('height', '110');
    vis.appendChild(svg);
    const arr = new Array(cur.pizza.d).fill(null);
    for (let i = 0; i < cur.pizza.n; i++) arr[i] = 'cheese';
    drawPizza(svg, arr, 80, 80, 64, true);
  } else if (cur.visual) {
    vis.innerHTML = cur.visual;
  }
  const box = document.getElementById('mathChoices');
  box.className = cur.big ? 'big-choices' : '';
  box.innerHTML = '';
  cur.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = c;
    btn.onclick = () => mathPick(btn, c);
    box.appendChild(btn);
  });
  if (typeof speak === 'function') setTimeout(() => speak(cur.say), 220);
}
function mathPick(btn, val) {
  const s = mathSession;
  if (!s || btn.dataset.done) return;
  document.querySelectorAll('#mathChoices .answer-btn').forEach(b => b.dataset.done = '1');
  if (val === s.cur.answer || ('' + val) === ('' + s.cur.answer)) {
    btn.classList.add('correct');
    s.correct++;
    if (typeof sfxCorrect === 'function') sfxCorrect();
    document.getElementById('mathFeedback').innerHTML = '<span class="mf-good">Correct! \u{1F44D}</span>';
  } else {
    btn.classList.add('wrong');
    if (typeof sfxWrong === 'function') sfxWrong();
    document.querySelectorAll('#mathChoices .answer-btn').forEach(b => { if (('' + b.textContent) === ('' + s.cur.answer)) b.classList.add('correct'); });
    document.getElementById('mathFeedback').innerHTML = '<span class="mf-bad">The answer is ' + s.cur.answer + '</span>';
  }
  s.q++;
  setTimeout(() => { if (s.q >= MATH_Q) finishStage(); else renderMathQ(); }, 1050);
}
function finishStage() {
  const s = mathSession;
  document.getElementById('mathSessionOverlay').classList.add('hidden');
  const passed = s.correct >= MATH_PASS;
  const prevBest = mathData.passed[s.stage.id] || 0;
  const firstPass = passed && prevBest < MATH_PASS;
  if (passed && s.correct > prevBest) { mathData.passed[s.stage.id] = s.correct; persistMath(); }

  let reward = 0;
  if (passed) { reward = firstPass ? 3 : 1; if (typeof awardStars === 'function') awardStars(reward); }

  // sync achievements
  if (typeof stats === 'object') { stats.mathPassed = mathPassedCount(); if (typeof persistStats === 'function') persistStats(); }
  if (typeof checkAchievements === 'function') checkAchievements();

  document.getElementById('mathResultEmoji').textContent = passed ? randomFrom(['\u{1F389}', '\u{1F31F}', '\u{1F973}']) : '\u{1F4AA}';
  document.getElementById('mathResultTitle').textContent = passed ? (firstPass ? 'Step mastered!' : 'Well done!') : 'Keep practicing!';
  document.getElementById('mathResultStars').textContent = '⭐'.repeat(s.correct) + '☆'.repeat(MATH_Q - s.correct);
  document.getElementById('mathResultText').textContent = s.correct + ' / ' + MATH_Q + ' correct' + (reward ? '  (+' + reward + ' ⭐)' : '');
  const next = document.getElementById('mathNextBtn');
  const hasNext = s.idx < MATH_STAGES.length - 1;
  next.style.display = (passed && hasNext) ? 'block' : 'none';
  if (passed && typeof sfxCelebrate === 'function') sfxCelebrate();
  const ov = document.getElementById('mathResultOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function mathNextStage() {
  document.getElementById('mathResultOverlay').classList.add('hidden');
  const ni = mathSession.idx + 1;
  if (ni < MATH_STAGES.length && stageUnlocked(ni)) startStage(ni); else backToLadder();
}
function mathRetry() {
  document.getElementById('mathResultOverlay').classList.add('hidden');
  startStage(mathSession.idx);
}
function backToLadder() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('mathResultOverlay').classList.add('hidden');
  showMath();
}
function quitMath() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('mathSessionOverlay').classList.add('hidden');
  showMath();
}

// =============================================
// WEEKLY GOAL — keep-practicing loop
// =============================================
const WEEK_GOAL = 40;
function weekId() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-' + wk;
}
function loadWeek() {
  let w; try { w = JSON.parse(localStorage.getItem(LS_WEEK)); } catch (e) {}
  if (!w || w.id !== weekId()) w = { id: weekId(), earned: 0, claimed: false };
  return w;
}
let weekData = loadWeek();
function persistWeek() { try { localStorage.setItem(LS_WEEK, JSON.stringify(weekData)); } catch (e) {} }

// wrap awardStars to track the weekly tally (and grant a one-time bonus)
const _origAward = awardStars;
awardStars = function (n) {
  _origAward(n);
  if (weekData.id !== weekId()) weekData = { id: weekId(), earned: 0, claimed: false };
  weekData.earned += n;
  if (!weekData.claimed && weekData.earned >= WEEK_GOAL) {
    weekData.claimed = true;
    persistWeek();
    _origAward(10); // bonus, without re-counting
    setTimeout(weeklyToast, 900);
  } else {
    persistWeek();
  }
};
function weeklyToast() {
  const t = document.getElementById('achToast');
  if (!t) return;
  t.innerHTML = '<span class="at-ic">\u{1F381}</span><span><b>Weekly goal!</b><br>+10 bonus stars \u{1F389}</span>';
  t.className = 'show';
  if (typeof sfxCelebrate === 'function') sfxCelebrate();
  setTimeout(() => { t.className = ''; }, 2800);
}

// add a weekly-goal row to the parent dashboard
if (typeof showParent === 'function') {
  const _showParent = showParent;
  showParent = function () {
    _showParent();
    const box = document.getElementById('parentStats');
    if (box) {
      const d = document.createElement('div');
      d.className = 'parent-row';
      d.innerHTML = '<span>\u{1F4C5} This week</span><b>' + Math.min(weekData.earned, WEEK_GOAL) + ' / ' + WEEK_GOAL + ' ⭐</b>';
      box.appendChild(d);
      const m = document.createElement('div');
      m.className = 'parent-row';
      m.innerHTML = '<span>\u{1F9E0} Math steps</span><b>' + mathPassedCount() + ' / ' + MATH_STAGES.length + '</b>';
      box.appendChild(m);
    }
  };
}
