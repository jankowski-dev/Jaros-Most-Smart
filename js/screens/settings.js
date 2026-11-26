// Настройки: имя, звук, эффекты, сложность, тема и сброс прогресса.

import { icon } from '../ui/icons.js';
import { mascot } from '../ui/mascot.js';
import { escapeHtml } from '../ui/html.js';
import { applyTheme } from '../theme.js';

function switchRow(id, title, description, checked) {
    return `<div class="settings-row">
        <div>
            <p class="font-bold">${title}</p>
            <p class="muted text-sm">${description}</p>
        </div>
        <button class="switch" type="button" role="switch" aria-checked="${checked}" aria-label="${title}" data-toggle="${id}">
            <span class="switch-thumb"></span>
        </button>
    </div>`;
}

function sectionHeader(iconName, title) {
    return `<div class="mb-3 flex items-center gap-3">
        <span class="badge-icon">${icon(iconName, { size: 20 })}</span>
        <h2 class="text-lg font-extrabold">${title}</h2>
    </div>`;
}

export function renderSettings(container, ctx) {
    const settings = ctx.store.getSettings();
    const profile = settings.profile;
    const prefs = settings.settings;
    const version = window.APP_VERSION || '3.0.0';

    container.innerHTML = `
        <div class="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p class="text-caption uppercase tracking-[0.16em] text-ink-muted">Настройки</p>
                    <h1 class="text-title mt-1">Настройки Байта</h1>
                </div>
                <div class="mascot">${mascot('happy', { size: 104 })}</div>
            </header>

            <div class="settings-grid mt-5">
                <section class="settings-section">
                    ${sectionHeader('user', 'Профиль')}
                    <label class="field">
                        <span class="field-label">Как тебя называть</span>
                        <input id="settings-name" class="field-input" maxlength="20" value="${escapeHtml(profile.name)}" autocomplete="off">
                    </label>
                    <p class="muted mt-2 text-xs">Так Байт будет здороваться и хвалить.</p>
                </section>

                <section class="settings-section">
                    ${sectionHeader('volume', 'Звук')}
                    ${switchRow('sound', 'Озвучка', 'Голос Байта и чтение слов', prefs.sound)}
                    ${switchRow('effects', 'Звуковые эффекты', 'Короткие сигналы правильно/ошибка', prefs.effects)}
                </section>

                <section class="settings-section">
                    ${sectionHeader('target', 'Сложность')}
                    <div class="segmented" role="group" aria-label="Сложность">
                        <button type="button" data-setting="difficulty" data-value="easy" aria-pressed="${prefs.difficulty === 'easy'}">Лёгкий</button>
                        <button type="button" data-setting="difficulty" data-value="hard" aria-pressed="${prefs.difficulty === 'hard'}">Сложный</button>
                    </div>
                    <p class="muted mt-3 text-sm" data-difficulty-copy>${prefs.difficulty === 'hard' ? 'Примеры до 20 и целые предложения.' : 'Сложение до 10 и слоги.'}</p>
                </section>

                <section class="settings-section">
                    ${sectionHeader('sun', 'Тема')}
                    <div class="segmented" role="group" aria-label="Тема">
                        <button type="button" data-setting="theme" data-value="light" aria-pressed="${prefs.theme === 'light'}">${icon('sun', { size: 16 })} Светлая</button>
                        <button type="button" data-setting="theme" data-value="dark" aria-pressed="${prefs.theme === 'dark'}">${icon('moon', { size: 16 })} Тёмная</button>
                        <button type="button" data-setting="theme" data-value="system" aria-pressed="${prefs.theme === 'system'}">${icon('system', { size: 16 })} Как в системе</button>
                    </div>
                    <p class="muted mt-3 text-sm">Тема применяется сразу.</p>
                </section>

                <section class="settings-section lg:col-span-2">
                    ${sectionHeader('trash', 'Прогресс')}
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p class="font-bold">Сбросить прогресс</p>
                            <p class="muted mt-1 max-w-xl text-sm">XP, уровень, серия, бейджи и история исчезнут. Имя, тема, звук и сложность останутся.</p>
                        </div>
                        <button id="reset-progress" class="btn btn-danger" type="button">${icon('trash', { size: 18 })} Сбросить</button>
                    </div>
                </section>

                <section class="settings-section lg:col-span-2">
                    ${sectionHeader('info', 'О приложении')}
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="mascot">${mascot('idle', { size: 96 })}</div>
                        <div>
                            <p class="font-extrabold">Ярик.Уроки — уроки с Байтом</p>
                            <p class="muted mt-1 text-sm">Версия ${escapeHtml(version)} · Сделано для Ярика · Байт одобряет</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;

    const nameInput = container.querySelector('#settings-name');
    const saveName = () => {
        const saved = ctx.store.updateSettings({ profile: { name: nameInput.value } });
        nameInput.value = saved.profile.name;
        ctx.showToast('Сохранено', { type: 'success' });
    };

    nameInput.addEventListener('blur', saveName);
    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            nameInput.blur();
        }
    });

    container.querySelectorAll('[data-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.toggle;
            const next = button.getAttribute('aria-checked') !== 'true';
            button.setAttribute('aria-checked', String(next));
            ctx.store.updateSettings({ settings: { [key]: next } });
        });
    });

    const difficultyCopy = container.querySelector('[data-difficulty-copy]');
    container.querySelectorAll('[data-setting="difficulty"]').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;
            ctx.store.updateSettings({ settings: { difficulty: value } });
            container.querySelectorAll('[data-setting="difficulty"]').forEach(other => {
                other.setAttribute('aria-pressed', String(other.dataset.value === value));
            });
            if (difficultyCopy) {
                difficultyCopy.textContent = value === 'hard'
                    ? 'Примеры до 20 и целые предложения.'
                    : 'Сложение до 10 и слоги.';
            }
        });
    });

    container.querySelectorAll('[data-setting="theme"]').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;
            ctx.store.updateSettings({ settings: { theme: value } });
            applyTheme(value);
            container.querySelectorAll('[data-setting="theme"]').forEach(other => {
                other.setAttribute('aria-pressed', String(other.dataset.value === value));
            });
        });
    });

    const themeMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onSystemThemeChange = () => {
        if (ctx.store.getSettings().settings.theme === 'system') applyTheme('system');
    };
    if (themeMedia) themeMedia.addEventListener('change', onSystemThemeChange);

    const resetButton = container.querySelector('#reset-progress');
    resetButton.addEventListener('click', async () => {
        const confirmed = await ctx.confirmDialog({
            title: 'Сбросить прогресс?',
            message: 'XP, уровень, серия, бейджи и история исчезнут. Имя, тема, звук и сложность останутся.',
            confirmText: 'Сбросить',
            danger: true
        });

        if (!confirmed) return;

        ctx.store.resetProgress();
        ctx.showToast('Прогресс сброшен', { type: 'success' });
        ctx.navigate('#/');
    });

    return {
        destroy() {
            if (themeMedia) themeMedia.removeEventListener('change', onSystemThemeChange);
        }
    };
}
