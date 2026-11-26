// Временный экран настроек до Task 6.

import { mascot } from '../ui/mascot.js';

export function renderSettings(container) {
    container.innerHTML = `
        <div class="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
            <div class="mascot">${mascot('think', { size: 180 })}</div>
            <h1 class="text-title mt-4">Настройки</h1>
            <p class="muted mt-2 max-w-md">Скоро здесь можно будет поменять имя, звук, сложность и тему. Пока — версия ${window.APP_VERSION || '3.0.0'}.</p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
                <a class="btn btn-primary" href="#/">На главную</a>
                <a class="btn btn-tonal" href="#/progress">Прогресс</a>
            </div>
        </div>
    `;

    return { destroy() {} };
}
