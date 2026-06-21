/* Fraction Pieces service worker.
   - HTML/navigation: network-first (always newest when online, cache offline)
   - other assets: stale-while-revalidate
   Bump CACHE on every release. */
const CACHE = 'fp-cache-v8';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'style.css?v=8',
  'levels.js?v=8',
  'game.js?v=8',
  'shop.js?v=8',
  'extras.js?v=8',
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

function isHTML(req) {
  return req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isHTML(req)) {
    // network-first so an online launch always shows the latest version
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // stale-while-revalidate for everything else
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
