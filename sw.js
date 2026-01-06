// Service Worker für PWA
const CACHE_NAME = 'fußball-quiz-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((err) => {
        console.log('Cache-Fehler:', err);
      })
  );
  self.skipWaiting();
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Network first, dann cache
        return fetch(event.request)
          .then((response) => {
            // Prüfe ob gültige Antwort
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Response klonen
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            // Falls offline und nicht im Cache, zeige Offline-Seite
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

