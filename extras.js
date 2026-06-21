/* ========================================
   EXTRAS: education (voice + fun facts + fraction bar),
   achievements/badges, Free Play (endless), and the level map.
   Pure add-on layer; wraps existing functions, never replaces core logic.
   ======================================== */

const LS_STATS = 'fp_stats';
const LS_ACH = 'fp_ach';
const LS_LEVELSTARS = 'fp_levelstars';

let stats = loadStats();
let achUnlocked = loadAch();
let levelStars = loadLevelStars();
let lastFrac = '1/4';

// endless / free play state
let endless = false, served = 0;
const ENDLESS_POOL = ['cheese', 'olive', 'pepperoni', 'mushroom', 'pepper'];

// =============================================
// PERSISTENCE
// =============================================
function loadStats() {
  const def = { served: 0, threeStars: 0, campaign: false };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(LS_STATS)) || {}); }
  catch (e) { return def; }
}
function persistStats() { try { localStorage.setItem(LS_STATS, JSON.stringify(stats)); } catch (e) {} }

function loadAch() { try { return JSON.parse(localStorage.getItem(LS_ACH)) || []; } catch (e) { return []; } }
function persistAch() { try { localStorage.setItem(LS_ACH, JSON.stringify(achUnlocked)); } catch (e) {} }

function loadLevelStars() {
  try { const a = JSON.parse(localStorage.getItem(LS_LEVELSTARS)); if (Array.isArray(a)) return a; } catch (e) {}
  return [];
}
function persistLevelStars() { try { localStorage.setItem(LS_LEVELSTARS, JSON.stringify(levelStars)); } catch (e) {} }
function recordLevelStar(idx, stars) {
  if (stars > (levelStars[idx] || 0)) { levelStars[idx] = stars; persistLevelStars(); }
}

// =============================================
// EDUCATION: voice narration + fun facts + fraction bar
// =============================================
function speak(text) {
  if (!settingsData.voice) return;
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.2; u.volume = 1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

function renderFractionBar(count, denom) {
  const bar = document.getElementById('fractionBar');
  if (!bar) return;
  bar.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'frac-track';
  const w = Math.max(14, Math.min(40, Math.floor(300 / denom))); // responsive segment width
  for (let i = 0; i < denom; i++) {
    const seg = document.createElement('div');
    seg.className = 'frac-seg' + (i < count ? ' fill' : '');
    seg.style.width = w + 'px';
    seg.style.animationDelay = (i * 0.06) + 's';
    track.appendChild(seg);
  }
  bar.appendChild(track);
}

// called by game.js when a fraction question is shown
function onQuestionShown(ask, count, denom, frac) {
  lastFrac = frac;
  renderFractionBar(count, denom);
  speak('What fraction is ' + (TOPPING_NAMES[ask] || ask) + '?');
}

// say a fraction in kid words: 2/4 -> "two quarters", 1/2 -> "one half"
const ORD = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'] };
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function sayFrac(n, d) { const o = ORD[d]; if (!o) return n + ' over ' + d; return n + ' ' + (n === 1 ? o[0] : o[1]); }

function funFactFor(frac) {
  const parts = frac.split('/').map(Number), n = parts[0], d = parts[1];
  if (n === d) return { t: n + '/' + d + ' makes 1 WHOLE pizza! \u{1F389}', say: n + ' ' + (ORD[d] ? ORD[d][1] : 'parts') + ' makes one whole pizza!' };
  const g = gcd(n, d);
  if (g > 1) {
    const sn = n / g, sd = d / g;
    const simple = sd === 1 ? 'a whole' : sn + '/' + sd;
    return { t: n + '/' + d + ' is the same as ' + simple + '! \u{1F355}', say: sayFrac(n, d) + ' is the same as ' + (sd === 1 ? 'one whole' : sayFrac(sn, sd)) };
  }
  return { t: n + ' out of ' + d + ' slices — that’s ' + sayFrac(n, d) + '!', say: sayFrac(n, d) };
}

// =============================================
// ACHIEVEMENTS / BADGES
// =============================================
const ACHS = [
  { id: 'first',    icon: '\u{1F355}', title: 'First Pizza',  desc: 'Serve your first pizza',     test: s => s.served >= 1 },
  { id: 'three',    icon: '⭐',        title: 'Star Baker',   desc: 'Get 3 stars on a pizza',     test: s => s.threeStars >= 1 },
  { id: 'served10', icon: '\u{1F468}‍\u{1F373}', title: 'Busy Kitchen', desc: 'Serve 10 pizzas', test: s => s.served >= 10 },
  { id: 'served25', icon: '\u{1F3EA}', title: 'Pizza Pro',    desc: 'Serve 25 pizzas',            test: s => s.served >= 25 },
  { id: 'stars25',  icon: '✨',        title: 'Star Collector', desc: 'Earn 25 stars',            test: s => s.lifetime >= 25 },
  { id: 'stars50',  icon: '\u{1F31F}', title: 'Star Master',  desc: 'Earn 50 stars',              test: s => s.lifetime >= 50 },
  { id: 'stars100', icon: '\u{1F4AB}', title: 'Star Legend',  desc: 'Earn 100 stars',             test: s => s.lifetime >= 100 },
  { id: 'shopper',  icon: '\u{1F6CD}️', title: 'Shopper',     desc: 'Buy your first shop item',   test: s => s.owned > s.freeCount },
  { id: 'decorator',icon: '\u{1F388}', title: 'Decorator',    desc: 'Place 5 decorations',        test: s => s.decos >= 5 },
  { id: 'master',   icon: '\u{1F3C6}', title: 'Pizza Master', desc: 'Finish all the levels',      test: s => s.campaign }
];

function buildStats() {
  const ownedTotal = ['theme', 'mascot', 'awning', 'bg', 'deco'].reduce((a, k) => a + (owned[k] ? owned[k].length : 0), 0);
  const freeCount = SHOP_THEMES.filter(x => x.cost === 0).length + SHOP_MASCOTS.filter(x => x.cost === 0).length +
    SHOP_AWNINGS.filter(x => x.cost === 0).length + SHOP_BGS.filter(x => x.cost === 0).length;
  return {
    served: stats.served, threeStars: stats.threeStars, campaign: stats.campaign,
    lifetime: lifetime, owned: ownedTotal, freeCount: freeCount, decos: (shopData.decos || []).length
  };
}

function checkAchievements() {
  const s = buildStats();
  const newly = [];
  ACHS.forEach(a => { if (achUnlocked.indexOf(a.id) === -1 && a.test(s)) { achUnlocked.push(a.id); newly.push(a); } });
  if (newly.length) {
    persistAch();
    newly.forEach((a, i) => setTimeout(() => achToast(a), 500 + i * 1700));
  }
}

let achToastTimer = null;
function achToast(a) {
  const t = document.getElementById('achToast');
  if (!t) return;
  t.innerHTML = '<span class="at-ic">' + a.icon + '</span><span><b>Badge unlocked!</b><br>' + a.title + '</span>';
  t.className = 'show';
  if (typeof sfxStar === 'function') sfxStar();
  clearTimeout(achToastTimer);
  achToastTimer = setTimeout(() => { t.className = ''; }, 2600);
}

function renderAchievements() {
  document.getElementById('achProgress').textContent = achUnlocked.length + ' / ' + ACHS.length + ' badges earned';
  const g = document.getElementById('achGrid');
  g.innerHTML = '';
  ACHS.forEach(a => {
    const got = achUnlocked.indexOf(a.id) !== -1;
    const d = document.createElement('div');
    d.className = 'ach-item' + (got ? '' : ' locked');
    d.innerHTML = '<div class="ach-ic">' + (got ? a.icon : '\u{1F512}') + '</div>' +
      '<div class="ach-t">' + a.title + '</div><div class="ach-d">' + a.desc + '</div>';
    g.appendChild(d);
  });
}
function showAchievements() {
  if (typeof sfxButton === 'function') sfxButton();
  renderAchievements();
  const ov = document.getElementById('achOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideAchievements() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('achOverlay').classList.add('hidden');
}

// =============================================
// LEVEL MAP
// =============================================
function renderMap() {
  document.getElementById('mapWallet').textContent = wallet;
  const path = document.getElementById('mapPath');
  path.innerHTML = '';
  for (let i = 0; i < levels.length; i++) {
    const earned = levelStars[i] || 0;
    const unlocked = i === 0 || (levelStars[i - 1] || 0) > 0;
    const node = document.createElement('div');
    node.className = 'map-node' + (unlocked ? '' : ' locked') + (earned > 0 ? ' done' : '');
    if (unlocked) {
      node.innerHTML = '<div class="node-num">' + (i + 1) + '</div>' +
        '<div class="node-stars">' + ('⭐'.repeat(earned) + '☆'.repeat(3 - earned)) + '</div>';
      node.onclick = () => beginLevel(i);
    } else {
      node.innerHTML = '<div class="node-lock">\u{1F512}</div>';
    }
    path.appendChild(node);
  }
  // "you are here" mascot pin on the next level to play
  let curIdx = 0;
  for (let i = 0; i < levels.length; i++) {
    const unlocked = i === 0 || (levelStars[i - 1] || 0) > 0;
    if (!unlocked) break;
    curIdx = i;
    if (!(levelStars[i] > 0)) break;
  }
  const cur = path.children[curIdx];
  if (cur && !cur.classList.contains('locked')) {
    cur.classList.add('current');
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.textContent = shopData.mascot;
    cur.appendChild(pin);
  }
}
function showMap() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  renderMap();
  const ov = document.getElementById('mapOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in'); ov.scrollTop = 0;
}
function hideMap() { document.getElementById('mapOverlay').classList.add('hidden'); }

// close any hub (map / games) before launching a mini-game
function hideHubs() {
  document.getElementById('mapOverlay').classList.add('hidden');
  document.getElementById('gamesOverlay').classList.add('hidden');
}

// ===== MINI GAMES HUB =====
function showGames() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  document.getElementById('gamesWallet').textContent = wallet;
  const ov = document.getElementById('gamesOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in'); ov.scrollTop = 0;
}
function hideGames() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('gamesOverlay').classList.add('hidden');
}

function showGameScreen() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'flex';
}

// play a specific campaign level (from the map)
function beginLevel(idx) {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  endless = false; levelOverride = null;
  hideHubs();
  showGameScreen();
  document.getElementById('progressDots').style.display = '';
  document.getElementById('endlessBadge').style.display = 'none';
  currentLevel = idx;
  loadLevel(idx);
  if (typeof startMusic === 'function') startMusic();
  const ce = document.getElementById('chefEmoji'), ct = document.getElementById('chefText');
  if (ct) ct.textContent = 'Welcome to ' + shopData.name + '! \u{1F355}';
  if (ce) ce.textContent = shopData.mascot;
}

// =============================================
// FREE PLAY (ENDLESS)
// =============================================
function genOrder() {
  const denoms = [2, 3, 4, 4, 6, 8]; // mixed slice counts (4 weighted)
  const d = denoms[Math.floor(Math.random() * denoms.length)];
  const p = ENDLESS_POOL.slice().sort(() => Math.random() - 0.5);
  const a = p[0], b = p[1];
  const na = 1 + Math.floor(Math.random() * (d - 1)); // 1..d-1 of topping A
  const arr = [];
  for (let i = 0; i < d; i++) arr.push(i < na ? a : b);
  return arr.sort(() => Math.random() - 0.5);
}
function startEndless() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  endless = true; served = 0; levelOverride = { order: genOrder() };
  hideHubs();
  showGameScreen();
  document.getElementById('progressDots').style.display = 'none';
  const badge = document.getElementById('endlessBadge');
  badge.style.display = 'inline-flex';
  document.getElementById('servedCount').textContent = '0';
  currentLevel = 0;
  loadLevel(0);
  if (typeof startMusic === 'function') startMusic();
  const ce = document.getElementById('chefEmoji'), ct = document.getElementById('chefText');
  if (ct) ct.textContent = 'Free Play! Keep cooking! \u{1F525}';
  if (ce) ce.textContent = shopData.mascot;
}

// =============================================
// SETTINGS: read-aloud toggle (extends shop.js settings)
// =============================================
const _buildSettingsUI = buildSettingsUI;
buildSettingsUI = function () {
  _buildSettingsUI();
  const v = document.getElementById('setVoiceToggle');
  if (v) { v.textContent = settingsData.voice ? 'On' : 'Off'; v.classList.toggle('off', !settingsData.voice); }
};
function settingsToggleVoice() {
  settingsData.voice = !settingsData.voice;
  persistSettings();
  buildSettingsUI();
  if (settingsData.voice) speak('Reading is on!');
}

// =============================================
// HOOKS INTO THE GAME (wrap shop.js's already-wrapped versions)
// =============================================
const STORY_BEATS = [
  n => n + ' loved it! \u{1F60B}',
  () => 'Your shop is getting famous! ⭐',
  () => 'Another happy customer! \u{1F389}',
  n => n + ' will tell all their friends!',
  () => 'Delicious work, chef! \u{1F468}‍\u{1F373}'
];

const _ext_showCelebration = showCelebration;
showCelebration = function (stars) {
  const oldRank = rankFor(stats.served);
  _ext_showCelebration(stars);
  // story beat
  const cs = document.getElementById('celebStory');
  if (cs) { const b = STORY_BEATS[Math.floor(Math.random() * STORY_BEATS.length)]; cs.textContent = b(lastCustomerName); }
  // stats
  stats.served++;
  if (stars === 3) stats.threeStars++;
  persistStats();
  // shop rank up?
  const newRank = rankFor(stats.served);
  if (newRank.name !== oldRank.name) setTimeout(() => rankToast(newRank), 1500);
  if (endless) {
    served++;
    const sc = document.getElementById('servedCount');
    if (sc) sc.textContent = served;
  } else {
    recordLevelStar(currentLevel, stars);
  }
  // fun fact + voice
  const f = funFactFor(lastFrac);
  const ff = document.getElementById('funFact');
  if (ff) ff.textContent = f ? f.t : '';
  if (f) setTimeout(() => speak(f.say), 750);
  checkAchievements();
};

const _ext_showGameComplete = showGameComplete;
showGameComplete = function () {
  _ext_showGameComplete();
  stats.campaign = true; persistStats();
  checkAchievements();
};

// endless: never "complete"; just serve the next random pizza
const _ext_nextLevel = nextLevel;
nextLevel = function () {
  if (endless) {
    if (typeof sfxButton === 'function') sfxButton();
    document.getElementById('celebrationOverlay').classList.add('hidden');
    document.getElementById('confettiContainer').innerHTML = '';
    document.getElementById('flyingStars').innerHTML = '';
    levelOverride = { order: genOrder() };
    loadLevel(0);
    if (musicEnabled && typeof startMusic === 'function') startMusic();
    return;
  }
  _ext_nextLevel();
};

// catch shop purchases/decorations for the Shopper/Decorator badges
const _ext_afterShopChange = afterShopChange;
afterShopChange = function () {
  _ext_afterShopChange();
  checkAchievements();
};

// =============================================
// CUSTOMERS (named characters + varied lines)
// =============================================
const CUST_ROSTER = [
  { e: '\u{1F430}', n: 'Rosie' }, { e: '\u{1F436}', n: 'Max' }, { e: '\u{1F431}', n: 'Mimi' },
  { e: '\u{1F43C}', n: 'Bao' }, { e: '\u{1F98A}', n: 'Foxy' }, { e: '\u{1F435}', n: 'Coco' },
  { e: '\u{1F42F}', n: 'Tiger' }, { e: '\u{1F438}', n: 'Hops' }, { e: '\u{1F981}', n: 'Leo' },
  { e: '\u{1F427}', n: 'Pip' }, { e: '\u{1F428}', n: 'Ko' }, { e: '\u{1F984}', n: 'Sparkle' }
];
const CUST_LINES = ['wants this pizza!', 'is so hungry!', 'loves this one!', 'can’t wait!', 'ordered this!', 'says yum!'];
let lastCustomerName = 'Rosie';
renderCustomer = function (idx) {
  const c = CUST_ROSTER[idx % CUST_ROSTER.length];
  lastCustomerName = c.n;
  const face = document.getElementById('orderCustomer');
  const sp = document.getElementById('orderSpeech');
  if (face) face.textContent = c.e;
  if (sp) sp.textContent = c.n + ' ' + CUST_LINES[idx % CUST_LINES.length];
};

// ===== SHOP RANK / FAME (grows with pizzas served) =====
function rankFor(served) {
  if (served >= 31) return { name: 'Legendary Pizzeria', icon: '\u{1F3C6}' };
  if (served >= 16) return { name: 'Famous Pizzeria', icon: '⭐' };
  if (served >= 8) return { name: 'Busy Pizzeria', icon: '\u{1F468}‍\u{1F373}' };
  if (served >= 3) return { name: 'Corner Pizzeria', icon: '\u{1F355}' };
  return { name: 'Food Cart', icon: '\u{1F69A}' };
}
function rankToast(r) {
  const t = document.getElementById('achToast');
  if (!t) return;
  t.innerHTML = '<span class="at-ic">' + r.icon + '</span><span><b>Shop leveled up!</b><br>' + r.name + '</span>';
  t.className = 'show';
  if (typeof sfxCelebrate === 'function') sfxCelebrate();
  clearTimeout(achToastTimer);
  achToastTimer = setTimeout(() => { t.className = ''; }, 2800);
}

// =============================================
// DAILY REWARD (streak)
// =============================================
const LS_DAILY = 'fp_daily';
let pendingDaily = null;
function dateStr(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function checkDaily() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(LS_DAILY)); } catch (e) {}
  const today = new Date(), ts = dateStr(today);
  if (data && data.last === ts) return; // already claimed today
  const y = new Date(today); y.setDate(today.getDate() - 1);
  const ys = dateStr(y);
  let streak = 1;
  if (data && data.last === ys) streak = (data.streak || 1) + 1;
  const best = Math.max(streak, (data && data.best) || 0);
  pendingDaily = { streak: streak, bonus: Math.min(2 + streak, 10), ts: ts, best: best };
  document.getElementById('dailyStreak').textContent = 'Day ' + streak + ' streak! \u{1F525}';
  document.getElementById('dailyBonus').textContent = '+' + pendingDaily.bonus + ' stars for your shop!';
  document.getElementById('dailyStars').textContent = '⭐'.repeat(Math.min(pendingDaily.bonus, 8));
  const ov = document.getElementById('dailyOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function claimDaily() {
  if (typeof ensureAudio === 'function') ensureAudio();
  if (pendingDaily) {
    awardStars(pendingDaily.bonus);
    try { localStorage.setItem(LS_DAILY, JSON.stringify({ last: pendingDaily.ts, streak: pendingDaily.streak, best: pendingDaily.best })); } catch (e) {}
    if (typeof sfxCelebrate === 'function') sfxCelebrate();
    pendingDaily = null;
    checkAchievements();
  }
  document.getElementById('dailyOverlay').classList.add('hidden');
}

// =============================================
// FRACTION ADDITION MINI-GAME
// =============================================
let addState = null;
function drawAddPizza(svg, count, denom, topping) {
  const arr = new Array(denom).fill(null);
  for (let i = 0; i < count; i++) arr[i] = topping;
  drawPizza(svg, arr, 80, 80, 64, true);
}
function genAddRound() {
  const denom = [4, 4, 6][Math.floor(Math.random() * 3)];
  const a = 1 + Math.floor(Math.random() * (denom - 1));
  const b = 1 + Math.floor(Math.random() * (denom - a));
  addState = { denom: denom, a: a, b: b, sum: a + b, tries: 0 };
  drawAddPizza(document.getElementById('addPizzaA'), a, denom, 'cheese');
  drawAddPizza(document.getElementById('addPizzaB'), b, denom, 'pepperoni');
  document.getElementById('addPrompt').innerHTML = a + '/' + denom + ' + ' + b + '/' + denom + ' = <b>?</b>';
  setTimeout(() => speak(sayFrac(a, denom) + ' plus ' + sayFrac(b, denom) + '. How many altogether?'), 250);
  const correct = (a + b) + '/' + denom;
  const opts = new Set([correct]);
  [a + b - 1, a + b + 1, a, b].forEach(v => { if (opts.size < 4 && v >= 1 && v <= denom) opts.add(v + '/' + denom); });
  let c = 1; while (opts.size < 4 && c <= denom) { opts.add(c + '/' + denom); c++; }
  const box = document.getElementById('addChoices'); box.innerHTML = '';
  [...opts].sort(() => Math.random() - 0.5).forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn'; btn.textContent = f;
    btn.onclick = () => addAnswer(btn, f, correct);
    box.appendChild(btn);
  });
}
function addAnswer(btn, chosen, correct) {
  if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
  addState.tries++;
  if (typeof sfxButton === 'function') sfxButton();
  if (chosen === correct) {
    btn.classList.add('correct');
    if (typeof sfxCorrect === 'function') sfxCorrect();
    document.querySelectorAll('#addChoices .answer-btn').forEach(b => b.style.pointerEvents = 'none');
    const reward = addState.tries === 1 ? 2 : 1;
    awardStars(reward);
    document.getElementById('addWallet').textContent = wallet;
    if (typeof spawnConfetti === 'function') spawnConfetti(document.getElementById('confettiContainer'));
    setTimeout(() => speak(sayFrac(addState.a, addState.denom) + ' plus ' + sayFrac(addState.b, addState.denom) + ' equals ' + sayFrac(addState.sum, addState.denom)), 300);
    checkAchievements();
    setTimeout(genAddRound, 1600);
  } else {
    btn.classList.add('wrong'); btn.style.pointerEvents = 'none';
    if (typeof sfxWrong === 'function') sfxWrong();
  }
}
function startAddGame() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  hideHubs();
  document.getElementById('addWallet').textContent = wallet;
  genAddRound();
  const ov = document.getElementById('addOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideAddGame() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('addOverlay').classList.add('hidden');
}

// =============================================
// COMPARE MINI-GAME (which fraction is bigger?)
// =============================================
let cmpState = null;
function drawCmpPizza(svg, count, denom) {
  const arr = new Array(denom).fill(null);
  for (let i = 0; i < count; i++) arr[i] = 'cheese';
  drawPizza(svg, arr, 80, 80, 64, true);
}
function genCompare() {
  const denoms = [2, 3, 4, 6, 8];
  const d1 = denoms[Math.floor(Math.random() * denoms.length)];
  const d2 = denoms[Math.floor(Math.random() * denoms.length)];
  const n1 = 1 + Math.floor(Math.random() * d1);
  let n2 = 1 + Math.floor(Math.random() * d2), guard = 0;
  while (Math.abs(n1 / d1 - n2 / d2) < 1e-9 && guard++ < 30) n2 = 1 + Math.floor(Math.random() * d2);
  cmpState = { n1: n1, d1: d1, n2: n2, d2: d2, bigger: (n1 / d1) > (n2 / d2) ? 'A' : 'B', done: false };
  drawCmpPizza(document.getElementById('cmpPizzaA'), n1, d1);
  drawCmpPizza(document.getElementById('cmpPizzaB'), n2, d2);
  document.getElementById('cmpLabA').textContent = n1 + '/' + d1;
  document.getElementById('cmpLabB').textContent = n2 + '/' + d2;
  const msg = document.getElementById('compareMsg');
  msg.textContent = 'Tap the pizza with more!'; msg.className = '';
  ['cmpBtnA', 'cmpBtnB'].forEach(id => document.getElementById(id).classList.remove('right', 'wrong'));
  setTimeout(() => speak('Which is bigger? ' + sayFrac(n1, d1) + ' or ' + sayFrac(n2, d2) + '?'), 250);
}
function comparePick(side) {
  if (!cmpState || cmpState.done) return;
  if (typeof sfxButton === 'function') sfxButton();
  const rightId = cmpState.bigger === 'A' ? 'cmpBtnA' : 'cmpBtnB';
  if (side === cmpState.bigger) {
    cmpState.done = true;
    document.getElementById(rightId).classList.add('right');
    if (typeof sfxCorrect === 'function') sfxCorrect();
    awardStars(1);
    document.getElementById('compareWallet').textContent = wallet;
    if (typeof spawnConfetti === 'function') spawnConfetti(document.getElementById('confettiContainer'));
    const bn = side === 'A' ? cmpState.n1 + '/' + cmpState.d1 : cmpState.n2 + '/' + cmpState.d2;
    const bd = side === 'A' ? [cmpState.n1, cmpState.d1] : [cmpState.n2, cmpState.d2];
    const msg = document.getElementById('compareMsg');
    msg.textContent = bn + ' is bigger! ⭐'; msg.className = 'good';
    setTimeout(() => speak(sayFrac(bd[0], bd[1]) + ' is bigger!'), 300);
    checkAchievements();
    setTimeout(genCompare, 1600);
  } else {
    document.getElementById(side === 'A' ? 'cmpBtnA' : 'cmpBtnB').classList.add('wrong');
    if (typeof sfxWrong === 'function') sfxWrong();
    document.getElementById('compareMsg').textContent = 'Try the other one!';
  }
}
function startCompare() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  hideHubs();
  document.getElementById('compareWallet').textContent = wallet;
  genCompare();
  const ov = document.getElementById('compareOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideCompare() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('compareOverlay').classList.add('hidden');
}

// =============================================
// PARENT DASHBOARD
// =============================================
function showParent() {
  if (typeof sfxButton === 'function') sfxButton();
  const done = levelStars.filter(s => s > 0).length;
  let daily = {};
  try { daily = JSON.parse(localStorage.getItem(LS_DAILY)) || {}; } catch (e) {}
  const acc = stats.served ? Math.round(stats.threeStars / stats.served * 100) : 0;
  const rows = [
    ['\u{1F355} Pizzas served', stats.served],
    ['\u{1F3AF} First-try perfect', stats.threeStars + ' (' + acc + '%)'],
    ['\u{1F5FA} Levels completed', done + ' / ' + levels.length],
    ['\u{1F3C6} Badges earned', achUnlocked.length + ' / ' + ACHS.length],
    ['⭐ Stars earned (total)', lifetime],
    ['\u{1F525} Best daily streak', (daily.best || daily.streak || 0) + ' days'],
    ['\u{1F3EA} Shop rank', rankFor(stats.served).icon + ' ' + rankFor(stats.served).name]
  ];
  const box = document.getElementById('parentStats');
  box.innerHTML = '';
  rows.forEach(r => {
    const d = document.createElement('div');
    d.className = 'parent-row';
    d.innerHTML = '<span>' + r[0] + '</span><b>' + r[1] + '</b>';
    box.appendChild(d);
  });
  const ov = document.getElementById('parentOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideParent() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('parentOverlay').classList.add('hidden');
}

// =============================================
// FIND THE MATCH MINI-GAME (equivalent fractions)
// =============================================
let matchState = null;
const MATCH_BASES = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]];
function eqFracs(sn, sd) {
  const res = [];
  [2, 3, 4, 6, 8].forEach(d => { if (d % sd === 0) { const k = d / sd; res.push([sn * k, d]); } });
  return res;
}
function drawMatchPizza(svg, n, d) {
  const arr = new Array(d).fill(null);
  for (let i = 0; i < n; i++) arr[i] = 'cheese';
  drawPizza(svg, arr, 80, 80, 64, true);
}
function genMatch() {
  const base = MATCH_BASES[Math.floor(Math.random() * MATCH_BASES.length)];
  const all = eqFracs(base[0], base[1]);
  const target = all[Math.floor(Math.random() * all.length)];
  const corrCands = all.filter(f => f[1] !== target[1]);
  const correct = corrCands[Math.floor(Math.random() * corrCands.length)];
  const tv = target[0] / target[1];
  const distractors = [];
  let guard = 0;
  while (distractors.length < 2 && guard++ < 120) {
    const d = [2, 3, 4, 6, 8][Math.floor(Math.random() * 5)];
    const n = 1 + Math.floor(Math.random() * d);
    if (Math.abs(n / d - tv) < 1e-9) continue;
    if (n === correct[0] && d === correct[1]) continue;
    if (distractors.some(x => x[0] === n && x[1] === d)) continue;
    distractors.push([n, d]);
  }
  matchState = { target: target, correct: correct, done: false };
  drawMatchPizza(document.getElementById('matchTarget'), target[0], target[1]);
  document.getElementById('matchTargetLabel').textContent = target[0] + '/' + target[1];
  const opts = [correct].concat(distractors).sort(() => Math.random() - 0.5);
  const box = document.getElementById('matchOptions');
  box.innerHTML = '';
  opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.className = 'match-opt';
    btn.innerHTML = '<svg id="matchOpt' + i + '" viewBox="0 0 160 160" width="72" height="72"></svg><div class="cmp-label">' + o[0] + '/' + o[1] + '</div>';
    box.appendChild(btn);
    drawMatchPizza(btn.querySelector('svg'), o[0], o[1]);
    btn.onclick = () => matchPick(o[0], o[1], btn);
  });
  const msg = document.getElementById('matchMsg');
  msg.textContent = 'Which one is the same?'; msg.className = '';
  setTimeout(() => speak('Which one is the same as ' + sayFrac(target[0], target[1]) + '?'), 250);
}
function matchPick(n, d, btn) {
  if (!matchState || matchState.done) return;
  if (typeof sfxButton === 'function') sfxButton();
  if (n === matchState.correct[0] && d === matchState.correct[1]) {
    matchState.done = true;
    btn.classList.add('right');
    if (typeof sfxCorrect === 'function') sfxCorrect();
    awardStars(1);
    document.getElementById('matchWallet').textContent = wallet;
    if (typeof spawnConfetti === 'function') spawnConfetti(document.getElementById('confettiContainer'));
    const t = matchState.target;
    const msg = document.getElementById('matchMsg');
    msg.textContent = t[0] + '/' + t[1] + ' = ' + n + '/' + d + '! ⭐'; msg.className = 'good';
    setTimeout(() => speak(sayFrac(t[0], t[1]) + ' is the same as ' + sayFrac(n, d)), 300);
    checkAchievements();
    setTimeout(genMatch, 1700);
  } else {
    btn.classList.add('wrong');
    if (typeof sfxWrong === 'function') sfxWrong();
    document.getElementById('matchMsg').textContent = 'Not the same — try again!';
  }
}
function startMatch() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  hideHubs();
  document.getElementById('matchWallet').textContent = wallet;
  genMatch();
  const ov = document.getElementById('matchOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideMatch() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('matchOverlay').classList.add('hidden');
}

// =============================================
// NUMBER LINE MINI-GAME
// =============================================
let lineState = null;
const LINE_DENOMS = [2, 3, 4, 5, 6, 8];
function genLine() {
  const d = LINE_DENOMS[Math.floor(Math.random() * LINE_DENOMS.length)];
  const n = 1 + Math.floor(Math.random() * (d - 1));
  lineState = { n: n, d: d, done: false };
  document.getElementById('linePrompt').innerHTML = 'Where is <b>' + n + '/' + d + '</b>?';
  const track = document.getElementById('lineTrack');
  track.innerHTML = '';
  const base = document.createElement('div'); base.className = 'line-base'; track.appendChild(base);
  const l0 = document.createElement('div'); l0.className = 'line-end l0'; l0.textContent = '0'; track.appendChild(l0);
  const l1 = document.createElement('div'); l1.className = 'line-end l1'; l1.textContent = '1'; track.appendChild(l1);
  for (let i = 0; i <= d; i++) {
    const t = document.createElement('button');
    t.className = 'line-tick' + (i === 0 || i === d ? ' fixed' : '');
    t.style.left = (i / d * 100) + '%';
    t.onclick = () => linePick(i, t);
    track.appendChild(t);
  }
  const msg = document.getElementById('lineMsg');
  msg.textContent = 'Tap the right spot!'; msg.className = '';
  setTimeout(() => speak('Where is ' + sayFrac(n, d) + '?'), 250);
}
function linePick(i, t) {
  if (!lineState || lineState.done) return;
  if (typeof sfxButton === 'function') sfxButton();
  if (i === lineState.n) {
    lineState.done = true;
    t.classList.add('right');
    t.innerHTML = '<span class="tick-lab">' + lineState.n + '/' + lineState.d + '</span>';
    if (typeof sfxCorrect === 'function') sfxCorrect();
    awardStars(1);
    document.getElementById('lineWallet').textContent = wallet;
    const msg = document.getElementById('lineMsg');
    msg.textContent = 'Yes! ⭐'; msg.className = 'good';
    if (typeof spawnConfetti === 'function') spawnConfetti(document.getElementById('confettiContainer'));
    setTimeout(() => speak('Yes! ' + sayFrac(lineState.n, lineState.d)), 300);
    checkAchievements();
    setTimeout(genLine, 1700);
  } else {
    t.classList.add('wrong');
    if (typeof sfxWrong === 'function') sfxWrong();
    document.getElementById('lineMsg').textContent = 'Not there — try again!';
    setTimeout(() => t.classList.remove('wrong'), 500);
  }
}
function startLine() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  hideHubs();
  document.getElementById('lineWallet').textContent = wallet;
  genLine();
  const ov = document.getElementById('lineOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideLine() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('lineOverlay').classList.add('hidden');
}

// show the shop's current rank inside the shop screen
const _ext_showShop = showShop;
showShop = function () {
  _ext_showShop();
  const el = document.getElementById('shopRank');
  if (el) { const r = rankFor(stats.served); el.innerHTML = '<span>' + r.icon + '</span> ' + r.name; }
};

// ===== INIT =====
if (typeof settingsData.voice === 'undefined') { settingsData.voice = true; persistSettings(); }
checkAchievements(); // grandfather badges for returning players
checkDaily();        // welcome / daily streak gift
