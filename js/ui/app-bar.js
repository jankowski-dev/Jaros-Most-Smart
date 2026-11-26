// Общий app bar урока/теста: назад, заголовок, уровень, таймер и звук.

import { icon } from './icons.js';

export function renderAppBar({ title, subtitle = '', showBack = true, showSound = true, level = '' } = {}) {
    return `<header class="app-bar">
        <div class="flex min-w-0 items-center gap-2">
            ${showBack ? `<button class="icon-button flex-shrink-0" type="button" data-app-back aria-label="Назад">${icon('arrowLeft', { size: 20 })}</button>` : ''}
            <div class="min-w-0">
                <p class="app-bar-title truncate">${title}</p>
                ${subtitle ? `<p class="app-bar-subtitle truncate">${subtitle}</p>` : ''}
            </div>
        </div>
        <div class="ml-auto flex flex-shrink-0 items-center gap-2">
            ${level ? `<span class="chip chip-primary hidden sm:inline-flex">${level}</span>` : ''}
            <span class="chip tabular" data-app-timer>00:00</span>
            ${showSound ? `<button class="icon-button" type="button" data-app-sound aria-label="Выключить звук" aria-pressed="true">${icon('volume', { size: 20 })}</button>` : ''}
        </div>
    </header>`;
}

export function bindAppBar(container, { onBack, store, showToast, speech } = {}) {
    const back = container.querySelector('[data-app-back]');
    const sound = container.querySelector('[data-app-sound]');

    const onBackClick = () => {
        if (typeof onBack === 'function') onBack();
    };

    if (back) back.addEventListener('click', onBackClick);

    const updateSound = () => {
        if (!sound) return;
        const enabled = store.getSettings().settings.sound;
        sound.innerHTML = icon(enabled ? 'volume' : 'volumeOff', { size: 20 });
        sound.setAttribute('aria-pressed', String(enabled));
        sound.setAttribute('aria-label', enabled ? 'Выключить звук' : 'Включить звук');
    };

    const onSoundClick = () => {
        const enabled = store.getSettings().settings.sound;
        const next = !enabled;
        store.updateSettings({ settings: { sound: next } });
        if (!next && speech) speech.cancel();
        updateSound();
        if (showToast) showToast(next ? 'Озвучка включена' : 'Озвучка выключена', { type: 'info' });
    };

    if (sound) {
        updateSound();
        sound.addEventListener('click', onSoundClick);
    }

    return () => {
        if (back) back.removeEventListener('click', onBackClick);
        if (sound) sound.removeEventListener('click', onSoundClick);
    };
}
