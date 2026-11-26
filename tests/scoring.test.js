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
