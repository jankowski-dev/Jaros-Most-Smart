const CACHE_NAME = 'yarik-uroki-v2.5';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/config.js',
  '/speech-service.js',
  '/update-notifier.js',
  '/manifest.json',
  '/icon.png'
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

// Активация: удаляем все старые кэши
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

// Fetch: сеть в приоритете, кэш — только как fallback для офлайна.
// Так изменения на сервере подхватываются сразу, без ожидания нового SW.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Пропускаем не-GET и запросы к API
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  // Работаем только со своим origin
  let sameOrigin = false;
  try {
    sameOrigin = new URL(request.url).origin === self.location.origin;
  } catch (e) {
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
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => cached || offlineFallback(request));
      })
  );
});

function offlineFallback(request) {
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/><text fill="#999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// Слушаем сообщения от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Получена команда SKIP_WAITING');
    self.skipWaiting();
    self.clients.claim();
  }
});
