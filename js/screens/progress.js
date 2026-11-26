// Экран прогресса: уровень, серия, звёзды, предметы, бейджи и история.

import { icon } from '../ui/icons.js';
import { mascot } from '../ui/mascot.js';
import { escapeHtml } from '../ui/html.js';
import { getAccuracy, getLast7Days, getTotalStars } from '../progress-utils.js';

const TYPE_LABELS = {
    math: 'Математика',
    reading: 'Чтение',
    test: 'Тест на слух'
};

const TYPE_ICONS = {
    math: 'plus',
    reading: 'book',
    test: 'headphones'
};

function starRow(count, size = 16) {
    return `<span class="stars" aria-label="${count} из 3 звёзд">${[0, 1, 2]
        .map(index => `<span class="star ${index < count ? 'is-filled' : ''}">${icon('star', { size })}</span>`)
        .join('')}</span>`;
}

function subjectCard(iconName, title, value, label, meta, stars = 0) {
    return `<div class="card p-4 sm:p-5">
        <div class="flex items-center gap-3">
            <span class="badge-icon flex-shrink-0">${icon(iconName, { size: 22 })}</span>
            <div>
                <p class="font-extrabold">${title}</p>
                <p class="muted text-xs">${meta}</p>
            </div>
        </div>
        <div class="mt-4 flex items-end justify-between gap-3">
            <div>
                <p class="stat-value">${value}</p>
                <p class="muted text-xs">${label}</p>
            </div>
            ${starRow(stars)}
        </div>
    </div>`;
}

function historyRow(entry) {
    const label = TYPE_LABELS[entry.type] || entry.type;
    const date = new Date(entry.date);
    const dateText = Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
    const result = entry.type === 'reading'
        ? `${entry.correct} карточек`
        : `${entry.correct}/${entry.total}`;

    return `<div class="history-item">
        <span class="badge-icon flex-shrink-0">${icon(TYPE_ICONS[entry.type] || 'chart', { size: 20 })}</span>
        <div class="min-w-0 flex-1">
            <p class="font-bold">${label}</p>
            <p class="muted text-xs">${dateText}</p>
        </div>
        <div class="flex flex-col items-end gap-1">
            <p class="font-extrabold">${result}</p>
            ${starRow(entry.stars || 0, 14)}
        </div>
    </div>`;
}

export function renderProgress(container, ctx) {
    const progress = ctx.store.getProgress();
    const level = ctx.store.getLevelInfo();
    const days = getLast7Days(progress.streak.activeDays);
    const totalStars = getTotalStars(progress);
    const badges = ctx.store.getBadgeDefinitions();
    const math = progress.subjects.math;
    const reading = progress.subjects.reading;
    const test = progress.subjects.test;
    const hasHistory = progress.history.length > 0;

    container.innerHTML = `
        <div class="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p class="text-caption uppercase tracking-[0.16em] text-ink-muted">Твой прогресс</p>
                    <h1 class="text-title mt-1">Паутинка Байта</h1>
                    <p class="muted mt-1 text-sm">Звёзды, серия и бейджи — всё, что ты уже собрал.</p>
                </div>
                <div class="mascot">${mascot(hasHistory ? 'happy' : 'sleep', { size: 120 })}</div>
            </header>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
                <div class="stat-tile">
                    <span class="stat-label">Уровень</span>
                    <span class="stat-value">${level.level}</span>
                    <span class="muted text-sm">${level.totalXp} XP всего</span>
                </div>
                <div class="stat-tile">
                    <span class="stat-label">Серия</span>
                    <span class="stat-value">${progress.streak.current}</span>
                    <span class="muted text-sm">лучшая: ${progress.streak.best}</span>
                </div>
                <div class="stat-tile">
                    <span class="stat-label">Звёзды</span>
                    <span class="stat-value">${totalStars}/9</span>
                    <span class="muted text-sm">за предметы</span>
                </div>
            </div>

            <div class="mt-4 grid gap-4 lg:grid-cols-2">
                <section class="card p-4 sm:p-5">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p class="text-label uppercase tracking-[0.12em] text-primary-strong">Уровень ${level.level}</p>
                            <p class="muted mt-1 text-sm">До следующего уровня</p>
                        </div>
                        <span class="chip">${level.xpIntoLevel}/${level.xpForNext} XP</span>
                    </div>
                    <div class="progress-track mt-4"><div class="progress-fill" style="width: ${level.xpIntoLevel}%"></div></div>
                    <p class="muted mt-3 text-sm">Каждый ответ и каждая прочитанная карточка приближают новый уровень.</p>
                </section>

                <section class="card p-4 sm:p-5">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p class="text-label uppercase tracking-[0.12em] text-primary-strong">Серия дней</p>
                            <p class="muted mt-1 text-sm">${progress.streak.current > 0 ? 'Не разрывай паутинку!' : 'Начни серию сегодня'}</p>
                        </div>
                        <span class="chip">${icon('flame', { size: 14 })} ${progress.streak.current}</span>
                    </div>
                    <div class="streak-dots mt-4">
                        ${days.map(day => `<span class="streak-dot ${day.active ? 'is-active' : ''}" title="${day.date}">${day.label}</span>`).join('')}
                    </div>
                </section>
            </div>

            <section class="mt-6">
                <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-extrabold">Предметы</h2>
                        <p class="muted mt-1 text-sm">Точность и лучшие результаты.</p>
                    </div>
                </div>
                <div class="mt-3 grid gap-3 md:grid-cols-3">
                    ${subjectCard('plus', 'Математика', `${getAccuracy(math)}%`, 'точность', `${math.sessions} сессий`, math.bestStars)}
                    ${subjectCard('book', 'Чтение', reading.cardsRead, 'карточек', `${reading.sessions} сессий · ${Math.round(reading.totalSeconds / 60)} мин`, reading.bestStars)}
                    ${subjectCard('headphones', 'Тест на слух', `${getAccuracy(test)}%`, 'точность', `${test.sessions} сессий`, test.bestStars)}
                </div>
            </section>

            <section class="mt-6">
                <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-extrabold">Бейджи</h2>
                        <p class="muted mt-1 text-sm">Открыто ${Object.keys(progress.badges).length} из ${badges.length}.</p>
                    </div>
                </div>
                <div class="badge-grid mt-3">
                    ${badges.map(badge => {
                        const unlocked = Boolean(progress.badges[badge.id]);
                        return `<div class="badge-card ${unlocked ? '' : 'is-locked'}" title="${escapeHtml(badge.description)}">
                            <span class="badge-icon">${icon(unlocked ? 'award' : 'lock', { size: 22 })}</span>
                            <span class="font-bold">${escapeHtml(badge.title)}</span>
                            <span class="muted text-xs">${escapeHtml(badge.description)}</span>
                        </div>`;
                    }).join('')}
                </div>
            </section>

            <section class="mt-6">
                <div class="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-extrabold">Последние занятия</h2>
                        <p class="muted mt-1 text-sm">Последние 10 сессий.</p>
                    </div>
                </div>
                ${hasHistory
                    ? `<div class="card mt-3 p-4 sm:p-5">${progress.history.slice(0, 10).map(historyRow).join('')}</div>`
                    : `<div class="card mt-3 empty-state">
                        <div class="mascot">${mascot('sleep', { size: 130 })}</div>
                        <p class="font-extrabold">Пока здесь тихо</p>
                        <p class="max-w-sm text-sm">Начни первый урок — и Байт запишет твои звёзды и серию.</p>
                        <a class="btn btn-primary mt-2" href="#/">Начать урок</a>
                    </div>`}
            </section>
        </div>
    `;

    return { destroy() {} };
}
