import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../js/router.js';

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

test('parseRoute normalizes trailing slashes', () => {
    assert.deepEqual(parseRoute('#/progress/'), { name: 'progress' });
    assert.deepEqual(parseRoute('#/play/math/'), { name: 'play', type: 'math' });
});
