// Global variable to hold audio context
let audioContext = null;
let availableVoices = [];

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

// Function to load available voices
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

// Основная логика приложения "Ярик.Уроки"

// Глобальные переменные
let currentPage = 'home';
let currentLevel = 1;
let currentCategory = 'subtraction';
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
let activeMenu = 'math';
let isSubmenuExpanded = {
    'math': true,
    'reading': false,
    'writing': false,
    'puzzles': false
};
let dropdownOpen = false; // Для управления выпадающим меню
let mathCompleted = false; // Флаг завершения математических заданий
let readingCompleted = false; // Флаг завершения заданий по чтению

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Load available voices
    loadAvailableVoices();
    
    // Инициализация таймера
    startTimer();
    
    // Initialize audio context on first user interaction
    const handleUserInteraction = () => {
        initAudioContext();
        // Remove the event listeners after initialization
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Логотип для возврата на главную
    document.getElementById('mainLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    document.getElementById('sidebarLogo').addEventListener('click', function() {
        showLoaderAndNavigateToHome();
    });
    
    // Навигация
    document.getElementById('startLessons').addEventListener('click', function() {
        showLoaderAndNavigateToLessons();
    });
    
    // Выбор уровня на главной - улучшенное управление
    const levelDropdownBtn = document.getElementById('levelDropdownBtn');
    const levelDropdownContent = document.getElementById('levelDropdownContent');
    
    levelDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownOpen = !dropdownOpen;
        levelDropdownContent.classList.toggle('show', dropdownOpen);
    });
    
    // Закрытие выпадающего меню при клике вне его
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdownOpen = false;
            levelDropdownContent.classList.remove('show');
        }
    });
    
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            currentLevel = parseInt(this.dataset.level);
            const levelText = this.textContent;
            levelDropdownBtn.innerHTML = 
                levelText + 
                '<svg width="15" height="9" viewBox="0 0 15 9" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.6668 8.64216L4.57807e-07 1.72819L1.6664 0L7.5 6.04988L13.3336 0L15 1.72819L8.3332 8.64216C8.1122 8.87128 7.8125 9 7.5 9C7.1875 9 6.8878 8.87128 6.6668 8.64216Z" fill="#F0F0F0"/></svg>';
            
            dropdownOpen = false;
            levelDropdownContent.classList.remove('show');
            
            // Обновляем отображение уровня
            updateLevelDisplay();
        });
    });
    
    // Навигация в боковом меню с лоадером
    document.getElementById('menu-reading').addEventListener('click', function() {
        if (activeMenu !== 'reading') {
            showLoaderAndSwitchMenu('reading');
        } else {
            toggleSubmenu('reading');
        }
    });
    
    document.getElementById('menu-writing').addEventListener('click', function() {
        if (activeMenu !== 'writing') {
            showLoaderAndSwitchMenu('writing');
        } else {
            toggleSubmenu('writing');
        }
    });
    
    document.getElementById('menu-puzzles').addEventListener('click', function() {
        if (activeMenu !== 'puzzles') {
            showLoaderAndSwitchMenu('puzzles');
        } else {
            toggleSubmenu('puzzles');
        }
    });
    
    document.getElementById('menu-math').addEventListener('click', function() {
        if (activeMenu !== 'math') {
            showLoaderAndSwitchMenu('math');
        } else {
            toggleSubmenu('math');
        }
    });
    
    // Подменю математики
    document.querySelectorAll('#math-submenu .submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            // Сброс таймера и состояния при смене категории
            resetTimer();
            mathCompleted = false;
            
            document.querySelectorAll('#math-submenu .submenu-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
            currentCategory = this.dataset.category;
            generateMathProblems();
            currentMathIndex = 0;
            correctAnswers = 0;
            totalAnswers = 0;
            showMathProblem();
            updateStats();
            
            // Разблокируем клавиатуру
            document.getElementById('numberPad').classList.remove('disabled');
        });
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
        if (activeMenu === 'math') {
            resetMathTest();
        } else if (activeMenu === 'reading') {
            resetReadingTest();
        }
    });
    
    // Кнопка "Начать заново" для математики
    document.getElementById('restartMathBtn').addEventListener('click', function() {
        resetMathTest();
    });
    
    // Кнопка "Начать заново" для чтения
    document.getElementById('restartReadingBtn').addEventListener('click', function() {
        resetReadingTest();
    });
    
    // Генерация начальных данных
    generateMathProblems();
    showMathProblem();
    
    // Обновление статистики
    updateStats();
    
    // Обновляем отображение уровня на главной
    updateLevelDisplay();
});

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

// Функция завершения заданий по чтению
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
    
// Функция сброса заданий по чтению
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
        document.getElementById('lessons-page').style.display = 'none';
        document.getElementById('lessons-page').classList.remove('active');
        
        // Показываем главную страницу
        document.getElementById('home-page').style.display = 'block';
        document.getElementById('home-page').classList.add('active');
        
        // Сброс таймера
        resetTimer();
        
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

// Функция навигации на страницу уроков с лоадером
function showLoaderAndNavigateToLessons() {
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
    function navigateToLessons() {
        // Полностью скрываем главную страницу
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('home-page').classList.remove('active');
        
        // Показываем страницу уроков
        document.getElementById('lessons-page').style.display = 'block';
        document.getElementById('lessons-page').classList.add('active');
        
        // Сброс таймера
        resetTimer();
        
        // В зависимости от уровня показываем соответствующий контент
        updateCurrentLevelDisplay();
        if (currentLevel === 4) {
            setActiveMenu('math');
            showMathContent();
        } else {
            setActiveMenu('reading');
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
            navigateToLessons();
        } else {
            // Если прошло меньше 1.5 секунд, ждем оставшееся время
            setTimeout(navigateToLessons, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

// Функция переключения меню с лоадером
function showLoaderAndSwitchMenu(menuName) {
    // Показываем лоадер
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.style.opacity = '0';
    
    // Плавное появление лоадера
    setTimeout(() => {
        loader.style.opacity = '1';
    }, 10);
    
    // Минимальное время показа лоадера - 1 секунда
    const minLoaderTime = 1000;
    const startTime = Date.now();
    
    // Функция переключения меню
    function switchMenu() {
        // Сброс таймера
        resetTimer();
        
        setActiveMenu(menuName);
        if (menuName === 'reading') {
            showReadingContent();
        } else if (menuName === 'math') {
            showMathContent();
        }
        
        // Скрываем лоадер
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 300);
    }
    
    // Запускаем таймер
    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoaderTime) {
            switchMenu();
        } else {
            setTimeout(switchMenu, minLoaderTime - elapsed);
        }
    }, minLoaderTime);
}

// Установка активного меню
function setActiveMenu(menuName) {
    // Закрываем все подменю
    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.classList.remove('show');
    });
    
    // Сбрасываем активные пункты меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Устанавливаем новый активный пункт
    activeMenu = menuName;
    
    if (menuName === 'reading') {
        document.getElementById('menu-reading').classList.add('active');
        // Раскрываем подменю если оно было раскрыто ранее
        if (isSubmenuExpanded.reading) {
            // У чтения нет подменю, но если будет - добавить здесь
        }
    } else if (menuName === 'math') {
        document.getElementById('menu-math').classList.add('active');
        document.getElementById('math-submenu').classList.add('show');
    }
}

// Переключение подменю
function toggleSubmenu(menuName) {
    const submenu = document.getElementById(menuName + '-submenu');
    if (submenu) {
        isSubmenuExpanded[menuName] = !isSubmenuExpanded[menuName];
        if (isSubmenuExpanded[menuName]) {
            submenu.classList.add('show');
        } else {
            submenu.classList.remove('show');
        }
    }
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
        currentWords = [...syllablesLevel1];
    } else if (currentLevel === 2) {
        currentWords = [...syllablesLevel2];
    } else if (currentLevel === 3) {
        currentWords = [...syllablesLevel3];
    } else {
        // Для уровня 4 (математика) показываем математику
        setActiveMenu('math');
        showMathContent();
        return;
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
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
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
    
    // Обновляем состояние озвучивания
    if (window.speechSynthesis) {
        // Создаем новый utterance для отслеживания состояния
        const utterance = new SpeechSynthesisUtterance(word);
        
        utterance.onstart = function() {
            isSpeaking = true;
        };
        
        utterance.onend = function() {
            isSpeaking = false;
            visualizer.style.display = 'none';
        };
        
        utterance.onerror = function() {
            isSpeaking = false;
            visualizer.style.display = 'none';
        };
    }
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
    
    if (currentCategory === 'addition') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 10) + 1;
            let b = Math.floor(Math.random() * 10) + 1;
            let answer = a + b;
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '+',
                answer: answer
            });
        }
    } else if (currentCategory === 'subtraction') {
        for (let i = 0; i < count; i++) {
            let a = Math.floor(Math.random() * 10) + 1;
            let b = Math.floor(Math.random() * 10) + 1;
            
            // Убедимся, что результат положительный
            if (a < b) {
                [a, b] = [b, a];
            }
            
            mathProblems.push({
                num1: a,
                num2: b,
                operator: '-',
                answer: a - b
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

// Обновление отображения уровня
function updateLevelDisplay() {
    // Обновляем текст в выпадающем списке
    const levelText = levelNames[currentLevel] || 'Легкий';
    
    // Обновляем боковое меню на странице занятий
    if (document.getElementById('currentLevelDisplay')) {
        document.getElementById('currentLevelDisplay').textContent = levelText;
    }
}

// Обновление отображения текущего уровня
function updateCurrentLevelDisplay() {
    document.getElementById('currentLevelDisplay').textContent = levelNames[currentLevel] || 'Легкий';
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
});
