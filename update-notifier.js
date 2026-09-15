// Update Notifier для PWA
// Периодически проверяет новую версию через Railway API

const CHECK_INTERVAL = 30 * 60 * 1000; // 30 минут
const STORAGE_KEY = 'yarik_uroki_updated_to';

let updateBanner = null;
let updateBtn = null;
let updateText = null;
let isUpdating = false;
let pendingVersion = null; // версия, которая ожидает обновления

async function checkForUpdates() {
  // Если сейчас идёт обновление - не показываем баннер
  if (isUpdating) return;

  try {
    const response = await fetch('/api/version?t=' + Date.now());

    if (!response.ok) {
      console.log('[UpdateNotifier] Не удалось проверить версию');
      return;
    }

    const data = await response.json();
    console.log('[UpdateNotifier] Версия API:', data.version, 'Сохранённая:', localStorage.getItem(STORAGE_KEY));

    if (data.version) {
      const lastUpdated = localStorage.getItem(STORAGE_KEY);
      
      // Если уже обновлялись до этой версии - скрываем баннер навсегда
      if (lastUpdated === data.version) {
        console.log('[UpdateNotifier] Уже обновлено до последней версии');
        hideUpdateBanner();
        return;
      }
      
      // Показываем баннер с новой версией
      console.log(`[UpdateNotifier] Доступна новая версия: ${data.version}`);
      pendingVersion = data.version;
      showUpdateBanner(data.version);
    }
  } catch (error) {
    console.log('[UpdateNotifier] Ошибка проверки обновлений:', error);
  }
}

function showUpdateBanner(newVersion) {
  if (isUpdating) return;

  updateBanner = document.getElementById('update-banner');
  updateBtn = document.getElementById('update-btn');
  updateText = document.getElementById('update-text');

  if (!updateBanner || !updateBtn || !updateText) return;

  updateBanner.style.display = 'flex';
  updateText.textContent = 'Появилась новая версия';
  updateBtn.textContent = 'Обновить';
  updateBtn.style.display = 'inline-flex';
  
  // Сбрасываем прогресс-бар
  const progressContainer = document.getElementById('update-progress-container');
  const progressBar = document.getElementById('update-progress-bar');
  if (progressContainer) progressContainer.style.display = 'none';
  if (progressBar) progressBar.style.width = '0%';

  // Всегда переустанавливаем обработчик клика
  updateBtn.onclick = () => {
    console.log('[UpdateNotifier] Кнопка Обновить нажата');
    if (isUpdating) return;
    isUpdating = true;

    // Показываем что идёт обновление
    updateText.textContent = 'Обновление...';
    updateBtn.style.display = 'none';
    
    // Показываем прогресс-бар
    const progressContainer = document.getElementById('update-progress-container');
    const progressBar = document.getElementById('update-progress-bar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    // Анимация загрузки 2 секунды
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      progressBar.style.width = progress + '%';
      
      if (progress >= 100) {
        clearInterval(interval);
        applyUpdate(newVersion);
      }
    }, 40); // 40ms * 50 = 2000ms
  };
}

function applyUpdate(newVersion) {
  console.log('[UpdateNotifier] Применяем обновление');

  const run = async () => {
    // 1. Просим браузер проверить новый service worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();

        // 2. Ждём новый SW (не дольше 5 секунд)
        const newWorker = await waitForSWReady(registration, 5000);
        if (newWorker) {
          console.log('[UpdateNotifier] Новый SW готов, отправляем SKIP_WAITING');
          newWorker.postMessage({ type: 'SKIP_WAITING' });
          await waitForControllerChange(5000);
        }
      }
    } catch (err) {
      console.warn('[UpdateNotifier] Не удалось обновить SW:', err);
    }

    // 3. В любом случае сбрасываем кэши — это гарантирует свежие файлы
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (err) {
      console.warn('[UpdateNotifier] Не удалось очистить кэш:', err);
    }

    try {
      localStorage.setItem(STORAGE_KEY, newVersion);
      pendingVersion = null;
    } catch (err) {
      console.warn('[UpdateNotifier] Не удалось сохранить версию:', err);
    }

    // 4. Перезагружаем страницу
    window.location.reload();
  };

  run();
}

function waitForSWReady(registration, timeout = 5000) {
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;

    const done = (worker) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(worker);
    };

    const watch = (worker) => {
      if (worker.state === 'installed') {
        done(worker);
        return;
      }
      worker.addEventListener('statechange', function onState() {
        if (worker.state === 'installed') {
          worker.removeEventListener('statechange', onState);
          done(worker);
        }
      });
    };

    if (registration.installing) {
      watch(registration.installing);
    } else if (registration.waiting) {
      done(registration.waiting);
    } else {
      registration.addEventListener('updatefound', function onUpdateFound() {
        if (registration.installing) {
          registration.removeEventListener('updatefound', onUpdateFound);
          watch(registration.installing);
        }
      });
    }

    // Если новый SW так и не появился — не зависаем, продолжаем без него
    timer = setTimeout(() => done(null), timeout);
  });
}

function waitForControllerChange(timeout = 5000) {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve();
      return;
    }

    let settled = false;
    let timer = null;

    const done = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', onController);
      resolve();
    };

    function onController() {
      done();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onController);
    timer = setTimeout(done, timeout);
  });
}

function hideUpdateBanner() {
  if (updateBanner) {
    updateBanner.style.display = 'none';
  }
  isUpdating = false;
}

function initUpdateNotifier() {
  // Service Workers работают только через HTTP/HTTPS, не через file://
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
    console.log('[UpdateNotifier] SW недоступен (file:// протокол или не поддерживается)');
    return;
  }

  // На локальной разработке SW только мешает: он кэширует файлы и отдаёт
  // старые версии. Отключаем его на localhost.
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    console.log('[UpdateNotifier] localhost — service worker отключён');
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach((r) => r.unregister()))
      .catch(() => {});
    return;
  }

  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('[UpdateNotifier] SW зарегистрирован:', registration.scope);

      // Проверяем обновления при каждой загрузке страницы
      registration.addEventListener('updatefound', () => {
        // Если сейчас идёт обновление - не показываем баннер
        if (isUpdating) return;

        console.log('[UpdateNotifier] Найден новый SW!');
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[UpdateNotifier] Новый SW готов, показываем баннер обновления');
            checkForUpdates();
          }
        });
      });

      checkForUpdates();

      setInterval(() => {
        registration.update().then(() => {
          console.log('[UpdateNotifier] Проверка обновлений SW');
        });
      }, CHECK_INTERVAL);
    })
    .catch((error) => {
      console.error('[UpdateNotifier] Ошибка регистрации SW:', error);
    });
}

document.addEventListener('DOMContentLoaded', initUpdateNotifier);
