// Update Notifier для PWA
// Периодически проверяет новую версию через Railway API

const APP_VERSION = '1.1.0';
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 минут

let updateBanner = null;
let updateBtn = null;

async function checkForUpdates() {
  try {
    // Проверяем версию через Railway API endpoint
    const response = await fetch('/api/version');

    if (!response.ok) {
      console.log('[UpdateNotifier] Не удалось проверить версию');
      return;
    }

    const data = await response.json();

    if (data.version && data.version !== APP_VERSION) {
      console.log(`[UpdateNotifier] Доступна новая версия: ${data.version}`);
      showUpdateBanner();
    }
  } catch (error) {
    console.log('[UpdateNotifier] Ошибка проверки обновлений:', error);
  }
}

function showUpdateBanner() {
  if (updateBanner) return; // Уже показан

  updateBanner = document.getElementById('update-banner');
  updateBtn = document.getElementById('update-btn');

  if (!updateBanner) return;

  updateBanner.style.display = 'flex';

  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }
}

function initUpdateNotifier() {
  // Регистрация Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[UpdateNotifier] SW зарегистрирован:', registration.scope);

        // Проверяем обновления сразу
        checkForUpdates();

        // Затем периодически
        setInterval(checkForUpdates, CHECK_INTERVAL);

        // Также проверяем при обновлении SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch((error) => {
        console.error('[UpdateNotifier] Ошибка регистрации SW:', error);
      });
  }
}

// Запуск при загрузке скрипта
document.addEventListener('DOMContentLoaded', initUpdateNotifier);