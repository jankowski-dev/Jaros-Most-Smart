// Чистые помощники экрана прогресса.

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function dateKey(date) {
    const pad = (number) => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getLast7Days(activeDays = [], now = new Date()) {
    const active = new Set(Array.isArray(activeDays) ? activeDays : []);
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(now);
        date.setDate(date.getDate() - offset);
        const key = dateKey(date);
        days.push({
            date: key,
            label: WEEKDAYS[date.getDay()],
            active: active.has(key)
        });
    }

    return days;
}

export function getAccuracy(subject) {
    const correct = Number(subject?.correct) || 0;
    const total = Number(subject?.total) || 0;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function getTotalStars(progress) {
    const subjects = progress?.subjects || {};
    return Object.values(subjects).reduce((sum, subject) => sum + (Number(subject?.bestStars) || 0), 0);
}
