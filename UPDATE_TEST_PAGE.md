# Обновление тестовой страницы для обработки аудио-ответов

## Проблема
Тестовая страница `speech-test.html` ожидает JSON ответ от прокси-сервера, но прокси возвращает бинарные аудио-данные (Ogg формат).

## Решение
Нужно обновить функцию `testProxyServer()` в тестовой странице, чтобы она правильно обрабатывала аудио-ответы.

## Шаги для обновления

### Вариант 1: Быстрое исправление (рекомендуется)

Замените функцию `testProxyServer()` в файле `speech-test.html`:

```javascript
// Тест прокси-сервера (обновленная версия)
async function testProxyServer() {
    const text = document.getElementById('proxyText').value;
    const statusDiv = document.getElementById('proxyStatus');
    
    statusDiv.className = 'status';
    statusDiv.textContent = 'Тестируем прокси...';
    
    addLog('info', 'Тестирование прокси-сервера...');
    
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voice: 'alena',
                emotion: 'good',
                speed: 1.0
            })
        });
        
        if (response.ok) {
            // Проверяем Content-Type ответа
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('audio')) {
                // Получаем размер аудио
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                statusDiv.innerHTML = `
                    <strong>✅ Прокси работает отлично!</strong><br>
                    <small>Получено аудио: ${audioBlob.size} байт (${contentType})</small><br>
                    <small>Аудио готово к воспроизведению</small><br>
                    <button onclick="playTestAudio('${audioUrl}')" style="margin-top: 10px;">
                        ▶️ Воспроизвести тестовое аудио
                    </button>
                `;
                statusDiv.classList.add('status-ok');
                addLog('success', `Прокси работает! Аудио: ${audioBlob.size} байт`);
            } else if (contentType && contentType.includes('json')) {
                // JSON ответ (для обратной совместимости)
                const data = await response.json();
                statusDiv.textContent = `✅ Прокси работает: ${data.message || 'OK'}`;
                statusDiv.classList.add('status-ok');
                addLog('success', 'Прокси-сервер работает корректно (JSON ответ)');
            } else {
                // Неизвестный формат, но статус OK
                statusDiv.textContent = `✅ Прокси отвечает (${response.status})`;
                statusDiv.classList.add('status-ok');
                addLog('success', `Прокси отвечает статусом ${response.status}`);
            }
        } else {
            const errorText = await response.text();
            statusDiv.textContent = `❌ Ошибка прокси: ${response.status}`;
            statusDiv.classList.add('status-error');
            addLog('error', `Прокси ошибка ${response.status}: ${errorText}`);
        }
    } catch (error) {
        statusDiv.textContent = `❌ Ошибка подключения: ${error.message}`;
        statusDiv.classList.add('status-error');
        addLog('error', `Ошибка подключения к прокси: ${error.message}`);
    }
}

// Функция для воспроизведения тестового аудио
function playTestAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().then(() => {
        addLog('success', 'Тестовое аудио воспроизводится');
    }).catch(error => {
        addLog('error', 'Ошибка воспроизведения аудио', error);
    });
}
```

### Вариант 2: Полная замена тестовой страницы

Если хотите полностью обновить тестовую страницу, создайте новый файл `speech-test-v2.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест Yandex SpeechKit v2</title>
    <style>
        /* Стили остаются такими же */
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #4CAF50; color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .status-ok { background: #d4edda; color: #155724; }
        .status-error { background: #f8d7da; color: #721c24; }
        .log { background: #333; color: #fff; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Тест Yandex SpeechKit v2</h1>
        
        <div class="test-section">
            <h3>Тест прокси с аудио-поддержкой</h3>
            <input type="text" id="proxyText" value="Тест прокси сервера" style="width: 100%; padding: 10px;">
            <div>
                <button id="testProxy">🔄 Тест прокси (с аудио)</button>
                <button id="playLastAudio" style="display:none;">▶️ Воспроизвести последнее аудио</button>
            </div>
            <div id="proxyStatus" class="status"></div>
            <div id="audioInfo" style="display:none;">
                <audio id="testAudio" controls></audio>
            </div>
        </div>
        
        <div class="test-section">
            <h3>Журнал событий</h3>
            <div class="log" id="logContainer">
                <div class="log-entry">[00:00:00] Система запущена</div>
            </div>
        </div>
    </div>

    <script>
        let lastAudioUrl = null;
        
        document.getElementById('testProxy').addEventListener('click', async function() {
            const text = document.getElementById('proxyText').value;
            const statusDiv = document.getElementById('proxyStatus');
            const audioInfo = document.getElementById('audioInfo');
            const playButton = document.getElementById('playLastAudio');
            
            statusDiv.className = 'status';
            statusDiv.textContent = 'Тестируем...';
            audioInfo.style.display = 'none';
            
            addLog('info', `Тест прокси: "${text}"`);
            
            try {
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text,
                        voice: 'alena',
                        emotion: 'good',
                        speed: 1.0
                    })
                });
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    const audioBlob = await response.blob();
                    
                    // Освобождаем предыдущий URL
                    if (lastAudioUrl) URL.revokeObjectURL(lastAudioUrl);
                    
                    lastAudioUrl = URL.createObjectURL(audioBlob);
                    const audioElement = document.getElementById('testAudio');
                    audioElement.src = lastAudioUrl;
                    
                    statusDiv.innerHTML = `
                        <strong>✅ Прокси работает!</strong><br>
                        <small>Формат: ${contentType}</small><br>
                        <small>Размер: ${(audioBlob.size / 1024).toFixed(1)} KB</small><br>
                        <small>Статус: ${response.status}</small>
                    `;
                    statusDiv.classList.add('status-ok');
                    
                    audioInfo.style.display = 'block';
                    playButton.style.display = 'inline-block';
                    
                    addLog('success', `Аудио получено: ${audioBlob.size} байт`);
                } else {
                    const errorText = await response.text();
                    statusDiv.textContent = `❌ Ошибка: ${response.status}`;
                    statusDiv.classList.add('status-error');
                    addLog('error', `Ошибка ${response.status}: ${errorText}`);
                }
            } catch (error) {
                statusDiv.textContent = `❌ ${error.message}`;
                statusDiv.classList.add('status-error');
                addLog('error', `Ошибка: ${error.message}`);
            }
        });
        
        document.getElementById('playLastAudio').addEventListener('click', function() {
            if (lastAudioUrl) {
                const audio = new Audio(lastAudioUrl);
                audio.play().then(() => {
                    addLog('success', 'Аудио воспроизводится');
                });
            }
        });
        
        function addLog(type, message) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ru-RU');
            const logContainer = document.getElementById('logContainer');
            const logElement = document.createElement('div');
            logElement.className = 'log-entry';
            logElement.innerHTML = `[${timeStr}] ${message}`;
            logContainer.appendChild(logElement);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    </script>
</body>
</html>
```

## Что изменилось в обновленной версии:

### 1. Правильная обработка Content-Type
- Проверяется заголовок `content-type` ответа
- Если это аудио (`audio/`), обрабатывается как аудиофайл
- Если это JSON, обрабатывается как JSON (для обратной совместимости)

### 2. Воспроизведение аудио
- Аудио сохраняется как Blob и создается URL
- Добавлена кнопка для воспроизведения тестового аудио
- Пользователь может услышать, что прокси действительно возвращает аудио

### 3. Информативная обратная связь
- Показывается размер аудиофайла
- Показывается MIME-тип
- Показывается статус ответа

## Как применить обновление:

### Способ A: Обновить существующую страницу
1. Откройте `speech-test.html` в редакторе
2. Найдите функцию `testProxyServer()`
3. Замените ее на код из "Варианта 1" выше
4. Добавьте функцию `playTestAudio()` в конец файла

### Способ B: Создать новую страницу
1. Создайте новый файл `speech-test-v2.html`
2. Скопируйте код из "Варианта 2"
3. Откройте `https://ваш-домен.railway.app/speech-test-v2.html`

## Проверка после обновления:

После обновления тест прокси должен показывать:
```
✅ Прокси работает отлично!
Получено аудио: 12345 байт (audio/ogg)
Аудио готово к воспроизведению
[▶️ Воспроизвести тестовое аудио]
```

При нажатии на кнопку вы услышите тестовую фразу через Yandex SpeechKit.

## Важно!

**Основное приложение уже должно работать с Yandex SpeechKit.** Обновление тестовой страницы нужно только для того, чтобы убрать ложную "ошибку" в тестах.

Если основное приложение (`https://ваш-домен.railway.app/`) работает с Yandex SpeechKit, значит интеграция успешно завершена!