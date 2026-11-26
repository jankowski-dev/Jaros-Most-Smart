# Robot-Spider Redesign 3.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать «Ярик.Уроки» в tablet-first дашборд с робо-пауком Байтом, прогрессом, XP/серией/бейджами и современным Material You-inspired интерфейсом, сохранив офлайн-PWA и озвучку.

**Architecture:** Vanilla JS ES-модули + Tailwind CSS 4, hash-роутер, экраны с `render/destroy/canLeave`, единый store на двух ключах `localStorage`, обёртка над существующим `speech-service.js`. Новый shell и экраны собираются инкрементально; старые `app.js`/`data.js` удаляются только после полной замены.

**Tech Stack:** JavaScript (ES2022 modules), Tailwind CSS 4, Express 4, Node 20+ test runner, Web Speech API / Yandex SpeechKit proxy, Service Worker/PWA.

**Spec:** `docs/superpowers/specs/2026-11-26-robot-spider-redesign-design.md`

---

## Preflight (перед Task 1)

- [ ] **Сохранить текущую грязную рабочую копию.** В репозитории уже есть незакоммиченные изменения (`app.js`, `config.js`, `index.html`, `styles.css`, `fonts/`, `src/` и др.). Не потерять их.
  - Показать владельцу `git status --short`.
  - С его согласия сделать WIP-коммит `chore: snapshot current app before 3.0` или `git stash push -u` с понятным сообщением.
  - Только после этого создавать ветку/ворктри через `superpowers:using-git-worktrees`.
- [ ] **Базовая проверка:** `npm install`, `npm run build:css`, `npm start`, открыть `http://127.0.0.1:3000/`. Зафиксировать, что текущее приложение работает.
- [ ] **Не менять `styles.css` вручную** и не удалять `fonts/` — они нужны офлайну.

---

## Global Constraints

- Никаких React/MUI/фреймворков и новых runtime-зависимостей. Только vanilla JS + Tailwind 4 + Express.
- Tablet-first: главный экран — 10″ планшет, портрет 800×1280 и ландшафт 1280×800; телефон 320–430; десктоп — редко и без отдельного UI.
- Все интерактивные зоны — минимум 44×44 px; основные кнопки 56–64 px; никаких действий только по hover.
- Маршруты: `#/`, `#/progress`, `#/settings`, `#/play/math`, `#/play/reading`, `#/play/test`.
- Длительность сессий: математика 10 заданий, чтение 20 карточек, тест 10 слов.
- XP: +10 за правильный ответ математики/теста, +2 за уникальную карточку чтения, +5 за завершение, +20 за идеальную математику/тест, +10 за первую завершённую сессию дня, +25 за бейдж.
- Звёзды: математика/тест — 3 при ≥90%, 2 при ≥70%, 1 за завершение; чтение — 3 за 20/20, 2 за ≥14, 1 за ≥1.
- Ключи хранилища: `yarik.uroki.settings.v1` и `yarik.uroki.progress.v1`. Сброс прогресса не трогает настройки.
- Никаких искусственных лоадеров; переходы мгновенные.
- Сохранить PWA/офлайн, network-first SW, Yandex TTS + браузерный fallback, отмену озвучки при уходе с экрана.
- `styles.css` — сгенерированный артефакт; исходники только в `src/`.
- CSP запрещает inline-скрипты: только внешние файлы и `type="module"`.
- Весь текст интерфейса — русский, тон дружелюбный, без стыда и сарказма.
- Версия релиза — `3.0.0`.
- Перед каждым коммитом: `npm test` (когда появится) и `npm run build:css` для UI-задач.

## Review Focus

Эти пять классов ошибок не покрываются одним очевидным тестом и чаще всего ломают реальное использование. Для каждого ниже указана задача, которая обязана его закрыть.

1. **Повреждённый/недоступный `localStorage` или quota error** — приложение всё равно должно загрузиться на дефолтах, не упасть и не потерять настройки. Тесты в Task 2.
2. **Двойной тап / быстрый переход во время фидбэка или озвучки** — не должно быть двойного XP, двойного ответа, оставшихся таймеров и говорящего динамика. Guard в Task 5, проверки в Task 9 и Task 11.
3. **Смена ориентации или скрытие вкладки посреди сессии** — таймер встаёт на паузу, раскладка не ломается, частичный прогресс не теряется. Тесты Task 8 + ручная проверка Task 13.
4. **Офлайн / ошибка Yandex TTS / rate limit** — браузерный fallback или мягкий тост, интерфейс не блокируется, нет unhandled rejection. Task 8 + Task 12.
5. **Длинное имя, длинная фраза, ширина 320 px** — текст переносится, имя экранируется, горизонтального скролла нет. Тест `normalizeName` в Task 2 + проверки Task 13.

---

## Task 1: Test Harness, Content, Scoring

**Files:**
- Modify: `package.json` (script `test`)
- Create: `js/package.json`, `tests/package.json`
- Create: `js/content.js`
- Create: `js/scoring.js`
- Test: `tests/content.test.js`, `tests/scoring.test.js`

**Interfaces:**
- Consumes: current data from `data.js` (read it, do not delete yet).
- Produces:
  - `readingEasy: ReadingCard[]`, `readingHard: ReadingCard[]`
  - `testWords: TestWord[]`
  - `generateMathProblems(level: 'easy' | 'hard', count = 10, rng = Math.random): MathProblem[]`
  - `praise: string[]`, `support: string[]`
  - `calculateGrade(correct: number, total: number): number` (1–10)
  - `calculateStars(type: 'math' | 'reading' | 'test', correct: number, total: number): 0 | 1 | 2 | 3`
  - `formatTime(seconds: number): string` (`HH:MM:SS`)
  - Types: `ReadingCard = { id: string, text: string, syllables: string[] | null }`, `TestWord = { id: string, word: string, options: [string, string, string] }`, `MathProblem = { num1: number, num2: number, operator: '+' | '-', answer: number }`.

- [ ] **Step 1: Add ESM test harness without changing the backend module type**

Root `package.json` must stay CommonJS because `speech-proxy.js` uses `require`. Add `js/package.json` and `tests/package.json` with `{"type":"module","private":true}`. Change the root test script to `"test": "node --test tests/"`.

Run: `npm test`
Expected: exit 0 with “0 tests” or a Node test summary; no “Cannot use import statement outside a module”.

- [ ] **Step 2: Write failing content tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readingEasy, readingHard, testWords, generateMathProblems, praise, support } from '../js/content.js';

test('reading cards have unique ids, text and coherent syllables', () => {
  const all = [...readingEasy, ...readingHard];
  assert.ok(all.length >= 50);
  assert.equal(new Set(all.map(c => c.id)).size, all.length);
  for (const card of all) {
    assert.ok(card.text.trim().length > 0);
    if (card.syllables) assert.equal(card.syllables.join(''), card.text.replace(/\s/g, ''));
  }
});

test('test words have exactly one correct option and two distractors', () => {
  assert.ok(testWords.length >= 30);
  for (const item of testWords) {
    assert.equal(item.options.length, 3);
    assert.equal(new Set(item.options).size, 3);
    assert.equal(item.options.filter(o => o === item.word).length, 1);
  }
});

test('themed robot/spider content exists', () => {
  const texts = [...readingEasy, ...readingHard].map(c => c.text.toUpperCase());
  assert.ok(texts.includes('РОБОТ'));
  assert.ok(texts.includes('ПАУК'));
  assert.ok(testWords.some(w => w.word === 'ПАУК'));
});

test('easy math stays within 10 and uses addition', () => {
  for (let i = 0; i < 100; i++) {
    for (const p of generateMathProblems('easy', 10)) {
      assert.equal(p.operator, '+');
      assert.ok(p.num1 >= 0 && p.num1 <= 10);
      assert.ok(p.num2 >= 0 && p.num2 <= 10);
      assert.equal(p.answer, p.num1 + p.num2);
    }
  }
});

test('hard math stays within 20 and never goes negative', () => {
  for (let i = 0; i < 100; i++) {
    for (const p of generateMathProblems('hard', 10)) {
      assert.ok(['+', '-'].includes(p.operator));
      assert.ok(p.num1 >= 0 && p.num1 <= 20);
      assert.ok(p.num2 >= 0 && p.num2 <= 20);
      assert.ok(p.answer >= 0);
      assert.equal(p.answer, p.operator === '+' ? p.num1 + p.num2 : p.num1 - p.num2);
    }
  }
});

test('praise and support are short non-empty strings', () => {
  assert.ok(praise.length >= 4);
  assert.ok(support.length >= 3);
  for (const line of [...praise, ...support]) assert.ok(line.length >= 3 && line.length <= 60);
});
```

- [ ] **Step 3: Write failing scoring tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGrade, calculateStars, formatTime } from '../js/scoring.js';

test('math/test star thresholds', () => {
  assert.equal(calculateStars('math', 10, 10), 3);
  assert.equal(calculateStars('math', 9, 10), 3);
  assert.equal(calculateStars('math', 8, 10), 2);
  assert.equal(calculateStars('math', 7, 10), 2);
  assert.equal(calculateStars('math', 6, 10), 1);
  assert.equal(calculateStars('test', 0, 10), 1);
});

test('reading star thresholds', () => {
  assert.equal(calculateStars('reading', 20, 20), 3);
  assert.equal(calculateStars('reading', 14, 20), 2);
  assert.equal(calculateStars('reading', 13, 20), 1);
  assert.equal(calculateStars('reading', 1, 20), 1);
  assert.equal(calculateStars('reading', 0, 20), 0);
});

test('grade scale stays 1..10', () => {
  assert.equal(calculateGrade(10, 10), 10);
  assert.equal(calculateGrade(9, 10), 9);
  assert.equal(calculateGrade(8, 10), 8);
  assert.equal(calculateGrade(1, 10), 1);
  assert.equal(calculateGrade(0, 0), 0);
});

test('formatTime pads and wraps hours', () => {
  assert.equal(formatTime(0), '00:00:00');
  assert.equal(formatTime(61), '00:01:01');
  assert.equal(formatTime(3661), '01:01:01');
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `js/content.js` / `js/scoring.js`.

- [ ] **Step 5: Implement `js/content.js`**

Copy the existing lists from `data.js` and convert:

- `syllablesEasy` → `readingEasy` with `{ id, text, syllables }`; split `СО-БА-КА` into `text: 'СОБАКА', syllables: ['СО','БА','КА']`.
- `syllablesHard` → `readingHard` with `syllables: null`.
- Add the robot/spider cards from spec §10.2 and test words from §10.3.
- `generateMathProblems`: easy = addition 0..10; hard = mixed addition/subtraction 0..20, subtraction result ≥ 0; return exactly `count` unique-ish problems, shuffled with `rng`.
- Add short praise/support lines from spec §10.4.

- [ ] **Step 6: Implement `js/scoring.js`**

Use the existing grade thresholds from `app.js` (`calculateGrade`). Stars as in Global Constraints. `formatTime` pads to two digits.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all Task 1 tests green.

- [ ] **Step 8: Commit**

```bash
git add package.json js/package.json tests/package.json js/content.js js/scoring.js tests/content.test.js tests/scoring.test.js
git commit -m "feat: add content model, scoring helpers and node tests"
```

---

## Task 2: Store Core — Settings, Answers, Time

**Files:**
- Create: `js/store.js`
- Test: `tests/store.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 (independent).
- Produces:
  - `SETTINGS_KEY`, `PROGRESS_KEY`, `DEFAULT_SETTINGS`, `DEFAULT_PROGRESS`
  - `createStore({ storage = null, now = () => new Date() } = {})` returning:
    - `getSettings(): SettingsState`
    - `getProgress(): ProgressState`
    - `updateSettings(partial): SettingsState`
    - `getLevelInfo(): { level: number, xpIntoLevel: number, xpForNext: number, totalXp: number }`
    - `recordAnswer({ type: 'math' | 'test', correct: boolean }): { xpGained: number, levelUp: boolean }`
    - `beginReadingSession(): void`
    - `recordReadingCard(cardId: string): { xpGained: number, isNew: boolean }`
    - `recordTime(seconds: number): { goalReached: boolean, bonusXp: number, levelUp: boolean }`
    - `resetProgress(): void`
    - `getStorageError(): boolean`
  - `normalizeName(value: string): string` exported for tests.

**Storage shape:** Use exactly the schema in spec §11.4. Add `daily.sessions: 0` if not present. Split settings and progress keys. Merge nested defaults when loading so old/partial data does not crash.

- [ ] **Step 1: Write failing store tests**

Create a helper in `tests/store.test.js`:

```js
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map)
  };
}
function fixedClock(iso) {
  let current = new Date(iso);
  return { now: () => new Date(current), set: (next) => { current = new Date(next); } };
}
```

Tests:

- `defaults when storage is empty` — name `Ярик`, difficulty `easy`, theme `system`, xp 0, level 1, all subjects zero.
- `settings and progress live under separate keys` — update name/theme, record answer; assert both keys exist and settings key has no xp.
- `normalizeName trims and caps` — `'  Ярик  '` → `'Ярик'`; `''` → `'Ярик'`; 25 chars → 20 chars.
- `recordAnswer adds xp and subject totals` — correct math +10, `correct=1,total=1`; wrong test +0, `total=1`.
- `level is computed from xp` — 10 correct math answers → 100 XP, level 2, `xpIntoLevel=0`, `xpForNext=100`.
- `reading cards count once per session` — `beginReadingSession()`, card A twice → first `{xpGained:2,isNew:true}`, second `{xpGained:0,isNew:false}`, `cardsRead=1`; new session, card A again → +2.
- `recordTime accumulates and gives goal bonus once` — 300 + 300 → goal at 600, bonus 20 once; further time no bonus.
- `daily resets on a new local date` — next day seconds 0, `goalBonusGiven=false`.
- `resetProgress keeps settings` — change name/theme, add XP, reset; settings unchanged, progress defaults.
- `corrupt storage falls back to defaults` — preload `'not json'`; store loads defaults, `getStorageError()===true`.
- `throwing storage keeps app usable` — storage methods throw; store works in memory, no throw.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `js/store.js` not found.

- [ ] **Step 3: Implement store core**

Details:

- Internal `settings` and `progress` objects; `saveSettings()`, `saveProgress()`.
- `storage === null` → memory-only mode.
- `readJson(key)` catches parse/get errors, sets `storageError = true`.
- `writeJson(key, value)` catches set errors, sets `storageError = true`.
- After loading progress, call `ensureDaily()` so the home screen never shows yesterday's daily ring.
- `normalizeName`: `String(value).trim().slice(0, 20) || 'Ярик'`.
- `updateSettings(partial)`: merge `profile`/`settings`; validate difficulty in `['easy','hard']`, theme in `['light','dark','system']`, booleans for `sound`/`effects`.
- `addXp(amount)` returns `{ xpGained, levelUp }`; updates `progress.xp`, `progress.level`.
- `recordAnswer` validates type; updates subject `correct/total`; correct → +10.
- `beginReadingSession`: `readingSeen = new Set()`.
- `recordReadingCard`: if seen, return 0; else add, `cardsRead++`, +2 XP.
- `recordTime`: `ensureDaily()` resets `daily` when date changes; adds seconds; if `seconds >= goalSeconds && !goalBonusGiven` → `goalBonusGiven = true`, `addXp(20)`, return `goalReached: true`.
- `resetProgress`: remove progress key, reset in-memory progress, clear `readingSeen`; keep settings.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, Task 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add js/store.js tests/store.test.js
git commit -m "feat: add persistent settings and progress store"
```

---

## Task 3: Store Sessions, Streak, Badges

**Files:**
- Create: `js/badges.js`
- Modify: `js/store.js`
- Test: `tests/badges.test.js`, extend `tests/store.test.js`

**Interfaces:**
- Consumes: `createStore` from Task 2.
- Produces:
  - `BADGES: BadgeDefinition[]` — `{ id, title, description }`
  - `evaluateBadges(progress: ProgressState): string[]` — ids of newly satisfied badges not already in `progress.badges`
  - `store.recordSession({ type, correct, total, durationSec, stars, xpEarned }): { bonusXp, badgeXp, levelUp, newBadges, dailyGoalReached, streak }`
  - `store.checkBadges(): { newBadges, badgeXp, levelUp }`
  - `store.getBadgeDefinitions(): BadgeDefinition[]`

**Badge definitions:** exactly the 10 from spec §9.6. Conditions:
`first-step` any `sessions > 0`; `streak-3`/`streak-7` current streak; `math-50` math.correct ≥ 50; `test-50` test.correct ≥ 50; `reader-100` reading.cardsRead ≥ 100; `perfect-math` history has math 10/10; `perfect-test` history has test 10/10; `all-subjects` all three sessions > 0; `level-5` level ≥ 5.

- [ ] **Step 1: Write failing badge/session tests**

Add to `tests/store.test.js`:

- `recordSession awards completion, first-session and perfect bonuses` — 10 correct math answers (100 XP), then `recordSession({type:'math', correct:10,total:10,durationSec:120,stars:3,xpEarned:100})` → `bonusXp=35`, `badgeXp=50`, `newBadges` contains `first-step` and `perfect-math`, `streak.current=1`, `daily.sessions=1`, `history[0].xp=135`, total XP `185` (100 + 35 + 50 badge XP).
- `same day second session skips first-session bonus` — after first session, a second **8/10** session `recordSession` gives `bonusXp=5` (no +10, no perfect).
- `perfect bonus is only for math and test` — reading 20/20 with `xpEarned=40` → `bonusXp` is 5 (+10 if first of day), never 20 more; no `perfect-reading` badge.
- `streak increments next day and resets after a gap` — session on day 1 → 1; day 2 → 2; skip to day 4 → 1, `best` stays 2.
- `history caps at 30` — 31 sessions → length 30, newest first.
- `badges unlock once and award 25 xp each` — first session unlocks; second session does not re-award; `checkBadges()` idempotent.
- `checkBadges on load awards pending badges` — progress with 50 math correct but no badge; `createStore` + `checkBadges` returns `math-50`, XP +25.

Add `tests/badges.test.js`:

- `badge definitions are complete and unique` — 10 ids, titles, descriptions.
- `evaluateBadges returns only newly satisfied ids` — construct progress objects for each condition.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `recordSession`/`badges` not defined.

- [ ] **Step 3: Implement `js/badges.js` and extend store**

- `BADGES` array with exact titles/descriptions from spec.
- `evaluateBadges(progress)` pure, no XP side effects.
- Store `recordSession`:
  1. `ensureDaily()`.
  2. Determine `firstOfDay = daily.sessions === 0`.
  3. `bonus = 5 + (firstOfDay ? 10 : 0) + (type !== 'reading' && correct === total && total > 0 ? 20 : 0)`.
  4. `addXp(bonus)`.
  5. Update subject `sessions++`, `lastPlayed`, `totalSeconds += durationSec`, `bestStars = max`.
  6. `daily.sessions++`.
  7. `markActiveDay()` — streak logic.
  8. `history.unshift({ type, date: now().toISOString(), correct, total, stars, durationSec: durationSec, xp: xpEarned + bonus })`; cap 30.
  9. `const badgeResult = checkBadges()`; add +25 per new badge.
  10. Return `{ bonusXp: bonus, badgeXp: badgeResult.badgeXp, levelUp: levelChanged || badgeResult.levelUp, newBadges: badgeResult.newBadges, dailyGoalReached: progress.daily.goalBonusGiven, streak: {...} }`.
- `checkBadges()` uses `evaluateBadges`, adds `badges[id] = date`, +25 XP each, returns `{ newBadges, badgeXp, levelUp }`.
- `markActiveDay()`: today local; if same — no change; if yesterday — +1; else 1; best max; activeDays add today, cap 30.
- `recordSession` must not call `checkBadges` recursively; keep it linear.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all store/badge tests green.

- [ ] **Step 5: Commit**

```bash
git add js/badges.js js/store.js tests/store.test.js tests/badges.test.js
git commit -m "feat: add sessions, streaks, history and badges"
```

---

## Task 4: Design Tokens, UI Primitives, Dev Preview

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/styles/animations.css`
- Modify: `src/input.css` (imports, `@theme`, `@custom-variant dark`, `@source`)
- Create: `js/ui/icons.js`, `js/ui/mascot.js`, `js/ui/toast.js`, `js/ui/dialog.js`, `js/ui/confetti.js`
- Create: `dev/ui.html`, `dev/ui.js`
- Rebuild: `styles.css`

**Interfaces:**
- Produces:
  - `icon(name: string, { size = 24, className = '' } = {}): string` (SVG markup)
  - `mascot(state: 'idle' | 'happy' | 'sad' | 'think' | 'sleep' | 'party', { className = '', size = 160 } = {}): string`
  - `showToast(message: string, { type = 'info', duration = 3200 } = {}): void`
  - `confirmDialog({ title, message, confirmText = 'Ок', cancelText = 'Отмена', danger = false }): Promise<boolean>`
  - `burstConfetti({ count = 80, duration = 1200 } = {}): void`
  - CSS variables/tokens from spec §6.1–6.3; component classes listed in spec §11.7.

- [ ] **Step 1: Build the dev preview page**

`dev/ui.html`: load `../styles.css` and `./ui.js` (module). Show:
- palette swatches, type scale, buttons (primary/tonal/ghost/danger), chips, segmented control, field, switch, cards, subject cards, stat tiles, stars, progress bar/ring.
- all mascot states.
- a toast trigger, confirm-dialog trigger, confetti trigger.
- icon grid.

`dev/ui.js` imports the primitives and wires the buttons.

- [ ] **Step 2: Implement tokens and base CSS**

- Define semantic Tailwind theme tokens `--color-bg`, `--color-surface`, `--color-ink`, `--color-primary`, etc. in an `@theme` block in `src/input.css` (after imports) with the light values from spec §6.1. Override the same variables under `.dark` in `tokens.css` with the dark values. This makes utilities like `bg-surface`, `text-ink`, `border-line` work and switch themes at runtime. Put radii, shadows, spacing, type scale, subject gradients in `tokens.css`. Do not create a second parallel set of color variable names.
- `base.css`: reset-ish base, body background, `font-variant-numeric`, focus-visible ring, `::selection`, safe-area helpers, `.app-shell`.
- `components.css`: all component classes from spec §11.7. Use `@layer components`.
- `animations.css`: `pulse`, `float`, `blink`, `pop`, `shake`, `fade-in`, `confetti-fall`, `mascot-party`; wrap large motion in `@media (prefers-reduced-motion: no-preference)`.
- `src/input.css`:

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/components.css";
@import "./styles/animations.css";

@source "../js/**/*.js";
@source "../dev/**/*.html";
@source "../dev/**/*.js";

@custom-variant dark (&:where(.dark, .dark *));
```

- Keep the local Montserrat `@font-face` rules.

- [ ] **Step 3: Implement UI primitives**

- Icons: inline SVG map; no external library. Include `home`, `chart`, `settings`, `plus`, `book`, `headphones`, `volume`, `volumeOff`, `rotate`, `x`, `arrowLeft`, `arrowRight`, `star`, `flame`, `lock`, `check`, `backspace`, `play`, `sun`, `moon`, `system`, `sparkles`.
- Mascot: inline SVG, states via different eyes/legs/mouth; `aria-hidden="true"` by default, accept `ariaLabel` if needed.
- Toast: appends to `#toast-root`; `role="status"`; auto-remove; max 3 visible.
- Dialog: native `<dialog>` in `#overlay-root`; `showModal()`, close on cancel/Esc; returns Promise<boolean>; restores focus.
- Confetti: DOM spans with CSS animation; no-op when `matchMedia('(prefers-reduced-motion: reduce)')` matches.

- [ ] **Step 4: Verify the design system**

Run: `npm run build:css`, `npm start`.
Open `http://127.0.0.1:3000/dev/ui.html`.
Expected: all components render; no console errors; dark toggle works; screenshot at 800×1280 and 1280×800 is readable; no horizontal scroll.

- [ ] **Step 5: Commit**

```bash
git add src/input.css src/styles js/ui dev styles.css
git commit -m "feat: add design system and UI primitives"
```

---

## Task 5: App Shell, Router, Home Skeleton

**Files:**
- Replace: `index.html`
- Create: `js/main.js`, `js/router.js`, `js/theme.js`, `js/theme-init.js`, `js/ui/nav.js`
- Create: `js/screens/home.js`, `js/screens/progress.js` (placeholder), `js/screens/settings.js` (placeholder), `js/screens/play-placeholder.js`
- Test: `tests/router.test.js`, `tests/theme.test.js`

**Interfaces:**
- Consumes: store (Task 2/3), UI primitives (Task 4).
- Produces:
  - `parseRoute(hash: string): Route` where `Route = { name: 'home'|'progress'|'settings'|'play', type?: 'math'|'reading'|'test' }`
  - `createRouter({ windowRef = window, onRoute }): { start(), stop(), navigate(path, { replace } = {}), currentHash() }`
  - `resolveTheme(theme: 'light'|'dark'|'system', prefersDark: boolean): 'light'|'dark'`
  - `applyTheme(theme): void`
  - Screen contract: `render(container, ctx) -> { destroy(): void, canLeave?(): boolean | Promise<boolean> }`
  - `ctx = { store, route, navigate, startPlay, showToast, confirmDialog }`
  - `startPlay(type)` sets the one-shot play guard and navigates to `#/play/<type>`.

**Shell:** `<main id="view-root">`, `<nav id="main-nav">`, `<div id="toast-root">`, `<div id="overlay-root">`, update banner with old IDs, no loader. Include `config.js`, `speech-service.js`, `js/theme-init.js` (head, classic), `js/main.js` (module), `update-notifier.js`. Remove `app.js`/`data.js` script tags.

- [ ] **Step 1: Write failing router/theme tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../js/router.js';
import { resolveTheme } from '../js/theme.js';

test('parseRoute maps known hashes', () => {
  assert.deepEqual(parseRoute('#/'), { name: 'home' });
  assert.deepEqual(parseRoute('#/progress'), { name: 'progress' });
  assert.deepEqual(parseRoute('#/settings'), { name: 'settings' });
  assert.deepEqual(parseRoute('#/play/math'), { name: 'play', type: 'math' });
  assert.deepEqual(parseRoute('#/play/reading'), { name: 'play', type: 'reading' });
  assert.deepEqual(parseRoute('#/play/test'), { name: 'play', type: 'test' });
});

test('parseRoute falls back home', () => {
  assert.deepEqual(parseRoute(''), { name: 'home' });
  assert.deepEqual(parseRoute('#/unknown'), { name: 'home' });
  assert.deepEqual(parseRoute('#/play/unknown'), { name: 'home' });
 });

test('resolveTheme respects system', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement router and theme**

- `parseRoute` normalizes trailing slashes; unknown → home.
- `createRouter` listens to `hashchange`; `onRoute(route, hash)`.
- `theme.js`: `resolveTheme`, `applyTheme` toggles `.dark` on `<html>`, sets `color-scheme` and `meta[name=theme-color]`.
- `theme-init.js`: classic IIFE, reads `yarik.uroki.settings.v1` in a `try/catch`, applies `.dark` before first paint; on any error defaults to light. No imports/exports.
- `nav.js`: renders bottom nav (phone/tablet) and rail (fine pointer desktop via CSS class/`matchMedia`). Three items; active state from route.
- `main.js`:
  - `createStore({ storage: window.localStorage })`.
  - If `store.getStorageError()` → `showToast('Не удалось прочитать сохранение. Начнём с чистого листа.')`; app continues.
  - `applyTheme`.
  - `const badges = store.checkBadges(); badges.newBadges.forEach(id => showToast(...))`.
  - Route table; play guard:
    - `allowedPlay` variable; `startPlay(type)` sets it then navigates.
    - On route play, if `allowedPlay !== type` → `navigate('#/', {replace:true})` + toast.
    - Leaving play clears `allowedPlay`.
  - Render screen; store `{ destroy, canLeave }`. On navigation, if `canLeave` exists, await it; if false, restore previous hash with `history.replaceState(null, '', '#' + previousHash)` and abort.
  - Ignore hash changes while `isNavigating`.
- Home screen (Task 5 version):
  - Greeting with escaped name; date.
  - Hero with mascot idle, daily ring, streak.
  - Difficulty segmented; on change `store.updateSettings` and update label.
  - Three subject cards with last results from `store.getProgress().subjects`; click → `ctx.startPlay(type)`.
  - Mini progress: level bar, stars, recent badges.
  - Links to progress/settings.
  - Empty state.
- Progress/settings placeholders: title + “Скоро” + mascot; settings link back.
- Play placeholder: title + “Урок скоро появится” + back.

- [ ] **Step 4: Verify the shell**

Run: `npm run build:css`, `npm test`, `npm start`.
Open `http://127.0.0.1:3000/`.
Expected: new home renders; nav works; `#/progress` and `#/settings` show placeholders; direct `#/play/math` redirects home with toast; home subject card opens placeholder; no console errors; update banner markup still has expected IDs; no artificial loader.

- [ ] **Step 5: Commit**

```bash
git add index.html js/main.js js/router.js js/theme.js js/theme-init.js js/ui/nav.js js/screens tests/router.test.js tests/theme.test.js
git commit -m "feat: add app shell, hash router and home dashboard skeleton"
```

---

## Task 6: Settings Screen

**Files:**
- Modify: `js/screens/settings.js`
- Modify: `js/main.js` if theme watcher needs wiring
- Test: existing store tests cover persistence; add `resolveTheme` tests already in Task 5

**Interfaces:**
- Consumes: `store.getSettings()`, `store.updateSettings()`, `store.resetProgress()`, `applyTheme`, `confirmDialog`, `showToast`, `icon`, `mascot`.
- Produces: full settings screen.

**Settings sections:** profile name; sound; effects; difficulty; theme; reset progress; about/version.

- [ ] **Step 1: Implement the settings form**

- Name input: `value` from settings, maxlength 20, save on blur/Enter; `store.updateSettings({ profile: { name } })`; show toast “Сохранено”.
- Sound toggle → `store.updateSettings({ settings: { sound } })`; affects speech wrapper later (Task 8 reads it at call time).
- Effects toggle → `effects`.
- Difficulty segmented → `difficulty`; persists.
- Theme segmented → `theme`; call `applyTheme()` immediately; listen to `prefers-color-scheme` when theme is `system`; clean up on destroy.
- Reset: danger button → `confirmDialog({ title:'Сбросить прогресс?', message:'XP, уровень, серия, бейджи и история исчезнут. Имя, тема, звук и сложность останутся.', confirmText:'Сбросить', danger:true })`; if true → `store.resetProgress()`, `showToast('Прогресс сброшен')`, re-render home via `navigate('#/')`.
- About: `window.APP_VERSION`, “Сделано для Ярика”, mascot.

- [ ] **Step 2: Verify**

`npm run build:css`, `npm start`.
Open `#/settings` at 800×1280 and 1280×800.
Check: name saves after reload; theme switches instantly and persists; difficulty persists; reset asks and keeps name/theme/sound/difficulty; no console errors.

- [ ] **Step 3: Commit**

```bash
git add js/screens/settings.js js/main.js
git commit -m "feat: build settings screen with theme and reset"
```

---

## Task 7: Progress Screen

**Files:**
- Create: `js/progress-utils.js`
- Modify: `js/screens/progress.js`
- Test: `tests/progress-utils.test.js`

**Interfaces:**
- Consumes: `store.getProgress()`, `store.getLevelInfo()`, `store.getBadgeDefinitions()`, `mascot`, `icon`.
- Produces:
  - `getLast7Days(activeDays: string[], now: Date): { date: string, label: string, active: boolean }[]`
  - `getAccuracy(subject: { correct: number, total: number }): number` (0–100, 0 when total 0)
  - `getTotalStars(progress: ProgressState): number`

- [ ] **Step 1: Write failing progress-utils tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLast7Days, getAccuracy, getTotalStars } from '../js/progress-utils.js';

test('last 7 days marks active dates', () => {
  const days = getLast7Days(['2026-11-20', '2026-11-26'], new Date('2026-11-26T12:00:00'));
  assert.equal(days.length, 7);
  assert.equal(days.at(-1).date, '2026-11-26');
  assert.equal(days.at(-1).active, true);
  assert.equal(days.at(-7).date, '2026-11-20');
  assert.equal(days.at(-7).active, true);
});

test('accuracy rounds and handles zero', () => {
  assert.equal(getAccuracy({ correct: 8, total: 10 }), 80);
  assert.equal(getAccuracy({ correct: 0, total: 0 }), 0);
  assert.equal(getAccuracy({ correct: 1, total: 3 }), 33);
});

test('total stars sums best stars', () => {
  const progress = { subjects: { math: { bestStars: 3 }, reading: { bestStars: 2 }, test: { bestStars: 1 } } };
  assert.equal(getTotalStars(progress), 6);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement progress utils and screen**

- Utility functions pure; local date keys.
- Progress screen:
  - Header with mascot `happy`.
  - Level card: level, XP bar `xpIntoLevel/xpForNext`, total XP.
  - Streak card: current/best, 7 dots from `getLast7Days`.
  - Stars card: total.
  - Three subject cards: math/test accuracy + best stars; reading cardsRead + sessions.
  - Badges grid: all definitions; unlocked colored, locked grey with lock and condition; title tooltip/`title` attribute.
  - History list: last 10 from `progress.history`, date formatted `ru-RU`, type label, result, stars.
  - Empty state with mascot `sleep` and CTA to home.
  - All text wraps at 320.

- [ ] **Step 4: Verify**

Seed data for screenshot via browser devtools `localStorage` (or play a session later). Check 800×1280 and 1280×800; empty state; no console errors.

- [ ] **Step 5: Commit**

```bash
git add js/progress-utils.js js/screens/progress.js tests/progress-utils.test.js
git commit -m "feat: build progress screen with badges and history"
```

---

## Task 8: Session Timer, Speech Adapter, Sound Effects, Voice Test

**Files:**
- Create: `js/timer.js`, `js/speech.js`, `js/effects.js`
- Modify: `js/main.js` (create speech/effects, pass in ctx), `js/screens/settings.js` (add “Проверить озвучку”)
- Test: `tests/timer.test.js`

**Interfaces:**
- Consumes: `window.speechService`, `window.speechSynthesis`, `window.createBrowserProgressTracker`, store sound/effects settings.
- Produces:
  - `createSessionTimer({ now = () => Date.now(), setIntervalFn = setInterval, clearIntervalFn = clearInterval, onTick = () => {} } = {})` → `{ start(), pause(), resume(), stop(), getSeconds() }`
  - `bindVisibilityPause(timer, doc = document): () => void`
  - `createSpeech({ isSoundEnabled, service = window.speechService, synth = window.speechSynthesis } = {})` → `{ speak(text, { isWord, onProgress } = {}): Promise<void>, cancel(): void, isEnabled(): boolean }`
  - `createEffects({ isEnabled = () => true } = {})` → `{ correct(): void, wrong(): void, unlock(): void }` — WebAudio beeps, lazy `AudioContext`, no-op when disabled.

- [ ] **Step 1: Write failing timer tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionTimer } from '../js/timer.js';

test('timer starts, ticks, pauses and resumes', () => {
  let t = 0;
  let tick = null;
  const timer = createSessionTimer({
    now: () => t,
    setIntervalFn: (fn) => { tick = fn; return 1; },
    clearIntervalFn: () => { tick = null; }
  });
  timer.start();
  t = 2500; tick();
  assert.equal(timer.getSeconds(), 2);
  timer.pause();
  t = 5000; assert.equal(timer.getSeconds(), 2);
  timer.resume();
  t = 6500; tick();
  assert.equal(timer.getSeconds(), 4);
  timer.stop();
  assert.equal(timer.getSeconds(), 4);
});
```

Add a visibility test with a fake `EventTarget` + `hidden` property:

```js
const doc = new EventTarget();
doc.hidden = false;
const calls = [];
const timer = { pause: () => calls.push('pause'), resume: () => calls.push('resume') };
const unbind = bindVisibilityPause(timer, doc);
doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
unbind();
assert.deepEqual(calls, ['pause', 'resume']);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `js/timer.js` missing.

- [ ] **Step 3: Implement timer and speech**

Timer as above; use accumulated milliseconds, not tick counting. `getSeconds` floors. `resume` only if paused; `start` idempotent.

Speech wrapper:
- `isEnabled()`: `isSoundEnabled()` AND (service enabled OR synth exists).
- `speak`: if disabled resolve; if service enabled → try `service.speak(text, { isWord, onProgress })`; on error fall back to browser.
- Browser fallback: cancel previous, create `SpeechSynthesisUtterance`, ru-RU, rate 0.8/0.9, pitch 1.1, volume 0.8/0.9; choose Russian voice; use `createBrowserProgressTracker` if available; resolve on end; reject on error.
- `cancel()`: `service?.cancel()`, `synth?.cancel()`.
- `effects.js`: create a lazy `AudioContext` on first correct/wrong; sine beeps (correct 800 Hz / 0.3 s, wrong 400 Hz / 0.5 s); resume if suspended; catch all errors. Respect `settings.effects`.
- `main.js`: create `speech` and `effects`, include both in `ctx`; both read the latest settings via callbacks.
- Settings: add “Проверить озвучку” button that speaks `«Привет, Ярик! Я Байт, твой робо-паук.»`; catch → toast.

- [ ] **Step 4: Run tests and manual speech check**

Run: `npm test` → PASS.
`npm start`, open settings, click “Проверить озвучку”. Without Yandex keys it must use browser voice; with keys — Yandex. Error must show toast, not console unhandled.

- [ ] **Step 5: Commit**

```bash
git add js/timer.js js/speech.js js/effects.js js/main.js js/screens/settings.js tests/timer.test.js
git commit -m "feat: add session timer, speech adapter and sound effects"
```

---

## Task 9: Math Lesson and Shared Result Screen

**Files:**
- Create: `js/screens/math.js`, `js/screens/result.js`, `js/ui/app-bar.js`
- Modify: `js/main.js` (route math to new screen)
- Remove/stop using: `js/screens/play-placeholder.js` for math (keep for reading/test until their tasks)

**Interfaces:**
- Consumes: `generateMathProblems` (Task 1), `calculateGrade`/`calculateStars`/`formatTime` (Task 1), store (Task 2/3), timer (Task 8), speech/effects (Task 8), UI primitives (Task 4).
- Produces:
  - `renderMath(container, ctx)` with `destroy`/`canLeave`
  - `renderResult(container, { ctx, type, correct, total, stars, grade, durationSec, xpEarned, bonusXp, badgeXp, startLevel, newBadges, onRestart, onHome })`
  - `renderAppBar({ title, subtitle = '', showBack = true, showSound = true }): string` — shared app bar markup with slots `[data-app-timer]`, `[data-app-sound]`, `[data-app-back]`
  - `bindAppBar(container, { onBack, store, showToast }): () => void` — wires back and sound toggle (updates `settings.sound`, swaps icon); returns cleanup.

**Behavior (spec §8.2, §8.5):**
- Shared app bar from `js/ui/app-bar.js`: back, title, level chip, timer slot, sound toggle. Sound toggle updates `settings.sound` and swaps volume/volume-off icon.

- 10 problems; explicit “Проверить”, no auto-submit.
- Keypad 3×4; keyboard digits/Backspace/Enter.
- Correct: +10 XP immediately via `store.recordAnswer`, `ctx.effects.correct()`, green feedback, Bait happy, next after 900 ms.
- Wrong: `ctx.effects.wrong()`, amber feedback with correct answer, next after 2000 ms.
- Timer chip small; flush time every 30 s and on exit; pause on hidden. If a flush returns `goalReached`, show toast “Цель дня выполнена! +20 XP”.
- Back/`canLeave`: if answered > 0 and not complete → confirm; on confirm flush time, no session completion.
- Completion: capture `startLevel` before the first answer; flush time; stars/grade; `const rewards = store.recordSession({ type:'math', correct, total:10, durationSec, stars, xpEarned })`; render result with `rewards.bonusXp`, `rewards.badgeXp`, `rewards.newBadges`, and `startLevel`.
- Result: confetti (unless reduced motion), mascot party, stars, `9 из 10`, grade chip, time, total session XP (`xpEarned + bonusXp + badgeXp`), “Новый уровень!” if `store.getLevelInfo().level > startLevel`, badge cards, “Ещё раз”/“На главную”. For `type === 'reading'`, title “Ты прочитал N карточек!”, no grade chip; for math/test, praise title and grade chip.
- Double-tap guard: `isChecking` disables keypad/check until next problem; ignore repeated Enter.
- Praise speech is fire-and-forget: catch rejection and never block the next problem.

- [ ] **Step 1: Implement result screen first**

Shared component with the fields above. Use `BADGES` titles for `newBadges`. Add confetti only on 2–3 stars or level-up? Spec says celebration; use confetti for 3 stars/level-up, milder for 1–2. Respect reduced motion.

- [ ] **Step 2: Implement math screen**

Use `ctx.store.getSettings().settings.difficulty` to call `generateMathProblems`. Render app bar, segmented progress (10), equation, answer slot, keypad, feedback, timer. Wire events with cleanup array. Ensure `destroy` clears timeouts, timer, visibility listener, speech. Ensure `canLeave` returns true when complete or no answers.

- [ ] **Step 3: Wire route and remove math placeholder**

`main.js` route `play` with `type === 'math'` → `renderMath`. Update home card if needed.

- [ ] **Step 4: Verify math**

Run `npm run build:css`, `npm test`, `npm start`.
Check on 800×1280 and 1280×800:
- 10 problems; keyboard and touch; correct/wrong feedback; sounds.
- Back after 1 answer asks; cancel stays; confirm leaves and keeps XP/correct totals.
- Complete 10/10 → 3 stars, perfect bonus, badges; result buttons work; replay; home shows updated XP/streak.
- Double-click Check does not double-score.
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add js/screens/math.js js/screens/result.js js/ui/app-bar.js js/main.js
git commit -m "feat: build math lesson and result screen"
```

---

## Task 10: Reading Screen

**Files:**
- Create: `js/screens/reading.js`, `js/word-fill.js`
- Modify: `js/main.js` (route reading to new screen)

**Interfaces:**
- Consumes: `readingEasy`/`readingHard` (Task 1), `calculateStars`/`formatTime` (Task 1), store `beginReadingSession`/`recordReadingCard`/`recordTime`/`recordSession` (Task 2/3), speech/timer (Task 8), result and `app-bar` (Task 9), UI primitives.
- Produces: `renderReading(container, ctx)` with `destroy`/`canLeave`.

**Behavior (spec §8.3):**
- Shared app bar (back, title, level, timer, sound toggle) from `js/ui/app-bar.js`.
- Pick 20 shuffled cards by difficulty; `store.beginReadingSession()` at start.
- Render word/phrase with syllables; vowels amber, consonants ink; phrase spaces preserved; no hyphen-as-syllable text.
- Auto-play on first display if sound; big “Послушать” button; replay; fill animation via `onProgress`; cancel previous speech on change.
- `recordReadingCard(card.id)` on first display; XP only once per session; accumulate `xpEarned`.
- On speech error: call `finish()`/reset fill, show a soft toast, keep navigating; never leave an unhandled rejection.
- Prev/next; keyboard arrows; progress `N / 20` and bar.
- Time flush every 30 s and on exit; timer pause on hidden; show toast when a flush reaches the daily goal.
- Finish button: capture `startLevel` at session start; if cardsRead ≥1 → stars + `recordSession({ type:'reading', correct: cardsRead, total: 20, durationSec, stars, xpEarned })` → result with `bonusXp`, `badgeXp`, `newBadges`, `startLevel`; if 0 → navigate home without session.
- Back/`canLeave`: if cardsRead ≥1 and not complete → confirm “Выйти? Прочитанные карточки сохранятся.” If confirmed, record partial session, then leave. If 0 → leave directly.
- `sessionRecorded` guard: `finishSession()` is idempotent; `canLeave`, the “Завершить” button and completion must not record twice.
- `destroy`: cancel speech, stop fill animation, timer, flush time, clear timeouts.

- [ ] **Step 1: Implement reading screen**

Render and wire. Reuse fill animation logic from `app.js` (`startFillAnimation`, `applyFill`, `stopFillAnimation`) but adapt to the new module; put it inside `js/screens/reading.js` or a small `js/word-fill.js` if reused by test. Since test also uses fill, create `js/word-fill.js` exporting `createWordFill(container)` with `setProgress`, `finish`, `cancel`. Add a small test? DOM-dependent; manual. Use in reading/test.

- [ ] **Step 2: Wire route and remove reading placeholder**

- [ ] **Step 3: Verify reading**

Check 800×1280 and 1280×800:
- 20 cards, auto-speech, fill animation, replay.
- Next/prev does not re-award XP.
- Exit at 12 cards asks; confirm shows result with 1 star and history; home reflects cardsRead.
- Finish at 20 → 3 stars.
- Speech cancel on back; no console errors.

- [ ] **Step 4: Commit**

```bash
git add js/screens/reading.js js/main.js js/word-fill.js
git commit -m "feat: build reading screen with card progress"
```

---

## Task 11: Listening Test Screen

**Files:**
- Create: `js/screens/test.js`
- Modify: `js/main.js` (route test to new screen)

**Interfaces:**
- Consumes: `testWords` (Task 1), `calculateStars`/`formatTime` (Task 1), store `recordAnswer`/`recordTime`/`recordSession` (Task 2/3), speech/timer (Task 8), result and `app-bar` (Task 9), UI primitives, `createWordFill` (Task 10).
- Produces: `renderTest(container, ctx)` with `destroy`/`canLeave`.

**Behavior (spec §8.4):**
- Shared app bar (back, title, timer, sound toggle) from `js/ui/app-bar.js`.
- 10 questions from `testWords`; options shuffled.
- Hidden word = `?` tiles by letter count; fill highlight during audio; reveal flip after correct.
- Big “Послушать” button; unlimited replays before answer; auto-play first after 400 ms. On speech error: reset fill, show soft toast, keep the question playable.
- First answer only: cancel speech/fill, disable options, `store.recordAnswer({ type:'test', correct })`, `ctx.effects.correct()/wrong()`, if wrong show correct option; reveal; next after 1.8 s.
- Timer chip; flush every 30 s and on exit; pause on hidden; show toast when a flush reaches the daily goal.
- Completion: capture `startLevel` before the first answer; stars/grade; `recordSession({ type:'test', correct, total:10, durationSec, stars, xpEarned })`; result with `bonusXp`, `badgeXp`, `newBadges`, `startLevel`.
- Back/`canLeave`: if answered > 0 and not complete → confirm; answers/XP already saved, no session completion.
- Double-tap guard: `isAnswered`; ignore option clicks after first.
- `destroy`: cancel speech, timers, timeouts.

- [ ] **Step 1: Implement test screen**

- [ ] **Step 2: Wire route and remove test placeholder**

- [ ] **Step 3: Verify test**

Check 800×1280 and 1280×800:
- 10 questions; replay button works; tiles `?`; fill during audio; correct reveals word; wrong shows correct; first answer determines score.
- Back after 2 answers asks; confirm leaves, XP/correct saved, no streak.
- Complete 10/10 → 3 stars; result; replay; home.
- No console errors; no double score.

- [ ] **Step 4: Commit**

```bash
git add js/screens/test.js js/main.js
git commit -m "feat: build listening test screen"
```

---

## Task 12: PWA, Version 3.0, Docs, Legacy Cleanup

**Files:**
- Modify: `sw.js`, `manifest.json`, `config.js`, `package.json`, `speech-proxy.js`, `update-version.js`, `README.md`, `AGENTS.md`
- Delete: `app.js`, `data.js`, `background.jpg`, `js/screens/play-placeholder.js` (after all three play screens are wired; verify no references)
- Rebuild: `styles.css`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: installable offline PWA at version 3.0.0, updated docs, no legacy runtime.

- [ ] **Step 1: Fix `/api/version` before deleting `app.js`**

In `speech-proxy.js`:
- Add `const pkg = require('./package.json');` near the top (package.json is already hidden from static).
- Replace the `fs.stat(app.js)` handler with:

```js
app.get('/api/version', (req, res) => {
  res.json({ version: pkg.version, buildTime: new Date().toISOString() });
});
```

- Remove unused `fs` import only if nothing else uses it.
- `update-version.js`: update `package.json` top-level version as well. Use a non-global replace of the first `"version": "..."` occurrence; do not touch dependency versions. Keep updating `config.js`, `sw.js`, `speech-proxy.js`.
- Run `node update-version.js 3.0.0`; verify `config.js`, `sw.js` (`yarik-uroki-v3.0.0`), `speech-proxy.js` `/api/info`, and `package.json` all show 3.0.0.
- Run `npm install --package-lock-only` to sync the root `package-lock.json` version.

- [ ] **Step 2: Update Service Worker cache**

- `CACHE_NAME = 'yarik-uroki-v3.0.0'`.
- Replace `ASSETS_TO_CACHE` with the new files:
  - `/`, `/index.html`, `/styles.css`, `/manifest.json`
  - `/config.js`, `/speech-service.js`, `/update-notifier.js`
  - `/js/main.js`, `router.js`, `store.js`, `content.js`, `scoring.js`, `badges.js`, `timer.js`, `speech.js`, `effects.js`, `theme.js`, `theme-init.js`, `progress-utils.js`, `word-fill.js`
  - `/js/ui/icons.js`, `mascot.js`, `toast.js`, `dialog.js`, `confetti.js`, `nav.js`, `app-bar.js`
  - `/js/screens/home.js`, `settings.js`, `progress.js`, `math.js`, `reading.js`, `test.js`, `result.js`
  - `/fonts/montserrat-cyrillic.woff2`, `/fonts/montserrat-latin.woff2`
  - `/icon.png`, `/icon-192.png`
- Do not cache `dev/` or docs.
- Keep network-first and offline fallback; update `offlineFallback` if needed.

- [ ] **Step 3: Update manifest and meta**

- `theme_color: "#F59E0B"`, `background_color: "#FFF8EE"`, description and name unchanged/updated.
- Add dark meta theme-color support in `theme.js` (already), ensure `index.html` has a default `theme-color`.
- Optional: replace icons with Bait; if not ready, keep current PNGs and note in README.

- [ ] **Step 4: Delete legacy runtime and verify references**

- Delete `app.js`, `data.js`, `background.jpg`, and `js/screens/play-placeholder.js`.
- Run `git grep -n "app.js\|data.js\|play-placeholder"` — allowed references only in docs/specs; fix code/config.
- Check `index.html` no longer references them.
- Check `speech-proxy.js` hidden file list still correct; add `AGENTS.md` to `HIDDEN_FILES` if you don’t want it served.
- Run `npm run build:css`, `npm test`, `npm start`.

- [ ] **Step 5: Update README and AGENTS.md**

README:
- What the app is, features (dashboard, Byte, XP/streak/badges, themes, tablet-first).
- Stack, commands, env vars, deployment, docs links.
- Note offline/speech modes and version 3.0.0.

AGENTS.md:
- New file map and responsibilities; routes; store API/schema; screen contract; speech; theme; tests; PWA/SW; pitfalls (`/api/version` now package.json, nested `js/package.json` type module, no inline scripts, SW disabled on localhost, Tailwind `@source`).
- How to add a reading card, test word, badge, or screen.
- Update manual smoke checklist to tablet-first.

- [ ] **Step 6: Verify PWA and version endpoints**

- `curl http://127.0.0.1:3000/api/version` → `{"version":"3.0.0",...}`.
- `curl http://127.0.0.1:3000/api/info` → version 3.0.0.
- Service Workers require a secure context. On plain `http://<LAN-IP>:3000` they will **not** register. Test offline on the deployed HTTPS Railway URL, or on `http://yarik.localhost:3000` — Chrome treats `*.localhost` as a secure context, and `update-notifier.js` only disables the exact hosts `localhost` and `127.0.0.1`.
- If you use `yarik.localhost`, add `http://yarik.localhost:3000` to `ALLOWED_ORIGINS` in `speech-proxy.js` so TTS POSTs with an Origin header are not rejected; on the deployed HTTPS URL this is not needed.
- Load once, switch to airplane mode, reload; all screens/assets work.
- On exact localhost, SW is intentionally disabled; do not test offline there.
- Check update banner still finds IDs and does not crash.

- [ ] **Step 7: Commit**

```bash
git add sw.js manifest.json config.js package.json speech-proxy.js update-version.js README.md AGENTS.md index.html styles.css
git add -A
git commit -m "chore: release 3.0.0 PWA, docs and remove legacy app"
```

(Use `git add -A` only after confirming no user changes are being swept in; run `git status` first.)

---

## Task 13: Final Verification and Acceptance

**Files:** fixes only; update docs if behavior changed.

- [ ] **Step 1: Automated checks**

Run:

```bash
npm test
npm run build:css
```

Expected: all tests pass; CSS builds without warnings/errors.

- [ ] **Step 2: Tablet-first visual smoke**

Open the app at 800×1280 and 1280×800 (portrait and landscape). Check:
- Home dashboard fills width, three subject cards, floating nav, hero + Byte; no huge empty bands.
- Math/reading/test in landscape use two-column layouts; portrait uses vertical; no clipped keypad/options.
- Progress and settings readable; badges grid; history.
- 390 and 320 px phone widths: no horizontal scroll; text wraps; controls reachable.
- Dark theme; system theme; reduced motion.

- [ ] **Step 3: Failure-mode checks**

- **Corrupt storage:** devtools → `localStorage.setItem('yarik.uroki.progress.v1','{bad')`; reload; app boots, toast/error, progress defaults; settings intact.
- **Storage blocked/quota:** if feasible, simulate by overriding `Storage.prototype.setItem` to throw; app remains usable. (Manual/devtools.)
- **Double tap:** math check and test option double-click; no double XP/answer.
- **Back/navigation during audio:** leave mid-word; speech stops; no console errors.
- **Orientation change/tab hidden:** start a session, rotate, hide tab; timer pauses and resumes; session continues.
- **Speech failure:** set `SPEECH_ENGINE=yandex` without keys or block `/api/tts`; app falls back or shows toast; no unhandled rejection.
- **Long name/phrase:** name 20 chars; hard reading phrase; 320 px width; no overflow.
- **Offline:** on the deployed HTTPS URL or `http://yarik.localhost:3000` (secure context), install/load, airplane mode, reload; app works; Yandex speech gracefully fails/fallback. Plain LAN HTTP will not register a SW.
- **Update banner:** ensure it appears when `/api/version` changes on a deployed-like origin; IDs intact.

- [ ] **Step 4: Accessibility and Lighthouse**

- Keyboard-only pass: Tab through nav, cards, keypad, options, dialogs; focus visible; Esc closes dialogs; Enter/Space activate.
- Lighthouse on home: accessibility ≥95, best practices ≥95.
- Check contrast and `prefers-reduced-motion`.
- Check `<main>`, headings, `aria-live` on feedback, `aria-pressed` on toggles.

- [ ] **Step 5: Acceptance checklist**

Walk through spec §17 and tick every item. Any failure → fix and repeat the relevant check.

- [ ] **Step 6: Final commit**

```bash
git status
npm test
npm run build:css
git add -A
git commit -m "test: verify 3.0 tablet-first redesign"
```

---

## Spec Coverage Map

| Spec area | Tasks |
|---|---|
| Tablet-first/touch-first, 10″ layouts | 4, 5, 13 |
| Colors, type, shape, mascot, motion | 4 |
| Routes and navigation | 5 |
| Home dashboard | 5 |
| Settings | 6 |
| Progress/badges/history | 3, 7 |
| Math + result | 9 |
| Reading | 1, 2, 10 |
| Test | 1, 11 |
| XP/stars/streak/daily goal | 2, 3 |
| Store schema/reset | 2, 3, 6 |
| Speech, sound effects, offline/PWA | 8, 12 |
| `/api/version` fix | 12 |
| Accessibility | 4, 13 |
| Tests/docs/version | 1–13 |
| Delete legacy files | 12 |

## Self-Review Notes

- **Store contract:** `recordAnswer`/`recordReadingCard` persist immediately; `recordSession` adds completion bonuses, history, streak and badges. `xpEarned` is passed for history; `bonusXp` and `badgeXp` are returned for the result screen. Names are used consistently in Tasks 2, 3, 9, 10, 11.
- **Reading:** one card = one word or phrase; 20 cards; `beginReadingSession` + `recordReadingCard` enforce one XP award per card; partial session records stars by count.
- **Reset:** two keys; progress reset only; settings preserved.
- **Test:** first answer only; one attempt; hidden `?` tiles; replay unlimited.
- **Preflight:** dirty working tree must be preserved before branching; do not lose `fonts/`, `src/`, icons.
- **Dependency direction:** Task 1 (pure) → 2/3 (store) → 4 (UI) → 5 (shell/home) → 6/7 (secondary screens) → 8 (runtime) → 9–11 (lessons) → 12 (PWA/docs) → 13 (verify). No task depends on a later task.
