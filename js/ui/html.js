// Безопасная вставка пользовательских строк и форматирование даты.

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => HTML_ESCAPES[character]);
}

export function formatDate(date = new Date()) {
    const text = new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date);

    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function pluralDays(value) {
    const number = Math.abs(Number(value) || 0);
    const mod10 = number % 10;
    const mod100 = number % 100;

    if (mod10 === 1 && mod100 !== 11) return `${number} день`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${number} дня`;
    return `${number} дней`;
}
