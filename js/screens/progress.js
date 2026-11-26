// Временный экран прогресса до Task 7.

import { mascot } from '../ui/mascot.js';

export function renderProgress(container) {
    container.innerHTML = `
        <div class="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
            <div class="mascot">${mascot('sleep', { size: 180 })}</div>
            <h1 class="text-title mt-4">Прогресс</h1>
            <p class="muted mt-2 max-w-md">Скоро здесь появятся уровень, серия дней, звёзды и бейджи. Байт уже плетёт паутинку.</p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
                <a class="btn btn-primary" href="#/">На главную</a>
                <a class="btn btn-tonal" href="#/settings">Настройки</a>
            </div>
        </div>
    `;

    return { destroy() {} };
}
