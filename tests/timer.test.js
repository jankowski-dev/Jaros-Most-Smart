import test from 'node:test';
import assert from 'node:assert/strict';
import { bindVisibilityPause, createSessionTimer } from '../js/timer.js';

test('timer starts, ticks, pauses and resumes', () => {
    let t = 0;
    let tick = null;
    const timer = createSessionTimer({
        now: () => t,
        setIntervalFn: (fn) => { tick = fn; return 1; },
        clearIntervalFn: () => { tick = null; }
    });

    timer.start();
    t = 2500;
    tick();
    assert.equal(timer.getSeconds(), 2);

    timer.pause();
    t = 5000;
    assert.equal(timer.getSeconds(), 2);

    timer.resume();
    t = 6500;
    tick();
    assert.equal(timer.getSeconds(), 4);

    timer.stop();
    assert.equal(timer.getSeconds(), 4);
});

test('timer start is idempotent and resume is safe', () => {
    let t = 0;
    let intervals = 0;
    const timer = createSessionTimer({
        now: () => t,
        setIntervalFn: () => { intervals += 1; return intervals; },
        clearIntervalFn: () => {}
    });

    timer.start();
    timer.start();
    assert.equal(intervals, 1);

    timer.resume();
    assert.equal(intervals, 1);
});

test('bindVisibilityPause pauses and resumes with the document', () => {
    const doc = new EventTarget();
    doc.hidden = false;
    const calls = [];
    const timer = {
        pause: () => calls.push('pause'),
        resume: () => calls.push('resume')
    };

    const unbind = bindVisibilityPause(timer, doc);
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    doc.hidden = false;
    doc.dispatchEvent(new Event('visibilitychange'));
    unbind();
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));

    assert.deepEqual(calls, ['pause', 'resume']);
});
