// Минимальный hash-роутер. Никаких зависимостей.

const PLAY_TYPES = new Set(['math', 'reading', 'test']);

export function parseRoute(hash = '') {
    const raw = String(hash)
        .replace(/^#/, '')
        .replace(/\/+$/, '');

    if (!raw || raw === '/') return { name: 'home' };

    const parts = raw.split('/').filter(Boolean);

    if (parts.length === 1 && parts[0] === 'progress') return { name: 'progress' };
    if (parts.length === 1 && parts[0] === 'settings') return { name: 'settings' };
    if (parts.length === 2 && parts[0] === 'play' && PLAY_TYPES.has(parts[1])) {
        return { name: 'play', type: parts[1] };
    }

    return { name: 'home' };
}

export function createRouter({ windowRef = window, onRoute = () => {} } = {}) {
    let started = false;

    const currentHash = () => windowRef.location.hash || '#/';
    const notify = () => onRoute(parseRoute(currentHash()), currentHash());
    const onHashChange = () => notify();

    return {
        start() {
            if (started) return;
            started = true;
            windowRef.addEventListener('hashchange', onHashChange);
            notify();
        },

        stop() {
            if (!started) return;
            started = false;
            windowRef.removeEventListener('hashchange', onHashChange);
        },

        navigate(path, { replace = false } = {}) {
            const hash = String(path).startsWith('#') ? String(path) : `#${path}`;

            if (replace) {
                windowRef.history.replaceState(null, '', hash);
                onRoute(parseRoute(hash), hash);
                return;
            }

            windowRef.location.hash = hash;
        },

        currentHash
    };
}
