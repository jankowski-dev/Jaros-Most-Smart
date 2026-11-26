// Лёгкое конфетти без canvas и библиотек. Уважает prefers-reduced-motion.

const COLORS = [
    'var(--color-primary)',
    'var(--color-secondary)',
    'var(--color-teal)',
    'var(--color-success)',
    '#F472B6',
    '#FDE68A'
];

export function burstConfetti({ count = 80, duration = 1200 } = {}) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = COLORS[i % COLORS.length];
        piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 12}rem`);
        piece.style.setProperty('--fall-duration', `${0.9 + Math.random() * 0.8}s`);
        piece.style.setProperty('--fall-delay', `${Math.random() * 0.25}s`);
        piece.style.transform = `rotate(${Math.random() * 180}deg)`;
        layer.appendChild(piece);
    }

    setTimeout(() => layer.remove(), duration + 900);
}
