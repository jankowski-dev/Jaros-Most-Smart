# AGENTS.md — карта проекта «Ярик.Уроки»

Этот файл — короткая точка входа для человека и ИИ-агента, который впервые открыл репозиторий. Он описывает **текущее** состояние и правила работы. Большой дизайн следующей версии лежит в `docs/superpowers/specs/2026-11-26-robot-spider-redesign-design.md`.

> Если ты агент: сначала прочитай этот файл, затем дизайн-док 3.0. Не начинай менять UI, пока не понял, в какой фазе находится редизайн.

---

## 1. Что это

Персональная обучающая PWA для семилетнего Ярика:

- **Математика** — примеры на сложение (лёгкий) и сложение/вычитание (сложный).
- **Чтение** — слоги, слова и фразы с озвучкой и подсветкой букв.
- **Тест на слух** — ребёнок слышит слово и выбирает один из трёх вариантов.
- **PWA** — устанавливается на телефон/планшет, работает офлайн после первой загрузки.
- **Озвучка** — Yandex SpeechKit через прокси на Railway; при ошибке — браузерный Web Speech API.

Пользователь один. Аккаунтов, сервера с прогрессом и аналитики нет. Прогресс (в версии 3.0) хранится только в `localStorage`.

**Устройства:** главный — планшет 10″ (портрет и ландшафт, touch), второй — телефон, десктоп — очень редко. Проектируем tablet-first и touch-first; отдельного десктопного интерфейса нет.

## 2. Быстрый старт

```bash
npm install
npm start          # http://localhost:3000
```

Без ключей Yandex приложение работает: `speech-service.js` уйдёт в браузерный fallback. Для полноценной озвучки нужны переменные из `.env.example`.

```bash
npm run dev        # nodemon для speech-proxy.js
npm run build:css  # Tailwind -> styles.css (минифицированный)
npm run watch:css  # пересборка стилей при изменениях
npm test           # сейчас заглушка; в 3.0 — node --test
node update-version.js 3.0
```

### Переменные среды

Смотри `.env.example`. Ключевые:

- `SPEECH_ENGINE=browser|yandex`
- `YANDEX_SPEECH_API_KEY`, `YANDEX_SPEECH_FOLDER_ID`
- `YANDEX_VOICE`, `YANDEX_EMOTION`, `YANDEX_SPEED`
- `SPEECH_FALLBACK=true`, `SPEECH_DEBUG=false`

На Railway фронтенд и прокси живут на одном origin, поэтому `proxyUrl` по умолчанию — `/api/tts`.

## 3. Карта файлов (текущая)

| Файл | Ответственность |
|---|---|
| `index.html` | Вся разметка: главная, урок, тест, настройки-заглушка, лоадер, баннер обновления |
| `app.js` | Вся логика: навигация, математика, чтение, тест, таймеры, озвучка, статистика. 1669 строк, глобальное состояние |
| `data.js` | Массивы слов/фраз, примеров, тестовых слов, фразы похвалы |
| `config.js` | `window.APP_VERSION`, `window.appConfig.speech`, чтение env |
| `speech-service.js` | Класс `SpeechService`, Yandex TTS, браузерный TTS, прогресс озвучки, `window.speechService` |
| `update-notifier.js` | Регистрация SW, проверка `/api/version`, баннер обновления |
| `sw.js` | Service Worker: network-first, офлайн-кэш |
| `speech-proxy.js` | Express: статика, `/health`, `/api/info`, `/api/version`, `/api/tts`, CSP, CORS, rate limit |
| `src/input.css` | Исходник Tailwind 4: тема, компоненты, адаптив, анимации |
| `styles.css` | **Сгенерированный** минифицированный CSS. Не редактировать вручную |
| `fonts/` | Локальные Montserrat woff2 — офлайн |
| `update-version.js` | Обновляет версию в `config.js`, `sw.js`, `speech-proxy.js` |
| `manifest.json` | PWA-манифест |
| `docs/superpowers/specs/` | Дизайн-доки |
| `background.jpg` | Не используется в UI. В 3.0 удалить |

### Целевая структура 3.0

Подробно — в дизайн-доке. Кратко:

```
index.html
src/input.css + src/styles/*.css
js/main.js, router.js, store.js, speech.js, content.js, timer.js
js/ui/{icons,mascot,toast,dialog,confetti}.js
js/screens/{home,math,reading,test,result,progress,settings}.js
config.js, speech-service.js, update-notifier.js, sw.js
```

`app.js` и `data.js` в 3.0 исчезают. Старые `config.js`, `speech-service.js`, `update-notifier.js` остаются классическими скриптами; новый код — ES-модули.

## 4. Как устроено сейчас

### Навигация

- Одна страница, четыре блока `.page` (`home-page`, `lesson-page`, `test-page`, `settings-page`).
- Переключение — вручную через `style.display` и класс `.active`.
- Лоадер искусственно показывается 500–700 мс при каждом переходе.
- URL не меняется; кнопка «назад» браузера не используется.

### Состояние

- Глобальные `let` в `app.js`: `currentSubject`, `currentLevel`, `voiceEnabled`, `mathProblems`, `currentWords`, `testQuestions` и т.д.
- Прогресс не сохраняется: после перезагрузки всё начинается заново.
- `localStorage` используется только в `update-notifier.js` для версии обновления.

### Данные

- `syllablesEasy` — `{ word: 'СО-БА-КА' }`, дефис является разметкой слогов.
- `syllablesHard` — `{ phrase: 'Девочка рисует' }`.
- `additionEasy`, `subtractionEasy` — генерируются циклами 0..10.
- `testWords` — `{ word, options: [correct, similar1, similar2] }`.
- `levelNames = { 1: 'Легкий', 2: 'Сложный' }`.

В 3.0 формат чтения меняется на `{ text, syllables }`, чтобы дефис не был разметкой, а фразы с дефисом не ломались.

### Озвучка

1. `speakText()` в `app.js` проверяет `window.speechService.isEnabled()`.
2. Если доступен Yandex — `speechService.speak()`; при ошибке `SpeechService` сам делает fallback на браузер.
3. Если Yandex выключен — `fallbackSpeakText()` в `app.js`.
4. `onProgress(0..1)` используется для синхронной заливки букв: Yandex — `audio.currentTime`, браузер — `onboundary` или оценка по времени.
5. При смене экрана `stopAllSpeech()` отменяет речь и анимацию.

**Правило:** любая новая озвучка должна отменяться при уходе с экрана и не блокировать интерфейс.

### PWA и обновления

- `sw.js` кэширует явный список `ASSETS_TO_CACHE`, сеть в приоритете, кэш — fallback.
- `update-notifier.js` на localhost **отключает** Service Worker (иначе разработка видит старый кэш). На Railway регистрирует `/sw.js`.
- `/api/version` сейчас возвращает `mtime` файла `app.js`. **Важно:** после удаления `app.js` в 3.0 нужно переключить endpoint на стабильную версию (например, `package.json`/`config.js`) и обновить `update-version.js`.
- Баннер обновления ожидает ID: `update-banner`, `update-btn`, `update-text`, `update-progress-container`, `update-progress-bar`. Сохраняй их при редизайне.
- `styles.css` кэшируется; после изменения стилей нужен `npm run build:css` и bump версии.

## 5. Правила для изменений

### Стили

- `styles.css` — артефакт. Меняй `src/input.css` (и будущие `src/styles/*.css`), затем `npm run build:css`.
- Tailwind 4. Не добавляй CDN и вторую CSS-систему.
- Не используй inline-скрипты: CSP в `speech-proxy.js` — `script-src 'self'`.
- Inline-стили допустимы (`style-src 'unsafe-inline'`), но лучше классы.
- Новые классы в JS-шаблонах должны попадать в сканирование Tailwind; в 3.0 добавить `@source "./js/**/*.js"`.

### JavaScript

- Новый код 3.0 — ES-модули, без глобальных переменных, кроме моста к `config.js`/`speech-service.js`.
- Каждый экран возвращает `destroy()` и очищает таймеры, слушатели, озвучку.
- Не храни DOM-узлы между рендерами.
- Числа/примеры — через чистые функции, чтобы их можно было тестировать.
- Пользовательские строки (имя) экранировать при вставке в HTML.
- Не добавляй фреймворки без явного решения: выбран vanilla JS + Tailwind.

### Контент

- Новые слова чтения: `{ text, syllables }`; для фраз `syllables: null`.
- Новые тестовые слова: ровно один правильный вариант, 2 похожих дистрактора.
- Новые примеры: ответ обязателен, для вычитания результат ≥ 0.
- Тон: дружелюбный, без стыда и сарказма. Обращение — по имени, не «малыш».

### Версии и кэш

- Версия приложения: `window.APP_VERSION` в `config.js`, `package.json`, `sw.js` `CACHE_NAME`, `/api/info` в `speech-proxy.js`.
- `node update-version.js 3.0` обновляет `config.js`, `sw.js`, `speech-proxy.js`; `package.json` обновить вручную.
- Меняешь список файлов — обнови `ASSETS_TO_CACHE` в `sw.js` и bump `CACHE_NAME`.
- Не проверяй SW-кэш на localhost: он специально отключён.

## 6. Проверка перед коммитом

Минимум:

```bash
npm run build:css
npm test
```

Ручной smoke:

- [ ] Главная открывается, все три предмета кликаются.
- [ ] Математика: ввод цифр, проверка, следующий пример, завершение.
- [ ] Чтение: озвучка, повтор, назад/далее, завершение.
- [ ] Тест: озвучка, варианты, правильный/неправильный ответ, завершение.
- [ ] Настройки: звук, сложность, тема, имя, сброс.
- [ ] Прогресс сохраняется после перезагрузки.
- [ ] 800×1280 и 1280×800 (планшет, обе ориентации), 320 / 390 (телефон), 1024 / 1440 (десктоп) — нет горизонтального скролла.
- [ ] Клавиатура и focus-visible.
- [ ] `prefers-reduced-motion`.
- [ ] Офлайн после первой загрузки.
- [ ] Консоль без ошибок.

## 7. Известные ловушки

- **SW на localhost отключён** — не пугайся, что обновления не применяются локально.
- **`/api/version` завязан на `app.js`** — после рефакторинга это надо исправить, иначе баннер обновления сломается.
- **CSP без inline-скриптов** — новые скрипты только внешними файлами/module.
- **Tailwind не видит классы в строках, если файл не сканируется** — добавь `@source`.
- **Пути и регистр** — Railway/Linux чувствителен к регистру; проверяй импорты.
- **Шрифты локальные** — не заменяй на Google Fonts, иначе офлайн и CSP.
- **`update-notifier.js` ищет конкретные ID** — не переименовывай баннер без правки нотифаера.
- **Незакоммиченные изменения** — в рабочей папке могут быть правки пользователя/предыдущей сессии. Не удаляй и не перезаписывай их без понимания.
- **`docs/` раздаётся статикой** — дизайн-доки доступны по URL; если это нежелательно, закрой `/docs` в `speech-proxy.js`.
- **Rate limit TTS 30 req/min** — при отладке озвучки можно упереться.

## 8. Документация

- Дизайн 3.0: `docs/superpowers/specs/2026-11-26-robot-spider-redesign-design.md`
- План реализации 3.0: `docs/superpowers/plans/2026-11-26-robot-spider-redesign.md`
- Предыдущее изменение: `docs/superpowers/specs/2026-09-15-word-fill-animation-design.md`
- README: обзор проекта и запуск.

При изменении архитектуры, маршрутов, схемы прогресса или команд обновляй этот файл в том же изменении.
