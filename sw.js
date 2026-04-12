const CACHE_NAME = 'yarik-uroki-v2.3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/config.js',
  '/speech-service.js',
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

  // Для HTML - всегда сеть, не кешируем
  if (event.request.destination === 'document') {
    return; // Пусть браузер сам загружает с сервера
  }

  // Для остального - cache-first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
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