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
document.addEventListener('DOMContentLoaded', function() {
    loadAvailableVoices();
    startTimer();
    
    document.getElementById('mainLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    document.getElementById('lessonLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    // Subject selection - Step 1
    document.querySelectorAll('#step1 .subject-card').forEach(card => {
        card.addEventListener('click', function() {
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
        });
    });
    
    // Subcategory selection - Step 2
    document.addEventListener('click', function(e) {
        if (e.target.closest('#subcategoryGrid') && e.target.closest('.subject-card')) {
            const card = e.target.closest('.subject-card');
            
            document.querySelectorAll('#subcategoryGrid .subject-card').forEach(opt => opt.classList.remove('active'));
            card.classList.add('active');
            
            currentCategory = card.dataset.category;
            
            document.getElementById('step2').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';
                
                setTimeout(() => {
                    document.getElementById('step3').classList.remove('hidden');
                }, 10);
            }, 300);
        }
    });
    
    // Difficulty selection - Step 3 - АВТОМАТИЧЕСКИЙ ЗАПУСК
    document.addEventListener('click', function(e) {
        if (e.target.closest('.difficulty-options') && e.target.closest('.difficulty-option')) {
            const card = e.target.closest('.difficulty-option');
            
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
        restartBtn.addEventListener('click', function() {
            resetLesson();
        });
    }
    
    // Клик на таймер для паузы/продолжения
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.addEventListener('click', toggleTimerPause);
    }
    
    // Finish lesson buttons
    document.getElementById('finishLessonBtn').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    // Calculator keys
    document.querySelectorAll('.number-key').forEach(key => {
        key.addEventListener('click', function(e) {
            if (mathCompleted) return;
            createRippleEffect(this, e);
            const value = this.dataset.value;
            handleNumberInput(value);
        });
    });
    
    // Voice toggle button
    document.getElementById('voiceToggleBtn').addEventListener('click', function() {
        voiceEnabled = !voiceEnabled;
        this.textContent = voiceEnabled ? 'Вкл' : 'Выкл';
        this.style.background = voiceEnabled ? '#EE9F21' : '#757575';
    });
    
    // Reading navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('prevBtn').addEventListener('click', prevWord);
    
    // Click on word to speak
    document.getElementById('wordDisplay').addEventListener('click', function() {
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

// Функция паузы/продолжения по клику на таймер
function toggleTimerPause() {
    isTimerPaused = !isTimerPaused;
    const timerLabel = document.querySelector('.timer-label');
    
    if (isTimerPaused) {
        timerLabel.textContent = '';
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else {
        timerLabel.textContent = '';
        startTimer();
    }
}

// Функция перезапуска урока
function resetLesson() {
    if (currentSubject === 'math') {
        resetMathTest();
        mathCompleted = false;
    } else if (currentSubject === 'reading') {
        resetReadingTest();
        readingCompleted = false;
    }
    
    // Сбрасываем таймер
    resetTimer();
    
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
            {name: 'addition', title: 'Сложение', description: 'Складывайте числа'},
            {name: 'subtraction', title: 'Вычитание', description: 'Находите разность'},
            {name: 'multiplication', title: 'Умножение', description: 'Умножайте числа'},
            {name: 'division', title: 'Деление', description: 'Делите числа'}
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
            {name: 'syllables', title: 'Слоги', description: 'Чтение по слогам'},
            {name: 'words', title: 'Слова', description: 'Чтение слов'},
            {name: 'sentences', title: 'Предложения', description: 'Чтение предложений'}
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
    document.querySelectorAll('#subcategoryGrid .subject-card').forEach(opt => opt.classList.remove('active'));
    document.querySelectorAll('.difficulty-options .difficulty-option').forEach(opt => opt.classList.remove('active'));
    
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
    lessonInfo.textContent = `${subjectName}: ${categoryName}`;
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
    
    // Сбрасываем таймер
    resetTimer();
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
    
    // Загружаем слова в зависимости от уровня
    loadReadingWords();
    
    resetTimer();
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = '';
    }
    isTimerPaused = false;
    updateReadingContent();
}

// Функция для загрузки слов для чтения
function loadReadingWords() {
    if (currentLevel === 1) {
        currentWords = [...syllablesLevel1];
    } else if (currentLevel === 2) {
        currentWords = [...syllablesLevel2];
    } else if (currentLevel === 3) {
        currentWords = [...syllablesLevel3];
    }
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
    
    generateMathProblems();
    showMathProblem();
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
    document.getElementById('wordTranscription').textContent = wordData.transcription;
    document.getElementById('wordDescription').textContent = generateDescription(wordData.word);
    
    document.getElementById('currentWord').textContent = currentWordIndex + 1;
    document.getElementById('totalWords').textContent = currentWords.length;
    
    const progress = ((currentWordIndex + 1) / currentWords.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    document.getElementById('taskNav').classList.add('show');
}

function speakCurrentWord() {
    if (currentWords.length === 0 || currentWordIndex >= currentWords.length || !voiceEnabled) return;
    
    const wordData = currentWords[currentWordIndex];
    const word = wordData.word.replace(/-/g, '');
    
    if (currentUtterance && isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        hideVisualizer();
    }
    
    const visualizer = document.getElementById('audioVisualizer');
    const wordContainer = document.querySelector('.word-container');
    
    if (visualizer) visualizer.style.visibility = 'hidden';
    
    if (wordContainer && visualizer) {
        wordContainer.insertBefore(visualizer, wordContainer.firstChild);
    }
    
    if (visualizer) {
        visualizer.style.position = 'relative';
        // visualizer.style.left = '0';
        // visualizer.style.top = '50%';
        visualizer.style.visibility = 'visible';
        visualizer.style.transform = 'translateY(-50%)';
        visualizer.style.display = 'flex';
    }
    
    currentUtterance = new SpeechSynthesisUtterance(word);
    const bestVoice = getBestRussianVoice();
    
    if (bestVoice) {
        currentUtterance.voice = bestVoice;
    }
    
    currentUtterance.rate = 0.8;
    currentUtterance.pitch = 1.1;
    currentUtterance.volume = 0.8;
    currentUtterance.lang = 'ru-RU';
    
    isSpeaking = true;
    
    currentUtterance.onend = function() {
        isSpeaking = false;
        hideVisualizer();
    };
    
    currentUtterance.onerror = function() {
        isSpeaking = false;
        hideVisualizer();
    };
    
    window.speechSynthesis.speak(currentUtterance);
}

function hideVisualizer() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.style.visibility = 'hidden';
    }
}

function generateDescription(word) {
    const key = word.replace(/-/g, '').toUpperCase();
    return wordDescriptions[key] || 'интересное, новое, полезное слово';
}

function generateMathProblems() {
    mathProblems = [];
    let count = 10;
    let maxValue = 10;
    
    if (currentLevel === 2) maxValue = 20;
    else if (currentLevel === 3) maxValue = 30;
    
    if (currentCategory === 'addition') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * Math.floor(maxValue / 2)) + 1;
            let b = Math.floor(Math.random() * Math.floor(maxValue / 2)) + 1;
            
            if (a + b > maxValue) {
                a = Math.floor(maxValue / 2);
                b = maxValue - a;
            }
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '+',
                answer: a + b
            });
        }
    } else if (currentCategory === 'subtraction') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * maxValue) + 1;
            let b = Math.floor(Math.random() * maxValue) + 1;
            
            if (a < b) {
                [a, b] = [b, a];
            }
            
            if (a > maxValue) {
                a = maxValue;
                b = Math.floor(Math.random() * maxValue) + 1;
                if (a < b) [a, b] = [b, a];
            }
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '-',
                answer: a - b
            });
        }
    } else if (currentCategory === 'multiplication') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 5) + 1;
            let b = Math.floor(Math.random() * Math.min(10, Math.floor(maxValue / a))) + 1;
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '*',
                answer: a * b
            });
        }
    } else if (currentCategory === 'division') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 5) + 1;
            let b = Math.floor(Math.random() * Math.min(10, Math.floor(maxValue / a))) + 1;
            let product = a * b;
            
            mathProblems.push({
                num1: product,
                num2: a,
                operator: '/',
                answer: b
            });
        }
    }
    
    for (let i = mathProblems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mathProblems[i], mathProblems[j]] = [mathProblems[j], mathProblems[i]];
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
            speakText(randomResponse);
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
            speakText(randomResponse);
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
    
    document.getElementById('solvedCount').textContent = totalAnswers;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;
    document.getElementById('totalCount').textContent = totalProblems;
}

function loadAvailableVoices() {
    setTimeout(() => {
        availableVoices = speechSynthesis.getVoices();
        console.log("Доступные голоса:", availableVoices.map(v => `${v.name} (${v.lang})`));
    }, 500);
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
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
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
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
    window.speechSynthesis.speak(utterance);
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

document.addEventListener('click', function(e) {
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
    
    if (e.target.classList.contains('subject-card')) {
        createRippleEffect(e.target, e);
    }
    
    if (e.target.classList.contains('difficulty-option')) {
        createRippleEffect(e.target, e);
    }
});