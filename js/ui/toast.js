// Нижние snackbar-уведомления. Не перекрывают навигацию и кнопки.

import { icon } from './icons.js';

const ICON_BY_TYPE = {
    info: 'info',
    success: 'check',
    warning: 'alert',
    error: 'x'
};

function getRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'toast-root';
        root.className = 'toast-stack';
        root.setAttribute('aria-live', 'polite');
        document.body.appendChild(root);
    }
    return root;
}

export function showToast(message, { type = 'info', duration = 3200 } = {}) {
    const root = getRoot();

    while (root.children.length >= 3) {
        root.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');

    const iconWrap = document.createElement('span');
    iconWrap.className = 'toast-icon';
    iconWrap.innerHTML = icon(ICON_BY_TYPE[type] || 'info', { size: 18 });

    const text = document.createElement('span');
    text.textContent = message;

    toast.append(iconWrap, text);
    root.appendChild(toast);

    let timer = null;

    const dismiss = () => {
        if (timer) clearTimeout(timer);
        toast.classList.add('is-leaving');
        setTimeout(() => toast.remove(), 220);
    };

    timer = setTimeout(dismiss, Math.max(800, duration));
    toast.addEventListener('click', dismiss);

    return dismiss;
}
