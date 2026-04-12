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

    if (data.version) {
      const lastUpdated = localStorage.getItem(STORAGE_KEY);
      
      // Если уже обновлялись до этой версии - скрываем баннер
      if (lastUpdated === data.version) {
        console.log('[UpdateNotifier] Уже обновлено до последней версии');
        hideUpdateBanner();
        return;
      }
      
      // Если версия на сервере отличается от последней сохранённой - показываем баннер
      if (lastUpdated !== data.version) {
        console.log(`[UpdateNotifier] Доступна новая версия: ${data.version}`);
        showUpdateBanner(data.version);
      }
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

  updateBtn.onclick = () => {
    if (isUpdating) return;
    isUpdating = true;

    // Показываем что идёт обновление
    updateText.textContent = 'Обновление...';

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
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
