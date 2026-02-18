# Ярик.Уроки с поддержкой Yandex SpeechKit

Проект обновлен для поддержки опционального синтеза речи через Yandex SpeechKit с прокси-сервером на Railway для обхода CORS ограничений.

## Файлы проекта

### Основные файлы (фронтенд):
- `index.html` - главная страница
- `app.js` - логика приложения (обновлен)
- `data.js` - данные упражнений
- `styles.css` - стили
- `config.js` - конфигурация синтеза речи
- `speech-service.js` - сервис синтеза речи

### Прокси-сервер (бэкенд):
- `speech-proxy.js` - прокси для Yandex SpeechKit
- `package.json` - зависимости Node.js

## Быстрая настройка

### 1. Переменные среды в Railway:

```
# Режим синтеза (обязательно)
SPEECH_ENGINE=browser  # или yandex

# Для Yandex SpeechKit:
YANDEX_PROXY_URL=https://ваш-прокси.up.railway.app/api/tts
YANDEX_SPEECH_API_KEY=ваш_api_ключ

# Опционально:
YANDEX_VOICE=alena
YANDEX_EMOTION=good
YANDEX_SPEED=1.0
SPEECH_FALLBACK=true
```

### 2. Развертывание прокси:

Railway автоматически определит Node.js приложение по `package.json`. Убедитесь, что переменная `YANDEX_SPEECH_API_KEY` установлена.

### 3. Проверка:

1. Прокси: `https://ваш-прокси.up.railway.app/health`
2. Приложение: откройте и проверьте озвучивание

## Архитектура

```
Браузер → Railway (frontend) → Railway (прокси) → Yandex SpeechKit
     ↑          ↑                   ↑                    ↑
   Запрос   config.js         speech-proxy.js        API Яндекс
```

## Режимы работы

### Браузерный синтез (по умолчанию):
- Использует Web Speech API
- Не требует настройки
- Мгновенный запуск

### Yandex SpeechKit:
- Высокое качество голоса
- Настройка голоса и эмоций
- Требует API ключ и прокси

## Устранение неполадок

1. **CORS ошибка**: убедитесь, что прокси работает и URL правильный
2. **API ключ не работает**: проверьте ключ в Yandex Cloud Console
3. **Нет звука**: проверьте `SPEECH_ENABLED=true` и консоль браузера

## Подробная инструкция

См. `INSTRUCTIONS.md` для детальной настройки.