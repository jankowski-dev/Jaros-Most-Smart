// Статические данные для приложения "Ярик.Уроки"

// ==================== ЧТЕНИЕ ====================

// -------------------------------------------------
// 1.1. СЛОГИ
// -------------------------------------------------

// 1.1.1. Слоги - Легкий уровень (слова из 3 букв)
const syllablesEasy = [
    { word: "КИТ", transcription: "[кит]", description: "Большое морское животное, которое пускает фонтан" },
    { word: "ЛЁД", transcription: "[лёт]", description: "Замёрзшая вода, скользкая и холодная" },
    { word: "СОН", transcription: "[сон]", description: "Состояние, когда мы спим и видим сны" },
    { word: "РОГ", transcription: "[рок]", description: "Твёрдый вырост на голове у коровы или оленя" },
    { word: "ВОЛ", transcription: "[вол]", description: "Сильное рабочее животное, бык" },
    { word: "ГАЗ", transcription: "[гас]", description: "Невидимое вещество, которым мы дышим" },
    { word: "СОК", transcription: "[сок]", description: "Вкусная жидкость из фруктов или овощей" },
    { word: "МОХ", transcription: "[мох]", description: "Мягкое зелёное растение, растущее на камнях" },
    { word: "ПУХ", transcription: "[пух]", description: "Лёгкие пушистые волоски у птиц" },
    { word: "ШУМ", transcription: "[шум]", description: "Громкие звуки, которые мешают" },
    { word: "БОР", transcription: "[бор]", description: "Сосновый лес с высокими деревьями" },
    { word: "ВЕК", transcription: "[век]", description: "Очень долгий период времени, сто лет" },
    { word: "ГУСЬ", transcription: "[гусь]", description: "Водоплавающая птица с длинной шеей" },
    { word: "ДЁРН", transcription: "[дёрн]", description: "Слой почвы с травой и корнями" },
    { word: "ЖАР", transcription: "[жар]", description: "Сильное тепло, жаркая погода" },
    { word: "ЗУБ", transcription: "[зуп]", description: "Костное образование во рту для жевания" },
    { word: "КЛЁН", transcription: "[клён]", description: "Дерево с резными листьями и крылатками" },
    { word: "ЛИС", transcription: "[лис]", description: "Хищное животное с рыжей шерстью" },
    { word: "МЁД", transcription: "[мёт]", description: "Сладкое лакомство, которое делают пчёлы" },
    { word: "НОС", transcription: "[нос]", description: "Часть лица для дыхания и обоняния" },
    { word: "ПАР", transcription: "[пар]", description: "Газообразное состояние воды" },
    { word: "РОТ", transcription: "[рот]", description: "Отверстие во рту, через которое мы едим" },
    { word: "СЫР", transcription: "[сыр]", description: "Вкусный молочный продукт, бывает разных сортов" },
    { word: "ТУТ", transcription: "[тут]", description: "Здесь, в этом месте" },
    { word: "УХО", transcription: "[ухо]", description: "Орган слуха у человека и животных" },
    { word: "ФЛАГ", transcription: "[флак]", description: "Прямоугольный кусок ткани с символами" },
    { word: "ХЛЕБ", transcription: "[хлеп]", description: "Пищевой продукт, который пекут из муки" },
    { word: "ЦВЕТ", transcription: "[цвет]", description: "Окраска предмета, то, что мы видим глазом" },
    { word: "ЧАЙ", transcription: "[чай]", description: "Горячий напиток из листьев чайного куста" },
    { word: "ШАР", transcription: "[шар]", description: "Геометрическое тело, круглое со всех сторон" },
    { word: "ЩИТ", transcription: "[щит]", description: "Защитное приспособление у воинов" },
    { word: "ЭХО", transcription: "[эхо]", description: "Отражение звука от препятствия" },
    { word: "ЮЛА", transcription: "[юла]", description: "Детская игрушка, которая крутится" },
    { word: "ЯМА", transcription: "[яма]", description: "Углубление в земле, ямка" },
    { word: "БАК", transcription: "[бак]", description: "Большой сосуд для хранения жидкости" },
    { word: "ВАЗ", transcription: "[вас]", description: "Изящный сосуд для цветов" },
    { word: "ГАЙ", transcription: "[гай]", description: "Металлическое крепление с резьбой" },
    { word: "ДОМ", transcription: "[дом]", description: "Здание, где живут люди" },
    { word: "ЕЛЬ", transcription: "[ель]", description: "Хвойное дерево с колючими иголками" },
    { word: "ЖУК", transcription: "[жук]", description: "Насекомое с твёрдыми надкрыльями" },
    { word: "ЗАЛ", transcription: "[зал]", description: "Просторное помещение для собраний" },
    { word: "ИВА", transcription: "[ива]", description: "Дерево с гибкими ветвями, растёт у воды" },
    { word: "ЙОД", transcription: "[йот]", description: "Химический элемент, используется в медицине" },
    { word: "КОТ", transcription: "[кот]", description: "Домашнее животное, любит молоко и мышей" },
    { word: "ЛУК", transcription: "[лук]", description: "Овощ, от которого плачут" },
    { word: "МАК", transcription: "[мак]", description: "Красный цветок с чёрными семенами" },
    { word: "НОЖ", transcription: "[нош]", description: "Острый инструмент для резки" },
    { word: "ОСА", transcription: "[оса]", description: "Летающее насекомое с жалом" },
    { word: "ПЁС", transcription: "[пёс]", description: "Собака, друг человека" },
    { word: "РАК", transcription: "[рак]", description: "Речное животное с клешнями" },
    { word: "СУП", transcription: "[суп]", description: "Жидкое блюдо, которое едят ложкой" }
];

// 1.1.2. Слоги - Средний уровень (слова из двух слогов, через тире)
const syllablesMedium = [
    { word: "МА-МА", transcription: "[ма-ма]", description: "Самый родной человек, мама" },
    { word: "ПА-ПА", transcription: "[па-па]", description: "Отец, самый сильный и смелый" },
    { word: "БА-БА", transcription: "[ба-ба]", description: "Бабушка, старшая женщина в семье" },
    { word: "ДЕ-ДА", transcription: "[де-да]", description: "Дедушка, старший мужчина в семье" },
    { word: "КО-ЗА", transcription: "[ко-за]", description: "Домашнее животное, даёт молоко" },
    { word: "ЛО-ША", transcription: "[ло-ша]", description: "Дикое животное, которое бегает быстро" },
    { word: "СО-ВА", transcription: "[со-ва]", description: "Ночная хищная птица с большими глазами" },
    { word: "РО-ЗА", transcription: "[ро-за]", description: "Красивый цветок с шипами" },
    { word: "ЛУ-НА", transcription: "[лу-на]", description: "Спутник Земли, светит ночью" },
    { word: "ЗВЕЗ-ДА", transcription: "[звез-да]", description: "Небесное тело, которое светит ночью" },
    { word: "СО-ЛНЦЕ", transcription: "[со-лнце]", description: "Звезда, которая светит днём" },
    { word: "ВЕТ-ЕР", transcription: "[вет-ер]", description: "Движение воздуха, ветер" },
    { word: "ДО-ЖДЬ", transcription: "[до-ждь]", description: "Вода, падающая с неба" },
    { word: "СНЕ-Г", transcription: "[сне-г]", description: "Белый холодный осадок зимой" },
    { word: "ЦВЕ-ТОК", transcription: "[цве-ток]", description: "Растение с красивыми лепестками" },
    { word: "ЯГО-ДА", transcription: "[яго-да]", description: "Сладкий плод, растёт на кустах" },
    { word: "ГРИ-Б", transcription: "[гри-б]", description: "Съедобный организм, растёт в лесу" },
    { word: "ЛИ-СТВА", transcription: "[ли-ства]", description: "Листья деревьев, зелёные или осенние" },
    { word: "ПТИ-ЦА", transcription: "[пти-ца]", description: "Пернатое животное, умеет летать" },
    { word: "РЫ-БА", transcription: "[ры-ба]", description: "Животное, которое живёт в воде и плавает" },
    { word: "КОШ-КА", transcription: "[кош-ка]", description: "Домашний питомец, мурлыкает" },
    { word: "МО-РЕ", transcription: "[мо-ре]", description: "Большой солёный водоём" },
    { word: "ПО-ЛЕ", transcription: "[по-ле]", description: "Ровное пространство без деревьев" },
    { word: "НЕ-БО", transcription: "[не-бо]", description: "Всё, что мы видим над головой" },
    { word: "ЗЕ-МЛЯ", transcription: "[зе-мля]", description: "Планета, на которой мы живём" },
    { word: "ВО-ДА", transcription: "[во-да]", description: "Прозрачная жидкость, которую мы пьём" },
    { word: "ВО-ЗДУХ", transcription: "[во-здух]", description: "Смесь газов, которой мы дышим" },
    { word: "О-ГОНЬ", transcription: "[о-гонь]", description: "Пламя, которое греет и светит" },
    { word: "ЦЕ-ПЬ", transcription: "[це-пь]", description: "Цепочка из звеньев" },
    { word: "ЛИ-СА", transcription: "[ли-са]", description: "Хищное животное с рыжим пушистым хвостом" },
    { word: "ВО-ЛК", transcription: "[во-лк]", description: "Лесной хищник, серый и злой" },
    { word: "МЕД-ВЕДЬ", transcription: "[мед-ведь]", description: "Крупный лесной зверь, любит мёд" },
    { word: "ЗА-ЯЦ", transcription: "[за-яц]", description: "Быстрый зверёк с длинными ушами" },
    { word: "БЕЛ-КА", transcription: "[бел-ка]", description: "Пушистый зверёк, живёт на деревьях" },
    { word: "СО-РОК", transcription: "[со-рок]", description: "Птица с чёрно-белым оперением" },
    { word: "ВО-РОН", transcription: "[во-рон]", description: "Большая чёрная птица" },
    { word: "СО-ЛОВ", transcription: "[со-лов]", description: "Певчая птица с красивым голосом" },
    { word: "ЧАЙ-КА", transcription: "[чай-ка]", description: "Морская птица, летает над водой" },
    { word: "ГА-ЛКА", transcription: "[га-лка]", description: "Маленькая птица, живёт в городе" },
    { word: "УТ-КА", transcription: "[ут-ка]", description: "Водоплавающая птица, крякает" },
    { word: "ГУ-СИ", transcription: "[гу-си]", description: "Домашние птицы с длинной шеей" },
    { word: "ИГ-РА", transcription: "[иг-ра]", description: "Занятие для развлечения" },
    { word: "КНИ-ГА", transcription: "[кни-га]", description: "Предмет с листами бумаги, для чтения" },
    { word: "РУЧ-КА", transcription: "[руч-ка]", description: "Предмет для письма чернилами" },
    { word: "ПАР-ТА", transcription: "[пар-та]", description: "Стол для ученика в школе" },
    { word: "ДОСК-А", transcription: "[доск-а]", description: "Плоская поверхность для письма мелом" },
    { word: "КО-РАБЛЬ", transcription: "[ко-рабль]", description: "Большое судно для плавания по морю" },
    { word: "СА-МОЛЁТ", transcription: "[са-молёт]", description: "Летательный аппарат с крыльями" },
    { word: "ТЕ-ЛЕФОН", transcription: "[те-лефон]", description: "Устройство для связи на расстоянии" },
    { word: "РА-ДИО", transcription: "[ра-дио]", description: "Устройство для приёма радиостанций" }
];

// 1.1.3. Слоги - Тяжелый уровень (УДАЛЕН)

// -------------------------------------------------
// 1.2. СЛОВА
// -------------------------------------------------

// 1.2.1. Слова - Легкий уровень (слова из 4-5 букв)
const wordsEasy = [
    { word: "КНИГА", transcription: "[кн'и-га]", description: "Предмет с листами бумаги, на которых напечатаны тексты" },
    { word: "РУЧКА", transcription: "[руч'-ка]", description: "Предмет для письма чернилами" },
    { word: "ПАРТА", transcription: "[пар-та]", description: "Стол для ученика в школе" },
    { word: "ДОСКА", transcription: "[дас-ка]", description: "Плоская поверхность для письма мелом" },
    { word: "МЕЛОК", transcription: "[м'э-лок]", description: "Маленький кусочек мела" },
    { word: "КУБИК", transcription: "[ку-б'ик]", description: "Маленький куб, игрушка для детей" },
    { word: "МЯЧИК", transcription: "[м'а-ч'ик]", description: "Маленький мяч" },
    { word: "ЗАЙКА", transcription: "[зай'-ка]", description: "Маленький заяц, ласково" },
    { word: "БЕЛКА", transcription: "[б'эл-ка]", description: "Пушистый зверёк, который живёт на дереве и грызёт орехи" },
    { word: "ВОЛК", transcription: "[волк]", description: "Хищный лесной зверь, серый и злой" },
    { word: "ЛИСА", transcription: "[л'и-са]", description: "Рыжая хищница с пушистым хвостом" },
    { word: "МИШКА", transcription: "[м'иш-ка]", description: "Медведь, игрушечный медведь" },
    { word: "СЛОН", transcription: "[слон]", description: "Огромное животное с хоботом" },
    { word: "ТИГР", transcription: "[т'игр]", description: "Большая полосатая кошка, хищник" },
    { word: "ЗЕБРА", transcription: "[з'эб-ра]", description: "Полосатая лошадка из жарких стран" },
    { word: "ЖИРАФ", transcription: "[жы-раф]", description: "Животное с очень длинной шеей" },
    { word: "НОСОК", transcription: "[на-сок]", description: "Одежда для ноги, которую надевают под обувь" },
    { word: "ТАПКИ", transcription: "[тап-к'и]", description: "Домашняя обувь" },
    { word: "ШАПКА", transcription: "[шап-ка]", description: "Головной убор, который греет" },
    { word: "ШОРТЫ", transcription: "[шор-ты]", description: "Короткие штаны для жаркой погоды" },
    { word: "МАЙКА", transcription: "[май'-ка]", description: "Лёгкая одежда без рукавов" },
    { word: "ЮБКА", transcription: "[йуб-ка]", description: "Женская одежда, которая надевается на пояс" },
    { word: "ПЛАТЬЕ", transcription: "[пла-т'йэ]", description: "Женская одежда, цельная, сверху и снизу" },
    { word: "ЧАШКА", transcription: "[чаш-ка]", description: "Посуда для чая или кофе" },
    { word: "ЛОЖКА", transcription: "[лош-ка]", description: "Предмет для еды жидкой пищи" },
    { word: "ВИЛКА", transcription: "[в'ил-ка]", description: "Предмет с зубцами для еды" },
    { word: "ТАРЕЛКА", transcription: "[та-р'эл-ка]", description: "Посуда, из которой едят" },
    { word: "СТАКАН", transcription: "[ста-кан]", description: "Стеклянный сосуд для питья" },
    { word: "КРУЖКА", transcription: "[круш-ка]", description: "Большая чашка с ручкой" },
    { word: "ХЛЕБ", transcription: "[хл'эп]", description: "Продукт питания, который пекут из муки" }
];

// 1.2.2. Слова - Средний уровень (УДАЛЕН)

// 1.2.3. Слова - Тяжелый уровень (УДАЛЕН)

// -------------------------------------------------
// 1.3. ПРЕДЛОЖЕНИЯ (пока пусто)
// -------------------------------------------------
const sentencesEasy = [];
const sentencesMedium = [];
const sentencesHard = [];


// ==================== МАТЕМАТИКА ====================

// -------------------------------------------------
// 2.1. СЛОЖЕНИЕ
// -------------------------------------------------
const additionEasy = []; // числа от 1 до 9
for (let i = 1; i <= 9; i++) {
    for (let j = 1; j <= 9; j++) {
        if (i + j <= 18) { // Не больше 18
            additionEasy.push({ num1: i, num2: j, answer: i + j });
        }
    }
}

const additionMedium = []; // числа от 5 до 20
for (let i = 5; i <= 20; i++) {
    for (let j = 5; j <= 20; j++) {
        if (i + j <= 40) { // Ограничим сумму
            additionMedium.push({ num1: i, num2: j, answer: i + j });
        }
    }
}

const additionHard = []; // числа от 5 до 50
for (let i = 5; i <= 50; i++) {
    for (let j = 5; j <= 50; j++) {
        if (i + j <= 100) { // Ограничим сумму
            additionHard.push({ num1: i, num2: j, answer: i + j });
        }
    }
}

// -------------------------------------------------
// 2.2. ВЫЧИТАНИЕ
// -------------------------------------------------
const subtractionEasy = []; // числа от 1 до 9
for (let i = 1; i <= 9; i++) {
    for (let j = 1; j <= i; j++) {
        subtractionEasy.push({ num1: i, num2: j, answer: i - j });
    }
}

const subtractionMedium = []; // числа от 5 до 20
for (let i = 5; i <= 20; i++) {
    for (let j = 5; j <= i; j++) {
        subtractionMedium.push({ num1: i, num2: j, answer: i - j });
    }
}

const subtractionHard = []; // числа от 5 до 50
for (let i = 5; i <= 50; i++) {
    for (let j = 5; j <= i; j++) {
        subtractionHard.push({ num1: i, num2: j, answer: i - j });
    }
}

// -------------------------------------------------
// 2.3. УМНОЖЕНИЕ
// -------------------------------------------------
const multiplicationEasy = []; // на 2
for (let i = 1; i <= 9; i++) {
    multiplicationEasy.push({ num1: i, num2: 2, answer: i * 2 });
}

const multiplicationMedium = []; // на 3
for (let i = 1; i <= 9; i++) {
    multiplicationMedium.push({ num1: i, num2: 3, answer: i * 3 });
}

const multiplicationHard = []; // на 4-5
for (let i = 1; i <= 9; i++) {
    for (let j = 4; j <= 5; j++) {
        multiplicationHard.push({ num1: i, num2: j, answer: i * j });
    }
}

// -------------------------------------------------
// 2.4. ДЕЛЕНИЕ (пусто)
// -------------------------------------------------
const divisionEasy = [];
const divisionMedium = [];
const divisionHard = [];


// ==================== РЕПЛИКИ ====================

// Реплики для правильных ответов
const correctResponses = [
    "Хорошая работа, Ярослав!",
    "Ярик, ты самый умный!",
    "Верно, Ярик, умница!",
    "Правильно!",
    "Замечательно, ты справился!",
    "Отлично!",
    "Решение верное!",
    "Всё верно!"
];

// Реплики для неправильных ответов
const wrongResponses = [
    "Ничего, в следующий раз получится!",
    "Не расстраивайся, попробуй ещё раз!",
    "Ошибиться может каждый, Ярик!",
    "Ярослав, подумай ещё!",
    "Попробуй ответить правильно, пирожок"
];

// Имена уровней сложности
const levelNames = {
    1: 'Легкий',
    2: 'Средний',
    3: 'Сложный'
};