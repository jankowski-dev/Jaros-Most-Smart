import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../js/theme.js';

test('resolveTheme respects explicit themes', () => {
    assert.equal(resolveTheme('light', true), 'light');
    assert.equal(resolveTheme('dark', false), 'dark');
});

test('resolveTheme follows system preference', () => {
    assert.equal(resolveTheme('system', true), 'dark');
    assert.equal(resolveTheme('system', false), 'light');
});

test('resolveTheme falls back to system on unknown values', () => {
    assert.equal(resolveTheme('unknown', true), 'dark');
    assert.equal(resolveTheme(undefined, false), 'light');
});
