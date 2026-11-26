# AGENTS.md — карта проекта «Ярик.Уроки 3.0»

Точка входа для человека и ИИ-агента. Описывает **текущее** состояние после редизайна 3.0.0. Дизайн и план лежат в `docs/superpowers/`.

> Если ты агент: прочитай этот файл, затем дизайн-док 3.0. Не меняй UI и схему прогресса, пока не понял архитектуру store/router/экранов.

---

## 1. Что это

Персональная обучающая PWA для семилетнего Ярика:

- математика: сложение до 10 (лёгкий), примеры до 20 с вычитанием (сложный);
- чтение: 20 карточек — слоги/слова или фразы;
- тест на слух: 10 слов, ребёнок слышит слово и выбирает из трёх вариантов;
- прогресс: XP, уровни, звёзды, серия дней, бейджи, история;
- маскот **Байт** — робо-паук;
- PWA: офлайн, установка, Yandex SpeechKit + браузерный fallback.

**Устройства:** главный — планшет 10″ (портрет 800×1280, ландшафт 1280×800, touch), второй — телефон, десктоп — редко. Проектируем tablet-first и touch-first; отдельного десктопного UI нет.

**Версия:** `3.0.0`.

## 2. Быстрый старт

```bash
npm install
npm start                 # http://localhost:3000
npm run build:css         # Tailwind -> styles.css
npm run watch:css         # пересборка стилей
npm test                  # node --test "tests/*.test.js"
npm run dev               # nodemon для speech-proxy.js
node update-version.js 3.0.0
```

`npm test` запускает Node-тесты из `tests/`. Новые модули в `js/` — ES-модули благодаря `js/package.json` (`"type":"module"`); корневой `package.json` остаётся CommonJS для `speech-proxy.js`. Тесты тоже ESM (`tests/package.json`).

### Переменные среды

Смотри `.env.example`: `SPEECH_ENGINE`, `YANDEX_SPEECH_API_KEY`, `YANDEX_SPEECH_FOLDER_ID`, `YANDEX_VOICE`, `YANDEX_EMOTION`, `YANDEX_SPEED`, `SPEECH_FALLBACK`, `SPEECH_DEBUG`.

## 3. Карта файлов

| Файл | Ответственность |
|---|---|
| `index.html` | App shell: `#view-root`, `#main-nav`, `#toast-root`, `#overlay-root`, баннер обновления, скрипты |
| `js/main.js` | Bootstrap: store, speech, effects, тема, роутер, guard выхода, контекст экранов |
| `js/router.js` | `parseRoute`, hash-роутер |
| `js/store.js` | Настройки/прогресс, XP, серия, ответы, время, сессии, сброс |
| `js/badges.js` | 10 бейджей и `evaluateBadges` |
| `js/content.js` | Массивы чтения, тестовые слова, генератор математики, похвала |
| `js/scoring.js` | `calculateGrade`, `calculateStars`, `formatTime` |
| `js/progress-utils.js` | 7 дней, точность, сумма звёзд |
| `js/timer.js` | `createSessionTimer`, `bindVisibilityPause` |
| `js/speech.js` | `createSpeech`: Yandex/браузер, отмена, прогресс |
| `js/effects.js` | WebAudio-сигналы правильно/ошибка |
| `js/theme.js` | `resolveTheme`, `applyTheme` |
| `js/theme-init.js` | Классический скрипт до paint: убирает вспышку темы |
| `js/word-fill.js` | Заливка `.word-letter` / `.test-char` / `.test-tile` |
| `js/ui/icons.js` | Встроенные SVG-иконки |
| `js/ui/mascot.js` | SVG Байта и состояния |
| `js/ui/toast.js` | Snackbar |
| `js/ui/dialog.js` | Подтверждение на `<dialog>` |
| `js/ui/confetti.js` | Конфетти |
| `js/ui/nav.js` | Bottom nav + rail |
| `js/ui/app-bar.js` | App bar урока и звук |
| `js/ui/html.js` | `escapeHtml`, `formatDate`, `pluralDays` |
| `js/screens/home.js` | Дашборд |
| `js/screens/math.js` | Математика, 10 заданий |
| `js/screens/reading.js` | Чтение, 20 карточек |
| `js/screens/test.js` | Тест на слух, 10 вопросов |
| `js/screens/result.js` | Общий экран завершения |
| `js/screens/progress.js` | Прогресс, бейджи, история |
| `js/screens/settings.js` | Настройки |
| `src/input.css` | Tailwind, `@theme`, `@source`, шрифты |
| `src/styles/*.css` | tokens/base/components/animations |
| `styles.css` | **Сгенерированный** CSS — не редактировать |
| `dev/ui.html` + `dev/ui.js` | Превью дизайн-системы, не в PWA-кэше |
| `config.js` | `window.APP_VERSION`, настройки речи |
| `speech-service.js` | Yandex TTS, браузерный TTS, прогресс |
| `speech-proxy.js` | Express, `/api/tts`, `/api/version`, `/health`, CSP/CORS |
| `sw.js` | Офлайн-кэш, network-first |
| `manifest.json` | PWA-манифест |
| `update-notifier.js` | Баннер обновления, регистрация SW |
| `update-version.js` | Версия в config/sw/package/speech-proxy |

`app.js`, `data.js`, `background.jpg` удалены.

## 4. Архитектура

### Роутер и экраны

Маршруты: `#/`, `#/progress`, `#/settings`, `#/play/math`, `#/play/reading`, `#/play/test`.

- `parseRoute(hash)` — чистая функция; неизвестное → home.
- `createRouter` слушает `hashchange`; `navigate(path, {replace})`.
- `main.js` хранит текущий экран. Экран — `render(container, ctx) -> { destroy, canLeave? }`.
- `ctx`: `{ store, route, navigate, startPlay, showToast, confirmDialog, speech, effects }`.
- Прямой заход на `#/play/*` без `startPlay` редиректит домой с тостом.
- `canLeave` вызывается роутером; если `false`, хэш восстанавливается через `history.replaceState`, экран остаётся.
- `destroy` обязан очистить таймеры, слушатели, озвучку, заливку.

### Store

`createStore({ storage, now })`. Ключи:

- `yarik.uroki.settings.v1` — `{ version, profile:{name}, settings:{sound,effects,difficulty,theme} }`.
- `yarik.uroki.progress.v1` — `{ version, xp, level, streak:{current,best,lastActiveDate,activeDays}, daily:{date,seconds,goalSeconds,goalBonusGiven,sessions}, subjects:{math,reading,test}, badges, history }`.

Ключевые методы:

- `getSettings()`, `getProgress()`, `updateSettings(partial)`.
- `getLevelInfo()` — `{ level, xpIntoLevel, xpForNext, totalXp }`.
- `recordAnswer({type,correct})` — сразу XP и `subjects[type].correct/total`; +10 за правильный.
- `beginReadingSession()`, `recordReadingCard(id)` — +2 XP за уникальную карточку сессии.
- `recordTime(seconds)` — цель дня, +20 XP один раз в день.
- `recordSession({type,correct,total,durationSec,stars,xpEarned})` — бонусы, история, серия, бейджи; возвращает `{bonusXp,badgeXp,levelUp,newBadges,dailyGoalReached,streak}`.
- `checkBadges()`, `getBadgeDefinitions()`, `resetProgress()`, `getStorageError()`.

XP: +10 ответ, +2 карточка, +5 завершение, +20 идеальная математика/тест, +10 первая сессия дня, +25 бейдж. Уровень = `floor(xp/100)+1`. Ошибки XP не отнимают.

Сброс прогресса не трогает настройки. Ошибки/битый JSON `localStorage` не роняют приложение: fallback в память + флаг `getStorageError()`.

### Контент

`js/content.js`:

- `readingEasy` / `readingHard` — `{ id, text, syllables }`; `syllables: null` для фраз.
- `testWords` — `{ id, word, options:[word,distractor,distractor] }`.
- `generateMathProblems(level, count, rng)` — easy: `+` до 10; hard: `+/-` до 20 без отрицательных.
- `praise`, `support` — короткие фразы.

Добавляя карточку чтения, не используй дефис как разметку: передавай `syllables` массивом. Добавляя тест, проверь ровно один правильный вариант.

### Озвучка и эффекты

- `js/speech.js` — обёртка над `window.speechService` (Yandex) и `window.speechSynthesis`.
- `isSoundEnabled` читает настройку в момент вызова.
- При ошибке Yandex — браузерный fallback; ошибка не должна блокировать экран.
- Всегда отменяйте речь при смене карточки/экрана (`ctx.speech.cancel()`).
- `onProgress(0..1)` — заливка букв/плиток.
- `js/effects.js` — WebAudio beeps, `AudioContext` лениво, ошибки глотаются.
- Настройки sound/effects — отдельные переключатели.

### Тема и стили

- `@theme` в `src/input.css` содержит светлые `--color-*`; `.dark` в `src/styles/tokens.css` переопределяет.
- Tailwind utilities: `bg-surface`, `text-ink`, `border-line`, `text-primary-strong`, `shadow-soft`, `rounded-card`.
- Компоненты: `.btn`, `.card`, `.chip`, `.segmented`, `.switch`, `.keypad`, `.word-card`, `.test-option`, `.lesson-grid`, `.bottom-nav`, `.nav-rail` и т.д.
- `styles.css` — артефакт `npm run build:css`. **Не редактировать вручную.**
- `@source` смотрит `../js/**/*.js` и `../dev/**/*.{html,js}`; новые классы в JS должны попадать в сканирование.
- Никаких inline-скриптов: CSP `script-src 'self'`.
- Шрифты локальные; не подключать Google Fonts.
- `prefers-reduced-motion` отключает анимации.

### Навигация и адаптив

- Телефон — нижняя панель; планшет — плавающая pill-панель; десктоп с мышью — rail (CSS media `hover:hover` + `pointer:fine`).
- Фокус-режим занятия: `body.focus-mode`, навигация скрыта.
- Планшет-ландшафт: `.lesson-grid` 7/5 (задание/управление); портрет — вертикально.
- Основные проверки: 800×1280, 1280×800, 390, 320.

## 5. Тесты и проверка

```bash
npm test
npm run build:css
```

Unit-тесты: `content`, `scoring`, `store`, `badges`, `router`, `theme`, `timer`, `progress-utils`.

Ручной smoke:

- [ ] Главная: приветствие, Байт, цель дня, серия, три предмета, переключатель сложности.
- [ ] Математика: 10 заданий, клавиатура/тач, правильный/неправильный фидбэк, back-confirm, результат, «Ещё раз».
- [ ] Чтение: автозвук, повтор, заливка, назад/далее, завершение частичное и 20/20, результат.
- [ ] Тест: 10 вопросов, плитки `?`, повтор, первый ответ, reveal, результат.
- [ ] Прогресс: уровень, серия, звёзды, бейджи, история; пустое состояние.
- [ ] Настройки: имя, звук, эффекты, сложность, тема, «Проверить озвучку», сброс прогресса.
- [ ] 800×1280, 1280×800, 390, 320: нет горизонтального скролла, всё читается.
- [ ] Тёмная тема и системная тема.
- [ ] Клавиатура, focus-visible, `prefers-reduced-motion`.
- [ ] Офлайн после первой загрузки на secure context.
- [ ] `/api/version` и `/api/info` показывают 3.0.0.
- [ ] Консоль без неожиданных ошибок (кроме сетевого 500 от TTS без ключа — это fallback).

## 6. PWA, версии, кэш

- `CACHE_NAME = 'yarik-uroki-v3.0.0'`; список файлов в `sw.js` обновлять при добавлении/удалении JS.
- Не кэшировать `dev/` и `docs/`.
- `update-version.js 3.0.0` обновляет `config.js`, `package.json`, `sw.js`, `/api/info`.
- `/api/version` читает `package.json`; после удаления `app.js` это обязательно.
- SW на `localhost`/`127.0.0.1` отключён в `update-notifier.js`. Для офлайна: HTTPS-деплой или `http://yarik.localhost:3000` (Chrome/Edge secure context; origin добавлен в CORS).
- `HIDDEN_FILES` в `speech-proxy.js` скрывает `package.json`, `README.md`, `AGENTS.md` и служебные файлы.
- `package-lock.json` синхронизировать через `npm install --package-lock-only`.

## 7. Как добавить

### Карточку чтения

В `js/content.js` добавить `{ id:'easy-XX', text:'РОБОТ', syllables:['РО','БОТ'] }` или `{ id:'hard-XX', text:'Робот чинит мотор', syllables:null }`. Проверить `npm test` (уникальные id, syllables.join === text).

### Тестовое слово

Добавить `['РОБОТ','РОБОТЫ','РОБОК']` в `testPairs`: первый — правильный, всего 3 уникальных варианта. Проверить `npm test`.

### Бейдж

Добавить в `BADGES` (`js/badges.js`) и условие в `evaluateBadges`. Если нужен счётчик — добавить поле в store и обновлять его. Проверить `tests/badges.test.js` и store-тесты.

### Экран

Создать `js/screens/name.js` с `render(container, ctx) -> { destroy, canLeave }`, добавить в `SCREENS`/`PLAY_SCREENS` в `js/main.js`, добавить пункт навигации при необходимости. Очистка обязательна.

## 8. Ловушки

- **`styles.css` — сгенерированный**: правки только в `src/`.
- **`js/package.json` type module**: не добавляй `require` в `js/`; корневой backend — CommonJS.
- **CSP без inline-скриптов**: только внешние файлы.
- **`@source`**: новые классы в JS должны сканироваться; после добавления классов — `npm run build:css`.
- **SW на localhost отключён**: не удивляйся отсутствию офлайна.
- **Пути и регистр**: Railway/Linux чувствителен; проверяй импорты.
- **Два ключа localStorage**: не смешивай настройки и прогресс; сброс прогресса не должен стирать настройки.
- **Озвучка**: всегда отменяй при смене экрана/карточки; не блокируй UI на ошибке.
- **`/api/version`**: теперь `package.json`; не возвращай mtime.
- **Баннер обновления**: ID `update-banner`, `update-btn`, `update-text`, `update-progress-container`, `update-progress-bar` обязательны.
- **`docs/` и `dev/`** раздаются статикой; не клади секреты.

## 9. Документация

- Дизайн 3.0: `docs/superpowers/specs/2026-11-26-robot-spider-redesign-design.md`
- План: `docs/superpowers/plans/2026-11-26-robot-spider-redesign.md`
- README: запуск и структура.
- Превью UI: `/dev/ui.html` после `npm start`.

При изменении архитектуры, маршрутов, схемы store или команд обновляй этот файл в том же изменении.
