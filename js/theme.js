// Тема: светлая, тёмная или системная.

export function resolveTheme(theme, prefersDark) {
    if (theme === 'light' || theme === 'dark') return theme;
    return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme, { root = document.documentElement, matchMedia = globalThis.matchMedia } = {}) {
    const prefersDark = typeof matchMedia === 'function'
        ? matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    const resolved = resolveTheme(theme, prefersDark);

    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#0E1120' : '#FFF8EE');
    }

    return resolved;
}
