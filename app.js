// Основная логика приложения "Ярик.Уроки"

// Глобальные переменные
let currentPage = 'home';
let currentLevel = 1;
let currentSubject = '';
let currentCategory = '';
let voiceEnabled = true;
let timerInterval;
let timerSeconds = 0;
let currentWordIndex = 0;
let currentMathIndex = 0;
let correctAnswers = 0;
let totalAnswers = 0;
let mathProblems = [];
let currentWords = [];
let isCheckingAnswer = false;
let loaderTimeout;
let currentUtterance = null;
let isSpeaking = false;
let mathCompleted = false;
let readingCompleted = false;
let availableVoices = [];
let audioContext = null;
let isTimerPaused = false;
let pausedSeconds = 0;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function () {
    loadAvailableVoices();
    startTimer();

    document.getElementById('mainLogo').addEventListener('click', function () {
        showLoaderAndNavigateToHome();
    });

    document.getElementById('lessonLogo').addEventListener('click', function () {
        showLoaderAndNavigateToHome();
    });

    // Subject selection - Step 1
    document.querySelectorAll('#step1 .subject-card').forEach(card => {
        card.addEventListener('click', function () {
            // Проверяем, доступна ли эта опция
            if (this.classList.contains('unavailable')) {
                // Если опция недоступна, просто возвращаемся без действий
                return;
            }

            document.querySelectorAll('#step1 .subject-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            currentSubject = this.dataset.subject;

            document.getElementById('step1').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step2').style.display = 'block';

                setTimeout(() => {
                    document.getElementById('step2').classList.remove('hidden');
                }, 10);
            }, 300);

            populateSubcategories();
            markUnavailableSubcategories();
        });
    });

    // Subcategory selection - Step 2
    document.addEventListener('click', function (e) {
        if (e.target.closest('#subcategoryGrid') && e.target.closest('.subject-card')) {
            const card = e.target.closest('.subject-card');

            // Проверяем, доступна ли эта опция
            if (card.classList.contains('unavailable')) {
                // Если опция недоступна, просто возвращаемся без действий
                return;
            }

            document.querySelectorAll('#subcategoryGrid .subject-card').forEach(opt => opt.classList.remove('active'));
            card.classList.add('active');

            currentCategory = card.dataset.category;

            document.getElementById('step2').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';

                setTimeout(() => {
                    document.getElementById('step3').classList.remove('hidden');
                    markUnavailableDifficulties();
                }, 10);
            }, 300);
        }
    });

    // Difficulty selection - Step 3
    document.addEventListener('click', function (e) {
        if (e.target.closest('.difficulty-options') && e.target.closest('.difficulty-option')) {
            const card = e.target.closest('.difficulty-option');

            // Проверяем, доступна ли эта опция
            if (card.classList.contains('unavailable')) {
                // Если опция недоступна, просто возвращаемся без действий
                return;
            }

            document.querySelectorAll('.difficulty-options .difficulty-option').forEach(opt => opt.classList.remove('active'));
            card.classList.add('active');

            currentLevel = parseInt(card.dataset.difficulty);

            // Сразу запускаем занятие без показа step4
            showLoaderAndNavigateToLesson();
        }
    });

    // Кнопка "Заново" вместо "Пауза"
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function () {
            resetLesson();
        });
    }

    // Клик на таймер для паузы/продолжения
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.addEventListener('click', toggleTimerPause);
    }

    // Finish lesson buttons
    document.getElementById('finishLessonBtn').addEventListener('click', function () {
        showLoaderAndNavigateToHome();
    });

    // Calculator keys
    document.querySelectorAll('.number-key').forEach(key => {
        key.addEventListener('click', function (e) {
            if (mathCompleted) return;
            createRippleEffect(this, e);
            const value = this.dataset.value;
            handleNumberInput(value);
        });
    });

    // Voice toggle button
    document.getElementById('voiceToggleBtn').addEventListener('click', function () {
        voiceEnabled = !voiceEnabled;

        const iconOn = document.getElementById('voiceIconOn');
        const iconOff = document.getElementById('voiceIconOff');

        if (voiceEnabled) {
            iconOn.style.display = 'inline-flex';
            iconOff.style.display = 'none';
            this.style.background = '#EE9F21';
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'inline-flex';
            this.style.background = '#757575';
        }
    });

    // Reading navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('prevBtn').addEventListener('click', prevWord);

    // Click on word to speak
    document.getElementById('wordDisplay').addEventListener('click', function () {
        speakCurrentWord();
    });

    // Initialize audio context on first user interaction
    const handleUserInteraction = () => {
        initAudioContext();
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    updateStats();
    markUnavailableSubjects();
});

// Функция для проверки наличия данных в подкатегориях
function checkSubcategoryDataAvailability(subject, category, level) {
    if (subject === 'math') {
        // Для математики проверяем наличие данных
        if (category === 'addition') {
            if (level === 1) return additionEasy.length > 0;
            if (level === 2) return additionMedium.length > 0;
            if (level === 3) return additionHard.length > 0;
        } else if (category === 'subtraction') {
            if (level === 1) return subtractionEasy.length > 0;
            if (level === 2) return subtractionMedium.length > 0;
            if (level === 3) return subtractionHard.length > 0;
        } else if (category === 'multiplication') {
            if (level === 1) return multiplicationEasy.length > 0;
            if (level === 2) return multiplicationMedium.length > 0;
            if (level === 3) return multiplicationHard.length > 0;
        } else if (category === 'division') {
            return false; // Деление всегда пустое
        }
        return true;
    } else if (subject === 'reading') {
        // Для чтения проверяем наличие данных
        if (category === 'syllables') {
            if (level === 1) return syllablesEasy.length > 0;
            if (level === 2) return syllablesMedium.length > 0;
            if (level === 3) return false; // Тяжелый уровень слогов пуст
        } else if (category === 'words') {
            if (level === 1) return wordsEasy.length > 0;
            if (level === 2) return false; // Средний уровень слов пуст
            if (level === 3) return false; // Тяжелый уровень слов пуст
        } else if (category === 'sentences') {
            return false; // Предложения всегда пустые
        }
    }
    return true;
}

// Функция для отметки недоступных подкатегорий
function markUnavailableSubcategories() {
    if (!currentSubject) return;

    const subcategoryCards = document.querySelectorAll('#subcategoryGrid .subject-card');

    subcategoryCards.forEach(card => {
        const category = card.dataset.category;
        let hasAnyLevel = false;

        // Проверяем наличие данных хотя бы для одного уровня сложности
        if (currentSubject === 'math') {
            if (category === 'addition') {
                hasAnyLevel = additionEasy.length > 0 || additionMedium.length > 0 || additionHard.length > 0;
            } else if (category === 'subtraction') {
                hasAnyLevel = subtractionEasy.length > 0 || subtractionMedium.length > 0 || subtractionHard.length > 0;
            } else if (category === 'multiplication') {
                hasAnyLevel = multiplicationEasy.length > 0 || multiplicationMedium.length > 0 || multiplicationHard.length > 0;
            } else if (category === 'division') {
                hasAnyLevel = false;
            }
        } else if (currentSubject === 'reading') {
            if (category === 'syllables') {
                hasAnyLevel = syllablesEasy.length > 0 || syllablesMedium.length > 0;
            } else if (category === 'words') {
                hasAnyLevel = wordsEasy.length > 0;
            } else if (category === 'sentences') {
                hasAnyLevel = false;
            }
        }

        if (!hasAnyLevel) {
            card.classList.add('unavailable');
            // Добавляем подсказку
            card.setAttribute('title', 'В этом разделе пока нет заданий');
        } else {
            card.classList.remove('unavailable');
            card.removeAttribute('title');
        }
    });
}

// Функция для отметки недоступных уровней сложности
function markUnavailableDifficulties() {
    if (!currentSubject || !currentCategory) return;

    const difficultyOptions = document.querySelectorAll('.difficulty-options .difficulty-option');

    difficultyOptions.forEach(option => {
        const level = parseInt(option.dataset.difficulty);
        const hasData = checkSubcategoryDataAvailability(currentSubject, currentCategory, level);

        if (!hasData) {
            option.classList.add('unavailable');
            option.setAttribute('title', 'Для этого уровня пока нет заданий');
        } else {
            option.classList.remove('unavailable');
            option.removeAttribute('title');
        }
    });
}

// Функция для отметки недоступных предметов
function markUnavailableSubjects() {
    const subjectCards = document.querySelectorAll('#step1 .subject-card');

    subjectCards.forEach(card => {
        const subject = card.dataset.subject;
        let hasAnyData = false;

        // Проверяем наличие данных для предмета
        if (subject === 'math') {
            // Для математики проверяем наличие хотя бы одной категории с данными
            hasAnyData = additionEasy.length > 0 || additionMedium.length > 0 || additionHard.length > 0 ||
                subtractionEasy.length > 0 || subtractionMedium.length > 0 || subtractionHard.length > 0 ||
                multiplicationEasy.length > 0 || multiplicationMedium.length > 0 || multiplicationHard.length > 0;
            // division всегда пусто, не учитываем
        } else if (subject === 'reading') {
            // Для чтения проверяем наличие хотя бы одной категории с данными
            hasAnyData = syllablesEasy.length > 0 || syllablesMedium.length > 0 ||
                wordsEasy.length > 0;
            // sentences всегда пусто, не учитываем
        } else if (subject === 'writing' || subject === 'puzzles') {
            // Для письма и головоломок данных нет
            hasAnyData = false;
        }

        if (!hasAnyData) {
            card.classList.add('unavailable');
            card.setAttribute('title', 'В этом разделе пока нет заданий');
        } else {
            card.classList.remove('unavailable');
            card.removeAttribute('title');
        }
    });
}

// Функция паузы/продолжения по клику на таймер
function toggleTimerPause() {
    isTimerPaused = !isTimerPaused;
    const timerElement = document.getElementById('timer');
    const timerLabel = document.querySelector('.timer-label');

    if (isTimerPaused) {
        timerLabel.textContent = '';
        timerElement.classList.add('timer-paused');
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        timerLabel.textContent = '';
        timerElement.classList.remove('timer-paused');
        startTimer();
    }
}

// Функция перезапуска урока
function resetLesson() {
    // Сброс всех счетчиков
    correctAnswers = 0;
    totalAnswers = 0;

    if (currentSubject === 'math') {
        resetMathTest();
        mathCompleted = false;
    } else if (currentSubject === 'reading') {
        resetReadingTest();
        readingCompleted = false;
    }

    // Сбрасываем таймер
    resetTimer();

    // Сбрасываем цвет таймера
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');

    // Сбрасываем заголовок таймера
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    isTimerPaused = false;
}

function populateSubcategories() {
    const container = document.getElementById('subcategoryGrid');
    if (!container) return;
    container.innerHTML = '';

    if (currentSubject === 'math') {
        const categories = [
            { name: 'addition', title: 'Сложение', description: 'Складывайте числа' },
            { name: 'subtraction', title: 'Вычитание', description: 'Находите разность' },
            { name: 'multiplication', title: 'Умножение', description: 'Умножайте числа' },
            { name: 'division', title: 'Деление', description: 'Делите числа' }
        ];

        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'subject-card';
            div.dataset.category = cat.name;
            div.innerHTML = `
                <h3>${cat.title}</h3>
                <p>${cat.description}</p>
            `;
            container.appendChild(div);
        });
    } else if (currentSubject === 'reading') {
        const categories = [
            { name: 'syllables', title: 'Слоги', description: 'Чтение по слогам' },
            { name: 'words', title: 'Слова', description: 'Чтение слов' },
            { name: 'sentences', title: 'Предложения', description: 'Чтение предложений' }
        ];

        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'subject-card';
            div.dataset.category = cat.name;
            div.innerHTML = `
                <h3>${cat.title}</h3>
                <p>${cat.description}</p>
            `;
            container.appendChild(div);
        });
    }
}

function resetHomeSelection() {
    document.querySelectorAll('#step1 .subject-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#subcategoryGrid .subject-card').forEach(opt => opt.classList.remove('active', 'unavailable'));
    document.querySelectorAll('.difficulty-options .difficulty-option').forEach(opt => opt.classList.remove('active', 'unavailable'));

    currentSubject = '';
    currentCategory = '';
    currentLevel = 1;

    // Скрываем все шаги кроме первого
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step3').classList.remove('hidden');

    document.getElementById('step1').style.display = 'block';
    document.getElementById('step1').classList.remove('hidden');
}

function getSubjectDisplayName(subject) {
    const names = {
        'math': 'Математика',
        'reading': 'Чтение',
        'writing': 'Письмо',
        'puzzles': 'Головоломки'
    };
    return names[subject] || subject;
}

function getCategoryDisplayName(category) {
    const names = {
        'addition': 'Сложение',
        'subtraction': 'Вычитание',
        'multiplication': 'Умножение',
        'division': 'Деление',
        'syllables': 'Слоги',
        'words': 'Слова',
        'sentences': 'Предложения'
    };
    return names[category] || category;
}

function updateLessonHeader() {
    const lessonInfo = document.getElementById('lessonInfo');
    if (!lessonInfo) return;
    const subjectName = getSubjectDisplayName(currentSubject);
    const categoryName = getCategoryDisplayName(currentCategory);
    const levelText = levelNames[currentLevel] || '';
    lessonInfo.textContent = `${subjectName}: ${categoryName} (${levelText})`;
}

function calculateGrade(correct, total) {
    if (total === 0) return 0;
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

function completeMathTest() {
    mathCompleted = true;
    document.getElementById('numberPad').classList.add('disabled');
    document.getElementById('mathProblem').style.display = 'none';
    document.querySelector('.input-label').style.display = 'none';

    const completionMessage = document.getElementById('completionMessage');
    completionMessage.style.display = 'flex';

    const grade = calculateGrade(correctAnswers, totalAnswers);
    document.getElementById('finalGrade').textContent = grade;

    document.getElementById('feedback').style.display = 'none';
    document.getElementById('progressFill').style.width = '100%';

    // Ставим таймер на паузу
    isTimerPaused = true;
    const timerElement = document.getElementById('timer');
    timerElement.classList.add('timer-paused');
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetMathTest() {
    mathCompleted = false;
    document.getElementById('numberPad').classList.remove('disabled');
    document.getElementById('mathProblem').style.display = 'flex';
    document.querySelector('.input-label').style.display = 'block';
    document.getElementById('completionMessage').style.display = 'none';

    // СБРАСЫВАЕМ СЧЕТЧИКИ
    correctAnswers = 0;
    totalAnswers = 0;
    currentMathIndex = 0;

    generateMathProblems();
    showMathProblem();
    updateStats();

    // Сбрасываем таймер
    resetTimer();
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    isTimerPaused = false;
}

function completeReadingTest() {
    readingCompleted = true;
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('wordDisplay').style.display = 'none';
    document.getElementById('wordInfo').style.display = 'none';
    document.getElementById('wordProgress').style.display = 'none';
    document.getElementById('readingCompletion').style.display = 'flex';

    document.getElementById('progressFill').style.width = '100%';

    // Ставим таймер на паузу
    isTimerPaused = true;
    const timerElement = document.getElementById('timer');
    timerElement.classList.add('timer-paused');
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetReadingTest() {
    readingCompleted = false;
    document.getElementById('wordDisplay').style.display = 'flex';
    document.getElementById('wordInfo').style.display = 'block';
    document.getElementById('wordProgress').style.display = 'flex';
    document.getElementById('readingCompletion').style.display = 'none';

    document.getElementById('taskNav').classList.add('show');

    currentWordIndex = 0;

    // Загружаем слова в зависимости от уровня и перемешиваем
    loadReadingWords();

    resetTimer();
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    isTimerPaused = false;
    updateReadingContent();
}

// Функция для загрузки слов для чтения с рандомизацией
function loadReadingWords() {
    let sourceArray = [];

    // Выбираем источник данных в зависимости от категории и уровня
    if (currentCategory === 'syllables') {
        if (currentLevel === 1) {
            sourceArray = [...syllablesEasy];
        } else if (currentLevel === 2) {
            sourceArray = [...syllablesMedium];
        } else if (currentLevel === 3) {
            // Для тяжелого уровня слогов нет данных
            sourceArray = [];
        }
    } else if (currentCategory === 'words') {
        if (currentLevel === 1) {
            sourceArray = [...wordsEasy];
        } else if (currentLevel === 2) {
            // Для среднего уровня слов нет данных
            sourceArray = [];
        } else if (currentLevel === 3) {
            // Для тяжелого уровня слов нет данных
            sourceArray = [];
        }
    } else if (currentCategory === 'sentences') {
        // Пока пусто для всех уровней
        sourceArray = [];
    }

    // Проверяем, есть ли данные
    if (sourceArray.length === 0) {
        // Если данных нет, возвращаемся на главную
        returnToHomeNoData();
        return;
    }

    // Перемешиваем массив
    currentWords = shuffleArray(sourceArray);

    // Если слов меньше 30, используем все, если больше - берем первые 30
    if (currentWords.length > 30) {
        currentWords = currentWords.slice(0, 30);
    }
}

// Функция возврата на главную при отсутствии данных
function returnToHomeNoData() {
    // Скрываем лоадер
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
    }, 300);

    // Возвращаемся на главную
    document.getElementById('lesson-page').style.display = 'none';
    document.getElementById('lesson-page').classList.remove('active');
    document.getElementById('home-page').style.display = 'flex';
    document.getElementById('home-page').classList.add('active');

    resetTimer();
    resetHomeSelection();

    // Сбрасываем цвет таймера
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');
}

// Функция перемешивания массива (алгоритм Фишера-Йетса)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showLoaderAndNavigateToHome() {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';

    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);

    const minLoaderTime = 1500;
    const startTime = Date.now();

    function navigateToHome() {
        document.getElementById('lesson-page').style.display = 'none';
        document.getElementById('lesson-page').classList.remove('active');
        document.getElementById('home-page').style.display = 'flex';
        document.getElementById('home-page').classList.add('active');

        resetTimer();
        resetHomeSelection();

        // Сбрасываем цвет таймера при возврате на главную
        const timerElement = document.getElementById('timer');
        timerElement.classList.remove('timer-paused');

        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300);
    }

    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            navigateToHome();
        } else {
            setTimeout(navigateToHome, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

function showLoaderAndNavigateToLesson() {
    // Проверяем, что все необходимые данные выбраны
    if (!currentSubject || !currentCategory) {
        console.error('Не выбраны предмет или категория');
        return;
    }

    // Проверяем, есть ли данные для выбранного уровня
    const hasData = checkSubcategoryDataAvailability(currentSubject, currentCategory, currentLevel);
    if (!hasData) {
        // Если данных нет, возвращаемся на главную
        returnToHomeNoData();
        return;
    }

    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';

    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);

    const minLoaderTime = 1500;
    const startTime = Date.now();

    function navigateToLesson() {
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('lesson-page').style.display = 'block';
        document.getElementById('lesson-page').classList.add('active');

        resetTimer();
        updateLessonHeader();

        // Сбрасываем цвет таймера
        const timerElement = document.getElementById('timer');
        timerElement.classList.remove('timer-paused');

        if (currentSubject === 'math') {
            showMathContent();
        } else if (currentSubject === 'reading') {
            showReadingContent();
        }

        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300);
    }

    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            navigateToLesson();
        } else {
            setTimeout(navigateToLesson, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

function showReadingContent() {
    document.getElementById('math-content').style.display = 'none';
    document.getElementById('reading-content').style.display = 'block';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('stats').classList.remove('show');

    readingCompleted = false;
    document.getElementById('readingCompletion').style.display = 'none';
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('wordDisplay').style.display = 'flex';
    document.getElementById('wordInfo').style.display = 'block';
    document.getElementById('wordProgress').style.display = 'flex';
    document.getElementById('progressFill').style.width = '0%';

    // Загружаем слова в зависимости от уровня
    loadReadingWords();

    currentWordIndex = 0;
    updateReadingContent();
}

function showMathContent() {
    document.getElementById('math-content').style.display = 'block';
    document.getElementById('reading-content').style.display = 'none';
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('stats').classList.add('show');

    mathCompleted = false;
    document.getElementById('numberPad').classList.remove('disabled');
    document.getElementById('mathProblem').style.display = 'flex';
    document.getElementById('completionMessage').style.display = 'none';
    document.querySelector('.input-label').style.display = 'block';

    // Сбрасываем счетчики
    correctAnswers = 0;
    totalAnswers = 0;

    generateMathProblems();
    showMathProblem();
    updateStats();
}

function showMathProblem() {
    if (mathCompleted) {
        completeMathTest();
        return;
    }

    if (mathProblems.length === 0 || currentMathIndex >= mathProblems.length) {
        completeMathTest();
        return;
    }

    const problem = mathProblems[currentMathIndex];

    document.getElementById('mathNum1').textContent = problem.num1;
    document.getElementById('mathNum2').textContent = problem.num2;
    document.getElementById('mathOperator').textContent = problem.operator;
    document.getElementById('mathAnswer').textContent = '?';
    document.getElementById('mathAnswer').style.color = '#888888';

    const progress = ((currentMathIndex + 1) / mathProblems.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    document.getElementById('mathProblem').style.display = 'flex';
    document.getElementById('completionMessage').style.display = 'none';
    document.querySelector('.input-label').style.display = 'block';
    document.getElementById('numberPad').classList.remove('disabled');
}

function updateReadingContent() {
    if (readingCompleted) return;

    // Проверяем, есть ли слова
    if (!currentWords || currentWords.length === 0) {
        completeReadingTest();
        return;
    }

    if (currentWordIndex >= currentWords.length) {
        completeReadingTest();
        return;
    }

    const wordData = currentWords[currentWordIndex];
    if (!wordData) return;

    const wordDisplay = document.getElementById('wordDisplay');
    if (!wordDisplay) return;

    wordDisplay.innerHTML = '';

    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.style.visibility = 'hidden';
    }

    // Определяем, как отображать данные в зависимости от типа
    if (wordData.phrase) {
        // Это фраза из двух слов
        const words = wordData.phrase.split(' ');

        words.forEach((word, wordIndex) => {
            // Добавляем пробел между словами (кроме последнего)
            if (wordIndex > 0) {
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'word-letter space';
                spaceSpan.textContent = ' ';
                spaceSpan.style.marginRight = '10px';
                wordDisplay.appendChild(spaceSpan);
            }

            // Разбиваем каждое слово на буквы
            for (let char of word) {
                const span = document.createElement('span');
                span.className = 'word-letter';
                span.textContent = char;

                const vowels = 'АЕЁИОУЫЭЮЯ';
                if (vowels.includes(char.toUpperCase())) {
                    span.classList.add('vowel');
                } else {
                    span.classList.add('consonant');
                }

                wordDisplay.appendChild(span);
            }
        });

        // Обновляем информацию
        document.getElementById('wordText').textContent = wordData.phrase;
        document.getElementById('wordTranscription').textContent = wordData.transcription || '';
        document.getElementById('wordDescription').textContent = wordData.example || wordData.description || '';

    } else if (wordData.word && wordData.word.includes('-')) {
        // Это слово с дефисами (слоги)
        const syllables = wordData.word.split('-');

        syllables.forEach((syllable, syllableIndex) => {
            if (syllableIndex > 0) {
                const divider = document.createElement('span');
                divider.className = 'syllable-divider';
                divider.textContent = '-';
                wordDisplay.appendChild(divider);
            }

            for (let char of syllable) {
                const span = document.createElement('span');
                span.className = 'word-letter';
                span.textContent = char;

                const vowels = 'АЕЁИОУЫЭЮЯ';
                if (vowels.includes(char.toUpperCase())) {
                    span.classList.add('vowel');
                } else {
                    span.classList.add('consonant');
                }

                wordDisplay.appendChild(span);
            }
        });

        document.getElementById('wordText').textContent = wordData.word.replace(/-/g, '');
        document.getElementById('wordTranscription').textContent = wordData.transcription || '';
        document.getElementById('wordDescription').textContent = wordData.description || '';

    } else {
        // Обычное слово
        const wordText = wordData.word || '';

        for (let char of wordText) {
            const span = document.createElement('span');
            span.className = 'word-letter';
            span.textContent = char;

            const vowels = 'АЕЁИОУЫЭЮЯ';
            if (vowels.includes(char.toUpperCase())) {
                span.classList.add('vowel');
            } else {
                span.classList.add('consonant');
            }

            wordDisplay.appendChild(span);
        }

        document.getElementById('wordText').textContent = wordData.word || '';
        document.getElementById('wordTranscription').textContent = wordData.transcription || '';
        document.getElementById('wordDescription').textContent = wordData.description || '';
    }

    document.getElementById('currentWord').textContent = currentWordIndex + 1;
    document.getElementById('totalWords').textContent = currentWords.length;

    const progress = ((currentWordIndex + 1) / currentWords.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    document.getElementById('taskNav').classList.add('show');
}

function speakCurrentWord() {
    if (currentWords.length === 0 || currentWordIndex >= currentWords.length || !voiceEnabled) return;

    const wordData = currentWords[currentWordIndex];
    let textToSpeak = '';

    if (wordData.phrase) {
        textToSpeak = wordData.phrase;
    } else {
        textToSpeak = wordData.word ? wordData.word.replace(/-/g, '') : '';
    }

    // Отменяем текущее воспроизведение через SpeechService
    if (window.speechService && typeof window.speechService.cancel === 'function') {
        window.speechService.cancel();
    }

    // Показываем визуализатор
    const visualizer = document.getElementById('audioVisualizer');
    const wordContainer = document.querySelector('.word-container');

    if (visualizer) visualizer.style.visibility = 'hidden';

    if (wordContainer && visualizer) {
        wordContainer.insertBefore(visualizer, wordContainer.firstChild);
    }

    if (visualizer) {
        visualizer.style.position = 'relative';
        visualizer.style.visibility = 'visible';
        visualizer.style.transform = 'translateY(-50%)';
        visualizer.style.display = 'flex';
    }

    // Используем единую функцию синтеза речи (которая использует SpeechService)
    speakText(textToSpeak, true).then(() => {
        // Скрываем визуализатор после завершения воспроизведения
        hideVisualizer();
    }).catch(error => {
        console.error('Ошибка синтеза слова:', error);
        hideVisualizer();
    });
}

function hideVisualizer() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.style.visibility = 'hidden';
    }
}

function generateMathProblems() {
    let sourceArray = [];
    let operator = '';

    // Выбираем источник данных в зависимости от категории и уровня
    if (currentCategory === 'addition') {
        operator = '+';
        if (currentLevel === 1) sourceArray = [...additionEasy];
        else if (currentLevel === 2) sourceArray = [...additionMedium];
        else if (currentLevel === 3) sourceArray = [...additionHard];
    } else if (currentCategory === 'subtraction') {
        operator = '-';
        if (currentLevel === 1) sourceArray = [...subtractionEasy];
        else if (currentLevel === 2) sourceArray = [...subtractionMedium];
        else if (currentLevel === 3) sourceArray = [...subtractionHard];
    } else if (currentCategory === 'multiplication') {
        operator = '*';
        if (currentLevel === 1) sourceArray = [...multiplicationEasy];
        else if (currentLevel === 2) sourceArray = [...multiplicationMedium];
        else if (currentLevel === 3) sourceArray = [...multiplicationHard];
    } else if (currentCategory === 'division') {
        // Пока пусто
        sourceArray = [];
    }

    // Перемешиваем массив
    let shuffled = shuffleArray(sourceArray);

    // Берем первые 10 элементов (или меньше, если их недостаточно)
    mathProblems = shuffled.slice(0, 10).map(item => ({
        num1: item.num1,
        num2: item.num2,
        operator: operator,
        answer: item.answer
    }));

    // Если примеров меньше 10, дублируем их, но с другими числами
    while (mathProblems.length < 10 && sourceArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * sourceArray.length);
        const item = sourceArray[randomIndex];
        mathProblems.push({
            num1: item.num1,
            num2: item.num2,
            operator: operator,
            answer: item.answer
        });
    }

    currentMathIndex = 0;
}

function handleNumberInput(value) {
    if (isCheckingAnswer || mathCompleted) return;

    const answerElement = document.getElementById('mathAnswer');

    if (answerElement.textContent === '?' || answerElement.textContent === '✓') {
        answerElement.textContent = value;
    } else if (answerElement.textContent.length < 3) {
        answerElement.textContent += value;
    }

    clearTimeout(window.checkTimeout);
    window.checkTimeout = setTimeout(checkMathAnswer, 2000);
}

function checkMathAnswer() {
    if (isCheckingAnswer || mathCompleted) return;

    const answerElement = document.getElementById('mathAnswer');
    const userAnswer = parseInt(answerElement.textContent);
    const problem = mathProblems[currentMathIndex];

    if (isNaN(userAnswer) || answerElement.textContent === '?' || answerElement.textContent === '✓') {
        return;
    }

    isCheckingAnswer = true;
    totalAnswers++;

    if (userAnswer === problem.answer) {
        correctAnswers++;
        answerElement.style.color = '#8BBCB2';
        playCorrectSound();
        const randomResponse = correctResponses[Math.floor(Math.random() * correctResponses.length)];
        showFeedback(randomResponse, false);

        if (voiceEnabled) {
            speakText(randomResponse).catch(() => { });
        }

        setTimeout(() => {
            currentMathIndex++;
            isCheckingAnswer = false;

            if (currentMathIndex >= mathProblems.length) {
                completeMathTest();
            } else {
                showMathProblem();
            }

            updateStats();
        }, 1500);
    } else {
        answerElement.style.color = '#F35C87';
        playIncorrectSound();
        const randomResponse = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        showFeedback(randomResponse, true);

        if (voiceEnabled) {
            speakText(randomResponse).catch(() => { });
        }

        setTimeout(() => {
            answerElement.textContent = '?';
            answerElement.style.color = '#888888';
            currentMathIndex++;
            isCheckingAnswer = false;

            if (currentMathIndex >= mathProblems.length) {
                completeMathTest();
            } else {
                showMathProblem();
            }

            updateStats();
        }, 1500);
    }
}

function showFeedback(text, isWrong) {
    const feedback = document.getElementById('feedback');
    const feedbackText = document.getElementById('feedbackText');

    feedbackText.textContent = text;
    feedback.classList.toggle('wrong', isWrong);
    feedback.style.display = 'flex';

    setTimeout(() => {
        feedback.style.display = 'none';
    }, 2000);
}

function nextWord() {
    if (currentWords.length === 0 || readingCompleted) return;

    if (currentWordIndex >= currentWords.length - 1) {
        completeReadingTest();
        return;
    }

    currentWordIndex++;
    updateReadingContent();
}

function prevWord() {
    if (currentWords.length === 0 || readingCompleted) return;

    if (currentWordIndex > 0) {
        currentWordIndex--;
    } else {
        currentWordIndex = 0;
    }
    updateReadingContent();
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (!isTimerPaused) {
            timerSeconds++;

            const hours = Math.floor(timerSeconds / 3600);
            const minutes = Math.floor((timerSeconds % 3600) / 60);
            const seconds = timerSeconds % 60;

            document.getElementById('timer').textContent =
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function resetTimer() {
    timerSeconds = 0;
    isTimerPaused = false;
    document.getElementById('timer').textContent = '00:00:00';
    startTimer();
}

function updateStats() {
    const totalProblems = mathProblems.length;
    const wrongAnswers = totalAnswers - correctAnswers;

    document.getElementById('totalCount').textContent = totalProblems;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;
}

function loadAvailableVoices() {
    setTimeout(() => {
        availableVoices = speechSynthesis.getVoices();
        console.log("Доступные голоса:", availableVoices.map(v => `${v.name} (${v.lang})`));
    }, 500);

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function () {
            availableVoices = speechSynthesis.getVoices();
            console.log("Обновленный список голосов:", availableVoices.map(v => `${v.name} (${v.lang})`));
        };
    }
}

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (AudioContext || webkitAudioContext)();
        } catch (e) {
            console.log("Web Audio API не поддерживается в этом браузере:", e);
        }
    }
}

function getBestRussianVoice() {
    let bestVoice = availableVoices.find(voice =>
        (voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')) &&
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('yandex'))
    );

    if (bestVoice) return bestVoice;

    bestVoice = availableVoices.find(voice =>
        (voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')) &&
        !voice.name.toLowerCase().includes('default')
    );

    if (bestVoice) return bestVoice;

    bestVoice = availableVoices.find(voice =>
        voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')
    );

    return bestVoice || null;
}

function speakText(text, isWord = false) {
    if (!voiceEnabled) return Promise.resolve();

    console.log('[DEBUG speakText]', {
        text: text.substring(0, 50),
        isWord,
        voiceEnabled,
        speechServiceExists: !!window.speechService,
        isEnabled: window.speechService ? window.speechService.isEnabled() : 'no service',
        config: window.speechService ? window.speechService.config : null
    });

    // Используем SpeechService если он доступен, иначе fallback на старую реализацию
    if (window.speechService && window.speechService.isEnabled()) {
        console.log('[DEBUG] Using SpeechService (Yandex)');
        return window.speechService.speak(text, { isWord: isWord }).catch(error => {
            console.error('Ошибка синтеза речи:', error);
            // Fallback на старую реализацию при ошибке
            console.log('[DEBUG] Fallback due to error');
            return fallbackSpeakText(text, isWord);
        });
    } else {
        console.log('[DEBUG] Using fallback (browser)');
        // Fallback на старую реализацию если SpeechService не доступен
        return fallbackSpeakText(text, isWord);
    }
}

// Старая реализация синтеза для fallback
function fallbackSpeakText(text, isWord = false) {
    console.log('[DEBUG fallbackSpeakText]', { text: text.substring(0, 50), isWord });
    if (!window.speechSynthesis) return Promise.resolve();

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const bestVoice = getBestRussianVoice();

        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        if (isWord) {
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
        } else {
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 0.9;
        }

        utterance.lang = 'ru-RU';

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (event) => {
            reject(new Error(`Ошибка браузерного синтеза: ${event.error}`));
        };

        window.speechSynthesis.speak(utterance);
    });
}

function playCorrectSound() {
    if (!audioContext) {
        initAudioContext();
    }

    if (!audioContext) {
        return;
    }

    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 800;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log("Ошибка при воспроизведении звука:", e);
    }
}

function playIncorrectSound() {
    if (!audioContext) {
        initAudioContext();
    }

    if (!audioContext) {
        return;
    }

    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 400;

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log("Ошибка при воспроизведении звука:", e);
    }
}

function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
    }

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn') || e.target.closest('.btn')) {
        const btn = e.target.classList.contains('btn') ? e.target : e.target.closest('.btn');
        createRippleEffect(btn, e);
    }

    if (e.target.classList.contains('number-key')) {
        createRippleEffect(e.target, e);
    }

    if (e.target.classList.contains('dropdown-item') || e.target.closest('.dropdown-item')) {
        const item = e.target.classList.contains('dropdown-item') ? e.target : e.target.closest('.dropdown-item');
        createRippleEffect(item, e);
    }

    if (e.target.classList.contains('subject-card') && !e.target.classList.contains('unavailable')) {
        createRippleEffect(e.target, e);
    }

    if (e.target.classList.contains('difficulty-option') && !e.target.classList.contains('unavailable')) {
        createRippleEffect(e.target, e);
    }
});