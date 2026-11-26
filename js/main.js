// Точка входа приложения 3.0: store, тема, роутер и экраны.

import { createStore } from './store.js';
import { createRouter } from './router.js';
import { applyTheme } from './theme.js';
import { renderNav } from './ui/nav.js';
import { showToast } from './ui/toast.js';
import { confirmDialog } from './ui/dialog.js';
import { createSpeech } from './speech.js';
import { createEffects } from './effects.js';
import { BADGES } from './badges.js';
import { renderHome } from './screens/home.js';
import { renderProgress } from './screens/progress.js';
import { renderSettings } from './screens/settings.js';
import { renderMath } from './screens/math.js';
import { renderPlayPlaceholder } from './screens/play-placeholder.js';

const SCREENS = {
    home: renderHome,
    progress: renderProgress,
    settings: renderSettings
};

const PLAY_SCREENS = {
    math: renderMath,
    reading: renderPlayPlaceholder,
    test: renderPlayPlaceholder
};

let storage = null;
let storageAccessError = false;
try {
    storage = window.localStorage;
} catch (error) {
    storageAccessError = true;
}

const store = createStore({ storage });
const speech = createSpeech({
    isSoundEnabled: () => store.getSettings().settings.sound
});
const effects = createEffects({
    isEnabled: () => store.getSettings().settings.effects
});
const badgeMap = new Map(BADGES.map(badge => [badge.id, badge]));

const router = createRouter({
    onRoute: (route, hash) => {
        void handleRoute(route, hash);
    }
});

let currentScreen = null;
let currentHash = null;
let isNavigating = false;
let allowedPlay = null;

function startPlay(type) {
    allowedPlay = type;
    router.navigate(`#/play/${type}`);
}

const ctx = {
    store,
    route: null,
    navigate: (path, options) => router.navigate(path, options),
    startPlay,
    showToast,
    confirmDialog,
    speech,
    effects
};

function screenFor(route) {
    if (route.name === 'play') return PLAY_SCREENS[route.type] || null;
    return SCREENS[route.name] || SCREENS.home;
}

function renderRoute(route, hash) {
    if (route.name === 'play' && allowedPlay !== route.type) {
        allowedPlay = null;
        showToast('Выбери урок на главной', { type: 'info' });
        router.navigate('#/', { replace: true });
        return;
    }

    if (route.name === 'play') allowedPlay = null;

    speech.cancel();

    if (currentScreen && typeof currentScreen.destroy === 'function') {
        currentScreen.destroy();
    }
    currentScreen = null;

    document.body.classList.toggle('focus-mode', route.name === 'play');

    const nav = document.getElementById('main-nav');
    if (nav) nav.innerHTML = renderNav(route.name);

    const main = document.getElementById('view-root');
    if (!main) return;

    main.innerHTML = '';
    main.focus({ preventScroll: true });

    const renderer = screenFor(route);

    try {
        currentScreen = renderer ? renderer(main, { ...ctx, route }) : null;
        currentHash = hash;
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Ошибка открытия экрана:', error);
        showToast('Не удалось открыть экран. Попробуй ещё раз.', { type: 'error' });
        main.innerHTML = `
            <div class="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
                <h1 class="text-title">Что-то пошло не так</h1>
                <p class="muted mt-2">Байт уже чинит паутинку. Попробуй вернуться на главную.</p>
                <a class="btn btn-primary mt-6" href="#/">На главную</a>
            </div>
        `;
    }
}

async function handleRoute(route, hash) {
    if (isNavigating) return;
    if (hash === currentHash) return;

    if (route.name === 'play' && allowedPlay !== route.type) {
        allowedPlay = null;
        showToast('Выбери урок на главной', { type: 'info' });
        router.navigate('#/', { replace: true });
        return;
    }

    isNavigating = true;

    try {
        if (currentScreen && typeof currentScreen.canLeave === 'function') {
            let allowed = true;
            try {
                allowed = await currentScreen.canLeave();
            } catch (error) {
                console.error('Ошибка проверки выхода:', error);
                allowed = true;
            }

            if (!allowed) {
                window.history.replaceState(null, '', currentHash || '#/');
                return;
            }
        }

        renderRoute(route, hash);
    } finally {
        isNavigating = false;
    }
}

function boot() {
    applyTheme(store.getSettings().settings.theme);

    if (storageAccessError || store.getStorageError()) {
        showToast('Не удалось прочитать сохранение. Начнём с чистого листа.', { type: 'warning' });
    }

    const badgeResult = store.checkBadges();
    badgeResult.newBadges.forEach(id => {
        const badge = badgeMap.get(id);
        showToast(`Новый бейдж: ${badge ? badge.title : id}`, { type: 'success' });
    });

    const themeMedia = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    if (themeMedia) {
        themeMedia.addEventListener('change', () => {
            if (store.getSettings().settings.theme === 'system') {
                applyTheme('system');
            }
        });
    }

    window.addEventListener('pointerdown', () => effects.unlock(), { once: true });

    router.start();
}

boot();
