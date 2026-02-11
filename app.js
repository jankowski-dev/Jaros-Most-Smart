// Основная логика приложения "Ярик.Уроки"

// Глобальные переменные
let currentPage = 'home';
let currentLevel = 1;
let currentSubject = ''; // Changed: no default subject
let currentCategory = ''; // Changed: no default category
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
let mathCompleted = false; // Флаг завершения математических заданий
let readingCompleted = false; // Флаг завершения заданий по чтению
let availableVoices = []; // Available voices for speech synthesis
let audioContext = null; // Audio context for sound effects

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Load available voices
    loadAvailableVoices();
    
    // Инициализация таймера
    startTimer();
    
    // Логотип для возврата на главную
    document.getElementById('mainLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    document.getElementById('lessonLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    // Subject selection
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            this.classList.add('active');
            
            currentSubject = this.dataset.subject;
            
            // Hide step 1 and show step 2
            document.getElementById('step1').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step2').style.display = 'block';
                
                // Allow next tick to render the element before adding class
                setTimeout(() => {
                    document.getElementById('step2').classList.remove('hidden');
                }, 10);
            }, 300); // Match the transition duration
            
            // Populate subcategories based on subject
            populateSubcategories();
        });
    });
    
    // Subcategory selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('subcategory-option')) {
            // Remove active class from all options
            document.querySelectorAll('.subcategory-option').forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            e.target.classList.add('active');
            
            currentCategory = e.target.dataset.category;
            
            // Hide step 2 and show step 3
            document.getElementById('step2').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';
                
                // Allow next tick to render the element before adding class
                setTimeout(() => {
                    document.getElementById('step3').classList.remove('hidden');
                }, 10);
            }, 300); // Match the transition duration
        }
    });
    
    // Difficulty selection
    document.querySelectorAll('.difficulty-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            document.querySelectorAll('.difficulty-option').forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            this.classList.add('active');
            
            currentLevel = parseInt(this.dataset.difficulty);
            
            // Hide step 3 and show step 4
            document.getElementById('step3').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('step3').style.display = 'none';
                document.getElementById('step4').style.display = 'block';
                
                // Allow next tick to render the element before adding class
                setTimeout(() => {
                    document.getElementById('step4').classList.remove('hidden');
                }, 10);
            }, 300); // Match the transition duration
        });
    });
    
    // Start lesson button
    document.getElementById('startLessonBtn').addEventListener('click', function() {
        showLoaderAndNavigateToLesson();
    });
    
    // Repeat lesson buttons
    document.getElementById('repeatLessonBtn').addEventListener('click', function() {
        resetLesson();
    });
    
    document.getElementById('repeatReadingBtn').addEventListener('click', function() {
        resetLesson();
    });
    
    // Finish lesson buttons
    document.getElementById('finishLessonBtn').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    document.getElementById('finishReadingBtn').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    // Клавиши калькулятора
    document.querySelectorAll('.number-key').forEach(key => {
        key.addEventListener('click', function(e) {
            // Если задание завершено - не обрабатываем клик
            if (mathCompleted) return;
            
            createRippleEffect(this, e);
            const value = this.dataset.value;
            handleNumberInput(value);
        });
    });
    
    // Кнопка голоса
    document.getElementById('voiceToggleBtn').addEventListener('click', function() {
        voiceEnabled = !voiceEnabled;
        this.textContent = voiceEnabled ? 'Голос: Вкл' : 'Голос: Выкл';
        
        if (!voiceEnabled) {
            this.style.background = '#757575';
        } else {
            this.style.background = '#EE9F21';
        }
    });
    
    // Кнопки навигации для чтения
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('prevBtn').addEventListener('click', prevWord);
    
    // Клик на слово для озвучивания
    document.getElementById('wordDisplay').addEventListener('click', function() {
        speakCurrentWord();
    });
    
    // Кнопка перезагрузки
    document.getElementById('reloadIcon').addEventListener('click', function() {
        // Проверяем, какой режим активен
        if (currentSubject === 'math') {
            resetLesson();
        } else if (currentSubject === 'reading') {
            resetLesson();
        }
    });
    
    // Initialize audio context on first user interaction
    const handleUserInteraction = () => {
        initAudioContext();
        // Remove the event listeners after initialization
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Обновление статистики
    updateStats();
});

// Populate subcategories based on selected subject
function populateSubcategories() {
    const container = document.getElementById('subcategoryGrid');
    container.innerHTML = ''; // Clear previous content
    
    if (currentSubject === 'math') {
        const categories = [
            {name: 'addition', title: 'Сложение', description: 'Складывайте числа'},
            {name: 'subtraction', title: 'Вычитание', description: 'Находите разность'},
            {name: 'multiplication', title: 'Умножение', description: 'Умножайте числа'},
            {name: 'division', title: 'Деление', description: 'Делите числа'}
        ];
        
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'subcategory-option';
            div.dataset.category = cat.name;
            div.innerHTML = `
                <div>${cat.title}</div>
                <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">${cat.description}</div>
            `;
            container.appendChild(div);
        });
    } else if (currentSubject === 'reading') {
        // For reading, we'll add appropriate categories
        const categories = [
            {name: 'syllables', title: 'Слоги', description: 'Чтение по слогам'},
            {name: 'words', title: 'Слова', description: 'Чтение слов'},
            {name: 'sentences', title: 'Предложения', description: 'Чтение предложений'}
        ];
        
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'subcategory-option';
            div.dataset.category = cat.name;
            div.innerHTML = `
                <div>${cat.title}</div>
                <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">${cat.description}</div>
            `;
            container.appendChild(div);
        });
    }
}

// Reset the selection on the home page
function resetHomeSelection() {
    // Remove active classes
    document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.subcategory-option').forEach(opt => opt.classList.remove('active'));
    document.querySelectorAll('.difficulty-option').forEach(opt => opt.classList.remove('active'));
    
    // Reset all selections
    currentSubject = '';
    currentCategory = '';
    currentLevel = 1;
    
    // Hide all steps except the first one
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step3').classList.remove('hidden');
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step4').classList.remove('hidden');
    
    // Show the first step
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step1').classList.remove('hidden');
}

// Helper function to get display name for subjects
function getSubjectDisplayName(subject) {
    const names = {
        'math': 'Математика',
        'reading': 'Чтение',
        'writing': 'Письмо',
        'puzzles': 'Головоломки'
    };
    return names[subject] || subject;
}

// Helper function to get display name for categories
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

// Функция подсчета оценки по 10-балльной шкале
function calculateGrade(correct, total) {
    if (total === 0) return 0;
    
    const percentage = (correct / total) * 100;
    
    // 10-балльная система
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

// Функция завершения математического теста
function completeMathTest() {
    mathCompleted = true;
    
    // Блокируем клавиатуру
    document.getElementById('numberPad').classList.add('disabled');
    
    // Скрываем математический пример
    document.getElementById('mathProblem').style.display = 'none';
    
    // Скрываем подпись "Введи ответ"
    document.querySelector('.input-label').style.display = 'none';
    
    // Показываем сообщение об окончании
    const completionMessage = document.getElementById('completionMessage');
    completionMessage.style.display = 'flex';
    
    // Рассчитываем и показываем оценку
    const grade = calculateGrade(correctAnswers, totalAnswers);
    document.getElementById('finalGrade').textContent = grade;
    
    // Показываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'flex';
    
    // Скрываем фидбэк сообщение если оно было показано
    document.getElementById('feedback').style.display = 'none';
    
    // Прогресс бар на 100%
    document.getElementById('progressFill').style.width = '100%';
}

// Функция сброса математического теста
function resetMathTest() {
    mathCompleted = false;
    
    // Разблокируем клавиатуру
    document.getElementById('numberPad').classList.remove('disabled');
    
    // Показываем математический пример
    document.getElementById('mathProblem').style.display = 'flex';
    
    // Показываем подпись "Введи ответ"
    document.querySelector('.input-label').style.display = 'block';
    
    // Скрываем сообщение об окончании
    document.getElementById('completionMessage').style.display = 'none';
    
    // Скрываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'none';
    
    // Сбрасываем статистику
    correctAnswers = 0;
    totalAnswers = 0;
    currentMathIndex = 0;
    
    // Генерируем новые задачи
    generateMathProblems();
    showMathProblem();
    updateStats();
}

// Функция завершения заданий по чтения
function completeReadingTest() {
    readingCompleted = true;

    // Блокируем кнопки навигации
    document.getElementById('taskNav').classList.remove('show');

    // Скрываем слово и информацию о слове
    document.getElementById('wordDisplay').style.display = 'none';
    document.getElementById('wordInfo').style.display = 'none';
    document.getElementById('wordProgress').style.display = 'none';

    // Показываем сообщение об окончании
    document.getElementById('readingCompletion').style.display = 'flex';

    // Показываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'flex';

    // Прогресс бар на 100%
    document.getElementById('progressFill').style.width = '100%';

    // Останавливаем таймер
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}
    
// Функция сброса заданий по чтения
function resetReadingTest() {
    readingCompleted = false;

    // Показываем слово и информацию о слове
    document.getElementById('wordDisplay').style.display = 'flex';
    document.getElementById('wordInfo').style.display = 'block';
    document.getElementById('wordProgress').style.display = 'block';

    // Скрываем сообщение об окончании
    document.getElementById('readingCompletion').style.display = 'none';

    // Скрываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'none';

    // Показываем кнопки навигации
    document.getElementById('taskNav').classList.add('show');

    // Сбрасываем индекс
    currentWordIndex = 0;

    // Перезапускаем таймер
    resetTimer();

    // Обновляем контент
    updateReadingContent();
}

// Function to reset the entire lesson
function resetLesson() {
    if (currentSubject === 'math') {
        resetMathTest();
        mathCompleted = false;
    } else if (currentSubject === 'reading') {
        resetReadingTest();
        readingCompleted = false;
    }
}

// Функция навигации на главную страницу с лоадером
function showLoaderAndNavigateToHome() {
    // Показываем лоадер
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';
    
    // Плавное появление лоадера
    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);
    
    // Минимальное время показа лоадера - 1.5 секунды
    const minLoaderTime = 1500;
    const startTime = Date.now();
    
    // Функция перехода на главную страницу
    function navigateToHome() {
        // Скрываем страницу уроков
        document.getElementById('lesson-page').style.display = 'none';
        document.getElementById('lesson-page').classList.remove('active');
        
        // Показываем главную страницу
        document.getElementById('home-page').style.display = 'block';
        document.getElementById('home-page').classList.add('active');
        
        // Сброс таймера
        resetTimer();
        
        // Reset home page selections
        resetHomeSelection();
        
        // Скрываем лоадер с небольшой задержкой для плавности
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300);
    }
    
    // Запускаем таймер на минимум 1.5 секунды
    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            navigateToHome();
        } else {
            // Если прошло меньше 1.5 секунд, ждем оставшееся время
            setTimeout(navigateToHome, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

// Функция навигации на страницу урока с лоадером
function showLoaderAndNavigateToLesson() {
    // Показываем лоадер
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';
    
    // Плавное появление лоадера
    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);
    
    // Минимальное время показа лоадера - 1.5 секунды
    const minLoaderTime = 1500;
    const startTime = Date.now();
    
    // Функция перехода на страницу уроков
    function navigateToLesson() {
        // Полностью скрываем главную страницу
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('home-page').classList.remove('active');
        
        // Показываем страницу урока
        document.getElementById('lesson-page').style.display = 'block';
        document.getElementById('lesson-page').classList.add('active');
        
        // Сброс таймера
        resetTimer();
        
        // Show content based on selected subject
        if (currentSubject === 'math') {
            showMathContent();
        } else if (currentSubject === 'reading') {
            showReadingContent();
        }
        
        // Скрываем лоадер с небольшой задержкой для плавности
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300);
    }
    
    // Запускаем таймер на минимум 1.5 секунды
    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            navigateToLesson();
        } else {
            // Если прошло меньше 1.5 секунд, ждем оставшееся время
            setTimeout(navigateToLesson, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

// Показать контент для чтения
function showReadingContent() {
    document.getElementById('math-content').style.display = 'none';
    document.getElementById('reading-content').style.display = 'block';
    document.getElementById('feedback').style.display = 'none'; // Скрываем фидбэк
    document.getElementById('stats').classList.remove('show'); // Скрываем статистику
    
    // Сбрасываем флаг завершения
    readingCompleted = false;

    // Скрываем сообщение об окончании и навигацию
    document.getElementById('readingCompletion').style.display = 'none';
    document.getElementById('taskNav').classList.remove('show');
    
    // Скрываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'none';
    
    // Показываем слово и информацию о слове
    document.getElementById('wordDisplay').style.display = 'flex';
    document.getElementById('wordInfo').style.display = 'block';
    document.getElementById('wordProgress').style.display = 'block';
    
    // Сбрасываем прогресс бар
    document.getElementById('progressFill').style.width = '0%';
    
    // Загружаем слова в зависимости от уровня
    if (currentLevel === 1) {
        // For reading, level 1 is simple 2-syllable words with vowels
        if (currentSubject === 'reading') {
            currentWords = [...syllablesLevel1];
        }
    } else if (currentLevel === 2) {
        // Level 2 is 3-letter words
        if (currentSubject === 'reading') {
            currentWords = [...syllablesLevel2];
        }
    } else if (currentLevel === 3) {
        // Level 3 is 6-letter words with 3 syllables
        if (currentSubject === 'reading') {
            currentWords = [...syllablesLevel3];
        }
    }
    
    currentWordIndex = 0;
    updateReadingContent();
}

// Показать контент для математики
function showMathContent() {
    document.getElementById('math-content').style.display = 'block';
    document.getElementById('reading-content').style.display = 'none';
    document.getElementById('taskNav').classList.remove('show'); // Скрываем кнопки навигации
    document.getElementById('feedback').style.display = 'none'; // Скрываем фидбэк
    document.getElementById('stats').classList.add('show'); // Показываем статистику
    
    // Сбрасываем флаг завершения
    mathCompleted = false;
    
    // Скрываем иконку перезагрузки
    document.getElementById('reloadIcon').style.display = 'none';
    
    // Сбрасываем состояние
    document.getElementById('numberPad').classList.remove('disabled');
    document.getElementById('mathProblem').style.display = 'flex';
    document.getElementById('completionMessage').style.display = 'none';
    document.querySelector('.input-label').style.display = 'block';
    
    // Generate problems based on selected category and difficulty
    generateMathProblems();
    showMathProblem();
}

// Показать математическую задачу
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
    
    // Прогресс бар
    const progress = ((currentMathIndex + 1) / mathProblems.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Показываем математический пример и скрываем сообщение об окончании
    document.getElementById('mathProblem').style.display = 'flex';
    document.getElementById('completionMessage').style.display = 'none';
    
    // Показываем подпись "Введи ответ"
    document.querySelector('.input-label').style.display = 'block';
    
    // Разблокируем клавиатуру
    document.getElementById('numberPad').classList.remove('disabled');
}

// Обновить контент для чтения
function updateReadingContent() {
    // Если чтение завершено, не обновляем
    if (readingCompleted) return;

    if (currentWords.length === 0 || currentWordIndex >= currentWords.length) {
        return;
    }
    
    const wordData = currentWords[currentWordIndex];
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.innerHTML = '';
    
    // Скрываем аквалайзер при обновлении слова
    const visualizer = document.getElementById('audioVisualizer');
    visualizer.style.display = 'none';
    
    // Разбиваем слово на слоги
    const syllables = wordData.word.split('-');
    
    syllables.forEach((syllable, syllableIndex) => {
        // Добавляем разделитель между слогами (кроме первого)
        if (syllableIndex > 0) {
            const divider = document.createElement('span');
            divider.className = 'syllable-divider';
            divider.textContent = '-';
            wordDisplay.appendChild(divider);
        }
        
        // Добавляем буквы
        for (let char of syllable) {
            const span = document.createElement('span');
            span.className = 'word-letter';
            span.textContent = char;
            
            // Определяем гласные
            const vowels = 'АЕЁИОУЫЭЮЯ';
            if (vowels.includes(char.toUpperCase())) {
                span.classList.add('vowel');
            } else {
                span.classList.add('consonant');
            }
            
            wordDisplay.appendChild(span);
        }
    });
    
    // Обновляем информацию о слове
    document.getElementById('wordText').textContent = wordData.word.replace(/-/g, '');
    document.getElementById('wordTranscription').textContent = wordData.transcription;
    document.getElementById('wordDescription').textContent = generateDescription(wordData.word);
    
    // Обновляем счетчик
    document.getElementById('currentWord').textContent = currentWordIndex + 1;
    document.getElementById('totalWords').textContent = currentWords.length;
    
    // Прогресс бар
    const progress = ((currentWordIndex + 1) / currentWords.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Показываем кнопки навигации
    document.getElementById('taskNav').classList.add('show');

    // Убрано автоматическое озвучивание слова
}

// Озвучить текущее слово
function speakCurrentWord() {
    if (currentWords.length === 0 || currentWordIndex >= currentWords.length || !voiceEnabled) return;
    
    const wordData = currentWords[currentWordIndex];
    const word = wordData.word.replace(/-/g, '');
    
    // Останавливаем предыдущее озвучивание
    if (currentUtterance && isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        hideVisualizer();
    }
    
    // Показываем визуализатор слева от слова
    const visualizer = document.getElementById('audioVisualizer');
    const wordContainer = document.querySelector('.word-container');
    
    // Скрываем аквалайзер перед показом
    visualizer.style.display = 'none';
    
    // Перемещаем аквалайзер в контейнер слова для правильного позиционирования
    if (wordContainer) {
        wordContainer.insertBefore(visualizer, wordContainer.firstChild);
    }
    
    // Позиционируем аквалайзер слева от слова
    visualizer.style.position = 'absolute';
    visualizer.style.left = '-90px';
    visualizer.style.top = '50%';
    visualizer.style.transform = 'translateY(-50%)';
    visualizer.style.display = 'flex';
    
    // Используем улучшенную функцию озвучивания
    speakText(word, true);
}

// Скрыть визуализатор
function hideVisualizer() {
    const visualizer = document.getElementById('audioVisualizer');
    if (visualizer) {
        visualizer.style.display = 'none';
    }
}

// Генерация описания слова
function generateDescription(word) {
    const key = word.replace(/-/g, '').toUpperCase();
    return wordDescriptions[key] || 'интересное, новое, полезное слово';
}

// Генерация математических задач
function generateMathProblems() {
    mathProblems = [];
    let count = 10;
    let maxValue = 10; // Default for easy level
    
    // Set max value based on difficulty level
    if (currentLevel === 2) maxValue = 20;
    else if (currentLevel === 3) maxValue = 30;
    
    if (currentCategory === 'addition') {
        for (let i = 0; i < count; i++) {
            // For addition, we need to ensure the sum doesn't exceed the max value
            let a = Math.floor(Math.random() * Math.floor(maxValue / 2)) + 1;
            let b = Math.floor(Math.random() * Math.floor(maxValue / 2)) + 1;
            
            // Ensure the result doesn't exceed the max value
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
            // For subtraction, ensure positive results
            let a = Math.floor(Math.random() * maxValue) + 1;
            let b = Math.floor(Math.random() * maxValue) + 1;
            
            // Ensure result is positive and within bounds
            if (a < b) {
                [a, b] = [b, a]; // Swap values
            }
            
            // Ensure a is not greater than max value
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
        // For multiplication, we'll use smaller numbers to keep results reasonable
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 5) + 1; // 1-5
            let b = Math.floor(Math.random() * Math.min(10, Math.floor(maxValue / a))) + 1; // Adjust b based on a and max value
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '*',
                answer: a * b
            });
        }
    } else if (currentCategory === 'division') {
        // For division, we'll generate products and their factors
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 5) + 1; // 1-5
            let b = Math.floor(Math.random() * Math.min(10, Math.floor(maxValue / a))) + 1; // Adjust b based on a and max value
            let product = a * b;
            
            mathProblems.push({
                num1: product,
                num2: a,
                operator: '/',
                answer: b
            });
        }
    }
    
    // Перемешиваем
    for (let i = mathProblems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mathProblems[i], mathProblems[j]] = [mathProblems[j], mathProblems[i]];
    }
    
    currentMathIndex = 0;
}

// Обработка ввода чисел
function handleNumberInput(value) {
    if (isCheckingAnswer || mathCompleted) return;
    
    const answerElement = document.getElementById('mathAnswer');
    
    if (answerElement.textContent === '?' || answerElement.textContent === '✓') {
        answerElement.textContent = value;
    } else if (answerElement.textContent.length < 3) { // Разрешаем до 3 цифр
        answerElement.textContent += value;
    }
    
    // Автоматическая проверка через 2 секунды (увеличено с 1 до 2 секунд)
    clearTimeout(window.checkTimeout);
    window.checkTimeout = setTimeout(checkMathAnswer, 2000);
}

// Проверка ответа по математике
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
        // Правильный ответ
        correctAnswers++;
        answerElement.style.color = '#8BBCB2';
        
        // Воспроизводим звук правильного ответа
        playCorrectSound();
        
        // Случайная похвала
        const randomResponse = correctResponses[Math.floor(Math.random() * correctResponses.length)];
        showFeedback(randomResponse, false);
        
        // Озвучивание с улучшенным голосом
        if (voiceEnabled) {
            speakText(randomResponse);
        }
        
        // Переход к следующей задаче через 1.5 секунды
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
        // Неправильный ответ
        answerElement.style.color = '#F35C87';
        
        // Воспроизводим звук неправильного ответа
        playIncorrectSound();
        
        // Случайное ободрение
        const randomResponse = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
        showFeedback(randomResponse, true);
        
        // Озвучивание с улучшенным голосом
        if (voiceEnabled) {
            speakText(randomResponse);
        }
        
        // Очистка ответа через 1.5 секунды и переход к следующей задаче
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

// Показать фидбэк сообщение
function showFeedback(text, isWrong) {
    const feedback = document.getElementById('feedback');
    const feedbackText = document.getElementById('feedbackText');
    
    feedbackText.textContent = text;
    feedback.classList.toggle('wrong', isWrong);
    feedback.style.display = 'flex';
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 2000);
}

// Следующее слово
function nextWord() {
    if (currentWords.length === 0 || readingCompleted) return;

    // Проверяем, достигнут ли конец списка
    if (currentWordIndex >= currentWords.length - 1) {
        completeReadingTest();
        return;
    }

    currentWordIndex++;
    updateReadingContent();
}

// Предыдущее слово
function prevWord() {
    if (currentWords.length === 0 || readingCompleted) return;

    currentWordIndex = (currentWordIndex - 1 + currentWords.length) % currentWords.length;
    updateReadingContent();
}

// Запуск таймера
function startTimer() {
    // Очищаем предыдущий интервал
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Обновляем каждую секунду
    timerInterval = setInterval(() => {
        timerSeconds++;
        
        const hours = Math.floor(timerSeconds / 3600);
        const minutes = Math.floor((timerSeconds % 3600) / 60);
        const seconds = timerSeconds % 60;
        
        document.getElementById('timer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Сброс таймера
function resetTimer() {
    timerSeconds = 0;
    document.getElementById('timer').textContent = '00:00:00';
    startTimer(); // Перезапускаем таймер
}

// Обновление статистики
function updateStats() {
    const totalProblems = mathProblems.length;
    const wrongAnswers = totalAnswers - correctAnswers;
    
    document.getElementById('solvedCount').textContent = totalAnswers;
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;
    document.getElementById('totalCount').textContent = totalProblems;
}

// Initialize voices when the page loads
function loadAvailableVoices() {
    // Wait for voices to be loaded (especially for Chrome)
    setTimeout(() => {
        availableVoices = speechSynthesis.getVoices();
        console.log("Доступные голоса:", availableVoices.map(v => `${v.name} (${v.lang})`));
    }, 500);
    
    // Event listener for when voices are loaded
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
            availableVoices = speechSynthesis.getVoices();
            console.log("Обновленный список голосов:", availableVoices.map(v => `${v.name} (${v.lang})`));
        };
    }
}

// Initialize audio context on first user interaction
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (AudioContext || webkitAudioContext)();
        } catch (e) {
            console.log("Web Audio API не поддерживается в этом браузере:", e);
        }
    }
}

// Function to get a high-quality Russian voice if available
function getBestRussianVoice() {
    // First, try to find a female Russian voice (often sounds more natural)
    let bestVoice = availableVoices.find(voice => 
        (voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')) && 
        (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || 
         voice.name.toLowerCase().includes('google') || voice.name.toLowerCase().includes('yandex'))
    );
    
    if (bestVoice) return bestVoice;
    
    // Then try to find any Russian voice that's not marked as default or basic
    bestVoice = availableVoices.find(voice => 
        (voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')) && 
        !voice.name.toLowerCase().includes('default')
    );
    
    if (bestVoice) return bestVoice;
    
    // Fallback to any Russian voice
    bestVoice = availableVoices.find(voice => 
        voice.lang.startsWith('ru') || voice.lang.startsWith('ru-RU')
    );
    
    return bestVoice || null;
}

// Function to speak text with improved voice settings
function speakText(text, isWord = false) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to get the best Russian voice
    const bestVoice = getBestRussianVoice();
    
    if (bestVoice) {
        utterance.voice = bestVoice;
    }
    
    // Adjust settings based on whether it's a word or phrase
    if (isWord) {
        // For words, use slightly slower rate for clarity
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
    } else {
        // For phrases/responses, use standard settings
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
    }
    
    utterance.lang = 'ru-RU';
    
    window.speechSynthesis.speak(utterance);
}

// Функция воспроизведения звукового эффекта для правильного ответа
function playCorrectSound() {
    // Ensure audio context is initialized
    if (!audioContext) {
        initAudioContext();
    }
    
    if (!audioContext) {
        return; // Web Audio API not supported
    }
    
    try {
        // Resume context if suspended (due to autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настройки осциллятора для приятного звука (правильный ответ)
        oscillator.type = 'sine';
        oscillator.frequency.value = 800; // Частота звука выше для положительного оттенка
        
        // Настройки громкости
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        // Воспроизводим звук на 300мс
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log("Ошибка при воспроизведении звука:", e);
    }
}

// Функция воспроизведения звукового эффекта для неправильного ответа
function playIncorrectSound() {
    // Ensure audio context is initialized
    if (!audioContext) {
        initAudioContext();
    }
    
    if (!audioContext) {
        return; // Web Audio API not supported
    }
    
    try {
        // Resume context if suspended (due to autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Настройки осциллятора для неприятного звука (неправильный ответ)
        oscillator.type = 'sine';
        oscillator.frequency.value = 400; // Более низкая частота для негативного оттенка
        
        // Настройки громкости
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Воспроизводим звук на 500мс
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log("Ошибка при воспроизведении звука:", e);
    }
}

// Material-UI ripple effect
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    // Позиционируем от места клика
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    // Убедимся, что элемент имеет position: relative для корректного позиционирования ripple
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

// Добавляем ripple эффект на все кнопки
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
    
    if (e.target.classList.contains('subcategory-option')) {
        createRippleEffect(e.target, e);
    }
    
    if (e.target.classList.contains('difficulty-option')) {
        createRippleEffect(e.target, e);
    }
});