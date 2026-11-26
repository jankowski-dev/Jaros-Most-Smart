// Классический скрипт до первой отрисовки: не даёт вспышке светлой темы
// появиться у пользователя с тёмной темой.
(function () {
    try {
        var raw = window.localStorage.getItem('yarik.uroki.settings.v1');
        var saved = raw ? JSON.parse(raw) : null;
        var theme = saved && saved.settings ? saved.settings.theme : 'system';
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var dark = theme === 'dark' || (theme !== 'light' && prefersDark);

        if (dark) document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    } catch (error) {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
    }
})();
