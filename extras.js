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
  for (let i = 0; i < denom; i++) {
    const seg = document.createElement('div');
    seg.className = 'frac-seg' + (i < count ? ' fill' : '');
    seg.style.animationDelay = (i * 0.08) + 's';
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

const FUN_FACTS = {
  '1/4': { t: '1 out of 4 slices — that’s one quarter!', say: 'One quarter. One out of four.' },
  '2/4': { t: '2/4 is the same as 1/2 — a half! \u{1F355}', say: 'Two fourths is the same as one half!' },
  '3/4': { t: '3 out of 4 — three quarters, almost the whole pizza!', say: 'Three quarters. Almost the whole pizza!' },
  '4/4': { t: '4/4 makes 1 WHOLE pizza! \u{1F389}', say: 'Four fourths makes one whole pizza!' }
};

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
}
function showMap() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  renderMap();
  const ov = document.getElementById('mapOverlay');
  ov.classList.remove('hidden'); ov.classList.add('fade-in'); ov.scrollTop = 0;
}
function hideMap() { document.getElementById('mapOverlay').classList.add('hidden'); }

function showGameScreen() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
}

// play a specific campaign level (from the map)
function beginLevel(idx) {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  endless = false; levelOverride = null;
  hideMap();
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
  const p = ENDLESS_POOL.slice().sort(() => Math.random() - 0.5);
  const a = p[0], b = p[1];
  const na = 1 + Math.floor(Math.random() * 3); // 1..3 of topping A
  const arr = [];
  for (let i = 0; i < 4; i++) arr.push(i < na ? a : b);
  return arr.sort(() => Math.random() - 0.5);
}
function startEndless() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  endless = true; served = 0; levelOverride = { order: genOrder() };
  hideMap();
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
const _ext_showCelebration = showCelebration;
showCelebration = function (stars) {
  _ext_showCelebration(stars);
  // stats
  stats.served++;
  if (stars === 3) stats.threeStars++;
  persistStats();
  if (endless) {
    served++;
    const sc = document.getElementById('servedCount');
    if (sc) sc.textContent = served;
  } else {
    recordLevelStar(currentLevel, stars);
  }
  // fun fact + voice
  const f = FUN_FACTS[lastFrac];
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

// ===== INIT =====
if (typeof settingsData.voice === 'undefined') { settingsData.voice = true; persistSettings(); }
checkAchievements(); // grandfather badges for returning players
