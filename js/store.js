// Единое состояние «Ярик.Уроки 3.0».
// Настройки и прогресс лежат под разными ключами, чтобы сброс прогресса
// не стирал имя, тему, звук и сложность.

import { BADGES, evaluateBadges } from './badges.js';

export const SETTINGS_KEY = 'yarik.uroki.settings.v1';
export const PROGRESS_KEY = 'yarik.uroki.progress.v1';

const XP_PER_LEVEL = 100;
const MATH_ANSWER_XP = 10;
const READING_CARD_XP = 2;
const DAILY_GOAL_XP = 20;

export const DEFAULT_SETTINGS = {
    version: 1,
    profile: { name: 'Ярик' },
    settings: {
        sound: true,
        effects: true,
        difficulty: 'easy',
        theme: 'system'
    }
};

function defaultSubject(type) {
    if (type === 'reading') {
        return { sessions: 0, cardsRead: 0, bestStars: 0, lastPlayed: null, totalSeconds: 0 };
    }
    return { sessions: 0, correct: 0, total: 0, bestStars: 0, lastPlayed: null, totalSeconds: 0 };
}

export const DEFAULT_PROGRESS = {
    version: 1,
    xp: 0,
    level: 1,
    streak: { current: 0, best: 0, lastActiveDate: null, activeDays: [] },
    daily: {
        date: null,
        seconds: 0,
        goalSeconds: 600,
        goalBonusGiven: false,
        sessions: 0
    },
    subjects: {
        math: defaultSubject('math'),
        reading: defaultSubject('reading'),
        test: defaultSubject('test')
    },
    badges: {},
    history: []
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonNegativeInt(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function toNonNegativeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

export function normalizeName(value) {
    return String(value ?? '').trim().slice(0, 20) || 'Ярик';
}

function localDateKey(date) {
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function previousDateKey(date) {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    return localDateKey(previous);
}

function levelFromXp(xp) {
    return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

function normalizeSubject(raw, type) {
    const fallback = defaultSubject(type);
    if (!isObject(raw)) return fallback;

    if (type === 'reading') {
        return {
            sessions: toNonNegativeInt(raw.sessions, fallback.sessions),
            cardsRead: toNonNegativeInt(raw.cardsRead, fallback.cardsRead),
            bestStars: Math.min(3, toNonNegativeInt(raw.bestStars, fallback.bestStars)),
            lastPlayed: typeof raw.lastPlayed === 'string' ? raw.lastPlayed : null,
            totalSeconds: toNonNegativeInt(raw.totalSeconds, fallback.totalSeconds)
        };
    }

    return {
        sessions: toNonNegativeInt(raw.sessions, fallback.sessions),
        correct: toNonNegativeInt(raw.correct, fallback.correct),
        total: toNonNegativeInt(raw.total, fallback.total),
        bestStars: Math.min(3, toNonNegativeInt(raw.bestStars, fallback.bestStars)),
        lastPlayed: typeof raw.lastPlayed === 'string' ? raw.lastPlayed : null,
        totalSeconds: toNonNegativeInt(raw.totalSeconds, fallback.totalSeconds)
    };
}

function normalizeSettings(raw) {
    const data = isObject(raw) ? raw : {};
    const profile = isObject(data.profile) ? data.profile : {};
    const settings = isObject(data.settings) ? data.settings : {};

    return {
        version: 1,
        profile: { name: normalizeName(profile.name) },
        settings: {
            sound: typeof settings.sound === 'boolean' ? settings.sound : true,
            effects: typeof settings.effects === 'boolean' ? settings.effects : true,
            difficulty: ['easy', 'hard'].includes(settings.difficulty) ? settings.difficulty : 'easy',
            theme: ['light', 'dark', 'system'].includes(settings.theme) ? settings.theme : 'system'
        }
    };
}

function normalizeProgress(raw) {
    const data = isObject(raw) ? raw : {};
    const streak = isObject(data.streak) ? data.streak : {};
    const daily = isObject(data.daily) ? data.daily : {};
    const subjects = isObject(data.subjects) ? data.subjects : {};
    const badges = isObject(data.badges) ? data.badges : {};
    const history = Array.isArray(data.history) ? data.history : [];

    const xp = toNonNegativeInt(data.xp, 0);

    return {
        version: 1,
        xp,
        level: levelFromXp(xp),
        streak: {
            current: toNonNegativeInt(streak.current, 0),
            best: toNonNegativeInt(streak.best, 0),
            lastActiveDate: typeof streak.lastActiveDate === 'string' ? streak.lastActiveDate : null,
            activeDays: Array.isArray(streak.activeDays)
                ? streak.activeDays.filter(day => typeof day === 'string').slice(-30)
                : []
        },
        daily: {
            date: typeof daily.date === 'string' ? daily.date : null,
            seconds: toNonNegativeInt(daily.seconds, 0),
            goalSeconds: Math.max(1, toNonNegativeInt(daily.goalSeconds, 600)),
            goalBonusGiven: daily.goalBonusGiven === true,
            sessions: toNonNegativeInt(daily.sessions, 0)
        },
        subjects: {
            math: normalizeSubject(subjects.math, 'math'),
            reading: normalizeSubject(subjects.reading, 'reading'),
            test: normalizeSubject(subjects.test, 'test')
        },
        badges: clone(badges),
        history: history.slice(0, 30).map(entry => (isObject(entry) ? clone(entry) : null)).filter(Boolean)
    };
}

export function createStore({ storage = null, now = () => new Date() } = {}) {
    let storageError = false;
    let readingSeen = new Set();

    function readJson(key) {
        if (!storage) return null;
        try {
            const raw = storage.getItem(key);
            return raw === null ? null : JSON.parse(raw);
        } catch (error) {
            storageError = true;
            return null;
        }
    }

    function writeJson(key, value) {
        if (!storage) return;
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch (error) {
            storageError = true;
        }
    }

    let settings = normalizeSettings(readJson(SETTINGS_KEY));
    let progress = normalizeProgress(readJson(PROGRESS_KEY));

    function today() {
        return localDateKey(now());
    }

    function ensureDaily() {
        const date = today();
        if (progress.daily.date === date) return;
        progress.daily = {
            date,
            seconds: 0,
            goalSeconds: progress.daily.goalSeconds || 600,
            goalBonusGiven: false,
            sessions: 0
        };
    }

    function saveSettings() {
        writeJson(SETTINGS_KEY, settings);
    }

    function saveProgress() {
        writeJson(PROGRESS_KEY, progress);
    }

    function addXp(amount) {
        const xpGained = Math.max(0, Math.floor(Number(amount) || 0));
        const levelBefore = levelFromXp(progress.xp);
        progress.xp = Math.max(0, progress.xp + xpGained);
        progress.level = levelFromXp(progress.xp);
        saveProgress();
        return { xpGained, levelUp: progress.level > levelBefore };
    }

    function markActiveDay() {
        const todayKey = today();
        const lastActive = progress.streak.lastActiveDate;

        if (lastActive !== todayKey) {
            if (lastActive === previousDateKey(now())) {
                progress.streak.current += 1;
            } else {
                progress.streak.current = 1;
            }
            progress.streak.lastActiveDate = todayKey;
            progress.streak.best = Math.max(progress.streak.best, progress.streak.current);
        }

        if (!progress.streak.activeDays.includes(todayKey)) {
            progress.streak.activeDays.push(todayKey);
            if (progress.streak.activeDays.length > 30) {
                progress.streak.activeDays = progress.streak.activeDays.slice(-30);
            }
        }
    }

    function checkBadges() {
        const newBadges = evaluateBadges(progress);
        let badgeXp = 0;
        let levelUp = false;

        for (const id of newBadges) {
            progress.badges[id] = today();
            const result = addXp(25);
            badgeXp += 25;
            levelUp = levelUp || result.levelUp;
        }

        if (newBadges.length > 0) saveProgress();

        return { newBadges, badgeXp, levelUp };
    }

    ensureDaily();

    return {
        getSettings() {
            return clone(settings);
        },

        getProgress() {
            return clone(progress);
        },

        updateSettings(partial = {}) {
            if (isObject(partial.profile) && typeof partial.profile.name === 'string') {
                settings.profile.name = normalizeName(partial.profile.name);
            }

            if (isObject(partial.settings)) {
                const next = partial.settings;
                if (typeof next.sound === 'boolean') settings.settings.sound = next.sound;
                if (typeof next.effects === 'boolean') settings.settings.effects = next.effects;
                if (['easy', 'hard'].includes(next.difficulty)) settings.settings.difficulty = next.difficulty;
                if (['light', 'dark', 'system'].includes(next.theme)) settings.settings.theme = next.theme;
            }

            saveSettings();
            return clone(settings);
        },

        getLevelInfo() {
            const level = levelFromXp(progress.xp);
            return {
                level,
                xpIntoLevel: progress.xp % XP_PER_LEVEL,
                xpForNext: XP_PER_LEVEL,
                totalXp: progress.xp
            };
        },

        recordAnswer({ type, correct } = {}) {
            if (!['math', 'test'].includes(type)) {
                return { xpGained: 0, levelUp: false };
            }

            const subject = progress.subjects[type];
            subject.total += 1;
            if (correct) subject.correct += 1;

            if (!correct) {
                saveProgress();
                return { xpGained: 0, levelUp: false };
            }

            return addXp(MATH_ANSWER_XP);
        },

        beginReadingSession() {
            readingSeen = new Set();
        },

        recordReadingCard(cardId) {
            if (!cardId || readingSeen.has(cardId)) {
                return { xpGained: 0, isNew: false };
            }

            readingSeen.add(cardId);
            progress.subjects.reading.cardsRead += 1;
            addXp(READING_CARD_XP);
            return { xpGained: READING_CARD_XP, isNew: true };
        },

        recordTime(seconds) {
            ensureDaily();
            progress.daily.seconds += toNonNegativeInt(seconds, 0);

            if (!progress.daily.goalBonusGiven && progress.daily.seconds >= progress.daily.goalSeconds) {
                progress.daily.goalBonusGiven = true;
                const result = addXp(DAILY_GOAL_XP);
                return { goalReached: true, bonusXp: DAILY_GOAL_XP, levelUp: result.levelUp };
            }

            saveProgress();
            return { goalReached: false, bonusXp: 0, levelUp: false };
        },

        recordSession({ type, correct = 0, total = 0, durationSec = 0, stars = 0, xpEarned = 0 } = {}) {
            if (!['math', 'reading', 'test'].includes(type)) {
                return {
                    bonusXp: 0,
                    badgeXp: 0,
                    levelUp: false,
                    newBadges: [],
                    dailyGoalReached: progress.daily.goalBonusGiven,
                    streak: clone(progress.streak)
                };
            }

            ensureDaily();

            const firstOfDay = progress.daily.sessions === 0;
            const perfect = type !== 'reading' && total > 0 && correct === total;
            const bonusXp = 5 + (firstOfDay ? 10 : 0) + (perfect ? 20 : 0);

            const levelBefore = progress.level;
            addXp(bonusXp);

            const subject = progress.subjects[type];
            if (subject) {
                subject.sessions += 1;
                subject.lastPlayed = now().toISOString();
                subject.totalSeconds += toNonNegativeInt(durationSec, 0);
                subject.bestStars = Math.max(
                    subject.bestStars || 0,
                    Math.min(3, toNonNegativeInt(stars, 0))
                );
            }

            progress.daily.sessions += 1;
            markActiveDay();

            const safeCorrect = toNonNegativeInt(correct, 0);
            const safeTotal = toNonNegativeInt(total, 0);
            const safeStars = Math.min(3, toNonNegativeInt(stars, 0));
            const safeDuration = toNonNegativeInt(durationSec, 0);

            progress.history.unshift({
                type,
                date: now().toISOString(),
                correct: safeCorrect,
                total: safeTotal,
                stars: safeStars,
                durationSec: safeDuration,
                xp: toNonNegativeInt(xpEarned, 0) + bonusXp
            });
            if (progress.history.length > 30) progress.history.length = 30;

            const badgeResult = checkBadges();
            saveProgress();

            return {
                bonusXp,
                badgeXp: badgeResult.badgeXp,
                levelUp: progress.level > levelBefore,
                newBadges: badgeResult.newBadges,
                dailyGoalReached: progress.daily.goalBonusGiven,
                streak: clone(progress.streak)
            };
        },

        checkBadges() {
            return checkBadges();
        },

        getBadgeDefinitions() {
            return clone(BADGES);
        },

        resetProgress() {
            progress = normalizeProgress(clone(DEFAULT_PROGRESS));
            progress.daily = {
                date: today(),
                seconds: 0,
                goalSeconds: 600,
                goalBonusGiven: false,
                sessions: 0
            };
            readingSeen = new Set();

            if (storage) {
                try {
                    storage.removeItem(PROGRESS_KEY);
                } catch (error) {
                    storageError = true;
                }
            }
        },

        getStorageError() {
            return storageError;
        }
    };
}
