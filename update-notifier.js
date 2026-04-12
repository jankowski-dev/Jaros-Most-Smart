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
        
        // Завершаем обновление
        navigator.serviceWorker.ready.then((registration) => {
          console.log('[UpdateNotifier] SW ready, waiting:', !!registration.waiting);
          
          registration.update().then(() => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }).catch(err => {
            console.error('[UpdateNotifier] Ошибка обновления SW:', err);
          });
          
          // Сохраняем версию и показываем результат
          localStorage.setItem(STORAGE_KEY, newVersion);
          setTimeout(() => {
            progressContainer.style.display = 'none';
            updateText.textContent = 'Обновлено!';
            updateBtn.style.display = 'inline-flex';
            updateBtn.textContent = 'Закрыть';
            updateBtn.onclick = () => {
              hideUpdateBanner();
              isUpdating = false;
            };
            setTimeout(() => window.location.reload(), 1000);
          }, 500);
        });
      }
    }, 40); // 40ms * 50 = 2000ms
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
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[UpdateNotifier] SW зарегистрирован:', registration.scope);

        // Проверяем обновления при каждой загрузке страницы
        registration.addEventListener('updatefound', () => {
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
  } else {
    console.log('[UpdateNotifier] SW недоступен (file:// протокол или не поддерживается)');
  }
}

document.addEventListener('DOMContentLoaded', initUpdateNotifier);
