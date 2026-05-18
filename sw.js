// Service worker for Espain trip planner
// Caches core assets so the page works offline (requires HTTPS or localhost — works on GitHub Pages)

const CACHE = 'espain-v1.3';

const PRECACHE = [
  './',
  './index.html',
  './summary.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// On install: pre-cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// On activate: clean up old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network; also cache map tiles
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache OSM tile requests so maps work offline after first visit
        if (
          response.ok &&
          (event.request.url.includes('tile.openstreetmap.org') ||
           event.request.url.includes('unpkg.com/leaflet'))
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // For navigation requests, fall back to the cached index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
