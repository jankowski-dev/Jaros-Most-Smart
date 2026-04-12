// Update Notifier для PWA
// Периодически проверяет новую версию через Railway API

const CHECK_INTERVAL = 30 * 60 * 1000; // 30 минут
const STORAGE_KEY = 'yarik_uroki_updated_to';

let updateBanner = null;
let updateBtn = null;
let updateText = null;
let isUpdating = false;

async function checkForUpdates() {
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

  // Всегда переустанавливаем обработчик клика
  updateBtn.onclick = () => {
    console.log('[UpdateNotifier] Кнопка Обновить нажата');
    if (isUpdating) return;
    isUpdating = true;
    console.log('[UpdateNotifier] Начинаем обновление...');

    // Показываем что идёт обновление
    updateText.textContent = 'Обновление...';

    navigator.serviceWorker.ready.then((registration) => {
      console.log('[UpdateNotifier] SW ready, waiting:', !!registration.waiting, 'active:', !!registration.active);
      
      if (registration.waiting) {
        console.log('[UpdateNotifier] Есть waiting SW, отправляем SKIP_WAITING');
        // Отправляем команду SW чтобы он активировал новую версию
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        registration.active.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            console.log('[UpdateNotifier] Новый Service Worker активирован');

            // Сохраняем что обновились до новой версии
            localStorage.setItem(STORAGE_KEY, newVersion);

            // Показываем сообщение об успехе
            updateText.textContent = 'Обновлено!';
            updateBtn.textContent = 'Закрыть';
            updateBtn.onclick = () => {
              hideUpdateBanner();
              isUpdating = false;
            };
          }
        });

        // Fallback если statechange не сработал
        setTimeout(() => {
          if (updateText.textContent === 'Обновление...') {
            localStorage.setItem(STORAGE_KEY, newVersion);
            updateText.textContent = 'Обновлено!';
            updateBtn.textContent = 'Закрыть';
            updateBtn.onclick = () => {
              hideUpdateBanner();
              isUpdating = false;
            };
          }
        }, 3000);
      } else {
        console.log('[UpdateNotifier] Нет waiting SW - уже активен');
        // SW уже активен, просто сохраняем версию
        localStorage.setItem(STORAGE_KEY, newVersion);
        updateText.textContent = 'Обновлено!';
        updateBtn.textContent = 'Закрыть';
        updateBtn.onclick = () => {
          hideUpdateBanner();
          isUpdating = false;
        };
      }
    });
  };
}

function hideUpdateBanner() {
  if (updateBanner) {
    updateBanner.style.display = 'none';
  }
  isUpdating = false;
}

function initUpdateNotifier() {
  // Service Workers работают только через HTTP/HTTPS, не через file://
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('/sw.js?t=' + Date.now())
      .then((registration) => {
        console.log('[UpdateNotifier] SW зарегистрирован:', registration.scope);

        checkForUpdates();

        setInterval(checkForUpdates, CHECK_INTERVAL);
      })
      .catch((error) => {
        console.error('[UpdateNotifier] Ошибка регистрации SW:', error);
      });
  } else {
    console.log('[UpdateNotifier] SW недоступен (file:// протокол или не поддерживается)');
  }
}

document.addEventListener('DOMContentLoaded', initUpdateNotifier);
