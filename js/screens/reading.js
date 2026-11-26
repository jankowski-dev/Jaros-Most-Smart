// Чтение: карточки слов и фраз, озвучка, заливка букв, прогресс и результат.

import { readingEasy, readingHard } from '../content.js';
import { calculateStars, formatTime } from '../scoring.js';
import { bindVisibilityPause, createSessionTimer } from '../timer.js';
import { createWordFill } from '../word-fill.js';
import { renderAppBar, bindAppBar } from '../ui/app-bar.js';
import { icon } from '../ui/icons.js';
import { renderResult } from './result.js';

const VOWELS = 'АЕЁИОУЫЭЮЯ';

function shuffle(array) {
    const result = [...array];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const random = Math.floor(Math.random() * (index + 1));
        [result[index], result[random]] = [result[random], result[index]];
    }
    return result;
}

function letterElement(character) {
    const span = document.createElement('span');
    const isVowel = VOWELS.includes(character.toUpperCase());
    span.className = `word-letter ${isVowel ? 'is-vowel' : 'is-consonant'}`;
    span.textContent = character;
    return span;
}

function renderCardText(wordElement, card) {
    wordElement.innerHTML = '';

    if (Array.isArray(card.syllables) && card.syllables.length > 0) {
        card.syllables.forEach((syllable, syllableIndex) => {
            if (syllableIndex > 0) {
                const gap = document.createElement('span');
                gap.className = 'syllable-gap';
                gap.setAttribute('aria-hidden', 'true');
                wordElement.appendChild(gap);
            }

            for (const character of syllable) {
                wordElement.appendChild(letterElement(character));
            }
        });
        return;
    }

    const words = card.text.split(' ');
    words.forEach((word, wordIndex) => {
        if (wordIndex > 0) {
            const space = document.createElement('span');
            space.className = 'word-letter space';
            space.textContent = ' ';
            wordElement.appendChild(space);
        }

        for (const character of word) {
            wordElement.appendChild(letterElement(character));
        }
    });
}

function createSession(container, ctx, restart) {
    const settings = ctx.store.getSettings();
    const difficulty = settings.settings.difficulty;
    const pool = difficulty === 'hard' ? readingHard : readingEasy;
    const cards = shuffle(pool).slice(0, 20);
    const total = cards.length;
    const level = ctx.store.getLevelInfo().level;
    const state = {
        index: 0,
        cardsRead: 0,
        xpEarned: 0,
        startLevel: level,
        completed: false,
        cleaned: false,
        sessionRecorded: false
    };

    ctx.store.beginReadingSession();

    container.innerHTML = `
        <div class="lesson-shell">
            ${renderAppBar({
                title: 'Чтение',
                subtitle: difficulty === 'hard' ? 'Предложения' : 'Слоги и слова',
                level: `Ур. ${level}`
            })}
            <div class="lesson-content">
                <div class="flex items-center gap-3">
                    <div class="progress-track flex-1"><div class="progress-fill" data-read-progress style="width: 0%"></div></div>
                    <span class="chip tabular" data-card-count>1 / ${total}</span>
                </div>
                <div class="lesson-grid mt-4">
                    <section class="word-card">
                        <div class="word-text" data-word role="button" tabindex="0" aria-label="Прослушать слово ещё раз"></div>
                        <button class="btn btn-primary btn-lg" type="button" data-listen>
                            ${icon('volume', { size: 20 })} Послушать
                        </button>
                    </section>
                    <section class="lesson-card flex flex-col justify-between gap-4">
                        <div class="flex flex-col gap-2">
                            <button class="btn btn-tonal w-full" type="button" data-prev>${icon('arrowLeft', { size: 18 })} Назад</button>
                            <button class="btn btn-primary w-full" type="button" data-next>Далее ${icon('arrowRight', { size: 18 })}</button>
                        </div>
                        <div class="text-center">
                            <button class="btn btn-ghost" type="button" data-finish>Завершить</button>
                            <p class="muted mt-2 text-xs">Стрелки ←/→ тоже работают.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;

    const wordElement = container.querySelector('[data-word]');
    const countElement = container.querySelector('[data-card-count]');
    const progressElement = container.querySelector('[data-read-progress]');
    const listenButton = container.querySelector('[data-listen]');
    const prevButton = container.querySelector('[data-prev]');
    const nextButton = container.querySelector('[data-next]');
    const finishButton = container.querySelector('[data-finish]');

    let pendingTimeout = null;
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

    function play(announce = false) {
        if (state.completed) return;
        if (!ctx.speech.isEnabled()) {
            if (announce) ctx.showToast('Озвучка выключена. Включи её в настройках.', { type: 'info' });
            return;
        }

        stopSpeech();
        const card = cards[state.index];
        const fill = createWordFill(wordElement);
        activeFill = fill;

        ctx.speech.speak(card.text, {
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

    function updateCard() {
        const card = cards[state.index];
        renderCardText(wordElement, card);
        countElement.textContent = `${state.index + 1} / ${total}`;
        progressElement.style.width = `${((state.index + 1) / total) * 100}%`;
        wordElement.setAttribute('aria-label', `${card.text}. Нажми, чтобы прослушать ещё раз.`);
        prevButton.disabled = state.index === 0;

        const result = ctx.store.recordReadingCard(card.id);
        if (result.isNew) {
            state.cardsRead += 1;
            state.xpEarned += result.xpGained;
        }

        if (ctx.speech.isEnabled()) {
            autoPlayTimer = setTimeout(() => play(false), 220);
        }
    }

    function goTo(index) {
        if (state.completed) return;

        if (index < 0) return;
        if (index >= total) {
            finishSession(true);
            return;
        }

        stopSpeech();
        state.index = index;
        updateCard();
    }

    function cleanup() {
        if (state.cleaned) return;
        state.cleaned = true;

        flushTime();
        if (pendingTimeout) clearTimeout(pendingTimeout);
        if (flushInterval) clearInterval(flushInterval);
        stopSpeech();
        unbindVisibility();
        timer.stop();
        appBarCleanup();
        document.removeEventListener('keydown', onKeydown);
    }

    function finishSession(showResult) {
        if (state.sessionRecorded) return;

        if (state.cardsRead === 0) {
            if (showResult) ctx.navigate('#/');
            return;
        }

        state.sessionRecorded = true;
        state.completed = true;
        stopSpeech();
        flushTime();

        const durationSec = timer.getSeconds();
        const stars = calculateStars('reading', state.cardsRead, total);
        const rewards = ctx.store.recordSession({
            type: 'reading',
            correct: state.cardsRead,
            total,
            durationSec,
            stars,
            xpEarned: state.xpEarned
        });

        cleanup();

        if (!showResult) {
            ctx.showToast('Прочитанные карточки сохранены', { type: 'success' });
            return;
        }

        renderResult(container, {
            ctx,
            type: 'reading',
            correct: state.cardsRead,
            total,
            stars,
            grade: 0,
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

    async function canLeave() {
        if (state.cardsRead === 0 || state.sessionRecorded) return true;

        const confirmed = await ctx.confirmDialog({
            title: 'Выйти из чтения?',
            message: 'Прочитанные карточки сохранятся, звёзды и история тоже. Продолжить можно будет в любое время.',
            confirmText: 'Выйти',
            cancelText: 'Остаться',
            danger: true
        });

        if (confirmed) finishSession(false);
        return confirmed;
    }

    function onKeydown(event) {
        if (document.querySelector('dialog[open]')) return;
        const target = event.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (target && target.closest && target.closest('button, a, [role="switch"]') && (event.key === 'Enter' || event.key === ' ')) return;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(state.index - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(state.index + 1);
        } else if (event.key === ' ') {
            event.preventDefault();
            play(true);
        }
    }

    listenButton.addEventListener('click', () => play(true));
    wordElement.addEventListener('click', () => play(true));
    wordElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            play(true);
        }
    });
    prevButton.addEventListener('click', () => goTo(state.index - 1));
    nextButton.addEventListener('click', () => goTo(state.index + 1));
    finishButton.addEventListener('click', () => {
        if (state.cardsRead === 0) {
            ctx.navigate('#/');
            return;
        }
        finishSession(true);
    });
    document.addEventListener('keydown', onKeydown);

    timer.start();
    flushInterval = setInterval(flushTime, 30000);
    updateCard();

    return { cleanup, canLeave };
}

export function renderReading(container, ctx) {
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
