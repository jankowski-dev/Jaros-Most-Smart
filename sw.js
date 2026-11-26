const CACHE_NAME = 'yarik-uroki-v3.0.0';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',

  '/config.js',
  '/speech-service.js',
  '/update-notifier.js',

  '/js/main.js',
  '/js/router.js',
  '/js/store.js',
  '/js/content.js',
  '/js/scoring.js',
  '/js/badges.js',
  '/js/timer.js',
  '/js/speech.js',
  '/js/effects.js',
  '/js/theme.js',
  '/js/theme-init.js',
  '/js/progress-utils.js',
  '/js/word-fill.js',

  '/js/ui/icons.js',
  '/js/ui/mascot.js',
  '/js/ui/toast.js',
  '/js/ui/dialog.js',
  '/js/ui/confetti.js',
  '/js/ui/nav.js',
  '/js/ui/app-bar.js',
  '/js/ui/html.js',

  '/js/screens/home.js',
  '/js/screens/settings.js',
  '/js/screens/progress.js',
  '/js/screens/math.js',
  '/js/screens/reading.js',
  '/js/screens/test.js',
  '/js/screens/result.js',

  '/fonts/montserrat-cyrillic.woff2',
  '/fonts/montserrat-latin.woff2',
  '/icon.png',
  '/icon-192.png'
];

// Установка: кладём свежие версии файлов в кэш.
// cache: 'reload' — в обход HTTP-кэша, чтобы не закэшировать старое.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          ASSETS_TO_CACHE.map((url) => {
            return fetch(new Request(url, { cache: 'reload' }))
              .then((response) => {
                if (response && response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {});
          })
        );
      })
  );
});

// Активация: удаляем все старые кэши.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: сеть в приоритете, кэш — fallback для офлайна.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  let sameOrigin = false;
  try {
    sameOrigin = new URL(request.url).origin === self.location.origin;
  } catch (error) {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return response;
        }

        // Если сервер ответил 5xx (или прокси вернул 502), отдаём кэш.
        if (response && response.status >= 500) {
          return caches.match(request, { ignoreVary: true }).then((cached) => cached || response);
        }

        return response;
      })
      .catch(() => {
        return caches.match(request, { ignoreVary: true }).then((cached) => cached || offlineFallback(request));
      })
  );
});

function offlineFallback(request) {
  if (request.mode === 'navigate') {
    return caches.match('/index.html', { ignoreVary: true }).then((cached) => cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' }));
  }

  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/><text fill="#999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    self.clients.claim();
  }
});
