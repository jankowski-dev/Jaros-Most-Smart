// Основная логика приложения "Ярик.Уроки"

// Глобальные переменные
let currentPage = 'home';
let currentLevel = 1;

// Базовые классы для элементов теста (зависят от дизайна и применяются app.js)
const TEST_WORD_DISPLAY_CLASSES = 'test-word-display text-7xl md:text-9xl font-black';
const TEST_OPTION_CLASSES = 'test-option border-2 border-gray-300 rounded-2xl p-5 text-xl font-bold text-gray-600 hover:border-brand hover:bg-brand/5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]';
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
let globalDifficulty = 1;

/**
 * Показывает полноэкранный лоадер и страхует от «вечного» экрана:
 * если навигация упадёт с ошибкой, лоадер всё равно скроется через 6 секунд.
 */
function showLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    if (loaderTimeout) clearTimeout(loaderTimeout);

    loader.style.display = 'flex';
    loader.style.opacity = '0';

    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);

    loaderTimeout = setTimeout(() => {
        hideLoader();
    }, 6000);
}

function hideLoader(delay = 0) {
    const loader = document.getElementById('loader');
    if (!loader) return;

    if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
    }

    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }, delay);
}

/**
 * Останавливает озвучку и анимацию заливки при смене экрана,
 * чтобы голос не продолжал звучать на главной или в другом задании.
 */
function stopAllSpeech() {
    stopFillAnimation();

    if (window.speechService && typeof window.speechService.cancel === 'function') {
        window.speechService.cancel();
    } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    currentUtterance = null;
}

// Тест на слух
let currentTestIndex = 0;
let testQuestions = [];
let testWordsData = [];
let testAnswers = [];
let testCorrectCount = 0;
let testTotalAnswered = 0;
let testCompleted = false;
let testTimerInterval;
let testTimerSeconds = 0;
let testVoiceEnabled = true;
let wrongAttempts = 0;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function () {
    loadAvailableVoices();
    // Таймер НЕ запускается здесь — запускается только при входе в урок

    document.getElementById('mainLogo').addEventListener('click', function () {
        showLoaderAndNavigateToHome();
    });

    document.getElementById('lessonLogo').addEventListener('click', function () {
        showLoaderAndNavigateToHome();
    });

    // Initialize toggle labels state (Легкий is default active)
    const leftLabel = document.querySelector('.toggle-left');
    const rightLabel = document.querySelector('.toggle-right');
    if (leftLabel && rightLabel) {
        leftLabel.classList.add('active');
        rightLabel.classList.remove('active');
    }

    // Toggle switch - глобальная настройка сложности
    const difficultyToggle = document.getElementById('difficultyToggle');
    if (difficultyToggle) {
        const syncToggleA11y = () => {
            const isHard = difficultyToggle.classList.contains('active');
            difficultyToggle.setAttribute('aria-checked', String(isHard));
            difficultyToggle.setAttribute('aria-label', isHard ? 'Сложность: сложная' : 'Сложность: лёгкая');
        };

        difficultyToggle.setAttribute('role', 'switch');
        difficultyToggle.setAttribute('tabindex', '0');
        syncToggleA11y();

        difficultyToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
            globalDifficulty = this.classList.contains('active') ? 2 : 1;

            const leftLabel = this.parentElement.querySelector('.toggle-left');
            const rightLabel = this.parentElement.querySelector('.toggle-right');
            if (leftLabel && rightLabel) {
                leftLabel.classList.toggle('active', globalDifficulty === 1);
                rightLabel.classList.toggle('active', globalDifficulty === 2);
            }
            syncToggleA11y();
        });

        difficultyToggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Menu items
    document.getElementById('menu-math').addEventListener('click', function () {
        currentSubject = 'math';
        currentCategory = 'addition';
        currentLevel = globalDifficulty;
        showLoaderAndNavigateToLesson();
    });

    document.getElementById('menu-reading').addEventListener('click', function () {
        currentSubject = 'reading';
        currentCategory = 'syllables';
        currentLevel = globalDifficulty;
        showLoaderAndNavigateToLesson();
    });

    document.getElementById('menu-test').addEventListener('click', function () {
        showLoaderAndNavigateToTest();
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Тест - голос
    document.getElementById('testVoiceToggleBtn').addEventListener('click', function () {
        testVoiceEnabled = !testVoiceEnabled;
        const iconOn = document.getElementById('testVoiceIconOn');
        const iconOff = document.getElementById('testVoiceIconOff');
        this.setAttribute('aria-label', testVoiceEnabled ? 'Озвучивание теста: включено' : 'Озвучивание теста: выключено');
        if (testVoiceEnabled) {
            iconOn.style.display = 'inline-flex';
            iconOff.style.display = 'none';
            this.classList.remove('bg-gray-200', 'text-gray-500');
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'inline-flex';
            this.classList.add('bg-gray-200', 'text-gray-500');
        }
    });

    // Тест - клик по слову для воспроизведения
    document.getElementById('testWordDisplay').addEventListener('click', function () {
        playCurrentTestWord();
    });

    // Тест - выбор варианта ответа
    document.querySelectorAll('.test-option').forEach(option => {
        option.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            checkTestAnswer(index);
        });
    });



    // Тест - заново
    document.getElementById('testRestartBtn').addEventListener('click', resetTest);

    // Тест - закрыть
    document.getElementById('finishTestBtn').addEventListener('click', showLoaderAndNavigateToHome);

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
        key.setAttribute('role', 'button');
        key.setAttribute('tabindex', '0');
        key.setAttribute('aria-label', 'Цифра ' + key.dataset.value);

        key.addEventListener('click', function (e) {
            if (mathCompleted) return;
            createRippleEffect(this, e);
            const value = this.dataset.value;
            handleNumberInput(value);
        });

        key.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                this.click();
            }
        });
    });

    // Keyboard input for math (desktop)
    document.addEventListener('keydown', function (e) {
        if (currentSubject !== 'math' || mathCompleted || isCheckingAnswer) return;
        if (!document.getElementById('lesson-page').classList.contains('active')) return;
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        if (e.target && e.target.classList && e.target.classList.contains('number-key')) {
            // Enter/Space на цифровой клавише обрабатывает сама клавиша.
            if (e.key === 'Enter' || e.key === ' ') return;
        }
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            handleNumberInput(e.key);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            checkMathAnswer();
        }
    });

    // Voice toggle button
    document.getElementById('voiceToggleBtn').addEventListener('click', function () {
        voiceEnabled = !voiceEnabled;
        this.setAttribute('aria-label', voiceEnabled ? 'Озвучивание урока: включено' : 'Озвучивание урока: выключено');

        const iconOn = document.getElementById('voiceIconOn');
        const iconOff = document.getElementById('voiceIconOff');

        if (voiceEnabled) {
            iconOn.style.display = 'inline-flex';
            iconOff.style.display = 'none';
            this.classList.remove('bg-gray-200', 'text-gray-500');
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'inline-flex';
            this.classList.add('bg-gray-200', 'text-gray-500');
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
});

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

function resetLesson() {
    stopAllSpeech();

    correctAnswers = 0;
    totalAnswers = 0;

    if (currentSubject === 'math') {
        resetMathTest();
        mathCompleted = false;
    } else if (currentSubject === 'reading') {
        resetReadingTest();
        readingCompleted = false;
    }

    resetTimer();

    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');

    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    isTimerPaused = false;
}

function getSubjectDisplayName(subject) {
    const names = {
        'math': 'Математика',
        'reading': 'Чтение'
    };
    return names[subject] || subject;
}

function getCategoryDisplayName(category) {
    const names = {
        'addition': 'Сложение',
        'syllables': 'Слоги'
    };
    return names[category] || category;
}

function updateLessonHeader() {
    const lessonInfo = document.getElementById('lessonInfo');
    if (!lessonInfo) return;
    const subjectName = getSubjectDisplayName(currentSubject);
    const levelText = levelNames[currentLevel] || '';
    lessonInfo.textContent = `${subjectName} (${levelText})`;
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
    stopAllSpeech();

    mathCompleted = true;
    document.getElementById('numberPad').classList.add('disabled');
    document.getElementById('mathProblem').style.display = 'none';
    document.getElementById('inputLabel').style.display = 'none';

    const completionMessage = document.getElementById('completionMessage');
    completionMessage.style.display = 'flex';

    const grade = calculateGrade(correctAnswers, totalAnswers);
    document.getElementById('finalGrade').textContent = grade;

    document.getElementById('feedback').style.display = 'none';
    document.getElementById('progressFill').style.width = '100%';

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
    document.getElementById('completionMessage').style.display = 'none';
    document.getElementById('inputLabel').style.display = '';

    correctAnswers = 0;
    totalAnswers = 0;
    currentMathIndex = 0;

    generateMathProblems();
    showMathProblem();
    updateStats();

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
    stopAllSpeech();

    readingCompleted = true;
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('wordDisplay').style.display = 'none';
    document.getElementById('wordProgress').style.display = 'none';
    document.getElementById('readingCompletion').style.display = 'flex';

    document.getElementById('readingProgressFill').style.width = '100%';

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
    document.getElementById('wordProgress').style.display = 'flex';
    document.getElementById('readingCompletion').style.display = 'none';

    document.getElementById('taskNav').classList.add('show');

    currentWordIndex = 0;

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

function loadReadingWords() {
    let sourceArray = [];

    if (currentLevel === 1) {
        sourceArray = [...syllablesEasy];
    } else {
        sourceArray = [...syllablesHard];
    }

    if (sourceArray.length === 0) {
        returnToHomeNoData();
        return;
    }

    currentWords = shuffleArray(sourceArray);

    if (currentWords.length > 30) {
        currentWords = currentWords.slice(0, 30);
    }
}

function returnToHomeNoData() {
    hideLoader();

    document.getElementById('lesson-page').style.display = 'none';
    document.getElementById('lesson-page').classList.remove('active');
    document.getElementById('home-page').style.display = 'flex';
    document.getElementById('home-page').classList.add('active');

    resetTimer();
    resetHomeSelection();

    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('timer-paused');
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showLoaderAndNavigateToHome() {
    stopAllSpeech();
    showLoader();

    const minLoaderTime = 500;
    const startTime = Date.now();

    function navigateToHome() {
        document.getElementById('lesson-page').style.display = 'none';
        document.getElementById('lesson-page').classList.remove('active');
        document.getElementById('settings-page').style.display = 'none';
        document.getElementById('settings-page').classList.remove('active');
        document.getElementById('test-page').style.display = 'none';
        document.getElementById('test-page').classList.remove('active');
        document.getElementById('home-page').style.display = 'flex';
        document.getElementById('home-page').classList.add('active');

        resetTimer();
        resetHomeSelection();

        const timerElement = document.getElementById('timer');
        timerElement.classList.remove('timer-paused');

        hideLoader(250);
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
    if (!currentSubject) {
        console.error('Не выбран предмет');
        return;
    }

    stopAllSpeech();
    showLoader();

    const minLoaderTime = 700;
    const startTime = Date.now();

    function navigateToLesson() {
        try {
            document.getElementById('home-page').style.display = 'none';
            document.getElementById('home-page').classList.remove('active');
            document.getElementById('settings-page').style.display = 'none';
            document.getElementById('settings-page').classList.remove('active');
            document.getElementById('test-page').style.display = 'none';
            document.getElementById('test-page').classList.remove('active');
            document.getElementById('lesson-page').style.display = 'flex';
            document.getElementById('lesson-page').classList.add('active');

            resetTimer();
            updateLessonHeader();

            const timerElement = document.getElementById('timer');
            timerElement.classList.remove('timer-paused');

            if (currentSubject === 'math') {
                showMathContent();
            } else if (currentSubject === 'reading') {
                showReadingContent();
            }
        } catch (error) {
            console.error('Ошибка при открытии урока:', error);
        } finally {
            // Лоадер скрывается даже при ошибке инициализации урока.
            hideLoader(250);
        }
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
    document.getElementById('reading-content').style.display = 'flex';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('stats').classList.remove('show');

    readingCompleted = false;
    document.getElementById('readingCompletion').style.display = 'none';
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('wordDisplay').style.display = 'flex';
    document.getElementById('wordProgress').style.display = 'flex';
    document.getElementById('readingProgressFill').style.width = '0%';

    const wordDisplay = document.getElementById('wordDisplay');
    if (currentLevel === 2) {
        wordDisplay.classList.add('hard-level');
    } else {
        wordDisplay.classList.remove('hard-level');
    }

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
    document.getElementById('inputLabel').style.display = '';

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
    document.getElementById('mathAnswer').classList.remove('text-correct', 'text-wrong');

    const progress = ((currentMathIndex + 1) / mathProblems.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    document.getElementById('mathProblem').style.display = 'flex';
    document.getElementById('completionMessage').style.display = 'none';
    document.getElementById('numberPad').classList.remove('disabled');
}

function updateReadingContent() {
    if (readingCompleted) return;

    stopAllSpeech();

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

    stopFillAnimation();
    wordDisplay.innerHTML = '';

    if (wordData.phrase) {
        const words = wordData.phrase.split(' ');

        words.forEach((word, wordIndex) => {
            if (wordIndex > 0) {
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'word-letter space';
                spaceSpan.textContent = ' ';
                spaceSpan.style.marginRight = '25px';
                wordDisplay.appendChild(spaceSpan);
            }

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

    } else if (wordData.word && wordData.word.includes('-')) {
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

    } else {
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
    }

    document.getElementById('currentWord').textContent = currentWordIndex + 1;
    document.getElementById('totalWords').textContent = currentWords.length;

    const progress = ((currentWordIndex + 1) / currentWords.length) * 100;
    document.getElementById('readingProgressFill').style.width = progress + '%';

    document.getElementById('taskNav').classList.add('show');
}

// --- Анимация заливки слова синхронно с озвучкой ---

const UNFILL_DURATION = 600; // мс — обратный ход заливки

let activeFillLetters = null;
let activeFillRaf = null;

function getFillLetters(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('.word-letter, .test-char'))
        .filter(el => !el.classList.contains('space'));
}

// fraction: 0..1 — залиты буквы [0, fraction*N)
function applyFill(letters, fraction) {
    if (!letters || !letters.length) return;
    const count = Math.round(Math.max(0, Math.min(1, fraction)) * letters.length);
    letters.forEach((el, i) => {
        el.classList.toggle('filled', i < count);
    });
}

// fraction: 0..1 — залиты буквы [fraction*N, N), т.е. гаснут слева направо
function applyUnfill(letters, fraction) {
    if (!letters || !letters.length) return;
    const count = Math.round(Math.max(0, Math.min(1, fraction)) * letters.length);
    letters.forEach((el, i) => {
        el.classList.toggle('filled', i >= count);
    });
}

function stopFillAnimation() {
    if (activeFillRaf) {
        cancelAnimationFrame(activeFillRaf);
        activeFillRaf = null;
    }
    if (activeFillLetters) {
        applyFill(activeFillLetters, 0);
        activeFillLetters = null;
    }
}

function startFillAnimation(container) {
    stopFillAnimation();

    const letters = getFillLetters(container);
    if (!letters.length) return null;

    activeFillLetters = letters;
    applyFill(letters, 0);

    return {
        setProgress(fraction) {
            if (activeFillLetters !== letters) return;
            applyFill(letters, fraction);
        },
        finish() {
            if (activeFillLetters !== letters) return;
            applyFill(letters, 1);

            const start = performance.now();
            const step = (now) => {
                const p = Math.min(1, (now - start) / UNFILL_DURATION);
                applyUnfill(letters, p);
                if (p < 1) {
                    activeFillRaf = requestAnimationFrame(step);
                } else {
                    activeFillRaf = null;
                    if (activeFillLetters === letters) activeFillLetters = null;
                }
            };
            activeFillRaf = requestAnimationFrame(step);
        }
    };
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

    if (window.speechService && typeof window.speechService.cancel === 'function') {
        window.speechService.cancel();
    }

    const wordDisplay = document.getElementById('wordDisplay');
    const animation = startFillAnimation(wordDisplay);

    speakText(textToSpeak, true, {
        onProgress: animation ? (fraction) => animation.setProgress(fraction) : undefined
    }).then(() => {
        if (animation) animation.finish();
    }).catch(error => {
        console.error('Ошибка синтеза слова:', error);
        if (animation) animation.finish();
    });
}

function generateMathProblems() {
    let sourceArray = [];

    if (currentLevel === 1) {
        sourceArray = additionEasy.map(item => ({ ...item, operator: '+' }));
    } else {
        const addProblems = additionEasy.map(item => ({ ...item, operator: '+' }));
        const subProblems = subtractionEasy.map(item => ({ ...item, operator: '-' }));
        const allProblems = [...addProblems, ...subProblems];
        sourceArray = shuffleArray(allProblems).slice(0, 20);
    }

    let shuffled = shuffleArray(sourceArray);

    mathProblems = shuffled.slice(0, 10).map(item => ({
        num1: item.num1,
        num2: item.num2,
        operator: item.operator,
        answer: item.answer
    }));

    while (mathProblems.length < 10 && sourceArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * sourceArray.length);
        const item = sourceArray[randomIndex];
        mathProblems.push({
            num1: item.num1,
            num2: item.num2,
            operator: item.operator,
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
        answerElement.classList.add('text-correct');
        playCorrectSound();
        const randomResponse = correctResponses[Math.floor(Math.random() * correctResponses.length)];
        showFeedback(randomResponse, false);

        const advanceToNextProblem = () => {
            currentMathIndex++;
            isCheckingAnswer = false;

            if (currentMathIndex >= mathProblems.length) {
                completeMathTest();
            } else {
                showMathProblem();
            }

            updateStats();
        };

        if (voiceEnabled) {
            const speechPromise = speakText(randomResponse).catch(() => { });
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2500));
            Promise.race([speechPromise, timeoutPromise]).then(advanceToNextProblem);
        } else {
            setTimeout(advanceToNextProblem, 2500);
        }
    } else {
        answerElement.classList.add('text-wrong');
        playIncorrectSound();
        const randomResponse = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        showFeedback(randomResponse, true);

        const advanceToNextProblem = () => {
            answerElement.textContent = '?';
            currentMathIndex++;
            isCheckingAnswer = false;

            if (currentMathIndex >= mathProblems.length) {
                completeMathTest();
            } else {
                showMathProblem();
            }

            updateStats();
        };

        if (voiceEnabled) {
            const speechPromise = speakText(randomResponse).catch(() => { });
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2500));
            Promise.race([speechPromise, timeoutPromise]).then(advanceToNextProblem);
        } else {
            setTimeout(advanceToNextProblem, 2500);
        }
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

function resetHomeSelection() {
    currentSubject = '';
    currentCategory = '';
    currentLevel = 1;
}

function loadAvailableVoices() {
    const debug = window.appConfig && window.appConfig.speech && window.appConfig.speech.common && window.appConfig.speech.common.debug;
    const logVoices = (label) => {
        if (!debug) return;
        console.log(label, availableVoices.map(v => `${v.name} (${v.lang})`));
    };
    setTimeout(() => {
        availableVoices = speechSynthesis.getVoices();
        logVoices("Доступные голоса:");
    }, 500);

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function () {
            availableVoices = speechSynthesis.getVoices();
            logVoices("Обновленный список голосов:");
        };
    }
}

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new AudioContext();
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

function speakText(text, isWord = false, options = {}) {
    if (!voiceEnabled) return Promise.resolve();

    const debug = window.appConfig && window.appConfig.speech && window.appConfig.speech.common && window.appConfig.speech.common.debug;
    if (debug) {
        console.log('[DEBUG speakText]', {
            text: text.substring(0, 50),
            isWord,
            voiceEnabled,
            speechServiceExists: !!window.speechService,
            isEnabled: window.speechService ? window.speechService.isEnabled() : 'no service',
            config: window.speechService ? window.speechService.config : null
        });
    }

    if (window.speechService && window.speechService.isEnabled()) {
        if (debug) console.log('[DEBUG] Using SpeechService (Yandex)');
        return window.speechService.speak(text, { isWord: isWord, onProgress: options.onProgress }).catch(error => {
            console.error('Ошибка синтеза речи:', error);
            if (debug) console.log('[DEBUG] Fallback due to error');
            return fallbackSpeakText(text, isWord, options);
        });
    } else {
        if (debug) console.log('[DEBUG] Using fallback (browser)');
        return fallbackSpeakText(text, isWord, options);
    }
}

function fallbackSpeakText(text, isWord = false, options = {}) {
    if (window.appConfig && window.appConfig.speech && window.appConfig.speech.common && window.appConfig.speech.common.debug) {
        console.log('[DEBUG fallbackSpeakText]', { text: text.substring(0, 50), isWord });
    }
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

        const tracker = typeof createBrowserProgressTracker === 'function'
            ? createBrowserProgressTracker(utterance, text, { isWord: isWord, onProgress: options.onProgress })
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

// ==================== ТЕСТ НА СЛУХ ====================

function showLoaderAndNavigateToTest() {
    stopAllSpeech();
    showLoader();

    const minLoaderTime = 500;
    const startTime = Date.now();

    function navigateToTest() {
        try {
            document.getElementById('home-page').style.display = 'none';
            document.getElementById('home-page').classList.remove('active');
            document.getElementById('lesson-page').style.display = 'none';
            document.getElementById('lesson-page').classList.remove('active');
            document.getElementById('test-page').style.display = 'flex';
            document.getElementById('test-page').classList.add('active');

            initTest();
        } catch (error) {
            console.error('Ошибка при открытии теста:', error);
        } finally {
            hideLoader(250);
        }
    }

    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            navigateToTest();
        } else {
            setTimeout(navigateToTest, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

function initTest() {
    currentTestIndex = 0;
    testCorrectCount = 0;
    testTotalAnswered = 0;
    testCompleted = false;
    wrongAttempts = 0; // wrongAnswers объявлен ниже как let
    testWordsData = [...testWords];
    testQuestions = shuffleArray([...testWordsData]).slice(0, 20);
    testAnswers = new Array(testQuestions.length).fill(null);

    resetTestTimer();
    showTestWord();
}

// Символы-заглушки для скрытого слова (смесь букв и знаков)
const PLACEHOLDER_CHARS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$?!*+=<>~';

function renderTestPlaceholder(word) {
    const wordDisplay = document.getElementById('testWordDisplay');
    if (!wordDisplay) return;

    wordDisplay.className = TEST_WORD_DISPLAY_CLASSES;
    wordDisplay.innerHTML = '';

    const length = (word || '').length;
    for (let i = 0; i < length; i++) {
        const span = document.createElement('span');
        span.className = 'test-char';
        span.textContent = PLACEHOLDER_CHARS[Math.floor(Math.random() * PLACEHOLDER_CHARS.length)];
        wordDisplay.appendChild(span);
    }
}

function showTestWord() {
    if (currentTestIndex >= testQuestions.length) {
        completeTest();
        return;
    }

    stopAllSpeech();

    const wordData = testQuestions[currentTestIndex];
    const options = document.querySelectorAll('.test-option');
    const feedback = document.getElementById('testFeedback');
    const completion = document.getElementById('testCompletion');

    completion.style.display = 'none';
    feedback.style.display = 'none';
    feedback.classList.remove('show', 'wrong');

    stopFillAnimation();
    renderTestPlaceholder(wordData.word);

    const shuffledOptions = shuffleArray([...wordData.options]);
    options.forEach((opt, i) => {
        opt.textContent = shuffledOptions[i];
        opt.disabled = false;
        opt.className = TEST_OPTION_CLASSES;
    });

    const progress = ((currentTestIndex + 1) / testQuestions.length) * 100;
    document.getElementById('testProgressFill').style.width = progress + '%';

    if (testVoiceEnabled) {
        setTimeout(() => playCurrentTestWord(), 500);
    }
}

function playCurrentTestWord() {
    if (!testVoiceEnabled || testQuestions.length === 0 || testCompleted) return;

    const wordData = testQuestions[currentTestIndex];
    const textToSpeak = wordData.word;

    if (window.speechService && typeof window.speechService.cancel === 'function') {
        window.speechService.cancel();
    }

    const wordDisplay = document.getElementById('testWordDisplay');
    const animation = startFillAnimation(wordDisplay);

    const speakPromise = window.speechService && window.speechService.isEnabled()
        ? window.speechService.speak(textToSpeak, {
            isWord: true,
            onProgress: animation ? (fraction) => animation.setProgress(fraction) : undefined
        })
        : fallbackSpeakText(textToSpeak, true, {
            onProgress: animation ? (fraction) => animation.setProgress(fraction) : undefined
        });

    speakPromise.then(() => {
        if (animation) animation.finish();
    }).catch(() => {
        if (animation) animation.finish();
    });
}

function revealTestWord(word, onDone) {
    const wordDisplay = document.getElementById('testWordDisplay');
    if (!wordDisplay) {
        if (onDone) onDone();
        return;
    }

    const chars = Array.from(wordDisplay.querySelectorAll('.test-char'));
    const letters = (word || '').split('');
    wordDisplay.classList.add('correct');

    const STAGGER = 60;
    const FLIP = 150;

    chars.forEach((span, i) => {
        setTimeout(() => {
            span.classList.add('revealing');
            setTimeout(() => {
                span.textContent = letters[i] || '';
                span.classList.remove('revealing');
            }, FLIP);
        }, i * STAGGER);
    });

    const total = chars.length ? chars.length * STAGGER + FLIP + 1300 : 0;
    setTimeout(() => {
        if (onDone) onDone();
    }, total);
}

function checkTestAnswer(selectedIndex) {
    if (testCompleted) return;

    const wordData = testQuestions[currentTestIndex];
    const shuffledOptions = document.querySelectorAll('.test-option');
    const selectedWord = shuffledOptions[selectedIndex].textContent;
    const correctWord = wordData.word;
    const isCorrect = selectedWord === correctWord;

    shuffledOptions.forEach((opt, i) => {
        opt.disabled = true;
        if (i === selectedIndex) {
            opt.classList.add('selected');
            if (isCorrect) {
                opt.classList.add('correct');
            } else {
                opt.classList.add('wrong');
            }
        }
    });

    if (isCorrect) {
        testCorrectCount++;
        playCorrectSound();

        stopFillAnimation();

        const feedback = document.getElementById('testFeedback');
        const response = correctResponses[Math.floor(Math.random() * correctResponses.length)];
        document.getElementById('testFeedbackText').textContent = response;
        feedback.classList.remove('wrong');
        feedback.classList.add('show');
        feedback.style.display = 'flex';

        revealTestWord(wordData.word, () => {
            feedback.classList.remove('show');
            feedback.style.display = 'none';
            nextTest();
        });
    } else {
        wrongAttempts++;
        playIncorrectSound();
        shakeElement(shuffledOptions[selectedIndex]);

        const feedback = document.getElementById('testFeedback');
        const response = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        document.getElementById('testFeedbackText').textContent = response;
        feedback.classList.add('show', 'wrong');
        feedback.style.display = 'flex';

        setTimeout(() => {
            feedback.classList.remove('show', 'wrong');
            feedback.style.display = 'none';
            shuffledOptions.forEach(opt => {
                opt.disabled = false;
                opt.classList.remove('selected', 'wrong');
            });
        }, 1000);
    }
}

function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = 'shake 0.5s ease-in-out';
}

function nextTest() {
    if (currentTestIndex < testQuestions.length - 1) {
        currentTestIndex++;
        wrongAttempts = 0;
        showTestWord();
    } else if (currentTestIndex === testQuestions.length - 1) {
        currentTestIndex++;
        setTimeout(completeTest, 500);
    }
}

function prevTest() {
    if (currentTestIndex > 0) {
        currentTestIndex--;
        showTestWord();
    }
}

function completeTest() {
    if (testCompleted) return;
    testCompleted = true;

    stopAllSpeech();

    document.getElementById('test-content').style.display = 'none';
    document.getElementById('testCompletion').style.display = 'flex';
    document.getElementById('testProgressFill').style.width = '100%';

    const grade = calculateGrade(testCorrectCount, testQuestions.length);
    document.getElementById('testFinalGrade').textContent = grade;

    isTimerPaused = true;
    if (testTimerInterval) {
        clearInterval(testTimerInterval);
    }
}

function resetTest() {
    currentTestIndex = 0;
    testCorrectCount = 0;
    testTotalAnswered = 0;
    testCompleted = false;
    wrongAttempts = 0;
    testQuestions = shuffleArray([...testWordsData]).slice(0, 20);
    testAnswers = new Array(testQuestions.length).fill(null);

    document.getElementById('test-content').style.display = 'flex';
    document.getElementById('testCompletion').style.display = 'none';

    resetTestTimer();
    showTestWord();
}

function resetTestTimer() {
    testTimerSeconds = 0;
    document.getElementById('testTimer').textContent = '00:00:00';

    if (testTimerInterval) {
        clearInterval(testTimerInterval);
    }

    testTimerInterval = setInterval(() => {
        testTimerSeconds++;
        const h = Math.floor(testTimerSeconds / 3600);
        const m = Math.floor((testTimerSeconds % 3600) / 60);
        const s = testTimerSeconds % 60;
        document.getElementById('testTimer').textContent =
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, 1000);
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

    if (e.target.classList.contains('menu-item')) {
        createRippleEffect(e.target, e);
    }
});