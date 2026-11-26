// Временный экран урока до Task 9–11.

import { icon } from '../ui/icons.js';
import { mascot } from '../ui/mascot.js';

const TITLES = {
    math: 'Математика',
    reading: 'Чтение',
    test: 'Тест на слух'
};

export function renderPlayPlaceholder(container, ctx) {
    const type = ctx.route.type;
    const title = TITLES[type] || 'Урок';

    container.innerHTML = `
        <div class="lesson-shell">
            <header class="app-bar">
                <a class="icon-button" href="#/" aria-label="На главную">${icon('arrowLeft', { size: 20 })}</a>
                <div>
                    <p class="app-bar-title">${title}</p>
                    <p class="app-bar-subtitle">Скоро</p>
                </div>
            </header>
            <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                <div class="mascot">${mascot('think', { size: 190 })}</div>
                <h1 class="text-title mt-4">Урок скоро появится</h1>
                <p class="muted mt-2 max-w-md">Байт уже готовит задания. Пока можно вернуться на главную и выбрать другой предмет.</p>
                <a class="btn btn-primary mt-6" href="#/">На главную</a>
            </div>
        </div>
    `;

    return {
        destroy() {},
        canLeave: () => true
    };
}
