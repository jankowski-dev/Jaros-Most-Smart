# Ярик.Уроки — уроки с Байтом

Персональная обучающая PWA для семилетнего Ярика:

- **Математика** — сложение до 10 и примеры до 20 с вычитанием.
- **Чтение** — слоги, слова и фразы с озвучкой и синхронной заливкой букв.
- **Тест на слух** — слово скрыто плитками `?`, нужно выбрать один из трёх вариантов.
- **Прогресс** — XP, уровни, звёзды, серия дней, бейджи и история занятий.
- **Байт** — робо-паук, который здоровается, подсказывает и радуется успехам.
- **Светлая и тёмная темы**, настройки имени, звука и сложности.
- **Офлайн-PWA** — устанавливается на планшет и телефон, работает без сети после первой загрузки.

Главный девайс — планшет 10″ (портрет и ландшафт), второй — телефон. Интерфейс
проектировался tablet-first и touch-first; отдельной десктопной версии нет.

## Стек

- Vanilla JavaScript (ES-модули), без React и фреймворков.
- Tailwind CSS 4 + локальный Montserrat.
- Express 4: статика и прокси Yandex SpeechKit.
- Service Worker / PWA.
- Node `node:test` для чистой логики.

## Быстрый старт

```bash
npm install
npm start          # http://localhost:3000
```

Без ключей Yandex приложение работает: озвучка уходит в браузерный Web Speech API.

```bash
npm run dev        # nodemon для speech-proxy.js
npm run build:css  # Tailwind -> styles.css
npm run watch:css  # пересборка стилей
npm test           # unit-тесты
```

## Переменные среды

Смотри `.env.example`. Ключевые:

```env
SPEECH_ENGINE=yandex        # или browser
YANDEX_SPEECH_API_KEY=...
YANDEX_SPEECH_FOLDER_ID=...
YANDEX_VOICE=alena
YANDEX_EMOTION=good
YANDEX_SPEED=1.0
SPEECH_FALLBACK=true
SPEECH_DEBUG=false
```

На Railway фронтенд и прокси живут на одном origin, поэтому `proxyUrl` по
умолчанию — `/api/tts`.

## Структура

```
index.html                  — app shell
src/input.css               — Tailwind + @theme
src/styles/                 — tokens, base, components, animations
styles.css                  — собранный CSS (не редактировать вручную)
js/main.js                  — bootstrap, роутер, контекст экранов
js/router.js                — hash-роутер
js/store.js                 — настройки, прогресс, XP, серия, бейджи
js/content.js               — математика, чтение, тестовые слова
js/scoring.js               — оценки, звёзды, время
js/badges.js                — определения и условия бейджей
js/progress-utils.js        — последние 7 дней, точность, звёзды
js/timer.js                 — таймер сессии
js/speech.js                — Yandex + браузерный fallback
js/effects.js               — WebAudio-сигналы
js/theme.js / theme-init.js — тема без вспышки
js/word-fill.js             — заливка букв/плиток
js/ui/                      — иконки, Байт, тосты, диалоги, конфетти, app bar, nav
js/screens/                 — home, math, reading, test, result, progress, settings
dev/ui.html                 — превью дизайн-системы (не в PWA-кэше)
config.js                   — window.APP_VERSION, настройки речи
speech-service.js           — Yandex TTS и браузерный синтез
speech-proxy.js             — Express, /api/tts, /api/version, /health
sw.js                       — офлайн-кэш
manifest.json               — PWA
```

`app.js` и `data.js` удалены в 3.0.0.

## Маршруты

- `#/` — главная.
- `#/progress` — прогресс.
- `#/settings` — настройки.
- `#/play/math`, `#/play/reading`, `#/play/test` — занятия (открываются с главной).

## Прогресс и хранение

Два ключа `localStorage`:

- `yarik.uroki.settings.v1` — имя, звук, эффекты, сложность, тема.
- `yarik.uroki.progress.v1` — XP, уровень, серия, цель дня, предметы, бейджи, история.

«Сбросить прогресс» удаляет только прогресс, настройки остаются. Сервера и
аккаунтов нет: данные живут на устройстве.

## PWA и офлайн

- Service Worker кэширует явный список файлов из `sw.js`, сеть в приоритете.
- На `localhost` и `127.0.0.1` SW **специально отключён**, чтобы разработка не
  видела старый кэш. Для проверки офлайна используйте HTTPS-деплой или
  `http://yarik.localhost:3000` (Chrome считает `*.localhost` secure context).
- `/api/version` берёт версию из `package.json`; обновление показывается баннером.

## Тесты

```bash
npm test
npm run build:css
```

Unit-тесты покрывают контент, scoring, store, бейджи, роутер, темы, таймер и
progress-utils. UI проверяется вручную по чеклисту в `AGENTS.md`, в первую
очередь на 800×1280 и 1280×800.

## Документация

- Дизайн 3.0: `docs/superpowers/specs/2026-11-26-robot-spider-redesign-design.md`
- План реализации: `docs/superpowers/plans/2026-11-26-robot-spider-redesign.md`
- Карта для агентов и людей: `AGENTS.md`

## Версия

`3.0.0`. Иконки PWA пока прежние; замена на Байта — отдельная задача.
