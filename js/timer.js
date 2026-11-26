// Таймер сессии: миллисекунды, пауза, возобновление, пауза при скрытии вкладки.

export function createSessionTimer({
    now = () => Date.now(),
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    onTick = () => {}
} = {}) {
    let startedAt = null;
    let accumulated = 0;
    let intervalId = null;

    function getMilliseconds() {
        return accumulated + (startedAt === null ? 0 : Math.max(0, now() - startedAt));
    }

    function getSeconds() {
        return Math.floor(getMilliseconds() / 1000);
    }

    function tick() {
        onTick(getSeconds());
    }

    function start() {
        if (startedAt !== null) return;
        startedAt = now();
        intervalId = setIntervalFn(tick, 1000);
        tick();
    }

    function pause() {
        if (startedAt === null) return;
        accumulated += Math.max(0, now() - startedAt);
        startedAt = null;
        if (intervalId !== null) {
            clearIntervalFn(intervalId);
            intervalId = null;
        }
        tick();
    }

    function stop() {
        pause();
    }

    return {
        start,
        pause,
        resume: start,
        stop,
        getSeconds
    };
}

export function bindVisibilityPause(timer, doc = document) {
    const onVisibilityChange = () => {
        if (doc.hidden) {
            timer.pause();
        } else {
            timer.resume();
        }
    };

    doc.addEventListener('visibilitychange', onVisibilityChange);

    return () => doc.removeEventListener('visibilitychange', onVisibilityChange);
}
