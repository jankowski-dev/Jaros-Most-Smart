// Короткие WebAudio-сигналы. Создают AudioContext лениво и уважают настройку.

export function createEffects({ isEnabled = () => true } = {}) {
    let context = null;

    function ensureContext() {
        if (!isEnabled()) return null;
        if (!context) {
            const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
            if (!AudioContextClass) return null;
            try {
                context = new AudioContextClass();
            } catch (error) {
                return null;
            }
        }

        if (context.state === 'suspended' && typeof context.resume === 'function') {
            context.resume().catch(() => {});
        }

        return context;
    }

    function beep(frequency, duration, volume) {
        const audio = ensureContext();
        if (!audio) return;

        try {
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();

            oscillator.connect(gain);
            gain.connect(audio.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(volume, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + duration);

            oscillator.start();
            oscillator.stop(audio.currentTime + duration);
        } catch (error) {
            // Звук — необязательное улучшение.
        }
    }

    return {
        correct() {
            beep(800, 0.3, 0.25);
        },
        wrong() {
            beep(400, 0.5, 0.2);
        },
        unlock() {
            ensureContext();
        }
    };
}
