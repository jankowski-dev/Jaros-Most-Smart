// Бейджи и их условия. evaluateBadges — чистая функция, без XP и DOM.

export const BADGES = [
    {
        id: 'first-step',
        title: 'Первый шаг',
        description: 'Первая завершённая сессия'
    },
    {
        id: 'streak-3',
        title: 'Три дня подряд',
        description: 'Серия из 3 дней'
    },
    {
        id: 'streak-7',
        title: 'Неделя с Байтом',
        description: 'Серия из 7 дней'
    },
    {
        id: 'math-50',
        title: 'Математик',
        description: '50 правильных ответов в математике'
    },
    {
        id: 'test-50',
        title: 'Острый слух',
        description: '50 правильных ответов в тесте'
    },
    {
        id: 'reader-100',
        title: 'Читатель',
        description: '100 прочитанных карточек'
    },
    {
        id: 'perfect-math',
        title: 'Без единой ошибки',
        description: 'Математика 10 из 10'
    },
    {
        id: 'perfect-test',
        title: 'Идеальный слух',
        description: 'Тест 10 из 10'
    },
    {
        id: 'all-subjects',
        title: 'Восемь лапок',
        description: 'По одной сессии каждого предмета'
    },
    {
        id: 'level-5',
        title: 'Пятый уровень',
        description: 'Достигнут уровень 5'
    }
];

const BADGE_IDS = new Set(BADGES.map(badge => badge.id));

export function evaluateBadges(progress) {
    const earned = progress.badges || {};
    const subjects = progress.subjects || {};
    const math = subjects.math || {};
    const reading = subjects.reading || {};
    const test = subjects.test || {};
    const history = Array.isArray(progress.history) ? progress.history : [];
    const currentStreak = progress.streak?.current || 0;
    const level = progress.level || 1;

    const satisfied = new Set();

    if ((math.sessions || 0) + (reading.sessions || 0) + (test.sessions || 0) > 0) {
        satisfied.add('first-step');
    }
    if (currentStreak >= 3) satisfied.add('streak-3');
    if (currentStreak >= 7) satisfied.add('streak-7');
    if ((math.correct || 0) >= 50) satisfied.add('math-50');
    if ((test.correct || 0) >= 50) satisfied.add('test-50');
    if ((reading.cardsRead || 0) >= 100) satisfied.add('reader-100');
    if (history.some(entry => entry.type === 'math' && entry.correct === 10 && entry.total === 10)) {
        satisfied.add('perfect-math');
    }
    if (history.some(entry => entry.type === 'test' && entry.correct === 10 && entry.total === 10)) {
        satisfied.add('perfect-test');
    }
    if ((math.sessions || 0) > 0 && (reading.sessions || 0) > 0 && (test.sessions || 0) > 0) {
        satisfied.add('all-subjects');
    }
    if (level >= 5) satisfied.add('level-5');

    return [...satisfied].filter(id => BADGE_IDS.has(id) && !earned[id]);
}
