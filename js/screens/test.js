// Тест на слух: 10 слов, скрытые плитки, три варианта ответа и результат.

import { praise, support, testWords } from '../content.js';
import { calculateGrade, calculateStars, formatTime } from '../scoring.js';
import { bindVisibilityPause, createSessionTimer } from '../timer.js';
import { createWordFill } from '../word-fill.js';
import { renderAppBar, bindAppBar } from '../ui/app-bar.js';
import { icon } from '../ui/icons.js';
import { renderResult } from './result.js';

function shuffle(array) {
    const result = [...array];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const random = Math.floor(Math.random() * (index + 1));
        [result[index], result[random]] = [result[random], result[index]];
    }
    return result;
}

function pick(lines) {
    return lines[Math.floor(Math.random() * lines.length)];
}

function createSession(container, ctx, restart) {
    const questions = shuffle(testWords).slice(0, 10).map(question => ({
        ...question,
        options: shuffle(question.options)
    }));
    const level = ctx.store.getLevelInfo().level;
    const state = {
        index: 0,
        correct: 0,
        answered: 0,
        xpEarned: 0,
        startLevel: level,
        completed: false,
        cleaned: false,
        sessionRecorded: false,
        isAnswered: false
    };

    container.innerHTML = `
        <div class="lesson-shell">
            ${renderAppBar({
                title: 'Тест на слух',
                subtitle: 'Слушай и выбирай',
                level: `Ур. ${level}`
            })}
            <div class="lesson-content">
                <div class="flex items-center gap-3">
                    <div class="progress-segments flex-1" data-progress aria-label="Прогресс теста">
                        ${questions.map((_, index) => `<span class="progress-segment" data-progress-segment="${index}"></span>`).join('')}
                    </div>
                    <span class="chip tabular" data-test-count>1 / ${questions.length}</span>
                </div>
                <div class="lesson-grid mt-4">
                    <section class="lesson-card text-center">
                        <div class="test-tiles" data-tiles></div>
                        <button class="btn btn-primary btn-lg mt-5" type="button" data-listen>
                            ${icon('volume', { size: 20 })} Послушать
                        </button>
                        <p class="muted mt-3 text-sm">Можно слушать сколько угодно раз.</p>
                        <div class="feedback mt-3" data-feedback hidden role="status" aria-live="polite"></div>
                    </section>
                    <section class="lesson-card">
                        <div class="test-options" data-options></div>
                        <p class="muted mt-3 text-center text-xs">Клавиши 1, 2, 3 тоже работают.</p>
                    </section>
                </div>
            </div>
        </div>
    `;

    const tilesElement = container.querySelector('[data-tiles]');
    const optionsElement = container.querySelector('[data-options]');
    const listenButton = container.querySelector('[data-listen]');
    const feedback = container.querySelector('[data-feedback]');
    const countElement = container.querySelector('[data-test-count]');
    const progressSegments = [...container.querySelectorAll('[data-progress-segment]')];

    let revealTimeouts = [];
    let autoPlayTimer = null;
    let flushInterval = null;
    let lastFlushed = 0;
    let activeFill = null;
    let speechErrorShown = false;

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

    function stopSpeech() {
        ctx.speech.cancel();
        if (activeFill) {
            activeFill.cancel();
            activeFill = null;
        }
        if (autoPlayTimer) {
            clearTimeout(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    function updateProgress() {
        progressSegments.forEach((segment, index) => {
            segment.classList.toggle('is-done', index < state.answered);
        });
    }

    function renderTiles(word) {
        tilesElement.innerHTML = '';
        for (let index = 0; index < word.length; index += 1) {
            const tile = document.createElement('span');
            tile.className = 'test-tile';
            tile.dataset.tile = String(index);
            tile.textContent = '?';
            tilesElement.appendChild(tile);
        }
    }

    function renderOptions(question) {
        optionsElement.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'test-option';
            button.dataset.optionIndex = String(index);
            button.textContent = option;
            button.addEventListener('click', () => answer(index));
            optionsElement.appendChild(button);
        });
    }

    function play(announce = false) {
        if (state.completed || state.isAnswered) return;

        if (!ctx.speech.isEnabled()) {
            if (announce) ctx.showToast('Озвучка выключена. Включи её в настройках.', { type: 'info' });
            return;
        }

        stopSpeech();
        const question = questions[state.index];
        const fill = createWordFill(tilesElement);
        activeFill = fill;

        ctx.speech.speak(question.word, {
            isWord: true,
            onProgress: fill.setProgress
        }).then(() => {
            fill.finish();
        }).catch(() => {
            fill.cancel();
            if (!speechErrorShown) {
                speechErrorShown = true;
                ctx.showToast('Не получилось озвучить. Попробуй ещё раз.', { type: 'warning' });
            }
        });
    }

    function revealWord(word) {
        revealTimeouts.forEach(timeout => clearTimeout(timeout));
        revealTimeouts = [];

        const tiles = [...tilesElement.querySelectorAll('[data-tile]')];
        tiles.forEach((tile, index) => {
            const timeout = setTimeout(() => {
                tile.textContent = word[index] || '';
                tile.classList.add('is-revealed');
            }, index * 60);
            revealTimeouts.push(timeout);
        });
    }

    function nextQuestion() {
        if (state.completed) return;

        if (state.index >= questions.length - 1) {
            complete();
            return;
        }

        state.index += 1;
        state.isAnswered = false;
        renderQuestion();
    }

    function complete() {
        if (state.completed) return;
        state.completed = true;
        stopSpeech();
        flushTime();

        const durationSec = timer.getSeconds();
        const stars = calculateStars('test', state.correct, questions.length);
        const grade = calculateGrade(state.correct, questions.length);
        const rewards = ctx.store.recordSession({
            type: 'test',
            correct: state.correct,
            total: questions.length,
            durationSec,
            stars,
            xpEarned: state.xpEarned
        });

        cleanup();

        renderResult(container, {
            ctx,
            type: 'test',
            correct: state.correct,
            total: questions.length,
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

    function answer(selectedIndex) {
        if (state.completed || state.isAnswered) return;

        const question = questions[state.index];
        const selectedWord = question.options[selectedIndex];
        if (!selectedWord) return;

        state.isAnswered = true;
        state.answered += 1;
        stopSpeech();
        listenButton.disabled = true;

        const isCorrect = selectedWord === question.word;
        const result = ctx.store.recordAnswer({ type: 'test', correct: isCorrect });
        state.xpEarned += result.xpGained;
        if (isCorrect) state.correct += 1;

        const buttons = [...optionsElement.querySelectorAll('.test-option')];
        buttons.forEach((button, index) => {
            button.disabled = true;
            if (index === selectedIndex) {
                button.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
            }
            if (!isCorrect && question.options[index] === question.word) {
                button.classList.add('is-correct');
            }
        });

        if (isCorrect) {
            ctx.effects.correct();
        } else {
            ctx.effects.wrong();
        }

        const line = pick(isCorrect ? praise : support);
        feedback.hidden = false;
        feedback.className = `feedback feedback--${isCorrect ? 'correct' : 'wrong'}`;
        feedback.textContent = isCorrect ? line : `${line} Правильный ответ — ${question.word}`;
        ctx.speech.speak(line).catch(() => {});

        updateProgress();
        revealWord(question.word);
        autoPlayTimer = setTimeout(nextQuestion, 1900);
    }

    function renderQuestion() {
        const question = questions[state.index];
        state.isAnswered = false;
        listenButton.disabled = false;
        feedback.hidden = true;
        feedback.textContent = '';
        feedback.className = 'feedback';
        countElement.textContent = `${state.index + 1} / ${questions.length}`;
        updateProgress();
        renderTiles(question.word);
        renderOptions(question);

        if (ctx.speech.isEnabled()) {
            autoPlayTimer = setTimeout(() => play(false), 400);
        }
    }

    async function canLeave() {
        if (state.answered === 0 || state.sessionRecorded) return true;

        const confirmed = await ctx.confirmDialog({
            title: 'Выйти из теста?',
            message: 'Ответы и XP сохранятся, но звёзды, серия и история за этот тест не начислятся.',
            confirmText: 'Выйти',
            cancelText: 'Остаться',
            danger: true
        });

        if (confirmed) flushTime();
        return confirmed;
    }

    function onKeydown(event) {
        if (document.querySelector('dialog[open]')) return;
        const target = event.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (target && target.closest && target.closest('button, a, [role="switch"]') && (event.key === 'Enter' || event.key === ' ')) return;

        if (['1', '2', '3'].includes(event.key)) {
            event.preventDefault();
            answer(Number(event.key) - 1);
        } else if (event.key === ' ') {
            event.preventDefault();
            play(true);
        }
    }

    function cleanup() {
        if (state.cleaned) return;
        state.cleaned = true;

        flushTime();
        revealTimeouts.forEach(timeout => clearTimeout(timeout));
        revealTimeouts = [];
        if (autoPlayTimer) clearTimeout(autoPlayTimer);
        if (flushInterval) clearInterval(flushInterval);
        stopSpeech();
        unbindVisibility();
        timer.stop();
        appBarCleanup();
        document.removeEventListener('keydown', onKeydown);
    }

    listenButton.addEventListener('click', () => play(true));
    document.addEventListener('keydown', onKeydown);

    timer.start();
    flushInterval = setInterval(flushTime, 30000);
    renderQuestion();

    return { cleanup, canLeave };
}

export function renderTest(container, ctx) {
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
