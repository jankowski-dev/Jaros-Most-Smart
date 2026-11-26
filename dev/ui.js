import { icon, ICON_NAMES } from '../js/ui/icons.js';
import { mascot } from '../js/ui/mascot.js';
import { showToast } from '../js/ui/toast.js';
import { confirmDialog } from '../js/ui/dialog.js';
import { burstConfetti } from '../js/ui/confetti.js';

if (new URLSearchParams(location.search).has('dark')) {
    document.documentElement.classList.add('dark');
}

function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((element) => {
        const large = element.classList.contains('subject-card-icon');
        element.innerHTML = icon(element.dataset.icon, { size: large ? 28 : 20 });
    });
}

hydrateIcons();

document.getElementById('stars-demo').innerHTML = [0, 1, 2]
    .map(() => `<span class="star is-filled">${icon('star', { size: 22 })}</span>`)
    .join('');

document.getElementById('mascot-grid').innerHTML = ['idle', 'happy', 'sad', 'think', 'sleep', 'party']
    .map(state => `
        <div class="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3">
            <div class="mascot">${mascot(state, { size: 120 })}</div>
            <span class="text-caption muted">${state}</span>
        </div>
    `)
    .join('');

document.getElementById('icon-grid').innerHTML = ICON_NAMES
    .map(name => `
        <div class="flex flex-col items-center gap-1 rounded-xl border border-line p-2 text-ink-muted">
            ${icon(name, { size: 20 })}
            <span class="text-[10px]">${name}</span>
        </div>
    `)
    .join('');

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    themeToggle.textContent = dark ? 'Светлая тема' : 'Тёмная тема';
});

document.querySelectorAll('[data-toast]').forEach((button) => {
    button.addEventListener('click', () => {
        const type = button.dataset.toast;
        const messages = {
            success: 'Отлично! Байт гордится тобой!',
            info: 'Сегодня потренируем лапки?',
            warning: 'Почти! Попробуем ещё.',
            error: 'Не получилось озвучить. Попробуй ещё раз.'
        };
        showToast(messages[type] || messages.info, { type });
    });
});

document.querySelector('[data-confirm]').addEventListener('click', async () => {
    const result = await confirmDialog({
        title: 'Сбросить прогресс?',
        message: 'XP, уровень, серия, бейджи и история исчезнут. Имя, тема, звук и сложность останутся.',
        confirmText: 'Сбросить',
        danger: true
    });
    showToast(result ? 'Прогресс сброшен (демо)' : 'Отменено', { type: result ? 'success' : 'info' });
});

document.querySelector('[data-confetti]').addEventListener('click', () => {
    burstConfetti({ count: 90 });
});
