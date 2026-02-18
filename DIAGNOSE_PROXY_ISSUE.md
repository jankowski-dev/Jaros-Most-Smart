# Диагностика проблемы с прокси-сервером

## Проблема
`POST https://jms.up.railway.app/api/tts net::ERR_CONNECTION_RESET`

Ошибка `ERR_CONNECTION_RESET` означает, что соединение с прокси-сервером было неожиданно разорвано. Это может быть вызвано несколькими причинами.

## Причины ERR_CONNECTION_RESET

### 1. **Прокси-сервер перезагружается/падает**
- Railway перезапускает контейнер
- Недостаточно памяти/ресурсов
- Ошибка в коде `speech-proxy.js`

### 2. **Проблемы с Yandex API**
- Неверный API ключ или Folder ID
- Превышение лимитов Yandex
- Временные проблемы Yandex API

### 3. **Проблемы сети**
- Временные проблемы Railway
- Блокировка запросов

## Шаги диагностики

### Шаг 1: Проверьте статус приложения на Railway

1. Откройте Railway Dashboard
2. Перейдите в ваш проект `jms`
3. Проверьте:
   - **Status**: Должен быть "Running" (а не "Deploying" или "Failed")
   - **Logs**: Откройте логи, ищите ошибки
   - **Health Checks**: Проверьте статус health check

### Шаг 2: Проверьте health check вручную

Откройте в браузере:
```
https://jms.up.railway.app/health
```

**Ожидаемый ответ:**
```json
{"status":"ok","service":"speech-proxy","timestamp":"2026-02-18T08:00:00.000Z"}
```

**Если ошибка:**
- 502/503/504: Сервер не запущен
- 404: Неправильный маршрут
- Connection refused: Сервер упал

### Шаг 3: Проверьте логи Railway

В Railway Dashboard откройте Logs и ищите:

**Ошибки запуска:**
```
Error: Cannot find module 'express'
Error: Port already in use
Out of memory
```

**Ошибки Yandex API:**
```
Yandex API error: 401 Unauthorized
Yandex API error: 403 Forbidden
Yandex API error: 429 Too Many Requests
```

### Шаг 4: Проверьте переменные среды

Убедитесь, что в Railway установлены:

1. **Обязательные:**
   - `YANDEX_SPEECH_API_KEY` - действительный API ключ
   - `YANDEX_SPEECH_FOLDER_ID` - правильный Folder ID

2. **Опциональные (но важные):**
   - `SPEECH_ENGINE` = `yandex`
   - `PORT` = `3000` (или любой другой)

### Шаг 5: Проверьте с помощью curl

Откройте терминал и выполните:

```bash
# 1. Проверка health check
curl -v https://jms.up.railway.app/health

# 2. Проверка прокси (если health check работает)
curl -X POST https://jms.up.railway.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Тест", "voice":"alena"}' \
  -v --output test.ogg
```

**Анализ ответа curl:**
- `200 OK` - прокси работает
- `401/403` - проблема с Yandex API ключом
- `500` - ошибка в speech-proxy.js
- `Connection reset` - сервер падает при обработке

## Возможные решения

### Решение 1: Перезапустите приложение на Railway

1. В Railway Dashboard найдите кнопку "Restart"
2. Перезапустите приложение
3. Подождите 1-2 минуты
4. Проверьте health check снова

### Решение 2: Проверьте код speech-proxy.js

Наиболее вероятные проблемы в `speech-proxy.js`:

**Проблема A: Неправильная обработка Yandex API ключа**
```javascript
// Проверьте эти строки в speech-proxy.js
const apiKey = process.env.YANDEX_SPEECH_API_KEY;
if (!apiKey) {
    // Возвращает 500 ошибку
}
```

**Проблема B: Ошибка при запросе к Yandex**
```javascript
try {
    const response = await fetch('https://tts.api.cloud.yandex.net/...', {
        // ...
    });
    // Если Yandex возвращает ошибку, прокси может падать
} catch (error) {
    // Должна быть обработка ошибок
}
```

### Решение 3: Увеличьте ресурсы Railway

Если проблема в нехватке памяти:
1. В Railway Dashboard откройте Settings
2. Проверьте план (Plan)
3. Если на бесплатном плане, попробуйте:
   - Уменьшить размер аудио (format: "lpcm", sampleRateHertz: 8000)
   - Добавить кэширование
   - Оптимизировать код

### Решение 4: Временный workaround

Если не удается быстро починить прокси, можно:

1. **Временно использовать браузерный синтез:**
   - Установите `SPEECH_ENGINE=browser` в Railway
   - Приложение будет работать (хоть и с браузерным синтезом)

2. **Проверить с другим Yandex API ключом:**
   - Создайте новый API ключ в Yandex Cloud
   - Обновите переменную `YANDEX_SPEECH_API_KEY`

## Экстренная диагностика

### Если health check не работает:

1. **Проверьте railway.json:**
```json
{
  "deploy": {
    "startCommand": "node speech-proxy.js",
    "healthcheckPath": "/health"
  }
}
```

2. **Проверьте package.json:**
```json
{
  "scripts": {
    "start": "node speech-proxy.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "node-fetch": "^2.6.7"
  }
}
```

3. **Проверьте наличие файлов:**
   - `speech-proxy.js` в корне проекта
   - `package.json` с правильными зависимостями
   - `railway.json` с правильной конфигурацией

## Следующие действия

1. **Сначала проверьте health check:** `https://jms.up.railway.app/health`
2. **Если health check не работает:** проверьте логи Railway
3. **Если health check работает, но /api/tts нет:** проверьте код speech-proxy.js
4. **Если /api/tts возвращает ошибку Yandex:** проверьте API ключ

## Что сообщить мне

Для дальнейшей помощи пришлите:

1. **Результат health check:** что возвращает `https://jms.up.railway.app/health`
2. **Логи Railway:** последние 20-30 строк логов
3. **Результат curl теста:** если пробовали
4. **Статус приложения в Railway:** Running/Deploying/Failed

С этой информацией я смогу точно определить причину проблемы и предложить конкретное решение.