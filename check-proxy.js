// check-proxy.js - Скрипт для проверки работы прокси-сервера
// Запуск: node check-proxy.js

const fetch = require('node-fetch');

async function checkProxy() {
    const baseUrl = process.env.RAILWAY_URL || 'https://jms.up.railway.app';

    console.log('🔍 Проверка прокси-сервера на Railway');
    console.log('URL:', baseUrl);
    console.log('='.repeat(50));

    try {
        // 1. Проверка health check
        console.log('\n1. Проверка health check...');
        const healthResponse = await fetch(`${baseUrl}/health`);
        console.log(`   Статус: ${healthResponse.status} ${healthResponse.statusText}`);

        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('   Ответ:', JSON.stringify(healthData, null, 2));
        } else {
            console.log('   ❌ Health check не работает');
            return false;
        }

        // 2. Проверка info endpoint
        console.log('\n2. Проверка info endpoint...');
        const infoResponse = await fetch(`${baseUrl}/api/info`);
        console.log(`   Статус: ${infoResponse.status} ${infoResponse.statusText}`);

        if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            console.log('   Сервис:', infoData.service);
            console.log('   Версия:', infoData.version);
            const yandexApiKey = infoData.environment?.yandexApiKey || infoData.environment?.yandexApiKey || 'Missing';
            console.log('   Yandex API настроен:', yandexApiKey);
        }

        // 3. Проверка TTS endpoint
        console.log('\n3. Проверка TTS endpoint...');
        const ttsResponse = await fetch(`${baseUrl}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: 'Тест работы прокси сервера',
                voice: 'alena',
                emotion: 'good',
                speed: 1.0
            })
        });

        console.log(`   Статус: ${ttsResponse.status} ${ttsResponse.statusText}`);
        console.log(`   Content-Type: ${ttsResponse.headers.get('content-type')}`);
        console.log(`   Content-Length: ${ttsResponse.headers.get('content-length')} байт`);

        if (ttsResponse.ok) {
            const contentType = ttsResponse.headers.get('content-type') || '';
            if (contentType.includes('audio')) {
                const buffer = await ttsResponse.buffer();
                console.log(`   ✅ Успех! Получено аудио: ${buffer.length} байт`);
                console.log(`   ✅ Тип: ${contentType}`);
            } else {
                const text = await ttsResponse.text();
                console.log(`   Ответ (первые 200 символов): ${text.substring(0, 200)}`);
            }
        } else {
            const errorText = await ttsResponse.text();
            console.log(`   ❌ Ошибка: ${errorText.substring(0, 200)}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ Проверка завершена');
        return true;

    } catch (error) {
        console.error('\n❌ Ошибка при проверке:', error.message);
        console.error('Стек:', error.stack);
        return false;
    }
}

// Запуск проверки
checkProxy().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Неожиданная ошибка:', error);
    process.exit(1);
});