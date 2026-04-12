#!/usr/bin/env node
/**
 * update-version.js
 * Скрипт для обновления версии приложения
 * Запуск: node update-version.js 2.4
 */

const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Укажите версию: node update-version.js 2.4');
  process.exit(1);
}

// Файлы для обновления
const files = [
  {
    path: path.join(__dirname, 'config.js'),
    pattern: /window\.APP_VERSION = '[^']+';/,
    replacement: `window.APP_VERSION = '${newVersion}';`
  },
  {
    path: path.join(__dirname, 'sw.js'),
    pattern: /const CACHE_NAME = '[^']+';/,
    replacement: `const CACHE_NAME = 'yarik-uroki-v${newVersion}';`
  },
  {
    path: path.join(__dirname, 'speech-proxy.js'),
    pattern: /version: '[\d.]+'/,
    replacement: `version: '${newVersion}'`
  }
];

files.forEach(file => {
  let content = fs.readFileSync(file.path, 'utf8');
  
  if (!file.pattern.test(content)) {
    console.error(`❌ Не удалось найти паттерн в ${file.path}`);
    process.exit(1);
  }
  
  content = content.replace(file.pattern, file.replacement);
  fs.writeFileSync(file.path, content);
  
  console.log(`✅ Обновлён ${file.path}`);
});

console.log(`\n🎉 Версия обновлена до ${newVersion}`);
console.log('Все файлы обновлены автоматически!');
