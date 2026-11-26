// Нижняя навигация для телефона/планшета и rail для десктопа с мышью.

import { icon } from './icons.js';
import { mascot } from './mascot.js';

const ITEMS = [
    { name: 'home', href: '#/', label: 'Учиться', icon: 'home' },
    { name: 'progress', href: '#/progress', label: 'Прогресс', icon: 'chart' },
    { name: 'settings', href: '#/settings', label: 'Настройки', icon: 'settings' }
];

function navItem(item, active, compact = false) {
    const isActive = active === item.name;
    const size = compact ? 22 : 24;
    return `<a class="nav-item ${isActive ? 'is-active' : ''}" href="${item.href}" ${isActive ? 'aria-current="page"' : ''}>
        ${icon(item.icon, { size })}
        <span>${item.label}</span>
    </a>`;
}

export function renderNav(active = 'home') {
    return `
        <nav class="bottom-nav" aria-label="Основная навигация">
            ${ITEMS.map(item => navItem(item, active, true)).join('')}
        </nav>
        <aside class="nav-rail">
            <a class="mb-8 flex items-center gap-1.5 px-2 text-2xl font-black tracking-wider no-underline" href="#/">
                <span class="text-ink">ЯРИК</span><span class="text-primary">.УРОКИ</span>
            </a>
            <nav class="flex flex-col gap-1" aria-label="Основная навигация">
                ${ITEMS.map(item => navItem(item, active)).join('')}
            </nav>
            <div class="mt-auto flex flex-col items-center gap-1 px-2 pb-2 text-center">
                <div class="mascot opacity-90">${mascot('idle', { size: 112 })}</div>
                <span class="text-caption muted">Байт на связи</span>
                <span class="text-caption muted">v${window.APP_VERSION || '3.0.0'}</span>
            </div>
        </aside>
    `;
}
