// Update Notifier для PWA
// Периодически проверяет новую версию через Railway API

const APP_VERSION = '2.1';
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 минут

let updateBanner = null;
let updateBtn = null;
let isUpdating = false;

async function checkForUpdates() {
  try {
    const response = await fetch('/api/version?t=' + Date.now());

    if (!response.ok) {
      console.log('[UpdateNotifier] Не удалось проверить версию');
      return;
    }

    const data = await response.json();

    if (data.version && data.version !== APP_VERSION) {
      console.log(`[UpdateNotifier] Доступна новая версия: ${data.version}`);
      showUpdateBanner();
    } else {
      hideUpdateBanner();
    }
  } catch (error) {
    console.log('[UpdateNotifier] Ошибка проверки обновлений:', error);
  }
}

function showUpdateBanner() {
  if (isUpdating) return;
  if (updateBanner) {
    updateBanner.style.display = 'flex';
    return;
  }

  updateBanner = document.getElementById('update-banner');
  updateBtn = document.getElementById('update-btn');

  if (!updateBanner) return;

  updateBanner.style.display = 'flex';

  if (updateBtn) {
    updateBtn.onclick = () => {
      if (isUpdating) return;
      isUpdating = true;

      hideUpdateBanner();

      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });

          registration.active.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              window.location.reload();
            }
          });

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          window.location.reload();
        }
      });
    };
  }
}

function hideUpdateBanner() {
  if (updateBanner) {
    updateBanner.style.display = 'none';
  }
}

function initUpdateNotifier() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[UpdateNotifier] SW зарегистрирован:', registration.scope);

        checkForUpdates();

        setInterval(checkForUpdates, CHECK_INTERVAL);

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('[UpdateNotifier] Ошибка регистрации SW:', error);
      });
  }
}

document.addEventListener('DOMContentLoaded', initUpdateNotifier);