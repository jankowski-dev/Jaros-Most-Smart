// Урок математики: 10 заданий, экранная и клавиатурная клавиатура,
// фидбэк, таймер, XP и общий экран результата.

import { generateMathProblems, praise, support } from '../content.js';
import { calculateGrade, calculateStars, formatTime } from '../scoring.js';
import { bindVisibilityPause, createSessionTimer } from '../timer.js';
import { renderAppBar, bindAppBar } from '../ui/app-bar.js';
import { icon } from '../ui/icons.js';
import { renderResult } from './result.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'check'];

function keypadMarkup() {
    return KEYS.map(key => {
        const action = key === 'back' || key === 'check';
        const className = key === 'back' ? 'key key--muted' : key === 'check' ? 'key key--check' : 'key';
        const label = key === 'back' ? 'Удалить' : key === 'check' ? 'Проверить' : `Цифра ${key}`;
        const content = key === 'back'
            ? icon('backspace', { size: 24 })
            : key === 'check'
                ? icon('check', { size: 26 })
                : key;

        return `<button class="${className}" type="button" data-key="${key}" aria-label="${label}">${content}</button>`;
    }).join('');
}

function pick(lines) {
    return lines[Math.floor(Math.random() * lines.length)];
}

function createSession(container, ctx, restart) {
    const settings = ctx.store.getSettings();
    const difficulty = settings.settings.difficulty;
    const problems = generateMathProblems(difficulty, 10);
    const level = ctx.store.getLevelInfo().level;
    const state = {
        index: 0,
        answer: '',
        checked: false,
        completed: false,
        cleaned: false,
        correct: 0,
        answered: 0,
        xpEarned: 0,
        startLevel: level
    };

    container.innerHTML = `
        <div class="lesson-shell">
            ${renderAppBar({
                title: 'Математика',
                subtitle: difficulty === 'hard' ? 'Примеры до 20' : 'Сложение до 10',
                level: `Ур. ${level}`
            })}
            <div class="lesson-content">
                <div class="progress-segments" data-progress aria-label="Прогресс урока">
                    ${problems.map((_, index) => `<span class="progress-segment" data-progress-segment="${index}"></span>`).join('')}
                </div>
                <div class="lesson-grid mt-4">
                    <section class="lesson-card">
                        <div class="equation">
                            <span class="number" data-num1></span>
                            <span class="operator" data-op></span>
                            <span class="number" data-num2></span>
                            <span class="equals">=</span>
                            <span class="answer-slot" data-answer>?</span>
                        </div>
                        <div class="feedback" data-feedback hidden role="status" aria-live="polite"></div>
                    </section>
                    <section class="lesson-card">
                        <div class="keypad">${keypadMarkup()}</div>
                        <p class="muted mt-3 text-center text-xs">Цифры, Backspace и Enter работают с клавиатуры.</p>
                    </section>
                </div>
            </div>
        </div>
    `;

    const answerSlot = container.querySelector('[data-answer]');
    const feedback = container.querySelector('[data-feedback]');
    const progressSegments = [...container.querySelectorAll('[data-progress-segment]')];
    const keypadButtons = [...container.querySelectorAll('[data-key]')];
    let pendingTimeout = null;
    let flushInterval = null;
    let lastFlushed = 0;

    const appBarCleanup = bindAppBar(container, {
        onBack: () => ctx.navigate('#/'),
        store: ctx.store,
        showToast: ctx.showToast,
        speech: ctx.speech
    });

    const timer = createSessionTimer({
        onTick: (seconds) => {
            const slot = container.querySelector('[data-app-timer]');
            if (slot) slot.textContent = formatTime(seconds).slice(3);
        }
    });

    const unbindVisibility = bindVisibilityPause(timer, document);

    function flushTime() {
        const seconds = timer.getSeconds();
        const delta = Math.max(0, seconds - lastFlushed);
        if (delta === 0) return;
        lastFlushed = seconds;
        const result = ctx.store.recordTime(delta);
        if (result.goalReached) {
            ctx.showToast('Цель дня выполнена! +20 XP', { type: 'success' });
        }
    }

    function updateProgress() {
        progressSegments.forEach((segment, index) => {
            segment.classList.toggle('is-done', index < state.answered);
        });
    }

    function updateAnswer() {
        answerSlot.textContent = state.answer || '?';
        answerSlot.classList.remove('is-correct', 'is-wrong');
    }

    function updateKeypad(disabled) {
        keypadButtons.forEach(button => {
            button.disabled = disabled;
        });
    }

    function renderProblem() {
        const problem = problems[state.index];
        container.querySelector('[data-num1]').textContent = problem.num1;
        container.querySelector('[data-op]').textContent = problem.operator;
        container.querySelector('[data-num2]').textContent = problem.num2;
        state.answer = '';
        state.checked = false;
        feedback.hidden = true;
        feedback.textContent = '';
        updateAnswer();
        updateProgress();
        updateKeypad(false);
    }

    function nextProblem() {
        pendingTimeout = null;
        if (state.completed) return;

        if (state.index >= problems.length - 1) {
            complete();
            return;
        }

        state.index += 1;
        renderProblem();
    }

    function complete() {
        if (state.completed) return;
        state.completed = true;
        flushTime();

        const durationSec = timer.getSeconds();
        const stars = calculateStars('math', state.correct, problems.length);
        const grade = calculateGrade(state.correct, problems.length);
        const rewards = ctx.store.recordSession({
            type: 'math',
            correct: state.correct,
            total: problems.length,
            durationSec,
            stars,
            xpEarned: state.xpEarned
        });

        cleanup();

        renderResult(container, {
            ctx,
            type: 'math',
            correct: state.correct,
            total: problems.length,
            stars,
            grade,
            durationSec,
            xpEarned: state.xpEarned,
            bonusXp: rewards.bonusXp,
            badgeXp: rewards.badgeXp,
            startLevel: state.startLevel,
            newBadges: rewards.newBadges,
            onRestart: () => restart(),
            onHome: () => ctx.navigate('#/')
        });
    }

    function checkAnswer() {
        if (state.checked || state.completed || state.answer === '') return;

        const problem = problems[state.index];
        const isCorrect = Number(state.answer) === problem.answer;
        state.checked = true;
        state.answered += 1;

        const result = ctx.store.recordAnswer({ type: 'math', correct: isCorrect });
        state.xpEarned += result.xpGained;
        if (isCorrect) state.correct += 1;

        updateProgress();
        updateKeypad(true);

        const line = pick(isCorrect ? praise : support);
        answerSlot.textContent = isCorrect ? state.answer : String(problem.answer);
        answerSlot.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
        feedback.hidden = false;
        feedback.className = `feedback feedback--${isCorrect ? 'correct' : 'wrong'}`;
        feedback.textContent = isCorrect ? line : `${line} Правильный ответ — ${problem.answer}`;

        if (isCorrect) {
            ctx.effects.correct();
        } else {
            ctx.effects.wrong();
        }

        ctx.speech.speak(line).catch(() => {});
        pendingTimeout = setTimeout(nextProblem, isCorrect ? 900 : 2000);
    }

    function handleKey(value) {
        if (state.checked || state.completed) return;

        if (value === 'back') {
            state.answer = state.answer.slice(0, -1);
            updateAnswer();
            return;
        }

        if (value === 'check') {
            checkAnswer();
            return;
        }

        if (/^\d$/.test(value) && state.answer.length < 3) {
            state.answer = state.answer === '0' ? value : state.answer + value;
            updateAnswer();
        }
    }

    function onKeydown(event) {
        if (document.querySelector('dialog[open]')) return;
        const target = event.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (target && target.closest && target.closest('button, a, [role="switch"]') && (event.key === 'Enter' || event.key === ' ')) return;

        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            handleKey(event.key);
        } else if (event.key === 'Backspace') {
            event.preventDefault();
            handleKey('back');
        } else if (event.key === 'Enter') {
            event.preventDefault();
            checkAnswer();
        }
    }

    keypadButtons.forEach(button => {
        button.addEventListener('click', () => handleKey(button.dataset.key));
    });
    document.addEventListener('keydown', onKeydown);

    timer.start();
    flushInterval = setInterval(flushTime, 30000);
    renderProblem();

    async function canLeave() {
        if (state.completed || state.answered === 0) return true;

        const confirmed = await ctx.confirmDialog({
            title: 'Выйти из урока?',
            message: 'Ответы и XP сохранятся, но звёзды, серия и история за этот урок не начислятся.',
            confirmText: 'Выйти',
            cancelText: 'Остаться',
            danger: true
        });

        if (confirmed) flushTime();
        return confirmed;
    }

    function cleanup() {
        if (state.cleaned) return;
        state.cleaned = true;

        flushTime();
        if (pendingTimeout) clearTimeout(pendingTimeout);
        if (flushInterval) clearInterval(flushInterval);
        unbindVisibility();
        timer.stop();
        ctx.speech.cancel();
        appBarCleanup();
        document.removeEventListener('keydown', onKeydown);
    }

    return { cleanup, canLeave };
}

export function renderMath(container, ctx) {
    let session = null;

    function mount() {
        if (session) session.cleanup();
        session = createSession(container, ctx, mount);
    }

    mount();

    return {
        destroy() {
            if (session) {
                session.cleanup();
                session = null;
            }
        },
        canLeave() {
            return session ? session.canLeave() : true;
        },
        restart() {
            mount();
        }
    };
}
