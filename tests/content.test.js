import test from 'node:test';
import assert from 'node:assert/strict';
import { readingEasy, readingHard, testWords, generateMathProblems, praise, support } from '../js/content.js';

test('reading cards have unique ids, text and coherent syllables', () => {
    const all = [...readingEasy, ...readingHard];
    assert.ok(all.length >= 50);
    assert.equal(new Set(all.map(card => card.id)).size, all.length);
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
        assert.equal(item.options.filter(option => option === item.word).length, 1);
    }
});

test('themed robot/spider content exists', () => {
    const texts = [...readingEasy, ...readingHard].map(card => card.text.toUpperCase());
    assert.ok(texts.includes('РОБОТ'));
    assert.ok(texts.includes('ПАУК'));
    assert.ok(testWords.some(item => item.word === 'ПАУК'));
});

test('easy math stays within 10 and uses addition', () => {
    for (let i = 0; i < 100; i++) {
        for (const problem of generateMathProblems('easy', 10)) {
            assert.equal(problem.operator, '+');
            assert.ok(problem.num1 >= 0 && problem.num1 <= 10);
            assert.ok(problem.num2 >= 0 && problem.num2 <= 10);
            assert.ok(problem.answer >= 0 && problem.answer <= 10);
            assert.equal(problem.answer, problem.num1 + problem.num2);
        }
    }
});

test('hard math stays within 20 and never goes negative', () => {
    for (let i = 0; i < 100; i++) {
        for (const problem of generateMathProblems('hard', 10)) {
            assert.ok(['+', '-'].includes(problem.operator));
            assert.ok(problem.num1 >= 0 && problem.num1 <= 20);
            assert.ok(problem.num2 >= 0 && problem.num2 <= 20);
            assert.ok(problem.answer >= 0 && problem.answer <= 20);
            assert.equal(
                problem.answer,
                problem.operator === '+' ? problem.num1 + problem.num2 : problem.num1 - problem.num2
            );
        }
    }
});

test('praise and support are short non-empty strings', () => {
    assert.ok(praise.length >= 4);
    assert.ok(support.length >= 3);
    for (const line of [...praise, ...support]) assert.ok(line.length >= 3 && line.length <= 60);
});
