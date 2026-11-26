// Синхронная заливка букв/плиток при озвучке.

const UNFILL_DURATION = 600;

export function createWordFill(container) {
    const letters = container
        ? Array.from(container.querySelectorAll('.word-letter, .test-char, .test-tile'))
            .filter(element => !element.classList.contains('space'))
        : [];

    let rafId = null;
    let active = true;

    function apply(fraction) {
        if (!active || letters.length === 0) return;
        const count = Math.round(Math.max(0, Math.min(1, fraction)) * letters.length);
        letters.forEach((element, index) => {
            element.classList.toggle('is-filled', index < count);
        });
    }

    function cancel() {
        active = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        letters.forEach(element => element.classList.remove('is-filled'));
    }

    return {
        setProgress(fraction) {
            apply(fraction);
        },

        finish() {
            if (!active) return;
            apply(1);

            const start = performance.now();
            const step = (now) => {
                if (!active) return;
                const progress = Math.min(1, (now - start) / UNFILL_DURATION);
                const count = Math.round((1 - progress) * letters.length);
                letters.forEach((element, index) => {
                    element.classList.toggle('is-filled', index < count);
                });

                if (progress < 1) {
                    rafId = requestAnimationFrame(step);
                } else {
                    rafId = null;
                }
            };

            rafId = requestAnimationFrame(step);
        },

        cancel
    };
}
