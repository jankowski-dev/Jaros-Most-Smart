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

// Установка - кешируем все assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кешируем assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация - очищаем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Удаляем старый кеш:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Новый SW активирован');
        return self.clients.claim();
      })
  );
});

// Fetch стратегия
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Для HTML (документы) - всегда network-first, чтобы получать свежие версии
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Нет интернета - берём из кеша
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Если совсем нет кеша (первый запуск офлайн) - возвращаем базовый HTML
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Для остального (CSS, JS, картинки) - cache-first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            return response;
          })
          .catch(() => {
            // Если нет интернета и нет кеша - игнорируем (сломанные изображения и т.д.)
            return new Response('', { status: 404 });
          });
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