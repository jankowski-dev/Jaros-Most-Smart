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
    const progress = {
        subjects: {
            math: { bestStars: 3 },
            reading: { bestStars: 2 },
            test: { bestStars: 1 }
        }
    };
    assert.equal(getTotalStars(progress), 6);
});
