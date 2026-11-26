// Встроенные SVG-иконки. Без внешних библиотек и CDN.

const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="7" rx="2"/><rect x="17" y="14" width="4" height="7" rx="2"/>',
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a10 10 0 0 1 0 13"/>',
    volumeOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="m17 9 5 5"/><path d="m22 9-5 5"/>',
    rotate: '<path d="M3 4v5h5"/><path d="M3.5 9A9 9 0 1 1 5 17"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    star: '<path fill="currentColor" stroke="none" d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-.9L12 2.8z"/>',
    flame: '<path d="M12 22c4 0 6-2.4 6-5.6 0-3.4-2.8-5.2-3.4-8.4-.2-1-1.5-1.2-2-.3-1 1.8-.8 3.7-.2 5.1-.9-1-1.5-2.3-1.6-3.8-.1-1-1.3-1.4-1.8-.5C7.6 10.7 6 12.9 6 16.4 6 19.6 8 22 12 22z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    backspace: '<path d="M21 6H9l-6 6 6 6h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>',
    play: '<path fill="currentColor" stroke="none" d="M8 5.5v13l11-6.5-11-6.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/><path d="m5 14 .7 1.8L7.5 16l-1.8.7L5 18.5l-.7-1.8L2.5 16l1.8-.2L5 14z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    award: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12.5-1.5 8 5-2.5 5 2.5-1.5-8"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 15h10l1-15"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    alert: '<path d="M10.3 3.6 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    party: '<path d="m4 20 4-12 8 8-12 4z"/><path d="M14 4c2 0 4 2 4 4"/><path d="M18 2c3 1 5 3 6 6"/>'
};

export function icon(name, { size = 24, className = '' } = {}) {
    const body = ICONS[name] || ICONS.sparkles;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(ICONS);
