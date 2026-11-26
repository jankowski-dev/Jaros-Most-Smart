// Обёртка над Yandex SpeechKit и браузерным Web Speech API.

export function createSpeech({
    isSoundEnabled = () => true,
    service = globalThis.speechService,
    synth = globalThis.speechSynthesis
} = {}) {
    const trackerFactory = globalThis.createBrowserProgressTracker;

    function isEnabled() {
        if (!isSoundEnabled()) return false;
        const serviceReady = Boolean(service && typeof service.isEnabled === 'function' && service.isEnabled());
        return serviceReady || Boolean(synth);
    }

    function cancel() {
        try {
            if (service && typeof service.cancel === 'function') service.cancel();
        } catch (error) {
            // Озвучка не должна ломать интерфейс.
        }
        try {
            if (synth && typeof synth.cancel === 'function') synth.cancel();
        } catch (error) {
            // Тоже не критично.
        }
    }

    function speakBrowser(text, { isWord = false, onProgress } = {}) {
        if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
            return Promise.resolve();
        }

        cancel();

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            utterance.rate = isWord ? 0.8 : 0.9;
            utterance.pitch = 1.1;
            utterance.volume = isWord ? 0.8 : 0.9;

            try {
                const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
                const russianVoice = voices.find(voice => String(voice.lang).startsWith('ru'));
                if (russianVoice) utterance.voice = russianVoice;
            } catch (error) {
                // Голос не обязателен: браузер выберет сам.
            }

            const tracker = typeof trackerFactory === 'function'
                ? trackerFactory(utterance, text, { isWord, onProgress })
                : null;

            utterance.onend = () => {
                if (tracker) {
                    tracker.stop();
                    tracker.reportFinal();
                }
                resolve();
            };

            utterance.onerror = (event) => {
                if (tracker) tracker.stop();
                reject(new Error(`Ошибка браузерного синтеза: ${event.error || 'unknown'}`));
            };

            try {
                synth.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function speak(text, { isWord = false, onProgress } = {}) {
        if (!text || !isEnabled()) return;

        if (service && typeof service.isEnabled === 'function' && service.isEnabled()) {
            try {
                await service.speak(text, { isWord, onProgress });
                return;
            } catch (error) {
                // Ниже — браузерный fallback.
            }
        }

        return speakBrowser(text, { isWord, onProgress });
    }

    return { speak, cancel, isEnabled };
}
