// Главная: приветствие, Байт, цель дня, предметы и мини-прогресс.

import { icon } from '../ui/icons.js';
import { mascot } from '../ui/mascot.js';
import { escapeHtml, formatDate, pluralDays } from '../ui/html.js';

const SUBJECTS = [
    { type: 'math', title: 'Математика', icon: 'plus', className: 'subject-card--math' },
    { type: 'reading', title: 'Чтение', icon: 'book', className: 'subject-card--reading' },
    { type: 'test', title: 'Тест на слух', icon: 'headphones', className: 'subject-card--test' }
];

function difficultyHint(difficulty) {
    return difficulty === 'hard'
        ? 'Сложный: примеры до 20 и целые предложения'
        : 'Лёгкий: сложение до 10 и слоги';
}

function subjectDescription(type, difficulty) {
    if (type === 'math') return difficulty === 'hard' ? 'Примеры до 20' : 'Сложение до 10';
    if (type === 'reading') return difficulty === 'hard' ? 'Предложения' : 'Слоги и слова';
    return '10 слов';
}

function lastEntry(progress, type) {
    return progress.history.find(entry => entry.type === type) || null;
}

function lastResult(progress, type) {
    const entry = lastEntry(progress, type);
    if (!entry) return 'Пока нет';
    if (type === 'reading') return `${entry.correct} карточек`;
    return `${entry.correct}/${entry.total}`;
}

function starsMarkup(count) {
    return `<span class="stars" aria-label="${count} из 3 звёзд">${[0, 1, 2]
        .map(index => `<span class="star ${index < count ? 'is-filled' : ''}">${icon('star', { size: 18 })}</span>`)
        .join('')}</span>`;
}

function recentBadges(ctx, progress) {
    const definitions = ctx.store.getBadgeDefinitions();
    const earned = definitions.filter(badge => progress.badges[badge.id]).slice(-3);

    if (earned.length === 0) {
        return '<span class="chip chip-muted">Пока нет бейджей</span>';
    }

    return earned
        .map(badge => `<span class="chip chip-primary">${icon('award', { size: 14 })} ${escapeHtml(badge.title)}</span>`)
        .join('');
}

function subjectCard(subject, ctx, progress, difficulty) {
    const bestStars = progress.subjects[subject.type].bestStars || 0;

    return `<button class="subject-card ${subject.className}" type="button" data-play="${subject.type}">
        <span class="flex items-start justify-between gap-3">
            <span class="subject-card-icon">${icon(subject.icon, { size: 28 })}</span>
            <span class="subject-card-arrow">${icon('arrowRight', { size: 18 })}</span>
        </span>
        <span class="mt-5 block">
            <span class="block text-lg font-extrabold">${subject.title}</span>
            <span class="muted mt-1 block text-sm" data-subject-description="${subject.type}">${subjectDescription(subject.type, difficulty)}</span>
            <span class="mt-3 flex flex-wrap items-center gap-2">
                ${starsMarkup(bestStars)}
                <span class="text-xs font-bold">${lastResult(progress, subject.type)}</span>
            </span>
        </span>
    </button>`;
}

export function renderHome(container, ctx) {
    const settings = ctx.store.getSettings();
    const progress = ctx.store.getProgress();
    const level = ctx.store.getLevelInfo();
    const difficulty = settings.settings.difficulty;
    const name = escapeHtml(settings.profile.name);
    const daily = progress.daily;
    const minutes = Math.round(daily.seconds / 60);
    const goalMinutes = Math.max(1, Math.round(daily.goalSeconds / 60));
    const percent = Math.min(100, Math.round((daily.seconds / daily.goalSeconds) * 100));
    const remaining = Math.max(0, goalMinutes - minutes);
    const totalStars = Object.values(progress.subjects).reduce((sum, subject) => sum + (subject.bestStars || 0), 0);
    const hasSessions = Object.values(progress.subjects).some(subject => subject.sessions > 0);
    const greeting = hasSessions
        ? 'Байт уже размял лапки. Продолжим?'
        : 'Первый раз? Начни с математики — я подскажу.';
    const streakChip = progress.streak.current > 0
        ? `<span class="chip">${icon('flame', { size: 14 })} ${pluralDays(progress.streak.current)}</span>`
        : `<span class="chip">${icon('sparkles', { size: 14 })} Начни серию</span>`;

    container.innerHTML = `
        <div class="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8">
            <header class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p class="text-caption uppercase tracking-[0.16em] text-ink-muted">${formatDate()}</p>
                    <h1 class="text-title mt-1">Привет, ${name}!</h1>
                </div>
                <div class="flex items-center gap-2">
                    <span class="chip chip-primary">${icon('star', { size: 14 })} Ур. ${level.level}</span>
                    <a class="icon-button" href="#/settings" aria-label="Настройки">${icon('settings', { size: 20 })}</a>
                </div>
            </header>

            <section class="hero-card card mt-5">
                <div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div class="max-w-xl">
                        <span class="chip chip-primary">Уроки с Байтом</span>
                        <h2 class="mt-3 text-2xl font-black">${greeting}</h2>
                        <p class="muted mt-2">Короткие задания, звёзды и паутинка прогресса — без спешки.</p>
                        <div class="mt-5 flex flex-wrap items-center gap-3">
                            <div class="ring" style="--value: ${percent}%"><span class="ring-label">${minutes}/${goalMinutes}</span></div>
                            <div>
                                <p class="font-extrabold">Цель дня</p>
                                <p class="muted text-sm">${remaining > 0 ? `Ещё ${remaining} мин` : 'Цель выполнена!'}</p>
                            </div>
                            ${streakChip}
                        </div>
                    </div>
                    <div class="mascot self-center md:self-end">${mascot(hasSessions ? 'happy' : 'idle', { size: 190 })}</div>
                </div>
            </section>

            <section class="mt-6">
                <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-extrabold">Что потренируем?</h2>
                        <p class="muted mt-1 text-sm">Выбери предмет — Байт подскажет.</p>
                    </div>
                    <div class="segmented" role="group" aria-label="Сложность">
                        <button type="button" data-difficulty="easy" aria-pressed="${difficulty === 'easy'}">Лёгкий</button>
                        <button type="button" data-difficulty="hard" aria-pressed="${difficulty === 'hard'}">Сложный</button>
                    </div>
                </div>
                <p class="muted mt-2 text-xs" data-difficulty-hint>${difficultyHint(difficulty)}</p>
                <div class="subject-grid mt-3">
                    ${SUBJECTS.map(subject => subjectCard(subject, ctx, progress, difficulty)).join('')}
                </div>
            </section>

            <section class="card mt-6 p-4 sm:p-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span class="badge-icon">${icon('award', { size: 24 })}</span>
                        <div>
                            <p class="font-extrabold">Уровень ${level.level}</p>
                            <p class="muted text-sm">${level.xpIntoLevel} из ${level.xpForNext} XP до следующего</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="chip">${icon('star', { size: 14 })} ${totalStars}/9</span>
                        <a class="btn btn-tonal btn-sm" href="#/progress">Весь прогресс ${icon('arrowRight', { size: 16 })}</a>
                    </div>
                </div>
                <div class="progress-track mt-4"><div class="progress-fill" style="width: ${level.xpIntoLevel}%"></div></div>
                <div class="mt-4 flex flex-wrap items-center gap-2">${recentBadges(ctx, progress)}</div>
            </section>

            <section class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="card flex items-start gap-3 p-4">
                    <span class="badge-icon flex-shrink-0">${icon('target', { size: 22 })}</span>
                    <div><p class="font-extrabold">Выбери предмет</p><p class="muted mt-1 text-sm">Математика, чтение или тест.</p></div>
                </div>
                <div class="card flex items-start gap-3 p-4">
                    <span class="badge-icon flex-shrink-0">${icon('check', { size: 22 })}</span>
                    <div><p class="font-extrabold">Ответь</p><p class="muted mt-1 text-sm">Короткая сессия — 5–10 минут.</p></div>
                </div>
                <div class="card flex items-start gap-3 p-4">
                    <span class="badge-icon flex-shrink-0">${icon('star', { size: 22 })}</span>
                    <div><p class="font-extrabold">Получи звёзды</p><p class="muted mt-1 text-sm">XP, бейджи и серия дней.</p></div>
                </div>
            </section>

            <section class="card mt-4 flex items-center gap-3 p-4">
                <div class="mascot flex-shrink-0">${mascot('think', { size: 76 })}</div>
                <div>
                    <p class="text-label uppercase tracking-[0.12em] text-primary-strong">Совет Байта</p>
                    <p class="mt-1 text-sm font-bold">Сначала один пример, потом одна карточка — так мозг не устаёт.</p>
                </div>
            </section>
        </div>
    `;

    const difficultyButtons = container.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextDifficulty = button.dataset.difficulty;
            ctx.store.updateSettings({ settings: { difficulty: nextDifficulty } });
            difficultyButtons.forEach(other => {
                other.setAttribute('aria-pressed', String(other.dataset.difficulty === nextDifficulty));
            });
            const hint = container.querySelector('[data-difficulty-hint]');
            if (hint) hint.textContent = difficultyHint(nextDifficulty);

            container.querySelectorAll('[data-subject-description]').forEach(description => {
                description.textContent = subjectDescription(description.dataset.subjectDescription, nextDifficulty);
            });
        });
    });

    container.querySelectorAll('[data-play]').forEach(button => {
        button.addEventListener('click', () => ctx.startPlay(button.dataset.play));
    });

    return { destroy() {} };
}
