# Решение проблемы "Cannot GET /" на Railway

## Проблема
После деплоя приложение показывает "Cannot GET /" вместо главной страницы.

## Причина
Railway определил проект как Node.js приложение (из-за `package.json` и `speech-proxy.js`) и пытается запустить его как сервер, но не обслуживает статические файлы.

## Решение

### 1. Обновленные файлы

Добавлены/обновлены два файла:

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "echo 'Building static site with proxy server'"
  },
  "deploy": {
    "startCommand": "node speech-proxy.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  },
  "static": {
    "publicDir": ".",
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "/*",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Обновленный `speech-proxy.js`
Теперь сервер:
1. Обслуживает статические файлы (`express.static`)
2. Работает как прокси для Yandex SpeechKit
3. Отдает `index.html` для всех маршрутов (SPA support)

### 2. Действия

1. **Добавьте `railway.json`** в корень проекта
2. **Перезапустите деплой** на Railway
3. **Проверьте** что теперь работает:
   - Главная страница: `https://ваш-проект.up.railway.app/`
   - Health check: `https://ваш-проект.up.railway.app/health`
   - Информация: `https://ваш-проект.up.railway.app/api/info`

### 3. Архитектура после исправления

```
Запрос на Railway → Express.js сервер (speech-proxy.js)
                         ↓
              Статические файлы (index.html, app.js и т.д.)
                         ↓
                 Браузер пользователя
                         ↓
        Запросы к /api/tts → Yandex SpeechKit
```

### 4. Проверка

1. **Главная страница**: должна открываться без ошибок
2. **Прокси-сервер**: `/health` возвращает `{"status":"ok"}`
3. **Синтез речи**: приложение должно озвучивать текст
4. **Консоль браузера**: нет ошибок CORS или 404

### 5. Если проблема осталась

1. **Проверьте логи Railway**: `railway logs`
2. **Убедитесь**, что все файлы загружены:
   - `railway.json`
   - `speech-proxy.js` (обновленная версия)
   - `package.json`
   - `index.html` и другие статические файлы
3. **Пересоздайте проект** на Railway если нужно

### 6. Альтернативное решение

Если хотите разделить фронтенд и бэкенд:

1. **Фронтенд отдельно**: удалите `package.json` и `speech-proxy.js`, Railway будет обслуживать статические файлы
2. **Бэкенд отдельно**: создайте отдельный проект для прокси, укажите его URL в `YANDEX_PROXY_URL`

## Готово

После добавления `railway.json` и обновления `speech-proxy.js` приложение будет работать корректно на Railway, обслуживая и статические файлы, и прокси для Yandex SpeechKit.