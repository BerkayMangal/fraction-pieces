/* ========================================
   MY PIZZA SHOP  +  STAR ECONOMY  +  SETTINGS
   Additive layer over the core game. Earn stars by playing,
   spend them to unlock & decorate your own pizzeria.
   ======================================== */

// ===== STORAGE KEYS =====
const LS_SHOP = 'fp_shop';
const LS_SETTINGS = 'fp_settings';
const LS_PROGRESS = 'fp_progress';
const LS_WALLET = 'fp_wallet';   // { wallet, lifetime }
const LS_OWNED = 'fp_owned';     // { theme:[], mascot:[], awning:[], bg:[], deco:[] }

// ===== CATALOG (cost in stars; 0 = free starter) =====
const SHOP_THEMES = [
  { id: 'orange', theme: '#ff8c00', dark: '#cc5500', light: '#ffb347', cost: 0 },
  { id: 'green',  theme: '#4caf50', dark: '#2e7d32', light: '#81c784', cost: 3 },
  { id: 'blue',   theme: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd', cost: 4 },
  { id: 'red',    theme: '#ef4444', dark: '#b91c1c', light: '#f87171', cost: 4 },
  { id: 'pink',   theme: '#ec4899', dark: '#be185d', light: '#f9a8d4', cost: 5 },
  { id: 'teal',   theme: '#14b8a6', dark: '#0f766e', light: '#5eead4', cost: 5 },
  { id: 'purple', theme: '#8b5cf6', dark: '#6d28d9', light: '#c4b5fd', cost: 6 }
];

const SHOP_MASCOTS = [
  { id: '\u{1F355}', cost: 0 }, // pizza
  { id: '\u{1F468}‍\u{1F373}', cost: 2 }, // chef
  { id: '⭐', cost: 2 }, // star
  { id: '\u{1F9C0}', cost: 3 }, // cheese
  { id: '\u{1F345}', cost: 3 }, // tomato
  { id: '\u{1F525}', cost: 4 }, // fire
  { id: '❤️', cost: 4 }, // heart
  { id: '\u{1F984}', cost: 6 }, // unicorn
  { id: '\u{1F451}', cost: 8 }  // crown
];

const SHOP_AWNINGS = [
  { id: '#ff8c00', cost: 0 },
  { id: '#ef4444', cost: 2 },
  { id: '#ec4899', cost: 2 },
  { id: '#3b82f6', cost: 3 },
  { id: '#8b5cf6', cost: 3 },
  { id: '#14b8a6', cost: 4 },
  { id: '#4caf50', cost: 2 }
];

const SHOP_BGS = [
  { id: 'warm',     bg: 'radial-gradient(ellipse at 50% 0%,#ffe8b8 0%,transparent 50%),linear-gradient(180deg,#fff3d6 0%,#f5d5a0 40%,#e8ba78 100%)', swatch: 'linear-gradient(180deg,#fff3d6,#e8ba78)', cost: 0 },
  { id: 'sky',      bg: 'linear-gradient(180deg,#dff1ff 0%,#acd8ff 60%,#7cc0f5 100%)', swatch: 'linear-gradient(180deg,#dff1ff,#7cc0f5)', cost: 4 },
  { id: 'mint',     bg: 'linear-gradient(180deg,#e3fbe9 0%,#bff0cd 60%,#8fe0aa 100%)', swatch: 'linear-gradient(180deg,#e3fbe9,#8fe0aa)', cost: 4 },
  { id: 'pink',     bg: 'linear-gradient(180deg,#ffe6f2 0%,#ffc2dd 60%,#ff9cc4 100%)', swatch: 'linear-gradient(180deg,#ffe6f2,#ff9cc4)', cost: 5 },
  { id: 'lavender', bg: 'linear-gradient(180deg,#efe7ff 0%,#d6c2ff 60%,#bfa3ff 100%)', swatch: 'linear-gradient(180deg,#efe7ff,#bfa3ff)', cost: 5 },
  { id: 'night',    bg: 'radial-gradient(circle at 70% 18%,rgba(255,255,255,0.25) 0,transparent 18%),linear-gradient(180deg,#2b2350 0%,#4b3b7a 60%,#7a5aa8 100%)', swatch: 'linear-gradient(180deg,#2b2350,#7a5aa8)', cost: 7 }
];

const SHOP_DECOS = [
  { id: '\u{1FAB4}', cost: 2 }, // potted plant
  { id: '\u{1F388}', cost: 2 }, // balloon
  { id: '\u{1F4A1}', cost: 3 }, // light bulb (lights)
  { id: '\u{1F338}', cost: 2 }, // blossom
  { id: '\u{1F308}', cost: 3 }, // rainbow
  { id: '\u{1F431}', cost: 4 }, // cat
  { id: '\u{1F415}', cost: 4 }, // dog
  { id: '\u{1F3AA}', cost: 4 }, // tent/circus
  { id: '\u{1F386}', cost: 5 }, // fireworks
  { id: '\u{1F3C6}', cost: 6 }, // trophy
  { id: '\u{1F680}', cost: 5 }, // rocket
  { id: '\u{1F33B}', cost: 3 }  // sunflower
];

const DEFAULT_SHOP = { name: 'My Pizza Shop', themeId: 'orange', mascot: '\u{1F355}', awning: '#ff8c00', bgId: 'warm', decos: [] };

// fixed positions for placed decorations inside the scene (left%, top%)
const DECO_SPOTS = [
  { l: 7, t: 60 }, { l: 88, t: 60 }, { l: 5, t: 18 }, { l: 90, t: 16 },
  { l: 30, t: 8 }, { l: 67, t: 8 }, { l: 16, t: 82 }, { l: 82, t: 84 },
  { l: 49, t: 5 }, { l: 40, t: 86 }, { l: 60, t: 86 }, { l: 11, t: 42 }
];

// cute customers who place the orders
const CUSTOMERS = ['\u{1F430}','\u{1F436}','\u{1F431}','\u{1F43C}','\u{1F98A}','\u{1F435}','\u{1F42F}','\u{1F438}','\u{1F981}'];

// ===== STATE =====
let shopData = loadShop();
let wallet = 0, lifetime = 0;
let owned = { theme: [], mascot: [], awning: [], bg: [], deco: [] };
let settingsData = loadSettings();

// =============================================
// PERSISTENCE
// =============================================
function loadShop() {
  try { return Object.assign({}, DEFAULT_SHOP, JSON.parse(localStorage.getItem(LS_SHOP)) || {}); }
  catch (e) { return Object.assign({}, DEFAULT_SHOP); }
}
function persistShop() { try { localStorage.setItem(LS_SHOP, JSON.stringify(shopData)); } catch (e) {} }

function loadWallet() {
  try {
    const w = JSON.parse(localStorage.getItem(LS_WALLET));
    if (w && typeof w.wallet === 'number') { wallet = w.wallet; lifetime = w.lifetime || w.wallet; return; }
  } catch (e) {}
  // migration: seed wallet from any previously saved progress stars
  const prog = loadProgress();
  wallet = prog.stars || 0; lifetime = wallet;
  persistWallet();
}
function persistWallet() { try { localStorage.setItem(LS_WALLET, JSON.stringify({ wallet, lifetime })); } catch (e) {} }

function loadOwned() {
  try {
    const o = JSON.parse(localStorage.getItem(LS_OWNED));
    if (o) owned = Object.assign({ theme: [], mascot: [], awning: [], bg: [], deco: [] }, o);
  } catch (e) {}
  // always own the free starters + whatever is currently equipped (grandfather older saves)
  SHOP_THEMES.filter(x => x.cost === 0).forEach(x => addOwned('theme', x.id, true));
  SHOP_MASCOTS.filter(x => x.cost === 0).forEach(x => addOwned('mascot', x.id, true));
  SHOP_AWNINGS.filter(x => x.cost === 0).forEach(x => addOwned('awning', x.id, true));
  SHOP_BGS.filter(x => x.cost === 0).forEach(x => addOwned('bg', x.id, true));
  addOwned('theme', shopData.themeId, true);
  addOwned('mascot', shopData.mascot, true);
  addOwned('awning', shopData.awning, true);
  addOwned('bg', shopData.bgId, true);
  (shopData.decos || []).forEach(d => addOwned('deco', d, true));
  persistOwned();
}
function persistOwned() { try { localStorage.setItem(LS_OWNED, JSON.stringify(owned)); } catch (e) {} }

function isOwned(cat, id) { return owned[cat] && owned[cat].indexOf(id) !== -1; }
function addOwned(cat, id, silent) { if (!owned[cat].includes(id)) { owned[cat].push(id); if (!silent) persistOwned(); } }

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

// =============================================
// APPLY SHOP / SETTINGS TO THE GAME
// =============================================
function applyShop() {
  const t = themeById(shopData.themeId);
  const root = document.documentElement.style;
  root.setProperty('--theme', t.theme);
  root.setProperty('--theme-dark', t.dark);
  root.setProperty('--theme-light', t.light);
  root.setProperty('--awning', shopData.awning);
  root.setProperty('--game-bg', bgById(shopData.bgId).bg);

  const hdr = document.getElementById('shopHeaderName');
  const hMascot = document.getElementById('shopHeaderMascot');
  if (hdr) hdr.textContent = shopData.name;
  if (hMascot) hMascot.textContent = shopData.mascot;
}

function applySettings() {
  musicEnabled = settingsData.music;
  sfxEnabled = settingsData.sfx;
  syncSoundButtons();
  applyBrightness(settingsData.brightness);
}

function syncSoundButtons() {
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
}

function applyBrightness(val) {
  const ov = document.getElementById('brightnessOverlay');
  if (ov) ov.style.opacity = ((100 - val) / 100).toFixed(2);
}

// ===== WALLET DISPLAY =====
function updateWalletHUD() {
  const el = document.getElementById('totalStars');
  if (el) el.textContent = wallet;
  const sw = document.getElementById('shopWallet');
  if (sw) sw.textContent = wallet;
}

function awardStars(n) {
  wallet += n; lifetime += n; persistWallet(); updateWalletHUD();
}

function floatWalletGain(n) {
  const anchor = document.getElementById('starCount');
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'wallet-gain';
  el.textContent = '+' + n + '⭐';
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.top = (r.bottom + 4) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// =============================================
// SHOP SCENE (storefront preview)
// =============================================
function renderScene() {
  const t = themeById(shopData.themeId);
  const aw = document.getElementById('sceneAwning');
  const sign = document.getElementById('sceneSign');
  if (aw) aw.style.background = `repeating-linear-gradient(90deg,${shopData.awning} 0,${shopData.awning} 18px,#fff 18px,#fff 36px)`;
  if (sign) sign.style.background = `linear-gradient(135deg,${t.light},${t.theme})`;
  const sm = document.getElementById('sceneMascot'); if (sm) sm.textContent = shopData.mascot;
  const sn = document.getElementById('sceneName'); if (sn) sn.textContent = shopData.name;
  const sky = document.getElementById('sceneSky'); if (sky) sky.style.background = bgById(shopData.bgId).swatch;

  const dc = document.getElementById('sceneDecos');
  if (dc) {
    dc.innerHTML = '';
    (shopData.decos || []).forEach((em, i) => {
      const spot = DECO_SPOTS[i % DECO_SPOTS.length];
      const d = document.createElement('div');
      d.className = 'scene-deco';
      d.textContent = em;
      d.style.left = spot.l + '%';
      d.style.top = spot.t + '%';
      d.style.animationDelay = (i * 0.2) + 's';
      dc.appendChild(d);
    });
  }
}

// =============================================
// SHOP SCREEN UI
// =============================================
function makeItem(inner, ownedFlag, cost, selected, onClick) {
  const wrap = document.createElement('div');
  wrap.className = 'item' + (ownedFlag ? '' : ' locked') + (selected ? ' chosen' : '');
  if (selected) inner.classList.add('selected');
  wrap.appendChild(inner);
  if (!ownedFlag) {
    const p = document.createElement('div');
    p.className = 'price-tag';
    p.innerHTML = '&#9733;' + cost;
    wrap.appendChild(p);
  }
  wrap.onclick = onClick;
  return wrap;
}

function renderShopUI() {
  document.getElementById('shopNameInput').value = shopData.name;
  updateWalletHUD();

  // themes
  const tc = document.getElementById('shopThemeSwatches'); tc.innerHTML = '';
  SHOP_THEMES.forEach(t => {
    const s = document.createElement('div'); s.className = 'swatch'; s.style.background = t.theme;
    tc.appendChild(makeItem(s, isOwned('theme', t.id), t.cost, shopData.themeId === t.id,
      () => acquire('theme', t.id, t.cost, () => { shopData.themeId = t.id; })));
  });

  // mascots
  const mc = document.getElementById('shopMascotChoices'); mc.innerHTML = '';
  SHOP_MASCOTS.forEach(m => {
    const e = document.createElement('div'); e.className = 'emoji-choice'; e.textContent = m.id;
    mc.appendChild(makeItem(e, isOwned('mascot', m.id), m.cost, shopData.mascot === m.id,
      () => acquire('mascot', m.id, m.cost, () => { shopData.mascot = m.id; })));
  });

  // awnings
  const ac = document.getElementById('shopAwningSwatches'); ac.innerHTML = '';
  SHOP_AWNINGS.forEach(a => {
    const s = document.createElement('div'); s.className = 'swatch'; s.style.background = a.id;
    ac.appendChild(makeItem(s, isOwned('awning', a.id), a.cost, shopData.awning === a.id,
      () => acquire('awning', a.id, a.cost, () => { shopData.awning = a.id; })));
  });

  // backgrounds
  const bc = document.getElementById('shopBgChoices'); bc.innerHTML = '';
  SHOP_BGS.forEach(b => {
    const d = document.createElement('div'); d.className = 'bg-choice'; d.style.background = b.swatch;
    bc.appendChild(makeItem(d, isOwned('bg', b.id), b.cost, shopData.bgId === b.id,
      () => acquire('bg', b.id, b.cost, () => { shopData.bgId = b.id; })));
  });

  // decorations (multi-select / placeable)
  const dc = document.getElementById('shopDecoChoices'); dc.innerHTML = '';
  SHOP_DECOS.forEach(d => {
    const e = document.createElement('div'); e.className = 'emoji-choice'; e.textContent = d.id;
    const placed = (shopData.decos || []).includes(d.id);
    dc.appendChild(makeItem(e, isOwned('deco', d.id), d.cost, placed, () => clickDeco(d.id, d.cost)));
  });
}

function afterShopChange() {
  persistShop();
  applyShop();
  renderScene();
  renderShopUI();
}

// buy (if locked) or equip (if owned) for single-select categories
function acquire(cat, id, cost, equip) {
  if (isOwned(cat, id)) {
    equip();
    if (typeof sfxSelect === 'function') sfxSelect();
    afterShopChange();
    return;
  }
  if (wallet < cost) { denyPurchase(cost); return; }
  wallet -= cost; persistWallet();
  addOwned(cat, id);
  equip();
  celebrateUnlock(id);
  afterShopChange();
}

function clickDeco(id, cost) {
  if (isOwned('deco', id)) {
    const i = shopData.decos.indexOf(id);
    if (i >= 0) shopData.decos.splice(i, 1); else shopData.decos.push(id);
    if (typeof sfxSelect === 'function') sfxSelect();
    afterShopChange();
    return;
  }
  if (wallet < cost) { denyPurchase(cost); return; }
  wallet -= cost; persistWallet();
  addOwned('deco', id);
  shopData.decos.push(id);
  celebrateUnlock(id);
  afterShopChange();
}

function denyPurchase(cost) {
  if (typeof sfxWrong === 'function') sfxWrong();
  shopToast('Need ' + '⭐' + cost + ' — play to earn more!', true);
  const badge = document.querySelector('#shopOverlay .wallet-badge');
  if (badge) { badge.classList.remove('shake'); void badge.offsetWidth; badge.classList.add('shake'); }
}

function celebrateUnlock(id) {
  if (typeof sfxCorrect === 'function') sfxCorrect();
  if (typeof sfxStar === 'function') setTimeout(sfxStar, 150);
  shopToast('Unlocked ' + id + ' \u{1F389}', false);
}

let toastTimer = null;
function shopToast(msg, isWarn) {
  const t = document.getElementById('shopToast');
  if (!t) return;
  t.innerHTML = msg;
  t.className = isWarn ? 'warn show' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 1800);
}

function showShop() {
  if (typeof sfxButton === 'function') sfxButton();
  if (typeof ensureAudio === 'function') ensureAudio();
  renderShopUI();
  renderScene();
  const ov = document.getElementById('shopOverlay');
  ov.classList.remove('hidden');
  ov.classList.add('fade-in');
  ov.scrollTop = 0;
}
function hideShop() {
  if (typeof sfxButton === 'function') sfxButton();
  persistShop();
  document.getElementById('shopOverlay').classList.add('hidden');
}

// live name edit
document.addEventListener('input', function (e) {
  if (e.target && e.target.id === 'shopNameInput') {
    shopData.name = e.target.value.trim() || DEFAULT_SHOP.name;
    persistShop(); applyShop(); renderScene();
  }
});

// =============================================
// SETTINGS SCREEN
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
  ov.classList.remove('hidden'); ov.classList.add('fade-in');
}
function hideSettings() {
  if (typeof sfxButton === 'function') sfxButton();
  document.getElementById('settingsOverlay').classList.add('hidden');
}
function settingsToggleMusic() {
  settingsData.music = !settingsData.music; persistSettings();
  if (musicEnabled !== settingsData.music && typeof toggleMusic === 'function') toggleMusic();
  buildSettingsUI();
}
function settingsToggleSfx() {
  settingsData.sfx = !settingsData.sfx; persistSettings();
  if (sfxEnabled !== settingsData.sfx && typeof toggleSfx === 'function') toggleSfx();
  buildSettingsUI();
}
function onBrightnessChange(val) {
  settingsData.brightness = parseInt(val, 10);
  applyBrightness(settingsData.brightness); persistSettings();
}
function resetProgressBtn() {
  if (!confirm('Reset level progress? (Your stars and shop stay!)')) return;
  saveProgress(0, 0);
  currentLevel = 0; totalStars = 0;
  if (typeof sfxButton === 'function') sfxButton();
  alert('Level progress reset! ✨');
}
function resetShopBtn() {
  if (!confirm('Reset your shop to default? (You keep your stars.)')) return;
  shopData = Object.assign({}, DEFAULT_SHOP, { decos: [] });
  persistShop(); applyShop();
  if (typeof sfxButton === 'function') sfxButton();
  alert('Shop reset! \u{1F355}');
}

// =============================================
// CUSTOMER (story flavour on the order card)
// =============================================
function renderCustomer(idx) {
  const face = document.getElementById('orderCustomer');
  const speech = document.getElementById('orderSpeech');
  if (face) face.textContent = CUSTOMERS[idx % CUSTOMERS.length];
  if (speech) {
    const lines = ['I’d love this pizza!', 'Yum, make me this one!', 'My favorite, please!',
      'Can you make this?', 'This looks delicious!', 'One pizza, please!'];
    speech.textContent = lines[idx % lines.length];
  }
}

// =============================================
// HOOK INTO GAME (without breaking it)
// =============================================
const _toggleMusic = toggleMusic;
toggleMusic = function () { _toggleMusic(); settingsData.music = musicEnabled; persistSettings(); };
const _toggleSfx = toggleSfx;
toggleSfx = function () { _toggleSfx(); settingsData.sfx = sfxEnabled; persistSettings(); };

const _loadLevel = loadLevel;
loadLevel = function (idx) {
  _loadLevel(idx);
  saveProgress(idx, totalStars);
  applyShop();
  renderCustomer(idx);
  updateWalletHUD();
};

const _showCelebration = showCelebration;
showCelebration = function (stars) {
  awardStars(stars);            // credit the spendable wallet
  _showCelebration(stars);
  updateWalletHUD();            // HUD shows wallet, not session total
  floatWalletGain(stars);
};

const _showGameComplete = showGameComplete;
showGameComplete = function () {
  _showGameComplete();
  saveProgress(0, totalStars);  // next PLAY starts a fresh run
  updateWalletHUD();
  const fs = document.getElementById('finalScore');
  if (fs) fs.innerHTML += '<br><span style="color:#ff8c00;font-weight:600">Play again to earn ⭐ for your shop!</span>';
};

const _startGame = startGame;
startGame = function () {
  const prog = loadProgress();
  let resume = prog.level;
  if (typeof resume !== 'number' || resume < 0 || resume >= levels.length) resume = 0;

  if (typeof ensureAudio === 'function') ensureAudio();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  currentLevel = resume;
  totalStars = prog.stars || 0;
  loadLevel(resume);
  if (typeof startMusic === 'function') startMusic();
  updateWalletHUD();

  const ct = document.getElementById('chefText');
  const ce = document.getElementById('chefEmoji');
  if (ct) ct.textContent = `Welcome to ${shopData.name}! \u{1F355}`;
  if (ce) ce.textContent = shopData.mascot;
};

// ===== INIT =====
loadWallet();
loadOwned();
applyShop();
applySettings();
updateWalletHUD();
