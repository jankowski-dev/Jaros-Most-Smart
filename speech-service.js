// speech-service.js - Упрощенный сервис синтеза речи для Railway
// Только браузерный синтез и Yandex через прокси

class SpeechService {
    constructor(config) {
        this.config = config;
        this.currentAudio = null;
        this.currentUtterance = null;
    }

    /**
     * Озвучить текст
     */
    async speak(text, options = {}) {
        if (!this.config.common.enabled) {
            return;
        }

        // Отменяем текущее воспроизведение
        this.cancel();

        try {
            if (this.config.engine === 'yandex') {
                await this.speakYandex(text, options);
            } else {
                await this.speakBrowser(text, options);
            }
        } catch (error) {
            console.error('Ошибка синтеза речи:', error);

            // Fallback на браузерный синтез если включен
            if (this.config.common.fallback && this.config.engine === 'yandex') {
                console.log('Используем fallback (браузерный синтез)');
                try {
                    await this.speakBrowser(text, options);
                } catch (fallbackError) {
                    console.error('Fallback также не сработал:', fallbackError);
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

        if (!proxyUrl) {
            throw new Error('URL прокси-сервера не настроен. Укажите YANDEX_PROXY_URL в переменных среды.');
        }

        // Подготавливаем запрос к прокси
        const requestData = {
            text: text,
            voice: this.config.yandex.voice || 'alena',
            emotion: this.config.yandex.emotion || 'good',
            speed: this.config.yandex.speed || 1.0,
            lang: 'ru-RU'
        };

        // Выполняем запрос к прокси-серверу
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            let errorText = 'Неизвестная ошибка';
            try {
                errorText = await response.text();
            } catch (e) {
                // Игнорируем ошибку чтения
            }
            throw new Error(`Прокси-сервер ошибка (${response.status}): ${errorText}`);
        }

        // Получаем аудио данные
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

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