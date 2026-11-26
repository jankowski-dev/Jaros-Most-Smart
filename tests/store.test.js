import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createStore,
    normalizeName,
    SETTINGS_KEY,
    PROGRESS_KEY
} from '../js/store.js';

function memoryStorage(initial = {}) {
    const map = new Map(Object.entries(initial));
    return {
        getItem: (key) => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => map.set(key, String(value)),
        removeItem: (key) => map.delete(key),
        dump: () => Object.fromEntries(map)
    };
}

function fixedClock(iso) {
    let current = new Date(iso);
    return {
        now: () => new Date(current),
        set: (next) => { current = new Date(next); }
    };
}

test('defaults when storage is empty', () => {
    const store = createStore({ storage: memoryStorage(), now: fixedClock('2026-11-26T10:00:00').now });

    const settings = store.getSettings();
    assert.equal(settings.profile.name, 'Ярик');
    assert.equal(settings.settings.difficulty, 'easy');
    assert.equal(settings.settings.theme, 'system');
    assert.equal(settings.settings.sound, true);
    assert.equal(settings.settings.effects, true);

    const progress = store.getProgress();
    assert.equal(progress.xp, 0);
    assert.equal(progress.level, 1);
    assert.deepEqual(progress.streak, { current: 0, best: 0, lastActiveDate: null, activeDays: [] });
    assert.equal(progress.subjects.math.total, 0);
    assert.equal(progress.subjects.reading.cardsRead, 0);
    assert.equal(progress.subjects.test.total, 0);
    assert.deepEqual(progress.badges, {});
    assert.deepEqual(progress.history, []);
});

test('settings and progress live under separate keys', () => {
    const storage = memoryStorage();
    const store = createStore({ storage, now: fixedClock('2026-11-26T10:00:00').now });

    store.updateSettings({ profile: { name: 'Ярик 2' }, settings: { theme: 'dark' } });
    store.recordAnswer({ type: 'math', correct: true });

    const saved = storage.dump();
    const rawSettings = JSON.parse(saved[SETTINGS_KEY]);
    const rawProgress = JSON.parse(saved[PROGRESS_KEY]);

    assert.equal(rawSettings.profile.name, 'Ярик 2');
    assert.equal(rawSettings.settings.theme, 'dark');
    assert.equal('xp' in rawSettings, false);
    assert.equal(rawProgress.xp, 10);
    assert.equal('profile' in rawProgress, false);
});

test('normalizeName trims and caps', () => {
    assert.equal(normalizeName('  Ярик  '), 'Ярик');
    assert.equal(normalizeName(''), 'Ярик');
    assert.equal(normalizeName('   '), 'Ярик');
    assert.equal(normalizeName('а'.repeat(25)).length, 20);
});

test('recordAnswer adds xp and subject totals', () => {
    const store = createStore({ storage: memoryStorage(), now: fixedClock('2026-11-26T10:00:00').now });

    assert.deepEqual(store.recordAnswer({ type: 'math', correct: true }), { xpGained: 10, levelUp: false });
    let progress = store.getProgress();
    assert.equal(progress.xp, 10);
    assert.equal(progress.subjects.math.correct, 1);
    assert.equal(progress.subjects.math.total, 1);

    assert.deepEqual(store.recordAnswer({ type: 'test', correct: false }), { xpGained: 0, levelUp: false });
    progress = store.getProgress();
    assert.equal(progress.xp, 10);
    assert.equal(progress.subjects.test.correct, 0);
    assert.equal(progress.subjects.test.total, 1);
});

test('level is computed from xp', () => {
    const store = createStore({ storage: memoryStorage(), now: fixedClock('2026-11-26T10:00:00').now });

    for (let i = 0; i < 9; i++) store.recordAnswer({ type: 'math', correct: true });
    assert.equal(store.getLevelInfo().level, 1);
    assert.equal(store.getLevelInfo().xpIntoLevel, 90);

    const tenth = store.recordAnswer({ type: 'math', correct: true });
    assert.deepEqual(tenth, { xpGained: 10, levelUp: true });
    assert.deepEqual(store.getLevelInfo(), {
        level: 2,
        xpIntoLevel: 0,
        xpForNext: 100,
        totalXp: 100
    });
});

test('reading cards count once per session', () => {
    const store = createStore({ storage: memoryStorage(), now: fixedClock('2026-11-26T10:00:00').now });

    store.beginReadingSession();
    assert.deepEqual(store.recordReadingCard('easy-1'), { xpGained: 2, isNew: true });
    assert.deepEqual(store.recordReadingCard('easy-1'), { xpGained: 0, isNew: false });
    assert.equal(store.getProgress().subjects.reading.cardsRead, 1);
    assert.equal(store.getProgress().xp, 2);

    store.beginReadingSession();
    assert.deepEqual(store.recordReadingCard('easy-1'), { xpGained: 2, isNew: true });
    assert.equal(store.getProgress().subjects.reading.cardsRead, 2);
});

test('recordTime accumulates and gives goal bonus once', () => {
    const store = createStore({ storage: memoryStorage(), now: fixedClock('2026-11-26T10:00:00').now });

    assert.deepEqual(store.recordTime(300), { goalReached: false, bonusXp: 0, levelUp: false });
    assert.deepEqual(store.recordTime(300), { goalReached: true, bonusXp: 20, levelUp: false });
    assert.deepEqual(store.recordTime(60), { goalReached: false, bonusXp: 0, levelUp: false });

    assert.equal(store.getProgress().daily.seconds, 660);
    assert.equal(store.getProgress().daily.goalBonusGiven, true);
    assert.equal(store.getProgress().xp, 20);
});

test('daily resets on a new local date', () => {
    const clock = fixedClock('2026-11-26T10:00:00');
    const store = createStore({ storage: memoryStorage(), now: clock.now });

    store.recordTime(600);
    clock.set('2026-11-27T09:00:00');
    store.recordTime(60);

    const daily = store.getProgress().daily;
    assert.equal(daily.date, '2026-11-27');
    assert.equal(daily.seconds, 60);
    assert.equal(daily.goalBonusGiven, false);
});

test('daily is reset when loaded on a new date', () => {
    const storage = memoryStorage();
    const clock = fixedClock('2026-11-26T10:00:00');
    const first = createStore({ storage, now: clock.now });
    first.recordTime(60);

    clock.set('2026-11-27T10:00:00');
    const second = createStore({ storage, now: clock.now });

    assert.equal(second.getProgress().daily.date, '2026-11-27');
    assert.equal(second.getProgress().daily.seconds, 0);
    assert.equal(second.getProgress().daily.goalBonusGiven, false);
});

test('resetProgress keeps settings', () => {
    const storage = memoryStorage();
    const store = createStore({ storage, now: fixedClock('2026-11-26T10:00:00').now });

    store.updateSettings({ profile: { name: 'Тест' }, settings: { theme: 'dark', sound: false } });
    store.recordAnswer({ type: 'math', correct: true });
    store.recordTime(60);

    store.resetProgress();

    const settings = store.getSettings();
    assert.equal(settings.profile.name, 'Тест');
    assert.equal(settings.settings.theme, 'dark');
    assert.equal(settings.settings.sound, false);
    assert.equal(store.getProgress().xp, 0);
    assert.equal(store.getProgress().subjects.math.total, 0);
    assert.equal(storage.dump()[PROGRESS_KEY], undefined);
});

test('corrupt storage falls back to defaults', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: 'not json' });
    const store = createStore({ storage, now: fixedClock('2026-11-26T10:00:00').now });

    assert.equal(store.getProgress().xp, 0);
    assert.equal(store.getStorageError(), true);
});

test('throwing storage keeps app usable', () => {
    const storage = {
        getItem() { throw new Error('blocked'); },
        setItem() { throw new Error('quota'); },
        removeItem() { throw new Error('blocked'); }
    };
    const store = createStore({ storage, now: fixedClock('2026-11-26T10:00:00').now });

    assert.doesNotThrow(() => store.recordAnswer({ type: 'math', correct: true }));
    assert.equal(store.getStorageError(), true);
    assert.equal(store.getProgress().subjects.math.total, 1);
    assert.equal(store.getProgress().xp, 10);
});
