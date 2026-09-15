const CACHE_NAME = 'yarik-uroki-v2.4';

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

// Установка
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кешируем assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Активация
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

// Fetch стратегия
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Для HTML - network first с fallback на кэш
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Для остального - cache-first с network fallback
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
      .catch(() => {
        // Offline fallback для изображений
        if (event.request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/><text fill="#999" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Слушаем сообщения от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Получена команда SKIP_WAITING');
    self.skipWaiting();
    self.clients.claim();
  }
});