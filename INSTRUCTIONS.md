# Инструкция по настройке Yandex SpeechKit для Railway

## Файловая структура проекта

```
├── index.html          # Главная страница (уже обновлен)
├── app.js              # Основная логика (уже обновлен)
├── data.js             # Данные приложения
├── styles.css          # Стили
├── config.js           # Конфигурация синтеза речи
├── speech-service.js   # Сервис синтеза речи
├── speech-proxy.js     # Прокси-сервер для Yandex SpeechKit
├── package.json        # Зависимости для прокси-сервера
└── INSTRUCTIONS.md     # Эта инструкция
```

## Шаг 1: Настройка переменных среды в Railway

Добавьте следующие переменные среды в настройках вашего проекта на Railway:

### Обязательные переменные:
```
SPEECH_ENGINE=browser
```
или для использования Yandex SpeechKit:
```
SPEECH_ENGINE=yandex
YANDEX_PROXY_URL=https://ваш-прокси.up.railway.app/api/tts
YANDEX_SPEECH_API_KEY=ваш_api_ключ_яндекс
```

### Опциональные переменные:
```
YANDEX_VOICE=alena           # голос: alena, filipp, ermil
YANDEX_EMOTION=good          # эмоция: good, evil, neutral  
YANDEX_SPEED=1.0             # скорость: от 0.1 до 3.0
SPEECH_ENABLED=true          # включить синтез
SPEECH_FALLBACK=true         # fallback на браузерный синтез
SPEECH_DEBUG=false           # режим отладки
```

## Шаг 2: Развертывание прокси-сервера

### Вариант A: Использовать существующий Railway проект
1. Убедитесь, что файлы `speech-proxy.js` и `package.json` в корне проекта
2. Railway автоматически определит Node.js приложение
3. Добавьте переменные среды `YANDEX_SPEECH_API_KEY` и `YANDEX_SPEECH_FOLDER_ID` (опционально)

### Вариант B: Отдельный проект для прокси
1. Создайте новый проект на Railway
2. Загрузите только `speech-proxy.js` и `package.json`
3. Настройте переменные среды
4. Получите URL вида `https://ваш-прокси.up.railway.app`
5. Используйте этот URL в `YANDEX_PROXY_URL` основного проекта

## Шаг 3: Проверка работы

### Проверка прокси-сервера:
```
GET https://ваш-прокси.up.railway.app/health
```
Должен вернуть: `{"status":"ok","service":"speech-proxy"}`

### Проверка информации:
```
GET https://ваш-прокси.up.railway.app/api/info
```
Покажет конфигурацию прокси.

## Шаг 4: Настройка фронтенда

Конфигурация автоматически загружается из переменных среды в `config.js`:

```javascript
// Пример конфигурации для Yandex SpeechKit
window.appConfig = {
  speech: {
    engine: 'yandex',  // или 'browser'
    yandex: {
      proxyUrl: 'https://ваш-прокси.up.railway.app/api/tts',
      voice: 'alena',
      emotion: 'good',
      speed: 1.0
    },
    common: {
      enabled: true,
      fallback: true,
      debug: false
    }
  }
};
```

## Шаг 5: Тестирование

1. Откройте приложение на Railway
2. Пройдите процесс выбора предмета
3. Проверьте озвучивание слов и ответов
4. Если есть ошибки, включите `SPEECH_DEBUG=true` и проверьте консоль браузера

## Цепочка запросов

```
Браузер → Railway (frontend) → Railway (прокси) → Yandex SpeechKit → Railway (прокси) → Браузер
     |          |                   |                    |                   |          |
   Запрос   config.js         speech-proxy.js        API Яндекс      Аудио данные   Воспроизведение
```

## Переменные среды (полный список)

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `SPEECH_ENGINE` | `browser` | `browser` или `yandex` |
| `YANDEX_PROXY_URL` | (пусто) | URL прокси-сервера на Railway |
| `YANDEX_SPEECH_API_KEY` | (пусто) | API ключ Yandex SpeechKit |
| `YANDEX_SPEECH_FOLDER_ID` | (пусто) | ID каталога Yandex Cloud |
| `YANDEX_VOICE` | `alena` | Голос: `alena`, `filipp`, `ermil` |
| `YANDEX_EMOTION` | `good` | Эмоция: `good`, `evil`, `neutral` |
| `YANDEX_SPEED` | `1.0` | Скорость речи (0.1-3.0) |
| `SPEECH_ENABLED` | `true` | Включить синтез речи |
| `SPEECH_FALLBACK` | `true` | Fallback на браузерный синтез |
| `SPEECH_DEBUG` | `false` | Режим отладки |

## Устранение неполадок

### Ошибка: "Прокси-сервер недоступен"
1. Проверьте, что прокси-сервер запущен на Railway
2. Проверьте URL в `YANDEX_PROXY_URL`
3. Проверьте логи Railway

### Ошибка: "API ключ не настроен"
1. Убедитесь, что `YANDEX_SPEECH_API_KEY` установлен в переменных среды прокси
2. Проверьте, что ключ действителен
3. Проверьте права сервисного аккаунта в Yandex Cloud

### Ошибка: "CORS ошибка"
1. Убедитесь, что фронтенд и прокси на одном домене или настроены CORS
2. Проверьте, что прокси возвращает правильные CORS заголовки

### Ошибка: "Fallback не срабатывает"
1. Проверьте `SPEECH_FALLBACK=true`
2. Убедитесь, что браузер поддерживает Web Speech API
3. Проверьте консоль браузера на ошибки

## Производительность

- **Браузерный синтез**: мгновенно, не требует интернета
- **Yandex через прокси**: задержка 1-3 секунды, высокое качество
- **Кэширование**: прокси кэширует аудио на 1 час

## Безопасность

- API ключи хранятся только на сервере (Railway)
- HTTPS включен автоматически на Railway
- Рекомендуется настроить rate limiting при большом трафике

## Готово!

После настройки переменных среды и развертывания прокси-сервера приложение будет использовать Yandex SpeechKit для синтеза речи с автоматическим fallback на браузерный синтез при ошибках.