// test-speech-diagnostic.js - JavaScript для тестовой страницы диагностики

// Глобальные переменные
let speechService = null;
let logs = [];
let currentAudio = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function () {
    // Установка текущей даты
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ru-RU');

    // Загрузка информации об окружении
    loadEnvironmentInfo();

    // Инициализация обработчиков событий
    initEventHandlers();

    // Добавление начального лога
    addLog('info', 'Страница диагностики загружена');
});

// Загрузка информации об окружении
function loadEnvironmentInfo() {
    const envInfo = document.getElementById('envInfo');

    // Собираем информацию о браузере
    const browserInfo = {
        'User Agent': navigator.userAgent,
        'Платформа': navigator.platform,
        'Язык': navigator.language,
        'Онлайн': navigator.onLine ? 'Да' : 'Нет',
        'Web Speech API доступен': 'speechSynthesis' in window ? 'Да' : 'Нет',
        'Загруженные скрипты': document.querySelectorAll('script[src]').length
    };

    let html = '<div class="config-item"><span class="config-key">URL страницы:</span><span class="config-value">' + window.location.href + '</span></div>';

    for (const [key, value] of Object.entries(browserInfo)) {
        html += `<div class="config-item"><span class="config-key">${key}:</span><span class="config-value">${value}</span></div>`;
    }

    envInfo.innerHTML = html;
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Проверка конфигурации
    document.getElementById('checkConfigBtn').addEventListener('click', checkConfiguration);

    // Проверка сервера
    document.getElementById('checkServerBtn').addEventListener('click', checkServerStatus);

    // Тест синтеза речи
    document.getElementById('testSpeechBtn').addEventListener('click', testSpeechSynthesis);

    // Остановка воспроизведения
    document.getElementById('cancelSpeechBtn').addEventListener('click', cancelSpeech);

    // Тест прокси-сервера
    document.getElementById('testProxyBtn').addEventListener('click', testProxyServer);

    // Прямой тест Yandex
    document.getElementById('testDirectBtn').addEventListener('click', testDirectYandex);

    // Очистка логов
    document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);

    // Экспорт логов
    document.getElementById('exportLogsBtn').addEventListener('click', exportLogs);
}

// Функция добавления лога
function addLog(type, message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const logEntry = {
        time: timeStr,
        type: type,
        message: message,
        timestamp: now.getTime()
    };

    logs.push(logEntry);

    // Обновление отображения
    const logContainer = document.getElementById('logContainer');
    const logClass = `log-${type}`;

    const logElement = document.createElement('div');
    logElement.className = 'log-entry';
    logElement.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="${logClass}">${message}</span>`;

    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;

    // Обновление статуса в реальном времени
    updateSystemStatus(type, message);
}

// Обновление статуса системы
function updateSystemStatus(type, message) {
    const statusElement = document.getElementById('systemStatus');
    const lines = statusElement.querySelectorAll('p');

    // Обновляем статусы на основе сообщений
    if (message.includes('конфигурация') || message.includes('config')) {
        updateStatusLine(lines[0], type, message);
    } else if (message.includes('сервер') || message.includes('server') || message.includes('health')) {
        updateStatusLine(lines[1], type, message);
    } else if (message.includes('прокси') || message.includes('proxy')) {
        updateStatusLine(lines[2], type, message);
    } else if (message.includes('Yandex') || message.includes('API')) {
        updateStatusLine(lines[3], type, message);
    }
}

// Обновление строки статуса
function updateStatusLine(lineElement, type, message) {
    const indicator = lineElement.querySelector('.status-indicator');
    const text = lineElement.textContent.split(':')[0] + ': ';

    // Обновляем индикатор
    indicator.className = 'status-indicator';
    if (type === 'success') {
        indicator.classList.add('status-ok');
        lineElement.innerHTML = `${text} ${message}`;
    } else if (type === 'error') {
        indicator.classList.add('status-error');
        lineElement.innerHTML = `${text} ${message}`;
    } else if (type === 'warning') {
        indicator.classList.add('status-warning');
        lineElement.innerHTML = `${text} ${message}`;
    } else {
        indicator.classList.add('status-unknown');
    }
}

// Проверка конфигурации
async function checkConfiguration() {
    const spinner = document.getElementById('configSpinner');
    const resultDiv = document.getElementById('configResult');

    spinner.classList.remove('hidden');
    resultDiv.classList.add('hidden');

    addLog('info', 'Проверка конфигурации...');

    try {
        // Проверяем наличие конфигурационных файлов
        const configChecks = [
            { name: 'config.js', check: () => typeof window.appConfig !== 'undefined' },
            { name: 'speech-service.js', check: () => typeof SpeechService !== 'undefined' },
            { name: 'appConfig.speech', check: () => window.appConfig && window.appConfig.speech }
        ];

        let html = '<h4>Результаты проверки конфигурации:</h4>';
        let allOk = true;

        for (const check of configChecks) {
            try {
                const result = check.check();
                const status = result ? '✓' : '✗';
                const color = result ? 'config-value' : 'config-missing';

                html += `<div class="config-item">
                    <span class="config-key">${check.name}:</span>
                    <span class="${color}">${status} ${result ? 'Доступен' : 'Отсутствует'}</span>
                </div>`;

                if (!result) allOk = false;
            } catch (error) {
                html += `<div class="config-item">
                    <span class="config-key">${check.name}:</span>
                    <span class="config-missing">✗ Ошибка: ${error.message}</span>
                </div>`;
                allOk = false;
            }
        }

        // Проверяем переменные окружения
        if (window.appConfig && window.appConfig.speech) {
            const config = window.appConfig.speech;
            html += `<div class="config-item">
                <span class="config-key">Движок:</span>
                <span class="config-value">${config.engine || 'Не указан'}</span>
            </div>`;

            if (config.engine === 'yandex') {
                html += `<div class="config-item">
                    <span class="config-key">Прокси URL:</span>
                    <span class="config-value">${config.yandex.proxyUrl || 'Не указан'}</span>
                </div>`;
            }
        }

        resultDiv.innerHTML = html;
        resultDiv.classList.remove('hidden');

        if (allOk) {
            addLog('success', 'Конфигурация проверена успешно');
        } else {
            addLog('warning', 'В конфигурации обнаружены проблемы');
        }

    } catch (error) {
        addLog('error', `Ошибка проверки конфигурации: ${error.message}`);
        resultDiv.innerHTML = `<h4>Ошибка:</h4><p>${error.message}</p>`;
        resultDiv.classList.remove('hidden');
    } finally {
        spinner.classList.add('hidden');
    }
}

// Проверка статуса сервера
async function checkServerStatus() {
    addLog('info', 'Проверка статуса сервера...');

    try {
        const response = await fetch('/health');
        if (response.ok) {
            const data = await response.json();
            addLog('success', `Сервер работает: ${data.status} (${data.service})`);
        } else {
            addLog('error', `Сервер вернул ошибку: ${response.status}`);
        }
    } catch (error) {
        addLog('error', `Ошибка подключения к серверу: ${error.message}`);
    }
}

// Тест синтеза речи
async function testSpeechSynthesis() {
    const text = document.getElementById('testText').value;
    const engine = document.getElementById('engineSelect').value;
    const spinner = document.getElementById('speechSpinner');
    const resultDiv = document.getElementById('speechResult');

    if (!text.trim()) {
        addLog('warning', 'Введите текст для тестирования');
        return;
    }

    spinner.classList.remove('hidden');
    resultDiv.classList.add('hidden');

    addLog('info', `Запуск теста синтеза речи (движок: ${engine})...`);

    try {
        // Определяем движок
        let actualEngine = engine;
        if (engine === 'auto') {
            actualEngine = window.appConfig?.speech?.engine || 'browser';
            addLog('info', `Автоопределение: используется движок ${actualEngine}`);
        }

        // Загружаем speech-service если нужно
        if (!speechService && typeof SpeechService !== 'undefined') {
            speechService = new SpeechService();
            addLog('info', 'SpeechService инициализирован');
        }

        let resultMessage = '';

        if (actualEngine === 'browser') {
            // Тест браузерного синтеза
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ru-RU';
                utterance.rate = 1.0;

                utterance.onstart = () => {
                    addLog('success', 'Браузерный синтез начался');
                    resultMessage = 'Браузерный синтез запущен успешно';
                };

                utterance.onend = () => {
                    addLog('success', 'Браузерный синтез завершен');
                    updateSpeechResult('success', 'Браузерный синтез выполнен успешно');
                };

                utterance.onerror = (event) => {
                    addLog('error', `Ошибка браузерного синтеза: ${event.error}`);
                    updateSpeechResult('error', `Ошибка: ${event.error}`);
                };

                speechSynthesis.speak(utterance);
                currentAudio = utterance;
            } else {
                throw new Error('Web Speech API не поддерживается браузером');
            }
        } else if (actualEngine === 'yandex') {
            // Тест Yandex SpeechKit через speech-service
            if (!speechService) {
                throw new Error('SpeechService не доступен');
            }

            addLog('info', 'Запуск Yandex SpeechKit синтеза...');

            // Используем speech-service
            await speechService.speak(text, {
                voice: 'alena',
                emotion: 'good',
                speed: 1.0
            });

            resultMessage = 'Yandex SpeechKit синтез выполнен успешно';
            updateSpeechResult('success', resultMessage);

        } else {
            throw new Error(`Неизвестный движок: ${actualEngine}`);
        }

    } catch (error) {
        addLog('error', `Ошибка синтеза речи: ${error.message}`);
        updateSpeechResult('error', `Ошибка: ${error.message}`);
    } finally {
        spinner.classList.add('hidden');
    }
}

// Обновление результата теста синтеза
function updateSpeechResult(type, message) {
    const resultDiv = document.getElementById('speechResult');
    const color = type === 'success' ? '#10b981' : '#ef4444';
    const icon = type === 'success' ? '✅' : '❌';

    resultDiv.innerHTML = `
        <h4>Результат теста синтеза:</h4>
        <p style="color: ${color}; font-weight: bold;">${icon} ${message}</p>
        <p><small>Проверьте аудиовыход и консоль браузера для деталей</small></p>
    `;
    resultDiv.classList.remove('hidden');
}

// Остановка воспроизведения
function cancelSpeech() {
    if (currentAudio) {
        if (currentAudio instanceof SpeechSynthesisUtterance) {
            speechSynthesis.cancel();
            addLog('info', 'Браузерный синтез остановлен');
        } else if (currentAudio instanceof Audio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            addLog('info', 'Аудио воспроизведение остановлено');
        }
        currentAudio = null;
    }

    if (speechService && typeof speechService.cancel === 'function') {
        speechService.cancel();
        addLog('info', 'SpeechService остановлен');
    }
}

// Тест прокси-сервера
async function testProxyServer() {
    const text = document.getElementById('proxyText').value;
    const resultDiv = document.getElementById('proxyResult');

    if (!text.trim()) {
        addLog('warning', 'Введите текст для теста прокси');
        return;
    }

    addLog('info', 'Тестирование прокси-сервера...');

    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice: 'alena',
                emotion: 'good',
                speed: 1.0
            })
        });

        if (response.ok) {
            const data = await response.json();
            addLog('success', `Прокси-сервер ответил успешно: ${data.message || 'OK'}`);

            resultDiv.innerHTML = `
                <h4>Результат теста прокси:</h4>
                <p style="color: #10b981; font-weight: bold;">✅ Прокси-сервер работает корректно</p>
                <p><small>Статус: ${response.status}</small></p>
                <p><small>Ответ: ${JSON.stringify(data)}</small></p>
            `;
        } else {
            const errorText = await response.text();
            addLog('error', `Прокси-сервер вернул ошибку: ${response.status} - ${errorText}`);

            resultDiv.innerHTML = `
                <h4>Ошибка прокси-сервера:</h4>
                <p style="color: #ef4444; font-weight: bold;">❌ Ошибка ${response.status}</p>
                <p><small>${errorText}</small></p>
            `;
        }

    } catch (error) {
        addLog('error', `Ошибка подключения к прокси: ${error.message}`);

        resultDiv.innerHTML = `
            <h4>Ошибка подключения:</h4>
            <p style="color: #ef4444; font-weight: bold;">❌ ${error.message}</p>
            <p><small>Проверьте доступность сервера и CORS настройки</small></p>
        `;
    }

    resultDiv.classList.remove('hidden');
}

// Прямой тест Yandex API (только для отладки)
async function testDirectYandex() {
    addLog('warning', 'Прямой тест Yandex API отключен из-за CORS ограничений');

    const resultDiv = document.getElementById('proxyResult');
    resultDiv.innerHTML = `
        <h4>Прямой тест Yandex API:</h4>
        <p style="color: #f59e0b; font-weight: bold;">⚠️ Прямые запросы к Yandex API заблокированы CORS</p>
        <p><small>Используйте прокси-сервер (/api/tts) для работы с Yandex SpeechKit</small></p>
        <p><small>Это ограничение безопасности браузера, а не ошибка вашей конфигурации</small></p>
    `;
    resultDiv.classList.remove('hidden');
}

// Очистка логов
function clearLogs() {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '<div class="log-entry"><span class="log-time">[00:00:00]</span> <span class="log-info">Логи очищены</span></div>';
    logs = [];
    addLog('info', 'Журнал событий очищен');
}

// Экспорт логов
function exportLogs() {
    const logText = logs.map(log => `[${log.time}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `speech-diagnostic-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();

    URL.revokeObjectURL(url);
    addLog('info', 'Логи экспортированы в файл');
}