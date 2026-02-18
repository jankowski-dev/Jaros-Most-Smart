# Решение проблемы ERR_CONNECTION_RESET

## Быстрые решения (попробуйте по порядку)

### Решение 1: Перезапуск приложения на Railway

1. **Откройте Railway Dashboard** → ваш проект `jms`
2. **Найдите кнопку "Restart"** или "Redeploy"
3. **Перезапустите приложение**
4. **Подождите 2-3 минуты** пока перезапустится
5. **Проверьте:** `https://jms.up.railway.app/health`

### Решение 2: Проверка и обновление speech-proxy.js

Наиболее вероятная причина - ошибка в `speech-proxy.js` при запросе к Yandex. Проверьте текущую версию файла:

**Критические места для проверки:**

```javascript
// 1. Проверка переменных среды (должна быть ДО использования)
const apiKey = process.env.YANDEX_SPEECH_API_KEY;
const folderId = process.env.YANDEX_SPEECH_FOLDER_ID;

if (!apiKey) {
    console.error('YANDEX_SPEECH_API_KEY не установлен');
    return res.status(500).json({ error: 'API key not configured' });
}

// 2. Обработка ошибок при запросе к Yandex (должна быть try-catch)
try {
    const response = await fetch('https://tts.api.cloud.yandex.net/...', {
        method: 'POST',
        headers: {
            'Authorization': `Api-Key ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Yandex API error:', response.status, errorText);
        return res.status(response.status).json({ 
            error: 'Yandex API error', 
            details: errorText 
        });
    }
    
    // ... обработка успешного ответа
    
} catch (error) {
    console.error('Network error to Yandex:', error);
    return res.status(502).json({ 
        error: 'Failed to connect to Yandex API',
        message: error.message 
    });
}
```

### Решение 3: Упрощенная версия speech-proxy.js

Если текущий код сложный, замените его на упрощенную версию:

```javascript
// speech-proxy.js - Упрощенная версия
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'speech-proxy',
        timestamp: new Date().toISOString(),
        yandexConfigured: !!process.env.YANDEX_SPEECH_API_KEY
    });
});

// TTS endpoint
app.post('/api/tts', async (req, res) => {
    console.log('TTS request:', { 
        textLength: req.body.text?.length,
        voice: req.body.voice 
    });
    
    try {
        const { text, voice = 'alena', emotion = 'good', speed = 1.0 } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const apiKey = process.env.YANDEX_SPEECH_API_KEY;
        const folderId = process.env.YANDEX_SPEECH_FOLDER_ID;
        
        if (!apiKey) {
            console.error('API key missing');
            return res.status(500).json({ error: 'Yandex API key not configured' });
        }
        
        // Prepare request to Yandex
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('lang', 'ru-RU');
        params.append('voice', voice);
        params.append('emotion', emotion);
        params.append('speed', speed.toString());
        params.append('format', 'oggopus');
        
        if (folderId) {
            params.append('folderId', folderId);
        }
        
        console.log('Calling Yandex API...');
        
        const yandexResponse = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        
        console.log('Yandex response status:', yandexResponse.status);
        
        if (!yandexResponse.ok) {
            const errorText = await yandexResponse.text();
            console.error('Yandex API error:', yandexResponse.status, errorText);
            return res.status(yandexResponse.status).json({ 
                error: 'Yandex API error',
                status: yandexResponse.status,
                message: errorText.substring(0, 200)
            });
        }
        
        // Get audio data
        const audioBuffer = await yandexResponse.buffer();
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'audio/ogg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Send audio
        res.send(audioBuffer);
        
        console.log('Audio sent successfully:', audioBuffer.length, 'bytes');
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Serve static files
app.use(express.static(__dirname));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Yandex API configured: ${process.env.YANDEX_SPEECH_API_KEY ? 'Yes' : 'No'}`);
});
```

### Решение 4: Проверка переменных среды

В Railway Dashboard проверьте:

**Обязательные:**
```
YANDEX_SPEECH_API_KEY = ваш_действительный_API_ключ
YANDEX_SPEECH_FOLDER_ID = ваш_folder_id
```

**Опциональные (но важные):**
```
SPEECH_ENGINE = yandex
PORT = 3000
NODE_ENV = production
```

### Решение 5: Проверка package.json зависимостей

Убедитесь, что в `package.json` есть:

```json
{
  "name": "yaapp",
  "version": "1.0.0",
  "main": "speech-proxy.js",
  "scripts": {
    "start": "node speech-proxy.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "node-fetch": "^2.6.7"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## Пошаговый план исправления

### Шаг 1: Проверка здоровья
```
Откройте: https://jms.up.railway.app/health
```

**Если не работает:** Перейдите к Шагу 2
**Если работает:** Перейдите к Шагу 3

### Шаг 2: Восстановление health check

1. **Проверьте railway.json:**
```json
{
  "deploy": {
    "startCommand": "node speech-proxy.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. **Перезапустите приложение** в Railway
3. **Подождите 3 минуты**
4. **Проверьте health check снова**

### Шаг 3: Тестирование прокси

Если health check работает, но `/api/tts` нет:

1. **Проверьте логи Railway** на ошибки
2. **Используйте curl для теста:**
```bash
curl -X POST https://jms.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"тест"}' \
  -v
```

3. **Анализируйте ответ:**
   - `200 OK` с аудио - все работает
   - `401/403` - проблема с Yandex API ключом
   - `500` - ошибка в коде прокси

### Шаг 4: Обновление кода

Если найдены ошибки в коде:

1. **Скачайте текущий `speech-proxy.js`** с Railway
2. **Сравните с упрощенной версией** выше
3. **Исправьте ошибки** или замените полностью
4. **Загрузите обратно** и перезапустите

### Шаг 5: Альтернативное решение

Если не удается починить прокси быстро:

1. **Временно переключитесь на браузерный синтез:**
   - В Railway установите `SPEECH_ENGINE=browser`
   - Приложение будет работать (с браузерным синтезом)

2. **Проверьте с другим Yandex API ключом:**
   - Создайте новый ключ в Yandex Cloud
   - Обновите в Railway
   - Перезапустите приложение

## Экстренные меры

### Если ничего не помогает:

1. **Создайте минимальный тестовый прокси:**
```javascript
// test-proxy.js - минимальный рабочий прокси
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/tts', (req, res) => {
    console.log('Test TTS:', req.body.text);
    // Возвращаем фиктивный успешный ответ
    res.json({ success: true, message: 'Proxy is working' });
});

app.listen(3000, () => console.log('Test proxy running'));
```

2. **Разверните тестовый прокси** отдельно
3. **Обновите `YANDEX_PROXY_URL`** на новый адрес
4. **Проверьте работу**

## Что делать после исправления

### 1. Проверка работы:
```javascript
// В консоли браузера на основном приложении
window.speechService.speak('Тест исправления');
```

### 2. Мониторинг:
- Следите за логами Railway 5-10 минут
- Проверьте несколько запросов подряд
- Убедитесь, что нет intermittent failures

### 3. Оптимизация:
- Добавьте кэширование часто используемых фраз
- Настройте таймауты и retry логику
- Мониторьте использование Yandex API квот

## Отчет о проблеме

Если проблема сохраняется, предоставьте:

1. **Текущий код `speech-proxy.js`**
2. **Логи Railway** (последние 50 строк)
3. **Результат health check**
4. **Результат curl теста**

С этой информацией я смогу точно диагностировать и исправить проблему.