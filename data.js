const syllablesEasy = [
    { word: "КОТ", transcription: "[кот]", description: "Домашний питомец, любит молоко" },
    { word: "ДОМ", transcription: "[дом]", description: "Место, где живут люди" },
    { word: "ВО-ДА", transcription: "[во-да]", description: "Прозрачная жидкость" },
    { word: "РУ-КА", transcription: "[ру-ка]", description: "Часть тела для хватания" },
    { word: "НО-ГА", transcription: "[но-га]", description: "Часть тела для ходьбы" },
    { word: "ГО-ЛО-ВА", transcription: "[го-ло-ва]", description: "Часть тела с мозгом" },
    { word: "СО-СНА", transcription: "[со-сно]", description: "Хвойное дерево" },
    { word: "ЗЕБ-РА", transcription: "[зеб-ра]", description: "Полосатое животное" },
    { word: "ЛИ-СА", transcription: "[ли-са]", description: "Рыжий хищник" },
    { word: "БЕЛ-КА", transcription: "[бел-ка]", description: "Пушистый зверёк" },
    { word: "МЕД-ВЕ-ДЬ", transcription: "[мед-ведь]", description: "Большой лесной зверь" },
    { word: "ВОЛК", transcription: "[волк]", description: "Серый хищник" },
    { word: "СЛОН", transcription: "[слон]", description: "Животное с хоботом" },
    { word: "ЗАЯЦ", transcription: "[заяц]", description: "Зверёк с длинными ушами" },
    { word: "МЫШЬ", transcription: "[мышь]", description: "Маленький грызун" },
    { word: "ПТИ-ЦА", transcription: "[пти-ца]", description: "Пернатое существо" },
    { word: "РЫ-БА", transcription: "[ры-ба]", description: "Водное животное" },
    { word: "КУК-ЛА", transcription: "[кук-ла]", description: "Детская игрушка" },
    { word: "МЯЧ", transcription: "[мяч]", description: "Круглый для игры" },
    { word: "ЗОНТ", transcription: "[зонт]", description: "От дождя" },
    { word: "ЧА-СЫ", transcription: "[ча-сы]", description: "Показывают время" },
    { word: "КНИ-ГА", transcription: "[кни-га]", description: "Для чтения" },
    { word: "ОК-НО", transcription: "[окно]", description: "Через него смотрят" },
    { word: "ДВЕРЬ", transcription: "[дверь]", description: "Для входа" },
    { word: "СТУЛ", transcription: "[стул]", description: "Для сидения" },
    { word: "СТОЛ", transcription: "[стол]", description: "Для еды и работы" },
    { word: "КРО-ВА-ТЬ", transcription: "[кро-ва-ть]", description: "Для сна" },
    { word: "ПОЛ", transcription: "[пол]", description: "Под ногами" },
    { word: "ПО-ТО-ЛОК", transcription: "[по-то-лок]", description: "Над головой" },
    { word: "СТЕ-НА", transcription: "[сте-на]", description: "Часть комнаты" }
];

const syllablesHard = [
    { phrase: "Мама уже дома", transcription: "[ма-ма уже до-ма]" },
    { phrase: "Папа на работе", transcription: "[па-па на ра-бо-те]" },
    { phrase: "Кошка спит", transcription: "[кош-ка спит]" },
    { phrase: "Собака лает", transcription: "[со-ба-ка ла-ет]" },
    { phrase: "Птица летит", transcription: "[пти-ца ле-тит]" },
    { phrase: "Рыба плавает", transcription: "[ры-ба пла-ва-ет]" },
    { phrase: "Зайка играет", transcription: "[зай-ка иг-ра-ет]" },
    { phrase: "Мишка кушает", transcription: "[миш-ка ку-ша-ет]" },
    { phrase: "Волк бежит", transcription: "[волк бе-жит]" },
    { phrase: "Слон идет", transcription: "[слон и-дет]" },
    { phrase: "Белка прыгает", transcription: "[бел-ка пры-га-ет]" },
    { phrase: "Лиса охотится", transcription: "[ли-са охо-тит-ся]" },
    { phrase: "Медведь спит", transcription: "[мед-ведь спит]" },
    { phrase: "Мышка бегает", transcription: "[мыш-ка бе-га-ет]" },
    { phrase: "Кукла танцует", transcription: "[кук-ла тан-цу-ет]" },
    { phrase: "Мяч скачет", transcription: "[мяч скачет]" },
    { phrase: "Дом большой", transcription: "[дом боль-шой]" },
    { phrase: "Окно открыто", transcription: "[окно от-кры-то]" },
    { phrase: "Дверь закрыта", transcription: "[дверь за-кры-та]" },
    { phrase: "Стул упал", transcription: "[стул у-пал]" },
    { phrase: "Стол стоит", transcription: "[стол сто-ит]" },
    { phrase: "Кровать мягкая", transcription: "[кро-вать мяг-кая]" },
    { phrase: "Пол чистый", transcription: "[пол чис-тый]" },
    { phrase: "Стена белая", transcription: "[сте-на бе-ла-я]" },
    { phrase: "Книга интересная", transcription: "[кни-га ин-те-рес-ная]" },
    { phrase: "Часы идут", transcription: "[ча-сы и-дут]" },
    { phrase: "Зонт мокрый", transcription: "[зонт мок-рый]" },
    { phrase: "Мама готовит", transcription: "[ма-ма го-то-вит]" },
    { phrase: "Папа читает", transcription: "[па-па чи-та-ет]" }
];

let additionEasy = [];
for (let i = 0; i <= 10; i++) {
    for (let j = 0; j <= 10; j++) {
        additionEasy.push({ num1: i, num2: j, answer: i + j });
    }
}

let subtractionEasy = [];
for (let i = 0; i <= 10; i++) {
    for (let j = 0; j <= i; j++) {
        subtractionEasy.push({ num1: i, num2: j, answer: i - j });
    }
}

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

const wrongResponses = [
    "Ничего, в следующий раз получится!",
    "Не расстраивайся, попробуй ещё раз!",
    "Ошибиться может каждый, Ярик!",
    "Ярослав, подумай ещё!",
    "Попробуй ответить правильно, пирожок"
];

const levelNames = {
    1: 'Легкий',
    2: 'Сложный'
};