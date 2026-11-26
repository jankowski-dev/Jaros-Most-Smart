# Ярик.Уроки

Обучающая PWA для детей: математика, чтение и тест на слух. Поддерживает
браузерный синтез речи и Yandex SpeechKit через прокси на Railway.

## Файлы проекта

### Фронтенд
- `index.html` — разметка приложения
- `app.js` — логика приложения
- `data.js` — данные упражнений
- `styles.css` — собранные стили (генерируется Tailwind CSS, не редактировать вручную)
- `src/input.css` — исходник стилей Tailwind + компонентные стили
- `config.js` — конфигурация синтеза речи
- `speech-service.js` — сервис синтеза речи
- `update-notifier.js` — проверка обновлений и регистрация Service Worker
- `sw.js` — Service Worker (офлайн-кэш)
- `manifest.json` — манифест PWA
- `fonts/` — локальные файлы Montserrat (офлайн-режим)

### Бэкенд
- `speech-proxy.js` — Express-сервер: статика + прокси Yandex SpeechKit
- `package.json` — зависимости и npm-скрипты

## Быстрый старт

```bash
npm install
npm start
```

Приложение откроется на `http://localhost:3000`.

### Сборка стилей

```bash
npm run build:css    # однократная сборка styles.css
npm run watch:css    # пересборка при изменении src/input.css
```

## Переменные среды

```
SPEECH_ENGINE=yandex        # или browser
YANDEX_SPEECH_API_KEY=...   # обязателен для Yandex SpeechKit
YANDEX_SPEECH_FOLDER_ID=... # опционально
YANDEX_VOICE=alena
YANDEX_EMOTION=good
YANDEX_SPEED=1.0
SPEECH_FALLBACK=true
SPEECH_DEBUG=false
```

`config.js` по умолчанию использует относительный URL прокси `/api/tts`,
поэтому фронтенд и прокси должны быть на одном origin (так работает
`speech-proxy.js` на Railway). Если прокси вынесен на отдельный домен,
укажите его в `window.appConfig.speech.yandex.proxyUrl` и добавьте домен
в `connect-src` заголовка CSP в `speech-proxy.js`.

## Проверка

1. Прокси: `https://ваш-домен/health`
2. API: `https://ваш-домен/api/info`
3. Приложение: откройте корень сайта и проверьте озвучивание

## Режимы синтеза речи

- **Браузерный** (`browser`) — Web Speech API, работает без настройки.
- **Yandex SpeechKit** (`yandex`) — высокое качество голоса, требует API-ключ
  и прокси. При ошибке автоматически переключается на браузерный синтез
  (`SPEECH_FALLBACK=true`).

## Обновление версии

```bash
node update-version.js 2.7
```

Скрипт обновляет `config.js`, `sw.js` и версию в `speech-proxy.js`.
Не забудьте также обновить версию в `package.json` и пересобрать стили.
