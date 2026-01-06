// Скрипт для анализа вопросов
const fs = require('fs');

// Читаем HTML файл
const html = fs.readFileSync('./index.html', 'utf8');

// Извлекаем массивы вопросов из JavaScript
const allQuestionsMatch = html.match(/const allQuestions = \[([\s\S]*?)\];/);
const advancedQuestionsMatch = html.match(/const advancedQuestions = \[([\s\S]*?)\];/);

// Парсим вопросы (упрощенный парсинг)
function parseQuestions(match) {
    if (!match) return [];
    const content = match[1];
    const questions = [];
    const questionRegex = /\{[\s\S]*?id:\s*(\d+),[\s\S]*?rule:\s*(\d+),[\s\S]*?ruleName:\s*"([^"]+)",[\s\S]*?question:\s*"([^"]+)",[\s\S]*?options:\s*\[([\s\S]*?)\],[\s\S]*?correctAnswer:\s*(\d+)[\s\S]*?\}/g;
    
    let m;
    while ((m = questionRegex.exec(content)) !== null) {
        const optionsMatch = m[5].match(/"([^"]+)"/g);
        const options = optionsMatch ? optionsMatch.map(opt => opt.replace(/"/g, '')) : [];
        questions.push({
            id: parseInt(m[1]),
            rule: parseInt(m[2]),
            ruleName: m[3],
            question: m[4],
            options: options,
            correctAnswer: parseInt(m[6])
        });
    }
    return questions;
}

const allQuestions = parseQuestions(allQuestionsMatch);
const advancedQuestions = parseQuestions(advancedQuestionsMatch);

console.log(`\n=== АНАЛИЗ ВОПРОСОВ ===\n`);
console.log(`Базовых вопросов: ${allQuestions.length}`);
console.log(`Продвинутых вопросов: ${advancedQuestions.length}`);
console.log(`Всего вопросов: ${allQuestions.length + advancedQuestions.length}\n`);

// 1. Проверка покрытия всех 17 правил
console.log('=== 1. ПОКРЫТИЕ ПРАВИЛ ===\n');
const rulesCoverage = {};
for (let i = 1; i <= 17; i++) {
    rulesCoverage[i] = {
        basic: allQuestions.filter(q => q.rule === i).length,
        advanced: advancedQuestions.filter(q => q.rule === i).length
    };
}

const ruleNames = {
    1: "Das Spielfeld",
    2: "Der Ball",
    3: "Die Spieler",
    4: "Die Ausrüstung der Spieler",
    5: "Der Schiedsrichter",
    6: "Die weiteren Spieloffiziellen",
    7: "Die Dauer des Spiels",
    8: "Beginn und Fortsetzung des Spiels",
    9: "Ball im Spiel und außer Spiel",
    10: "Wie ein Tor erzielt wird",
    11: "Abseits",
    12: "Fouls und unsportliches Betragen",
    13: "Freistöße",
    14: "Strafstoß",
    15: "Einwurf",
    16: "Abstoß",
    17: "Eckstoß"
};

for (let i = 1; i <= 17; i++) {
    const total = rulesCoverage[i].basic + rulesCoverage[i].advanced;
    console.log(`Правило ${i}: ${ruleNames[i]}`);
    console.log(`  Базовый курс: ${rulesCoverage[i].basic} вопросов`);
    console.log(`  Продвинутый курс: ${rulesCoverage[i].advanced} вопросов`);
    console.log(`  Всего: ${total} вопросов\n`);
}

// 2. Проверка дубликатов вопросов
console.log('\n=== 2. ДУБЛИКАТЫ ВОПРОСОВ ===\n');
const allQuestionsCombined = [...allQuestions, ...advancedQuestions];
const questionTexts = {};
const duplicates = [];

allQuestionsCombined.forEach(q => {
    const normalized = q.question.toLowerCase().trim();
    if (questionTexts[normalized]) {
        duplicates.push({
            id1: questionTexts[normalized].id,
            id2: q.id,
            question: q.question
        });
    } else {
        questionTexts[normalized] = q;
    }
});

if (duplicates.length > 0) {
    console.log(`Найдено ${duplicates.length} дубликатов:\n`);
    duplicates.forEach(d => {
        console.log(`  ID ${d.id1} и ID ${d.id2}: "${d.question}"`);
    });
} else {
    console.log('Дубликатов вопросов не найдено ✓');
}

// 3. Проверка дубликатов вариантов ответов внутри одного вопроса
console.log('\n=== 3. ДУБЛИКАТЫ ВАРИАНТОВ ОТВЕТОВ ===\n');
let duplicateOptionsCount = 0;
allQuestionsCombined.forEach(q => {
    const optionsLower = q.options.map(opt => opt.toLowerCase().trim());
    const uniqueOptions = new Set(optionsLower);
    if (uniqueOptions.size !== optionsLower.length) {
        duplicateOptionsCount++;
        console.log(`  Вопрос ID ${q.id} (Правило ${q.rule}): "${q.question}"`);
        console.log(`    Варианты: ${q.options.join(' | ')}`);
    }
});

if (duplicateOptionsCount === 0) {
    console.log('Дубликатов вариантов ответов не найдено ✓');
} else {
    console.log(`\nНайдено вопросов с дубликатами вариантов: ${duplicateOptionsCount}`);
}

// 4. Проверка правильности индексов correctAnswer
console.log('\n=== 4. ПРОВЕРКА ИНДЕКСОВ ПРАВИЛЬНЫХ ОТВЕТОВ ===\n');
let invalidAnswers = 0;
allQuestionsCombined.forEach(q => {
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        invalidAnswers++;
        console.log(`  Вопрос ID ${q.id}: correctAnswer=${q.correctAnswer}, но вариантов всего ${q.options.length}`);
    }
});

if (invalidAnswers === 0) {
    console.log('Все индексы правильных ответов корректны ✓');
} else {
    console.log(`\nНайдено некорректных индексов: ${invalidAnswers}`);
}

// 5. Статистика по правилам
console.log('\n=== 5. СТАТИСТИКА ПО ПРАВИЛАМ ===\n');
const stats = {};
allQuestionsCombined.forEach(q => {
    if (!stats[q.rule]) {
        stats[q.rule] = { count: 0, ruleName: q.ruleName };
    }
    stats[q.rule].count++;
});

Object.keys(stats).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rule => {
    console.log(`Правило ${rule}: ${stats[rule].ruleName} - ${stats[rule].count} вопросов`);
});

// 6. Проверка релевантности вариантов (базовая проверка)
console.log('\n=== 6. ПРОВЕРКА РЕЛЕВАНТНОСТИ ВАРИАНТОВ ===\n');
let shortOptionsCount = 0;
allQuestionsCombined.forEach(q => {
    if (q.options.length < 4) {
        shortOptionsCount++;
        console.log(`  Вопрос ID ${q.id}: только ${q.options.length} вариантов`);
    }
});

if (shortOptionsCount === 0) {
    console.log('Все вопросы имеют 4 варианта ответа ✓');
} else {
    console.log(`Найдено вопросов с менее чем 4 вариантами: ${shortOptionsCount}`);
}

// 7. Рекомендации для базового курса
console.log('\n=== 7. РЕКОМЕНДАЦИИ ДЛЯ БАЗОВОГО КУРСА ===\n');
const basicRulesCoverage = {};
allQuestions.forEach(q => {
    if (!basicRulesCoverage[q.rule]) {
        basicRulesCoverage[q.rule] = 0;
    }
    basicRulesCoverage[q.rule]++;
});

const rulesWithFewQuestions = [];
for (let i = 1; i <= 17; i++) {
    const count = basicRulesCoverage[i] || 0;
    if (count < 3) {
        rulesWithFewQuestions.push({ rule: i, count, name: ruleNames[i] });
    }
}

if (rulesWithFewQuestions.length > 0) {
    console.log('Правила с недостаточным количеством вопросов в базовом курсе (< 3):');
    rulesWithFewQuestions.forEach(r => {
        console.log(`  Правило ${r.rule}: ${r.name} - ${r.count} вопросов`);
    });
} else {
    console.log('Все правила имеют минимум 3 вопроса в базовом курсе ✓');
}

console.log('\n=== АНАЛИЗ ЗАВЕРШЕН ===\n');


