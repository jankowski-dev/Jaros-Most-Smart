// speech-service.js - Упрощенный сервис синтеза речи для Railway
// Только браузерный синтез и Yandex через прокси
// Версия с улучшенным логированием и отладкой

class SpeechService {
    constructor(config) {
        this.config = config;
        this.currentAudio = null;
        this.currentUtterance = null;
        this.debug = true; // Включить отладку
    }

    // Метод для логирования
    log(type, message, data = null) {
        if (!this.debug) return;

        const timestamp = new Date().toISOString();
        const prefix = `[SpeechService ${timestamp}]`;

        switch (type) {
            case 'info':
                console.log(`${prefix} ℹ️ ${message}`, data || '');
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`, data || '');
                break;
            case 'warning':
                console.warn(`${prefix} ⚠️ ${message}`, data || '');
                break;
            case 'error':
                console.error(`${prefix} ❌ ${message}`, data || '');
                break;
            case 'debug':
                console.debug(`${prefix} 🔍 ${message}`, data || '');
                break;
        }

        // Также отправляем в глобальный логер если есть
        if (window.speechDebugLog) {
            window.speechDebugLog.push({ timestamp, type, message, data });
        }
    }

    /**
     * Озвучить текст
     */
    async speak(text, options = {}) {
        this.log('info', `Запуск синтеза речи: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`, {
            engine: this.config.engine,
            options
        });

        if (!this.config.common.enabled) {
            this.log('warning', 'Синтез речи отключен в конфигурации');
            return;
        }

        // Отменяем текущее воспроизведение
        this.cancel();

        try {
            if (this.config.engine === 'yandex') {
                this.log('debug', 'Используем Yandex SpeechKit');
                await this.speakYandex(text, options);
            } else {
                this.log('debug', 'Используем браузерный синтез');
                await this.speakBrowser(text, options);
            }

            this.log('success', 'Синтез речи выполнен успешно');
        } catch (error) {
            this.log('error', 'Ошибка синтеза речи', error);

            // Fallback на браузерный синтез если включен
            if (this.config.common.fallback && this.config.engine === 'yandex') {
                this.log('warning', 'Пробуем fallback на браузерный синтез');
                try {
                    await this.speakBrowser(text, options);
                    this.log('success', 'Fallback синтез выполнен успешно');
                } catch (fallbackError) {
                    this.log('error', 'Fallback также не сработал', fallbackError);
                }
            }
        }
    }

    /**
     * Браузерный синтез (Web Speech API)
     */
    async speakBrowser(text, options = {}) {
        if (!window.speechSynthesis) {
            throw new Error('Браузерный синтез не поддерживается');
        }

        return new Promise((resolve, reject) => {
            // Отменяем текущее озвучивание
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Настройки для русского языка
            utterance.lang = 'ru-RU';
            utterance.rate = options.isWord ? 0.8 : 0.9;
            utterance.pitch = 1.1;
            utterance.volume = options.isWord ? 0.8 : 0.9;

            // Ищем русский голос
            const voices = window.speechSynthesis.getVoices();
            const russianVoice = voices.find(v => v.lang.startsWith('ru'));
            if (russianVoice) {
                utterance.voice = russianVoice;
            }

            utterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                this.currentUtterance = null;
                reject(new Error(`Ошибка браузерного синтеза: ${event.error}`));
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Yandex SpeechKit через прокси на Railway
     */
    async speakYandex(text, options = {}) {
        const proxyUrl = this.config.yandex.proxyUrl;

        this.log('debug', 'Начинаем Yandex SpeechKit синтез', {
            proxyUrl: proxyUrl ? 'установлен' : 'отсутствует',
            textLength: text.length,
            options
        });

        if (!proxyUrl) {
            const error = new Error('URL прокси-сервера не настроен. Укажите YANDEX_PROXY_URL в переменных среды.');
            this.log('error', 'Ошибка конфигурации прокси', error);
            throw error;
        }

        // Подготавливаем запрос к прокси
        const requestData = {
            text: text,
            voice: this.config.yandex.voice || 'alena',
            emotion: this.config.yandex.emotion || 'good',
            speed: this.config.yandex.speed || 1.0,
            lang: 'ru-RU'
        };

        this.log('debug', 'Отправляем запрос к прокси', {
            proxyUrl,
            requestData: { ...requestData, text: `[${text.length} символов]` }
        });

        // Выполняем запрос к прокси-серверу
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        this.log('debug', 'Получен ответ от прокси', {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            let errorText = 'Неизвестная ошибка';
            try {
                errorText = await response.text();
                this.log('error', 'Текст ошибки от прокси', errorText);
            } catch (e) {
                this.log('error', 'Не удалось прочитать текст ошибки', e);
            }
            const error = new Error(`Прокси-сервер ошибка (${response.status}): ${errorText}`);
            this.log('error', 'Ошибка прокси-сервера', error);
            throw error;
        }

        // Получаем аудио данные
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        this.log('success', 'Аудио получено успешно', {
            blobSize: audioBlob.size,
            blobType: audioBlob.type,
            audioUrl: audioUrl.substring(0, 50) + '...'
        });

        // Воспроизводим аудио
        return this.playAudio(audioUrl);
    }

    /**
     * Воспроизвести аудио из URL
     */
    playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            try {
                const audio = new Audio(audioUrl);
                this.currentAudio = audio;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    resolve();
                };

                audio.onerror = (event) => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    reject(new Error(`Ошибка воспроизведения: ${event.target.error?.message || 'неизвестная ошибка'}`));
                };

                audio.play().catch(error => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    reject(new Error(`Не удалось начать воспроизведение: ${error.message}`));
                });

            } catch (error) {
                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                }
                reject(error);
            }
        });
    }

    /**
     * Отменить текущее озвучивание
     */
    cancel() {
        // Отменяем браузерный синтез
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.currentUtterance = null;
        }

        // Отменяем аудио воспроизведение
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    /**
     * Проверить, включен ли синтез
     */
    isEnabled() {
        return this.config.common.enabled;
    }
}

// Создаем глобальный экземпляр сервиса
if (window.appConfig && window.appConfig.speech) {
    window.speechService = new SpeechService(window.appConfig.speech);
}