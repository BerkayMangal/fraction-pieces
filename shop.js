/* ========================================
   MY PIZZA SHOP + SETTINGS + PERSISTENCE
   (additive layer — does not touch core game logic)
   ======================================== */

// ===== STORAGE KEYS =====
const LS_SHOP = 'fp_shop';
const LS_SETTINGS = 'fp_settings';
const LS_PROGRESS = 'fp_progress';

// ===== OPTION DATA =====
const SHOP_THEMES = [
  { id: 'orange', theme: '#ff8c00', dark: '#cc5500', light: '#ffb347' },
  { id: 'red',    theme: '#ef4444', dark: '#b91c1c', light: '#f87171' },
  { id: 'pink',   theme: '#ec4899', dark: '#be185d', light: '#f9a8d4' },
  { id: 'purple', theme: '#8b5cf6', dark: '#6d28d9', light: '#c4b5fd' },
  { id: 'blue',   theme: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd' },
  { id: 'teal',   theme: '#14b8a6', dark: '#0f766e', light: '#5eead4' },
  { id: 'green',  theme: '#4caf50', dark: '#2e7d32', light: '#81c784' }
];

const SHOP_MASCOTS = ['\u{1F355}','\u{1F468}‍\u{1F373}','⭐','\u{1F9C0}','\u{1F345}','\u{1F525}','❤️','\u{1F451}'];

const SHOP_AWNINGS = ['#ff8c00','#ef4444','#ec4899','#8b5cf6','#3b82f6','#14b8a6','#4caf50'];

const SHOP_BGS = [
  { id: 'warm',     bg: 'radial-gradient(ellipse at 50% 0%,#ffe8b8 0%,transparent 50%),linear-gradient(180deg,#fff3d6 0%,#f5d5a0 40%,#e8ba78 100%)', swatch: 'linear-gradient(180deg,#fff3d6,#e8ba78)' },
  { id: 'sky',      bg: 'linear-gradient(180deg,#dff1ff 0%,#acd8ff 60%,#7cc0f5 100%)', swatch: 'linear-gradient(180deg,#dff1ff,#7cc0f5)' },
  { id: 'mint',     bg: 'linear-gradient(180deg,#e3fbe9 0%,#bff0cd 60%,#8fe0aa 100%)', swatch: 'linear-gradient(180deg,#e3fbe9,#8fe0aa)' },
  { id: 'pink',     bg: 'linear-gradient(180deg,#ffe6f2 0%,#ffc2dd 60%,#ff9cc4 100%)', swatch: 'linear-gradient(180deg,#ffe6f2,#ff9cc4)' },
  { id: 'lavender', bg: 'linear-gradient(180deg,#efe7ff 0%,#d6c2ff 60%,#bfa3ff 100%)', swatch: 'linear-gradient(180deg,#efe7ff,#bfa3ff)' }
];

const DEFAULT_SHOP = { name: 'My Pizza Shop', themeId: 'orange', mascot: '\u{1F355}', awning: '#ff8c00', bgId: 'warm' };

// ===== STATE =====
let shopData = loadShop();
let settingsData = loadSettings();
let draftShop = null; // working copy while editing

// ===== LOAD / SAVE HELPERS =====
function loadShop() {
  try { return Object.assign({}, DEFAULT_SHOP, JSON.parse(localStorage.getItem(LS_SHOP)) || {}); }
  catch (e) { return Object.assign({}, DEFAULT_SHOP); }
}
function persistShop() { try { localStorage.setItem(LS_SHOP, JSON.stringify(shopData)); } catch (e) {} }

function loadSettings() {
  const def = { music: true, sfx: true, brightness: 100 };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}); }
  catch (e) { return def; }
}
function persistSettings() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(settingsData)); } catch (e) {} }

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS)) || { level: 0, stars: 0 }; }
  catch (e) { return { level: 0, stars: 0 }; }
}
function saveProgress(level, stars) {
  try { localStorage.setItem(LS_PROGRESS, JSON.stringify({ level, stars })); } catch (e) {}
}

function themeById(id) { return SHOP_THEMES.find(t => t.id === id) || SHOP_THEMES[0]; }
function bgById(id) { return SHOP_BGS.find(b => b.id === id) || SHOP_BGS[0]; }

// ===== APPLY SHOP TO GAME =====
function applyShop() {
  const t = themeById(shopData.themeId);
  const root = document.documentElement.style;
  root.setProperty('--theme', t.theme);
  root.setProperty('--theme-dark', t.dark);
  root.setProperty('--theme-light', t.light);
  root.setProperty('--game-bg', bgById(shopData.bgId).bg);

  const hdr = document.getElementById('shopHeaderName');
  const hMascot = document.getElementById('shopHeaderMascot');
  if (hdr) hdr.textContent = shopData.name;
  if (hMascot) hMascot.textContent = shopData.mascot;
}

// ===== APPLY SETTINGS =====
function applySettings() {
  // sync with game.js audio flags + in-game buttons
  musicEnabled = settingsData.music;
  sfxEnabled = settingsData.sfx;
  const mBtn = document.getElementById('musicBtn');
  const sBtn = document.getElementById('sfxBtn');
  if (mBtn) {
    mBtn.classList.toggle('on', musicEnabled);
    mBtn.classList.toggle('off', !musicEnabled);
    mBtn.innerHTML = musicEnabled ? '&#9834;' : '&#9835;';
  }
  if (sBtn) {
    sBtn.classList.toggle('on', sfxEnabled);
    sBtn.classList.toggle('off', !sfxEnabled);
    sBtn.innerHTML = sfxEnabled ? '&#128264;' : '&#128263;';
  }
  applyBrightness(settingsData.brightness);
}

function applyBrightness(val) {
  const ov = document.getElementById('brightnessOverlay');
  if (ov) ov.style.opacity = ((100 - val) / 100).toFixed(2); // 100 -> 0 dim, 40 -> 0.6 dim
}

// =============================================
// SHOP SCREEN UI
// =============================================
function buildShopUI() {
  draftShop = Object.assign({}, shopData);

  document.getElementById('shopNameInput').value = draftShop.name;

  // theme swatches
  const tc = document.getElementById('shopThemeSwatches');
  tc.innerHTML = '';
  SHOP_THEMES.forEach(t => {
    const s = document.createElement('div');
    s.className = 'swatch' + (t.id === draftShop.themeId ? ' selected' : '');
    s.style.background = t.theme;
    s.onclick = () => { draftShop.themeId = t.id; refreshSelected(tc, s); refreshPreview(); };
    tc.appendChild(s);
  });

  // mascots
  const mc = document.getElementById('shopMascotChoices');
  mc.innerHTML = '';
  SHOP_MASCOTS.forEach(em => {
    const e = document.createElement('div');
    e.className = 'emoji-choice' + (em === draftShop.mascot ? ' selected' : '');
    e.textContent = em;
    e.onclick = () => { draftShop.mascot = em; refreshSelected(mc, e); refreshPreview(); };
    mc.appendChild(e);
  });

  // awnings
  const ac = document.getElementById('shopAwningSwatches');
  ac.innerHTML = '';
  SHOP_AWNINGS.forEach(col => {
    const s = document.createElement('div');
    s.className = 'swatch' + (col === draftShop.awning ? ' selected' : '');
    s.style.background = col;
    s.onclick = () => { draftShop.awning = col; refreshSelected(ac, s); refreshPreview(); };
    ac.appendChild(s);
  });

  // backgrounds
  const bc = document.getElementById('shopBgChoices');
  bc.innerHTML = '';
  SHOP_BGS.forEach(b => {
    const d = document.createElement('div');
    d.className = 'bg-choice' + (b.id === draftShop.bgId ? ' selected' : '');
    d.style.background = b.swatch;
    d.onclick = () => { draftShop.bgId = b.id; refreshSelected(bc, d); refreshPreview(); };
    bc.appendChild(d);
  });

  refreshPreview();
}

function refreshSelected(container, chosen) {
  container.querySelectorAll('.swatch,.emoji-choice,.bg-choice').forEach(el => el.classList.remove('selected'));
  chosen.classList.add('selected');
}

function refreshPreview() {
  draftShop.name = document.getElementById('shopNameInput').value.trim() || DEFAULT_SHOP.name;
  const t = themeById(draftShop.themeId);
  // scope preview colors via inline style on preview elements
  document.getElementById('shopPreviewSign').style.background =
    `linear-gradient(135deg,${t.light},${t.theme})`;
  document.getElementById('shopPreviewAwning').style.background =
    `repeating-linear-gradient(90deg,${draftShop.awning} 0,${draftShop.awning} 16px,#fff 16px,#fff 32px)`;
  document.getElementById('shopPreviewName').textContent = draftShop.name;
  document.getElementById('shopPreviewMascot').textContent = draftShop.mascot;
}

function showShop() {
  if (typeof sfxButton === 'function') sfxButton();
  buildShopUI();
  const ov = document.getElementById('shopOverlay');
  ov.classList.remove('hidden');
  ov.classList.add('fade-in');
}
function hideShop() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('shopOverlay').classList.add('hidden');
}

function saveShop() {
  refreshPreview(); // make sure latest name captured
  shopData = Object.assign({}, draftShop);
  persistShop();
  applyShop();
  if (typeof sfxCorrect === 'function') sfxCorrect();
  hideShop();
}

// =============================================
// SETTINGS SCREEN UI
// =============================================
function buildSettingsUI() {
  const m = document.getElementById('setMusicToggle');
  const s = document.getElementById('setSfxToggle');
  m.textContent = settingsData.music ? 'On' : 'Off';
  m.classList.toggle('off', !settingsData.music);
  s.textContent = settingsData.sfx ? 'On' : 'Off';
  s.classList.toggle('off', !settingsData.sfx);
  document.getElementById('brightnessSlider').value = settingsData.brightness;
}

function showSettings() {
  if (typeof sfxButton === 'function') sfxButton();
  buildSettingsUI();
  const ov = document.getElementById('settingsOverlay');
  ov.classList.remove('hidden');
  ov.classList.add('fade-in');
}
function hideSettings() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('settingsOverlay').classList.add('hidden');
}

function settingsToggleMusic() {
  settingsData.music = !settingsData.music;
  persistSettings();
  // reuse game engine toggle so music actually starts/stops
  if (musicEnabled !== settingsData.music && typeof toggleMusic === 'function') toggleMusic();
  buildSettingsUI();
}
function settingsToggleSfx() {
  settingsData.sfx = !settingsData.sfx;
  persistSettings();
  if (sfxEnabled !== settingsData.sfx && typeof toggleSfx === 'function') toggleSfx();
  buildSettingsUI();
}
function onBrightnessChange(val) {
  settingsData.brightness = parseInt(val, 10);
  applyBrightness(settingsData.brightness);
  persistSettings();
}

function resetProgressBtn() {
  if (!confirm('Reset all progress and stars?')) return;
  saveProgress(0, 0);
  currentLevel = 0;
  totalStars = 0;
  if (typeof sfxButton === 'function') sfxButton();
  alert('Progress reset! ✨');
}
function resetShopBtn() {
  if (!confirm('Reset your pizza shop to default?')) return;
  shopData = Object.assign({}, DEFAULT_SHOP);
  persistShop();
  applyShop();
  if (typeof sfxButton === 'function') sfxButton();
  alert('Shop reset! \u{1F355}');
}

// =============================================
// HOOK INTO GAME (progress + welcome) WITHOUT BREAKING IT
// =============================================
// keep in-game sound buttons in sync with settings persistence
const _toggleMusic = toggleMusic;
toggleMusic = function () {
  _toggleMusic();
  settingsData.music = musicEnabled;
  persistSettings();
};
const _toggleSfx = toggleSfx;
toggleSfx = function () {
  _toggleSfx();
  settingsData.sfx = sfxEnabled;
  persistSettings();
};

// save progress whenever a level loads
const _loadLevel = loadLevel;
loadLevel = function (idx) {
  _loadLevel(idx);
  saveProgress(idx, totalStars);
  applyShop(); // ensure header/theme present on the freshly built screen
};

// resume saved progress + show shop welcome on PLAY
const _startGame = startGame;
startGame = function () {
  const prog = loadProgress();
  let resume = prog.level;
  if (typeof resume !== 'number' || resume < 0 || resume >= levels.length) resume = 0;

  ensureAudio();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  currentLevel = resume;
  totalStars = prog.stars || 0;
  loadLevel(resume);
  startMusic();

  // personalised welcome in the chef bubble
  const ct = document.getElementById('chefText');
  const ce = document.getElementById('chefEmoji');
  if (ct) ct.textContent = `Welcome to ${shopData.name}! \u{1F355}`;
  if (ce) ce.textContent = shopData.mascot;
};

// ===== INIT ON LOAD =====
applyShop();
applySettings();
