const CACHE = 'expense-manager-static-v12';

const ASSETS = [
  './',
  './index.html',
  './analitika.html',
  './seznam.html',
  './css/styles.css',
  './js/config.js',
  './js/db.js',
  './js/app.js',
  './js/install-ui.js',
  './js/pwa-update.js',
  './js/chart-theme.js',
  './js/analitika.js',
  './js/seznam.js',
  './js/icons.js',
  './js/dialogs.js',
  './vendor/chart.umd.min.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isAppAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return /\.(html|js|css|webmanifest|svg|png)$/.test(url.pathname) || url.pathname.endsWith('/');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    throw new Error('Offline');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isAppAsset(url)) {
    event.respondWith(networkFirst(request));
  }
});
