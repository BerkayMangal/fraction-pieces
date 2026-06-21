/* Fraction Pieces service worker — offline app shell, stale-while-revalidate.
   Bump CACHE on every release so clients pick up new files. */
const CACHE = 'fp-cache-v7';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'style.css?v=7',
  'levels.js?v=7',
  'game.js?v=7',
  'shop.js?v=7',
  'extras.js?v=7',
  'assets/start-screen.jpg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
