// config.js - Конфигурация синтеза речи для Railway
// Настройки загружаются из переменных среды Railway

window.appConfig = {
    speech: {
        // Движок синтеза речи: 'browser' или 'yandex'
        engine: 'yandex',

        // Настройки Yandex SpeechKit
        yandex: {
            // URL прокси-сервера на Railway (обязательно для режима yandex)
            // Формат: https://your-app-name.up.railway.app/api/tts
            proxyUrl: 'https://jms.up.railway.app/api/tts',

            // Голос: 'alena' (женский), 'filipp' (мужской), 'ermil' (мужской)
            voice: 'alena',

            // Эмоция: 'good', 'evil', 'neutral'
            emotion: 'good',

            // Скорость речи: от 0.1 до 3.0
            speed: 1.0
        },

        // Общие настройки
        common: {
            // Включить/выключить озвучку
            enabled: true,

            // Автоматический fallback на браузерный синтез при ошибках
            fallback: true,

            // Логирование (только для отладки)
            debug: false
        }
    }
};

// Загрузка конфигурации из переменных среды Railway
(function loadConfigFromEnv() {
    // Определяем источник переменных среды
    const env = typeof process !== 'undefined' && process.env ? process.env : window;

    // SPEECH_ENGINE может быть 'browser' или 'yandex'
    if (env.SPEECH_ENGINE && (env.SPEECH_ENGINE === 'browser' || env.SPEECH_ENGINE === 'yandex')) {
        window.appConfig.speech.engine = env.SPEECH_ENGINE;
    }

    // YANDEX_PROXY_URL - URL прокси-сервера на Railway
    if (env.YANDEX_PROXY_URL) {
        window.appConfig.speech.yandex.proxyUrl = env.YANDEX_PROXY_URL;
    }

    // Другие настройки Yandex
    if (env.YANDEX_VOICE) {
        window.appConfig.speech.yandex.voice = env.YANDEX_VOICE;
    }

    if (env.YANDEX_EMOTION) {
        window.appConfig.speech.yandex.emotion = env.YANDEX_EMOTION;
    }

    if (env.YANDEX_SPEED) {
        window.appConfig.speech.yandex.speed = parseFloat(env.YANDEX_SPEED);
    }

    // Общие настройки
    if (env.SPEECH_ENABLED) {
        window.appConfig.speech.common.enabled = env.SPEECH_ENABLED === 'true' || env.SPEECH_ENABLED === '1';
    }

    if (env.SPEECH_FALLBACK) {
        window.appConfig.speech.common.fallback = env.SPEECH_FALLBACK === 'true' || env.SPEECH_FALLBACK === '1';
    }

    if (env.SPEECH_DEBUG) {
        window.appConfig.speech.common.debug = env.SPEECH_DEBUG === 'true' || env.SPEECH_DEBUG === '1';
    }

    // Логирование конфигурации при отладке
    if (window.appConfig.speech.common.debug) {
        console.log('Конфигурация синтеза речи загружена:', window.appConfig.speech);
    }
})();