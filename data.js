// Статические данные для приложения "Ярик.Уроки"

// ==================== ЧТЕНИЕ ====================

// -------------------------------------------------
// 1.1. СЛОГИ
// -------------------------------------------------

// 1.1.1. Слоги - Легкий уровень (слова из 3 букв)
const syllablesEasy = [
    { word: "КОТ", transcription: "[кот]", description: "Домашнее животное, любит ловить мышей" },
    { word: "РОТ", transcription: "[рот]", description: "Часть лица, с помощью которой мы едим и говорим" },
    { word: "ЛОТ", transcription: "[лот]", description: "Единица измерения веса или старинная мера" },
    { word: "БОТ", transcription: "[бот]", description: "Небольшое гребное или парусное судно" },
    { word: "ПОТ", transcription: "[пот]", description: "Жидкость, которая выступает на коже в жару" },
    { word: "ДОМ", transcription: "[дом]", description: "Здание, где живут люди" },
    { word: "СОМ", transcription: "[сом]", description: "Крупная речная рыба с усами" },
    { word: "КОМ", transcription: "[ком]", description: "Смятый кусок чего-нибудь мягкого" },
    { word: "ЛУК", transcription: "[лук]", description: "Овощ, от которого плачут, или оружие для стрельбы" },
    { word: "СУК", transcription: "[сук]", description: "Толстая ветка на дереве" },
    { word: "ЖУК", transcription: "[жук]", description: "Насекомое с твёрдыми надкрыльями" },
    { word: "ПАК", transcription: "[пак]", description: "Связка или тюк с вещами" },
    { word: "МАК", transcription: "[мак]", description: "Красный цветок и съедобные семена" },
    { word: "РАК", transcription: "[рак]", description: "Речное животное с клешнями" },
    { word: "БАК", transcription: "[бак]", description: "Большой сосуд для жидкости" },
    { word: "ЛАК", transcription: "[лак]", description: "Раствор для покрытия поверхности, который блестит" },
    { word: "НОС", transcription: "[нос]", description: "Часть лица, которой мы дышим и чувствуем запахи" },
    { word: "ПЁС", transcription: "[п'ос]", description: "Собака, пёс" },
    { word: "ЛЕС", transcription: "[л'эс]", description: "Много деревьев, растущих рядом" },
    { word: "ВЕС", transcription: "[в'эс]", description: "Тяжесть предмета, измеряемая в килограммах" },
    { word: "МЁД", transcription: "[м'от]", description: "Сладкое и полезное лакомство от пчёл" },
    { word: "ЛЁД", transcription: "[л'от]", description: "Замёрзшая вода" },
    { word: "ДЕН", transcription: "[д'эн]", description: "Старое название дня или единица измерения" },
    { word: "ПЕН", transcription: "[п'эн]", description: "Старое название камня или скалы" },
    { word: "СЫН", transcription: "[сын]", description: "Мальчик по отношению к своим родителям" },
    { word: "БЫК", transcription: "[бык]", description: "Крупное рогатое животное" },
    { word: "ДУБ", transcription: "[дуп]", description: "Большое и крепкое дерево с жёлудями" },
    { word: "ЗУБ", transcription: "[зуп]", description: "Костное образование во рту для откусывания пищи" },
    { word: "ХЛЕБ", transcription: "[хл'эп]", description: "Еда, которую пекут из муки" },
    { word: "ГНОМ", transcription: "[гном]", description: "Сказочный маленький человечек" },
    { word: "ШАР", transcription: "[шар]", description: "Геометрическая фигура круглой формы" },
    { word: "МЯЧ", transcription: "[м'ач]", description: "Спортивный предмет для игры, который прыгает" },
    { word: "НОЖ", transcription: "[нош]", description: "Инструмент для резания" },
    { word: "МЕЧ", transcription: "[м'эч]", description: "Старинное холодное оружие" },
    { word: "ЁЖ", transcription: "[йош]", description: "Маленький зверёк с колючками" },
    { word: "УЖ", transcription: "[уш]", description: "Неядовитая змея с жёлтыми пятнами на голове" },
    { word: "ПОЛ", transcription: "[пол]", description: "Нижнее покрытие в комнате" },
    { word: "РОГ", transcription: "[рок]", description: "Костный вырост на голове у некоторых животных" },
    { word: "РОК", transcription: "[рок]", description: "Музыкальный стиль или судьба" },
    { word: "ВОЛ", transcription: "[вол]", description: "Рабочее животное, сильный бык" },
    { word: "ВОЗ", transcription: "[вос]", description: "Повозка с грузом или большая куча" },
    { word: "ГАЗ", transcription: "[гас]", description: "Топливо или состояние вещества, не твёрдое и не жидкое" },
    { word: "ТАЗ", transcription: "[тас]", description: "Широкий и неглубокий сосуд, или часть тела" },
    { word: "ТОК", transcription: "[ток]", description: "Электрический ток, или место для молотьбы" },
    { word: "СОК", transcription: "[сок]", description: "Жидкость из фруктов и овощей" },
    { word: "КУБ", transcription: "[куп]", description: "Геометрическая фигура, все стороны которой квадраты" },
    { word: "ПУХ", transcription: "[пух]", description: "Мягкие и лёгкие волоски у птиц и животных" },
    { word: "МУХ", transcription: "[мух]", description: "Крупная неприятность (поймать муху)" },
    { word: "ГУБ", transcription: "[гуп]", description: "Часть лица (множественное число от 'губа')" },
    { word: "ЛУЧ", transcription: "[луч]", description: "Узкая полоска света" }
];

// 1.1.2. Слоги - Средний уровень (слова из двух слогов, через тире)
const syllablesMedium = [
    { word: "КА-ША", transcription: "[ка-ша]", description: "Блюдо из крупы, сваренное на молоке или воде" },
    { word: "НЕ-БО", transcription: "[н'э-ба]", description: "Всё, что мы видим над головой: солнце, облака, звёзды" },
    { word: "РЫ-БА", transcription: "[ры-ба]", description: "Животное, которое живёт в воде и плавает" },
    { word: "РУ-КА", transcription: "[ру-ка]", description: "Часть тела от плеча до пальцев" },
    { word: "НО-ГА", transcription: "[на-га]", description: "Часть тела, на которой мы стоим и ходим" },
    { word: "ГО-ЛО-ВА", transcription: "[га-ла-ва]", description: "Часть тела, где находится мозг" }, // Опечатка? Это 3 слога
    { word: "БЕ-ДА", transcription: "[б'и-да]", description: "Несчастье, большая неприятность" },
    { word: "ВО-ДА", transcription: "[ва-да]", description: "Прозрачная жидкость, которую мы пьём" },
    { word: "ГУ-СИ", transcription: "[гу-с'и]", description: "Домашние птицы с длинной шеей" },
    { word: "ДЕ-ЛО", transcription: "[д'э-ла]", description: "Работа, занятие, задача" },
    { word: "ЗИ-МА", transcription: "[з'и-ма]", description: "Самое холодное время года" },
    { word: "КУ-РЫ", transcription: "[ку-ры]", description: "Домашние птицы, которые несут яйца" },
    { word: "ЛЕ-ТО", transcription: "[л'э-та]", description: "Самое тёплое время года" },
    { word: "МУ-ХА", transcription: "[му-ха]", description: "Надоедливое насекомое, которое жужжит" },
    { word: "НО-РА", transcription: "[на-ра]", description: "Жилище зверька в земле" },
    { word: "ПЕ-НА", transcription: "[п'э-на]", description: "Пузырчатая масса от мыла или волн" },
    { word: "РА-МА", transcription: "[ра-ма]", description: "Оконная конструкция со стеклом" },
    { word: "СА-ЛО", transcription: "[са-ла]", description: "Твёрдый животный жир, едят с хлебом" },
    { word: "ЦЕ-НА", transcription: "[цы-на]", description: "Стоимость товара в деньгах" },
    { word: "ЩУ-КА", transcription: "[щу-ка]", description: "Хищная речная рыба с зубами" },
    { word: "ЛА-ПА", transcription: "[ла-па]", description: "Ступня или кисть у животных" },
    { word: "КО-ЗА", transcription: "[ка-за]", description: "Домашнее животное, даёт молоко" },
    { word: "ВЕ-СЫ", transcription: "[в'и-сы]", description: "Прибор для измерения веса" },
    { word: "ГУ-БА", transcription: "[гу-ба]", description: "Часть рта, или гриб (губа)" },
    { word: "МО-РЕ", transcription: "[мо-р'э]", description: "Большой солёный водоём" },
    { word: "МА-МА", transcription: "[ма-ма]", description: "Самый родной человек" },
    { word: "ПА-ПА", transcription: "[па-па]", description: "Отец, самый сильный и смелый" },
    { word: "ЧУ-ДО", transcription: "[чу-да]", description: "Что-то удивительное и необычное" },
    { word: "ПО-ЛЕ", transcription: "[по-л'э]", description: "Большое ровное пространство без деревьев" },
    { word: "ПИ-ЛА", transcription: "[п'и-ла]", description: "Инструмент с зубчиками для резки дерева" },
    { word: "ЛУ-ЖА", transcription: "[лу-жа]", description: "Ямка с водой после дождя" },
    { word: "ЛУ-ЧИ", transcription: "[лу-ч'и]", description: "Полоски света от солнца" },
    { word: "РЕ-КА", transcription: "[р'и-ка]", description: "Большой поток воды, который течёт" },
    { word: "КИ-НО", transcription: "[к'и-но]", description: "Фильм, который показывают в большом зале" },
    { word: "ЗА-РЯ", transcription: "[за-р'а]", description: "Яркое освещение горизонта перед восходом или после заката" },
    { word: "ЖА-РА", transcription: "[жа-ра]", description: "Очень тёплая, жаркая погода" },
    { word: "ГО-РА", transcription: "[га-ра]", description: "Очень высокий холм" },
    { word: "ШУ-БА", transcription: "[шу-ба]", description: "Тёплая зимняя одежда из меха" },
    { word: "ША-РЫ", transcription: "[ша-ры]", description: "Множество шариков" },
    { word: "ЧА-СЫ", transcription: "[ча-сы]", description: "Прибор, показывающий время" },
    { word: "БУ-СЫ", transcription: "[бу-сы]", description: "Украшение из нанизанных на нитку шариков" },
    { word: "РО-ЗА", transcription: "[ро-за]", description: "Красивый цветок с шипами" },
    { word: "ЖА-БА", transcription: "[жа-ба]", description: "Земноводное, похожее на лягушку" },
    { word: "ЛЫ-ЖИ", transcription: "[лы-жы]", description: "Приспособления для хождения по снегу" },
    { word: "БУ-РЯ", transcription: "[бу-р'а]", description: "Сильный ветер с дождём или снегом" },
    { word: "СИ-ЛА", transcription: "[с'и-ла]", description: "Физическая мощь человека" },
    { word: "ВА-ТА", transcription: "[ва-та]", description: "Мягкое пушистое вещество" },
    { word: "ЛИ-СА", transcription: "[л'и-са]", description: "Хищное животное с рыжим пушистым хвостом" },
    { word: "ВА-ЗА", transcription: "[ва-за]", description: "Красивый сосуд для цветов" },
    { word: "СО-ВА", transcription: "[са-ва]", description: "Ночная хищная птица с большими глазами" }
];

// 1.1.3. Слоги - Тяжелый уровень (слова из трёх слогов, через тире)
const syllablesHard = [
    { word: "КО-РО-ВА", transcription: "[ка-ро-ва]", description: "Домашнее животное, даёт молоко" },
    { word: "МО-ЛО-КО", transcription: "[ма-ла-ко]", description: "Белая жидкость, которую даёт корова" },
    { word: "СО-БА-КА", transcription: "[са-ба-ка]", description: "Лучший друг человека, домашнее животное" },
    { word: "ЛО-ША-ДЬ", transcription: "[ла-шат']", description: "Животное, на котором можно ездить верхом" },
    { word: "КУ-РИ-ЦА", transcription: "[ку-р'и-ца]", description: "Домашняя птица, которая несёт яйца" },
    { word: "МА-ШИ-НА", transcription: "[ма-шы-на]", description: "Транспортное средство на колёсах с мотором" },
    { word: "РА-КЕ-ТА", transcription: "[ра-к'э-та]", description: "Летательный аппарат, который летит в космос" },
    { word: "СА-МО-ЛЁТ", transcription: "[са-ма-л'от]", description: "Воздушный транспорт с крыльями" },
    { word: "ВЕ-ЛО-СИП", transcription: "[в'э-ла-с'ип]", description: "Двухколёсный транспорт, который крутят ногами" },
    { word: "ТЕ-ЛЕ-ФОН", transcription: "[т'э-л'э-фон]", description: "Устройство для разговора на расстоянии" },
    { word: "О-КЕ-АН", transcription: "[а-к'э-ан]", description: "Огромное водное пространство" },
    { word: "Я-ГО-ДА", transcription: "[йа-га-да]", description: "Маленький сочный плод с кустов" },
    { word: "МА-ЛИ-НА", transcription: "[ма-л'и-на]", description: "Сладкая лесная ягода красного цвета" },
    { word: "ПО-МИ-ДОР", transcription: "[па-м'и-дор]", description: "Красный овощ, растущий на грядке" },
    { word: "О-ГУ-РЕЦ", transcription: "[а-гу-р'эц]", description: "Зелёный овощ, который хрустит" },
    { word: "КА-ПУ-СТА", transcription: "[ка-пу-ста]", description: "Овощ с большими листьями, растёт кочаном" },
    { word: "МОР-КОВЬ", transcription: "[мар-коф']", description: "Оранжевый овощ, который любят зайцы" },
    { word: "ПА-НА-МА", transcription: "[па-на-ма]", description: "Лёгкая шляпа от солнца" },
    { word: "ПИ-ДЖАК", transcription: "[п'и-джак]", description: "Верхняя часть костюма с воротником" },
    { word: "СА-ПО-ГИ", transcription: "[са-по-г'и]", description: "Высокая обувь для сырой погоды" },
    { word: "БО-ТИН-КИ", transcription: "[ба-т'ин-к'и]", description: "Закрытая обувь для улицы" },
    { word: "ПА-ЛЬ-ТО", transcription: "[па-л'то]", description: "Верхняя одежда для холодной погоды" },
    { word: "ША-ПКА", transcription: "[ша-пка]", description: "Головной убор, который греет" },
    { word: "ШАР-ФИК", transcription: "[шар-ф'ик]", description: "Маленький шарф, шарфик" },
    { word: "ВО-РО-ТА", transcription: "[ва-ро-та]", description: "Вход в здание или двор с большой дверью" },
    { word: "О-КНО", transcription: "[а-кно]", description: "Отверстие в стене со стеклом для света" },
    { word: "СА-ХАР", transcription: "[са-хар]", description: "Сладкое вещество белого цвета" },
    { word: "БА-РА-БАН", transcription: "[ба-ра-бан]", description: "Музыкальный инструмент, по которому бьют палочками" },
    { word: "КА-РА-НДАШ", transcription: "[ка-ран-даш]", description: "Инструмент для рисования" },
    { word: "ПЕ-НАЛ", transcription: "[п'э-нал]", description: "Коробочка для ручек и карандашей" }
];

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

// 1.2.2. Слова - Средний уровень (два слова: 3 буквы + 3-5 букв)
const wordsMedium = [
    { 
        phrase: "МОЙ КОТ", 
        words: ["МОЙ", "КОТ"],
        transcription: "[мой кот]", 
        example: "Мой кот любит спать на диване.",
        description: "Принадлежащий мне домашний питомец"
    },
    { 
        phrase: "ТВОЙ ДОМ", 
        words: ["ТВОЙ", "ДОМ"],
        transcription: "[твой дом]", 
        example: "Твой дом находится рядом со школой.",
        description: "Здание, где ты живёшь"
    },
    { 
        phrase: "МОЯ МАМА", 
        words: ["МОЯ", "МАМА"],
        transcription: "[ма-йа ма-ма]", 
        example: "Моя мама готовит вкусный обед.",
        description: "Родной человек, который заботится"
    },
    { 
        phrase: "ТВОЯ СЕСТРА", 
        words: ["ТВОЯ", "СЕСТРА"],
        transcription: "[тва-йа с'и-стра]", 
        example: "Твоя сестра учится в школе.",
        description: "Родственница, дочь твоих родителей"
    },
    { 
        phrase: "МОЁ МОЛОКО", 
        words: ["МОЁ", "МОЛОКО"],
        transcription: "[ма-йо ма-ла-ко]", 
        example: "Моё молоко стоит в холодильнике.",
        description: "Напиток, который я пью"
    },
    { 
        phrase: "НАШ ПАПА", 
        words: ["НАШ", "ПАПА"],
        transcription: "[наш па-па]", 
        example: "Наш папа читает нам сказки.",
        description: "Отец, глава семьи"
    },
    { 
        phrase: "ВАША РУЧКА", 
        words: ["ВАША", "РУЧКА"],
        transcription: "[ва-ша руч'-ка]", 
        example: "Ваша ручка упала на пол.",
        description: "Предмет для письма, который принадлежит вам"
    },
    { 
        phrase: "ЭТОТ МЯЧ", 
        words: ["ЭТОТ", "МЯЧ"],
        transcription: "[э-тат м'ач]", 
        example: "Этот мяч очень яркий.",
        description: "Предмет для игры, на который мы смотрим"
    },
    { 
        phrase: "ЭТА КНИГА", 
        words: ["ЭТА", "КНИГА"],
        transcription: "[э-та кн'и-га]", 
        example: "Эта книга интересная.",
        description: "Предмет для чтения, который мы держим"
    },
    { 
        phrase: "БЕЛЫЙ СНЕГ", 
        words: ["БЕЛЫЙ", "СНЕГ"],
        transcription: "[б'э-лый с'н'эк]", 
        example: "Белый снег покрыл землю.",
        description: "Осадки зимой белого цвета"
    },
    { 
        phrase: "СИНЕЕ НЕБО", 
        words: ["СИНЕЕ", "НЕБО"],
        transcription: "[с'и-н'э-йэ н'э-ба]", 
        example: "Синее небо над головой.",
        description: "Всё, что мы видим вверх"
    },
    { 
        phrase: "КРАСНЫЙ МАК", 
        words: ["КРАСНЫЙ", "МАК"],
        transcription: "[крас-ный мак]", 
        example: "Красный мак растёт в поле.",
        description: "Яркий цветок"
    },
    { 
        phrase: "ЖЁЛТЫЙ ЛИСТ", 
        words: ["ЖЁЛТЫЙ", "ЛИСТ"],
        transcription: "[жол-тый л'ист]", 
        example: "Жёлтый лист упал с дерева.",
        description: "Осенний лист"
    },
    { 
        phrase: "ЗЕЛЁНАЯ ТРАВА", 
        words: ["ЗЕЛЁНАЯ", "ТРАВА"],
        transcription: "[з'э-л'о-на-йа тра-ва]", 
        example: "Зелёная трава после дождя.",
        description: "Растение, покрывающее землю"
    },
    { 
        phrase: "БОЛЬШОЙ МЯЧ", 
        words: ["БОЛЬШОЙ", "МЯЧ"],
        transcription: "[бал'-шой м'ач]", 
        example: "Большой мяч не помещается в коробку.",
        description: "Предмет круглой формы"
    },
    { 
        phrase: "МАЛЕНЬКИЙ КОТ", 
        words: ["МАЛЕНЬКИЙ", "КОТ"],
        transcription: "[ма-л'эн'-к'ий кот]", 
        example: "Маленький кот спит в корзинке.",
        description: "Детёныш кошки"
    },
    { 
        phrase: "ВКУСНЫЙ СУП", 
        words: ["ВКУСНЫЙ", "СУП"],
        transcription: "[фкус-ный суп]", 
        example: "Вкусный суп сварила бабушка.",
        description: "Жидкое блюдо"
    },
    { 
        phrase: "СЛАДКИЙ ТОРТ", 
        words: ["СЛАДКИЙ", "ТОРТ"],
        transcription: "[слат-к'ий торт]", 
        example: "Сладкий торт на день рождения.",
        description: "Десерт, кондитерское изделие"
    }
];

// 1.2.3. Слова - Тяжелый уровень (два слова из 4-6 букв)
const wordsHard = [
    { 
        phrase: "МЫТЬ МАШИНУ", 
        words: ["МЫТЬ", "МАШИНУ"],
        transcription: "[мыт' ма-шы-ну]", 
        example: "Папа пошёл мыть машину.",
        description: "Очищать автомобиль от грязи"
    },
    { 
        phrase: "РЕЗАТЬ ХЛЕБ", 
        words: ["РЕЗАТЬ", "ХЛЕБ"],
        transcription: "[р'э-зат' хл'эп]", 
        example: "Мама учит меня резать хлеб.",
        description: "Делить хлеб на куски ножом"
    },
    { 
        phrase: "ЧИТАТЬ КНИГУ", 
        words: ["ЧИТАТЬ", "КНИГУ"],
        transcription: "[ч'и-тат' кн'и-гу]", 
        example: "Я люблю читать книгу перед сном.",
        description: "Воспринимать написанный текст"
    },
    { 
        phrase: "ПИСАТЬ ПИСЬМО", 
        words: ["ПИСАТЬ", "ПИСЬМО"],
        transcription: "[п'и-сат' п'ис'-мо]", 
        example: "Бабушка просит писать письмо.",
        description: "Составлять текст на бумаге"
    },
    { 
        phrase: "РИСОВАТЬ КАРТИНУ", 
        words: ["РИСОВАТЬ", "КАРТИНУ"],
        transcription: "[р'и-са-ват' кар-т'и-ну]", 
        example: "Учительница велела рисовать картину.",
        description: "Создавать изображение"
    },
    { 
        phrase: "ГУЛЯТЬ В ПАРКЕ", 
        words: ["ГУЛЯТЬ", "ПАРКЕ"],
        transcription: "[гу-л'ат' ф пар-к'э]", 
        example: "Мы любим гулять в парке.",
        description: "Проводить время на свежем воздухе"
    },
    { 
        phrase: "ИГРАТЬ В ФУТБОЛ", 
        words: ["ИГРАТЬ", "ФУТБОЛ"],
        transcription: "[иг-рат' ф фуд-бол]", 
        example: "Мальчики идут играть в футбол.",
        description: "Участвовать в спортивной игре"
    },
    { 
        phrase: "КУПИТЬ ИГРУШКУ", 
        words: ["КУПИТЬ", "ИГРУШКУ"],
        transcription: "[ку-п'ит' иг-руш-ку]", 
        example: "Мама обещала купить игрушку.",
        description: "Приобрести предмет для игры"
    },
    { 
        phrase: "ПРИГОТОВИТЬ УЖИН", 
        words: ["ПРИГОТОВИТЬ", "УЖИН"],
        transcription: "[пр'и-га-то-в'ит' у-жын]", 
        example: "Пора приготовить ужин для семьи.",
        description: "Сделать еду для вечернего приёма пищи"
    },
    { 
        phrase: "ВЫУЧИТЬ СТИХИ", 
        words: ["ВЫУЧИТЬ", "СТИХИ"],
        transcription: "[вы-у-ч'ит' ст'и-х'и]", 
        example: "Завтра нужно выучить стихи.",
        description: "Запомнить рифмованный текст"
    },
    { 
        phrase: "ПОМЫТЬ ПОСУДУ", 
        words: ["ПОМЫТЬ", "ПОСУДУ"],
        transcription: "[па-мыт' па-су-ду]", 
        example: "Я помогаю маме помыть посуду.",
        description: "Очистить тарелки и чашки"
    },
    { 
        phrase: "ЗАПРАВИТЬ КРОВАТЬ", 
        words: ["ЗАПРАВИТЬ", "КРОВАТЬ"],
        transcription: "[за-пра-в'ит' кра-ват']", 
        example: "Не забудь заправить кровать.",
        description: "Привести постель в порядок"
    },
    { 
        phrase: "ПОКОРМИТЬ РЫБОК", 
        words: ["ПОКОРМИТЬ", "РЫБОК"],
        transcription: "[па-кор-м'ит' ры-бок]", 
        example: "Дочка любит покормить рыбок.",
        description: "Дать еду аквариумным рыбкам"
    },
    { 
        phrase: "ВЫГУЛЯТЬ СОБАКУ", 
        words: ["ВЫГУЛЯТЬ", "СОБАКУ"],
        transcription: "[вы-гу-л'ат' са-ба-ку]", 
        example: "Сын пошёл выгулять собаку.",
        description: "Вести собаку на прогулку"
    }
];

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
    "Отлично, Ярик! Ты умница",
    "Ты самый умный, Ярослав!",
    "Верно! Ты умница!",
    "Правильно, Ярослав! Супер!",
    "Замечательно! Ты справился!",
    "Отлично, Ярослав!",
    "Прекрасно!",
    "Умничка, Ярослав!"
];

// Реплики для неправильных ответов
const wrongResponses = [
    "Ничего, Ярик, в следующий раз получится!",
    "Не расстраивайся, Ярослав, попробуй ещё раз!",
    "Ошибиться может каждый, Ярик, главное — не сдаваться!",
    "Ну, Ярослав, ничего страшного, подумай ещё!",
    "Попробуй ответить правильно, Ярик!",
    "Не беда, Ярослав! Следующий пример будет верным!",
    "Почти получилось! Давай ещё раз!"
];

// Имена уровней сложности
const levelNames = {
    1: 'Легкий',
    2: 'Средний',
    3: 'Сложный'
};