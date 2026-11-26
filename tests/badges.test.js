import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, evaluateBadges } from '../js/badges.js';

function baseProgress() {
    return {
        xp: 0,
        level: 1,
        streak: { current: 0, best: 0, lastActiveDate: null, activeDays: [] },
        subjects: {
            math: { sessions: 0, correct: 0, total: 0 },
            reading: { sessions: 0, cardsRead: 0 },
            test: { sessions: 0, correct: 0, total: 0 }
        },
        badges: {},
        history: []
    };
}

test('badge definitions are complete and unique', () => {
    assert.equal(BADGES.length, 10);
    assert.equal(new Set(BADGES.map(badge => badge.id)).size, 10);
    for (const badge of BADGES) {
        assert.ok(badge.id);
        assert.ok(badge.title.length > 0);
        assert.ok(badge.description.length > 0);
    }
});

test('no badges for empty progress', () => {
    assert.deepEqual(evaluateBadges(baseProgress()), []);
});

test('first-step unlocks after any completed session', () => {
    const progress = baseProgress();
    progress.subjects.math.sessions = 1;
    assert.deepEqual(evaluateBadges(progress), ['first-step']);
});

test('streak, accuracy and reading badges use their counters', () => {
    const progress = baseProgress();
    progress.streak.current = 3;
    progress.subjects.math.correct = 50;
    progress.subjects.reading.cardsRead = 100;

    assert.deepEqual(evaluateBadges(progress).sort(), ['math-50', 'reader-100', 'streak-3']);
});

test('perfect badges come from history', () => {
    const progress = baseProgress();
    progress.history = [
        { type: 'math', correct: 10, total: 10 },
        { type: 'test', correct: 10, total: 10 }
    ];

    assert.deepEqual(evaluateBadges(progress).sort(), ['perfect-math', 'perfect-test']);
});

test('all-subjects and level badges use progress state', () => {
    const progress = baseProgress();
    progress.level = 5;
    progress.subjects.math.sessions = 1;
    progress.subjects.reading.sessions = 1;
    progress.subjects.test.sessions = 1;

    assert.deepEqual(evaluateBadges(progress).sort(), ['all-subjects', 'first-step', 'level-5']);
});

test('earned badges are excluded', () => {
    const progress = baseProgress();
    progress.subjects.math.sessions = 1;
    progress.subjects.math.correct = 50;
    progress.badges['first-step'] = '2026-11-20';

    assert.deepEqual(evaluateBadges(progress), ['math-50']);
});
