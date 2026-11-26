// Общий экран завершения сессии для математики, чтения и теста.

import { icon } from '../ui/icons.js';
import { mascot } from '../ui/mascot.js';
import { escapeHtml } from '../ui/html.js';
import { burstConfetti } from '../ui/confetti.js';
import { formatTime } from '../scoring.js';

function starsRow(stars) {
    return `<div class="result-stars" aria-label="${stars} из 3 звёзд">${[0, 1, 2]
        .map(index => `<span class="${index < stars ? 'is-filled' : ''}">${icon('star', { size: 52 })}</span>`)
        .join('')}</div>`;
}

function resultTitle(type, stars, correct) {
    if (type === 'reading') return `Ты прочитал ${correct} карточек!`;
    if (stars >= 3) return 'Отлично!';
    if (stars >= 2) return 'Хорошо!';
    return 'Готово!';
}

export function renderResult(container, {
    ctx,
    type,
    correct,
    total,
    stars,
    grade,
    durationSec,
    xpEarned = 0,
    bonusXp = 0,
    badgeXp = 0,
    startLevel = 1,
    newBadges = [],
    onRestart = () => {},
    onHome = () => {}
} = {}) {
    const level = ctx.store.getLevelInfo();
    const levelUp = level.level > startLevel;
    const totalXp = Number(xpEarned) + Number(bonusXp) + Number(badgeXp);
    const badgeMap = new Map(ctx.store.getBadgeDefinitions().map(badge => [badge.id, badge]));
    const earnedBadges = newBadges.map(id => badgeMap.get(id)).filter(Boolean);
    const title = resultTitle(type, stars, correct);
    const showGrade = type !== 'reading';

    container.innerHTML = `
        <div class="lesson-shell">
            <header class="app-bar">
                <a class="icon-button" href="#/" aria-label="На главную">${icon('arrowLeft', { size: 20 })}</a>
                <div>
                    <p class="app-bar-title">Результат</p>
                    <p class="app-bar-subtitle">${type === 'reading' ? 'Чтение' : type === 'test' ? 'Тест на слух' : 'Математика'}</p>
                </div>
            </header>
            <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start px-4 py-6 sm:justify-center sm:py-10">
                <div class="card card-elevated result-card">
                    <div class="mascot result-mascot mx-auto">${mascot(stars >= 3 || levelUp ? 'party' : 'happy', { size: 180 })}</div>
                    ${starsRow(stars)}
                    <h1 class="mt-4 text-2xl font-black sm:text-3xl">${title}</h1>
                    <p class="muted mt-2">${stars >= 3 ? 'Байт гордится тобой!' : 'Каждая попытка делает тебя сильнее.'}</p>

                    <div class="mt-6 grid grid-cols-3 gap-2">
                        <div class="rounded-2xl bg-surface-2 p-3 text-center">
                            <p class="text-lg font-extrabold">${correct}/${total}</p>
                            <p class="muted text-xs">${type === 'reading' ? 'карточек' : 'правильно'}</p>
                        </div>
                        <div class="rounded-2xl bg-surface-2 p-3 text-center">
                            <p class="text-lg font-extrabold">${icon('clock', { size: 15 })} ${formatTime(durationSec).slice(3)}</p>
                            <p class="muted text-xs">время</p>
                        </div>
                        <div class="rounded-2xl bg-surface-2 p-3 text-center">
                            <p class="text-lg font-extrabold text-primary-strong">+${totalXp}</p>
                            <p class="muted text-xs">XP</p>
                        </div>
                    </div>

                    ${showGrade ? `<div class="mt-5 flex items-center justify-center gap-3">
                        <span class="result-grade">${grade}</span>
                        <div class="text-left">
                            <p class="font-extrabold">Оценка</p>
                            <p class="muted text-sm">по школьной шкале</p>
                        </div>
                    </div>` : ''}

                    ${levelUp ? `<div class="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-2 font-extrabold text-primary-strong">
                        ${icon('sparkles', { size: 18 })} Новый уровень ${level.level}!
                    </div>` : ''}

                    ${earnedBadges.length > 0 ? `<div class="mt-5">
                        <p class="text-label uppercase tracking-[0.12em] text-primary-strong">Новые бейджи</p>
                        <div class="mt-2 grid grid-cols-2 gap-2">
                            ${earnedBadges.map(badge => `<div class="badge-card">
                                <span class="badge-icon">${icon('award', { size: 20 })}</span>
                                <span class="font-bold">${escapeHtml(badge.title)}</span>
                            </div>`).join('')}
                        </div>
                    </div>` : ''}

                    <div class="mt-7 flex flex-wrap justify-center gap-3">
                        <button class="btn btn-primary" type="button" data-result-restart>${icon('rotate', { size: 18 })} Ещё раз</button>
                        <button class="btn btn-tonal" type="button" data-result-home>${icon('home', { size: 18 })} На главную</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.querySelector('[data-result-restart]').addEventListener('click', onRestart);
    container.querySelector('[data-result-home]').addEventListener('click', () => {
        if (typeof onHome === 'function') onHome();
        else ctx.navigate('#/');
    });

    if (stars >= 3 || levelUp) {
        burstConfetti({ count: 90 });
    }
}
