// Оценки, звёзды и форматирование времени. Чистые функции без DOM.

export function calculateGrade(correct, total) {
    if (!total) return 0;
    const percentage = (correct / total) * 100;
    if (percentage >= 95) return 10;
    if (percentage >= 85) return 9;
    if (percentage >= 75) return 8;
    if (percentage >= 65) return 7;
    if (percentage >= 55) return 6;
    if (percentage >= 45) return 5;
    if (percentage >= 35) return 4;
    if (percentage >= 25) return 3;
    if (percentage >= 15) return 2;
    return 1;
}

export function calculateStars(type, correct, total) {
    if (!total) return 0;

    if (type === 'reading') {
        if (correct <= 0) return 0;
        const ratio = correct / total;
        if (correct >= total) return 3;
        if (ratio >= 0.7) return 2;
        return 1;
    }

    const ratio = correct / total;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.7) return 2;
    return 1;
}

export function formatTime(seconds) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const rest = value % 60;
    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
}
