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
let globalDifficulty = 1;

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

    // Тест - голос
    document.getElementById('testVoiceToggleBtn').addEventListener('click', function () {
        testVoiceEnabled = !testVoiceEnabled;
        const iconOn = document.getElementById('testVoiceIconOn');
        const iconOff = document.getElementById('testVoiceIconOff');
        if (testVoiceEnabled) {
            iconOn.style.display = 'inline-flex';
            iconOff.style.display = 'none';
            this.style.background = '#EE9F21';
        } else {
            iconOn.style.display = 'none';
            iconOff.style.display = 'inline-flex';
            this.style.background = '#757575';
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
    readingCompleted = true;
    document.getElementById('taskNav').classList.remove('show');
    document.getElementById('wordDisplay').style.display = 'none';
    document.getElementById('wordProgress').style.display = 'none';
    document.getElementById('readingCompletion').style.display = 'flex';

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
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
    }, 300);

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
    if (!currentSubject) {
        console.error('Не выбран предмет');
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
        document.getElementById('settings-page').style.display = 'none';
        document.getElementById('settings-page').classList.remove('active');
        document.getElementById('test-page').style.display = 'none';
        document.getElementById('test-page').classList.remove('active');
        document.getElementById('lesson-page').style.display = 'block';
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
    document.getElementById('wordProgress').style.display = 'flex';
    document.getElementById('progressFill').style.width = '0%';

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
    document.querySelector('.input-label').style.display = 'block';

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

    if (window.speechService && typeof window.speechService.cancel === 'function') {
        window.speechService.cancel();
    }

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

    speakText(textToSpeak, true).then(() => {
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
        answerElement.style.color = '#8BBCB2';
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
        answerElement.style.color = '#F35C87';
        playIncorrectSound();
        const randomResponse = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        showFeedback(randomResponse, true);

        const advanceToNextProblem = () => {
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

    if (window.speechService && window.speechService.isEnabled()) {
        console.log('[DEBUG] Using SpeechService (Yandex)');
        return window.speechService.speak(text, { isWord: isWord }).catch(error => {
            console.error('Ошибка синтеза речи:', error);
            console.log('[DEBUG] Fallback due to error');
            return fallbackSpeakText(text, isWord);
        });
    } else {
        console.log('[DEBUG] Using fallback (browser)');
        return fallbackSpeakText(text, isWord);
    }
}

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

// ==================== ТЕСТ НА СЛУХ ====================

function showLoaderAndNavigateToTest() {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';

    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);

    const minLoaderTime = 800;
    const startTime = Date.now();

    function navigateToTest() {
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('lesson-page').style.display = 'none';
        document.getElementById('lesson-page').classList.remove('active');
        document.getElementById('test-page').style.display = 'flex';
        document.getElementById('test-page').classList.add('active');

        initTest();

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
    wrongAttempts = 0;
    testWordsData = [...testWords];
    testQuestions = shuffleArray([...testWordsData]).slice(0, 20);
    testAnswers = new Array(testQuestions.length).fill(null);

    resetTestTimer();
    showTestWord();
}

function showTestWord() {
    if (currentTestIndex >= testQuestions.length) {
        completeTest();
        return;
    }

    const wordData = testQuestions[currentTestIndex];
    const wordDisplay = document.getElementById('testWordDisplay');
    const options = document.querySelectorAll('.test-option');
    const feedback = document.getElementById('testFeedback');
    const completion = document.getElementById('testCompletion');

    completion.style.display = 'none';
    feedback.style.display = 'none';
    feedback.classList.remove('show', 'wrong');

    wordDisplay.textContent = '???';
    wordDisplay.className = 'test-word-display';

    const shuffledOptions = shuffleArray([...wordData.options]);
    options.forEach((opt, i) => {
        opt.textContent = shuffledOptions[i];
        opt.disabled = false;
        opt.className = 'test-option';
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

    const visualizer = document.getElementById('testAudioVisualizer');
    const wordContainer = document.querySelector('.test-word-container');

    if (visualizer) {
        visualizer.style.visibility = 'hidden';
    }

    if (wordContainer && visualizer) {
        wordContainer.insertBefore(visualizer, wordContainer.firstChild);
    }

    if (visualizer) {
        visualizer.style.position = 'relative';
        visualizer.style.visibility = 'visible';
        visualizer.style.transform = 'translateY(-50%)';
        visualizer.style.display = 'flex';
    }

    const speakPromise = window.speechService && window.speechService.isEnabled()
        ? window.speechService.speak(textToSpeak, { isWord: true })
        : fallbackSpeakText(textToSpeak, true);

    speakPromise.then(() => {
        hideTestVisualizer();
    }).catch(() => {
        hideTestVisualizer();
    });
}

function hideTestVisualizer() {
    const visualizer = document.getElementById('testAudioVisualizer');
    if (visualizer) {
        visualizer.style.visibility = 'hidden';
    }
}

let wrongAttempts = 0;

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

        const wordDisplay = document.getElementById('testWordDisplay');
        wordDisplay.textContent = wordData.word;
        wordDisplay.className = 'test-word-display correct';

        const feedback = document.getElementById('testFeedback');
        const response = correctResponses[Math.floor(Math.random() * correctResponses.length)];
        document.getElementById('testFeedbackText').textContent = response;
        feedback.classList.remove('wrong');
        feedback.classList.add('show');

        setTimeout(() => {
            feedback.classList.remove('show');
            nextTest();
        }, 2000);
    } else {
        wrongAttempts++;
        playIncorrectSound();
        shakeElement(shuffledOptions[selectedIndex]);

        const feedback = document.getElementById('testFeedback');
        const response = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        document.getElementById('testFeedbackText').textContent = response;
        feedback.classList.add('show', 'wrong');

        setTimeout(() => {
            feedback.classList.remove('show', 'wrong');
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

    document.getElementById('test-content').style.display = 'block';
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